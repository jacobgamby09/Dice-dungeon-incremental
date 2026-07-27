import { createCombatState } from '../combat/combatState'
import { addRollToTotals, rollDie } from '../combat/rollDie'
import { totalEnemyRolls } from '../combat/rollEnemyDie'
import { resolveRound } from '../combat/resolveRound'
import { DUNGEONS } from '../content/dungeons'
import { createEnemyState, rollNextEnemyIntent } from '../content/enemies'
import { getRollSpeed } from '../progression/talents'
import type { CombatState, RoundResolution } from '../types/combat'
import type { AwayRecap, RunState } from '../types/dungeon'
import type { PlayerProfile } from '../types/progression'

export const AUTO_COMBAT_DRAW_PAUSE_MS = 160
export const AUTO_COMBAT_RESOLVE_PAUSE_MS = 220
export const AUTO_COMBAT_VICTORY_PAUSE_MS = 1_250

const BASE_INTENT_TIME_MS = 720
const BASE_DIE_TIME_MS = 1_080
const BASE_RESOLUTION_TIME_MS = 1_520
const BASE_FINISH_RESOLUTION_TIME_MS = 860
const MAX_BACKGROUND_STEPS = 240

export type AutomationScreen = 'combat' | 'post_combat' | 'defeat'

export interface AutoCombatGameState {
  combat: CombatState
  profile: PlayerProfile
  run: RunState
  screen: AutomationScreen
}

export interface AutoCombatFastForwardResult extends AutoCombatGameState {
  bankedMilliseconds: number
  randomSeed: number
  recap: AwayRecap | null
}

function createStatefulRandom(initialSeed: number) {
  let state = initialSeed >>> 0
  return {
    getState: () => state,
    next: () => {
      state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0
      return state / 4_294_967_296
    },
  }
}

function estimateRemainingRoundMilliseconds(
  state: AutoCombatGameState,
): number {
  const speed = getRollSpeed(
    state.profile.talentRanks,
    state.profile.settings.rollSpeed,
  )

  if (state.screen === 'post_combat') {
    return AUTO_COMBAT_VICTORY_PAUSE_MS
  }

  if (state.combat.phase === 'resolving') {
    return Math.ceil(BASE_FINISH_RESOLUTION_TIME_MS / speed)
  }

  if (
    state.combat.phase === 'victory'
    || state.combat.phase === 'defeat'
  ) {
    return 0
  }

  const intentTime = state.combat.phase === 'revealing_enemy_intent'
    ? BASE_INTENT_TIME_MS + Math.max(0, (state.run.enemy?.dieIds.length ?? 1) - 1) * 90
    : 0
  const diceTime = state.combat.drawPileDieIds.length * BASE_DIE_TIME_MS
  return Math.ceil((intentTime + diceTime + BASE_RESOLUTION_TIME_MS) / speed)
}

function claimVictory(
  state: AutoCombatGameState,
  resolution: RoundResolution,
): AutoCombatGameState {
  const enemy = state.run.enemy
  const dungeonId = state.run.dungeonId
  if (!enemy || !dungeonId) return state

  const dungeon = DUNGEONS[dungeonId]
  const floorDefinition = dungeon.floors[state.run.encounterIndex]
  const rewardAlreadyClaimed = enemy.rewardClaimed
  const xpReward = rewardAlreadyClaimed ? 0 : enemy.xpReward
  const soulReward = rewardAlreadyClaimed ? 0 : enemy.soulReward
  const dungeonComplete = floorDefinition.isBoss
  const previousProgress = state.profile.dungeonProgress[dungeonId]

  return {
    screen: 'post_combat',
    profile: {
      ...state.profile,
      xp: state.profile.xp + xpReward,
      bankedSouls: state.profile.bankedSouls + soulReward,
      dungeonProgress: {
        ...state.profile.dungeonProgress,
        [dungeonId]: {
          highestFloorCleared: Math.max(
            previousProgress.highestFloorCleared,
            floorDefinition.floor,
          ),
          clearCount: previousProgress.clearCount
            + (dungeonComplete && !rewardAlreadyClaimed ? 1 : 0),
        },
      },
    },
    run: {
      ...state.run,
      status: 'victory',
      playerHp: resolution.playerHp,
      runStats: rewardAlreadyClaimed
        ? state.run.runStats
        : {
            enemiesDefeated: state.run.runStats.enemiesDefeated + 1,
            soulsEarned: state.run.runStats.soulsEarned + soulReward,
            xpEarned: state.run.runStats.xpEarned + xpReward,
          },
      enemy: {
        ...enemy,
        hp: resolution.enemyHp,
        shield: resolution.enemyShieldAfterPlayerPhase,
        rewardClaimed: true,
      },
      lastReward: {
        enemyName: enemy.name,
        floor: floorDefinition.floor,
        isBoss: floorDefinition.isBoss,
        xp: xpReward,
        souls: soulReward,
        dungeonComplete,
      },
    },
    combat: {
      ...state.combat,
      phase: 'victory',
      lastResolution: resolution,
      resolutionStep: 'player',
    },
  }
}

function finishResolvingState(
  state: AutoCombatGameState,
  random: () => number,
): AutoCombatGameState {
  const resolution = state.combat.lastResolution
  const enemy = state.run.enemy
  if (!resolution || !enemy) return state

  if (resolution.outcome === 'victory') {
    const claimed = enemy.rewardClaimed
      ? state
      : claimVictory(state, resolution)
    return {
      ...claimed,
      screen: 'post_combat',
      combat: {
        ...claimed.combat,
        phase: 'victory',
      },
    }
  }

  if (resolution.outcome === 'defeat') {
    return {
      ...state,
      screen: 'defeat',
      run: {
        ...state.run,
        status: 'defeat',
        playerHp: 0,
        enemy: {
          ...enemy,
          hp: resolution.enemyHp,
          shield: 0,
        },
      },
      combat: {
        ...state.combat,
        phase: 'defeat',
        resolutionStep: 'enemy_attack',
      },
    }
  }

  const nextEnemy = rollNextEnemyIntent({
    ...enemy,
    hp: resolution.enemyHp,
    shield: 0,
  }, random)
  return {
    ...state,
    screen: 'combat',
    run: {
      ...state.run,
      status: 'active',
      playerHp: resolution.playerHp,
      enemy: nextEnemy,
    },
    combat: createCombatState(
      state.run.equippedDiceSnapshot,
      state.combat.roundNumber + 1,
      state.combat.resolutionVersion,
      true,
      random,
    ),
  }
}

function completeCurrentRound(
  state: AutoCombatGameState,
  random: () => number,
): AutoCombatGameState {
  if (state.combat.phase === 'resolving') {
    return finishResolvingState(state, random)
  }

  const enemy = state.run.enemy
  if (!enemy || !state.run.dungeonId) return state

  let totals = { ...state.combat.totals }
  const results = [...state.combat.results]
  for (const dieId of state.combat.drawPileDieIds) {
    const die = state.run.equippedDiceSnapshot.find((candidate) => candidate.id === dieId)
    if (!die) continue
    const result = rollDie(die, random)
    results.push(result)
    totals = addRollToTotals(totals, result)
  }

  const resolution = resolveRound({
    playerHp: state.run.playerHp,
    playerMaxHp: state.run.playerMaxHp,
    enemyHp: enemy.hp,
    enemyMaxHp: enemy.maxHp,
    enemyShield: enemy.shield,
    enemyIntent: totalEnemyRolls(enemy.intentRolls),
    totals,
  })
  const resolvedState: AutoCombatGameState = {
    ...state,
    combat: {
      ...state.combat,
      phase: 'resolving',
      drawPileDieIds: [],
      results,
      totals,
      lastResolution: resolution,
      resolutionVersion: state.combat.resolutionVersion + 1,
      resolutionStep: 'player',
    },
  }

  if (resolution.outcome === 'victory') {
    return claimVictory(resolvedState, resolution)
  }

  if (resolution.outcome === 'defeat') {
    return finishResolvingState(resolvedState, random)
  }

  return finishResolvingState(resolvedState, random)
}

function advancePastVictory(
  state: AutoCombatGameState,
  random: () => number,
): AutoCombatGameState {
  if (
    state.screen !== 'post_combat'
    || state.run.status !== 'victory'
    || !state.run.dungeonId
    || state.run.lastReward?.dungeonComplete
  ) {
    return state
  }

  const dungeon = DUNGEONS[state.run.dungeonId]
  const nextEncounterIndex = state.run.encounterIndex + 1
  const nextFloor = dungeon.floors[nextEncounterIndex]
  if (!nextFloor) return state

  return {
    ...state,
    screen: 'combat',
    run: {
      ...state.run,
      status: 'active',
      encounterIndex: nextEncounterIndex,
      enemy: createEnemyState(nextFloor.encounterId, random),
      lastReward: null,
    },
    combat: createCombatState(
      state.run.equippedDiceSnapshot,
      1,
      state.combat.resolutionVersion,
      true,
      random,
    ),
  }
}

function getOutcome(state: AutoCombatGameState): AwayRecap['outcome'] {
  if (state.screen === 'defeat') return 'defeat'
  if (state.screen === 'post_combat' && state.run.lastReward?.dungeonComplete) {
    return 'boss_victory'
  }
  return 'active'
}

export function fastForwardAutoCombat(
  initialState: AutoCombatGameState,
  elapsedMilliseconds: number,
): AutoCombatFastForwardResult {
  const random = createStatefulRandom(initialState.run.automation.randomSeed)
  const initialFloor = initialState.run.encounterIndex + 1
  const initialStats = initialState.run.runStats
  const availableMilliseconds = Math.max(
    0,
    initialState.run.automation.bankedMilliseconds + elapsedMilliseconds,
  )
  let bankedMilliseconds = availableMilliseconds
  let state = initialState
  let roundsAdvanced = 0

  for (let step = 0; step < MAX_BACKGROUND_STEPS; step += 1) {
    if (
      state.screen === 'defeat'
      || (state.screen === 'post_combat' && state.run.lastReward?.dungeonComplete)
    ) {
      bankedMilliseconds = 0
      break
    }

    const stepCost = estimateRemainingRoundMilliseconds(state)
    if (stepCost <= 0 || bankedMilliseconds < stepCost) break
    bankedMilliseconds -= stepCost

    if (state.screen === 'post_combat') {
      state = advancePastVictory(state, random.next)
      continue
    }

    state = completeCurrentRound(state, random.next)
    roundsAdvanced += 1
  }

  const enemiesDefeated = state.run.runStats.enemiesDefeated - initialStats.enemiesDefeated
  const toFloor = state.run.encounterIndex + 1
  const recap = roundsAdvanced > 0 || enemiesDefeated > 0 || toFloor !== initialFloor
    ? {
        elapsedMilliseconds: Math.max(0, elapsedMilliseconds),
        enemiesDefeated,
        floorsAdvanced: Math.max(0, toFloor - initialFloor),
        fromFloor: initialFloor,
        outcome: getOutcome(state),
        roundsAdvanced,
        soulsEarned: state.run.runStats.soulsEarned - initialStats.soulsEarned,
        toFloor,
        xpEarned: state.run.runStats.xpEarned - initialStats.xpEarned,
      } satisfies AwayRecap
    : null

  return {
    ...state,
    bankedMilliseconds,
    randomSeed: random.getState(),
    recap,
  }
}
