import { addRollEffects, rollDie } from '../combat/rollDie'
import {
  applyEnemyStatusGuard,
  applyKillCharms,
  applyRollCharms,
  beginCharmRound,
  createCharmRunState,
  getShieldCarryRate,
} from '../combat/charms'
import { applyImprintRoll } from '../combat/imprints'
import { totalEnemyRolls } from '../combat/rollEnemyDie'
import { resolveRound } from '../combat/resolveRound'
import { DUNGEONS } from '../content/dungeons'
import { createEnemyState, rollNextEnemyIntent } from '../content/enemies'
import { EMPTY_TOTALS } from '../types/combat'
import type { DieInstance } from '../types/dice'
import type { SoulDieState } from '../types/dice'
import type { DungeonId } from '../types/dungeon'
import type { TalentRanks } from '../types/progression'
import type { ImprintInstance } from '../types/imprints'
import type { CharmSnapshot } from '../types/charms'
import { getEnemyRewardBreakdown } from '../progression/rewards'
import { rollFateDrop } from '../progression/fate'
import { applyImprintsToDice, grantImprint, rollImprintDrop } from '../progression/imprints'
import { createSoulDieState, drawSoulDie } from '../progression/soulDie'
import {
  getDungeonLootMultiplier,
  getFateDropMultiplier,
  getImprintDropMultiplier,
  getSoulDieValues,
  hasCharmsUnlocked,
} from '../progression/talents'

export interface SimulationBuild {
  charms?: readonly CharmSnapshot[]
  dice: readonly DieInstance[]
  dungeonClearCount?: number
  fatePity?: number
  imprints?: readonly ImprintInstance[]
  imprintHuntActive?: boolean
  playerMaxHp: number
  soulDieState?: SoulDieState
  talentRanks?: Readonly<TalentRanks>
}

export interface DungeonRunSimulation {
  averagePlayerAttack: number
  averagePlayerHeal: number
  averagePlayerShield: number
  completedDungeon: boolean
  charmTriggers: number
  defeatedAtFloor: number | null
  fatePity: number
  fateTokensCollected: number
  highestFloorCleared: number
  hpRemaining: number
  imprints: ImprintInstance[]
  roundsByFloor: number[]
  roundsPlayed: number
  soulsCollected: number
  soulDieState: SoulDieState
  xpEarned: number
}

export interface DungeonSimulationSummary {
  attempts: number
  averageHighestFloor: number
  averageRoundsByReachedFloor: number[]
  averageRoundsPlayed: number
  averageSouls: number
  averageXp: number
  bossClearRate: number
  floorReachRate: number[]
}

export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state += 0x6D2B79F5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export function simulateDungeonRun(
  dungeonId: DungeonId,
  build: SimulationBuild,
  random: () => number = Math.random,
): DungeonRunSimulation {
  const dungeon = DUNGEONS[dungeonId]
  let playerHp = build.playerMaxHp
  let highestFloorCleared = 0
  let roundsPlayed = 0
  let totalPlayerAttack = 0
  let totalPlayerHeal = 0
  let totalPlayerShield = 0
  const roundsByFloor = DUNGEONS[dungeonId].floors.map(() => 0)
  let soulsCollected = 0
  let xpEarned = 0
  let soulDieState = build.soulDieState ?? createSoulDieState()
  let imprints = [...(build.imprints ?? [])]
  const charms = [...(build.charms ?? [])]
  const hasEquippedCharms = charms.length > 0
  let charmState = createCharmRunState()
  let fatePity = build.fatePity ?? 0
  let fateTokensCollected = 0
  let charmTriggers = 0
  const orderedDice = applyImprintsToDice(build.dice, imprints)
  const attackOnlyLoadout = orderedDice.every((die) => die.family === 'attack')
  const shieldCarryRate = hasEquippedCharms ? getShieldCarryRate(charms) : 0

  for (const floor of dungeon.floors) {
    let enemy = createEnemyState(floor.encounterId, random)
    let floorCleared = false
    const encounterCharm = hasEquippedCharms
      ? beginCharmRound(charms, charmState, true)
      : { state: charmState, shield: 0, triggers: [] }
    charmState = encounterCharm.state
    charmTriggers += encounterCharm.triggers.length
    let carriedShield = encounterCharm.shield
    let carriedHeal = 0
    let playerPoison = 0
    let carriedEmpower = 0
    let carriedWeaken = 0

    for (let round = 0; round < 100; round += 1) {
      let totals = { ...EMPTY_TOTALS }
      let pendingFortify = 0
      let pendingEmpower = carriedEmpower
      let pendingWeaken = carriedWeaken
      let pendingImprintRelay = 0
      for (const [index, die] of orderedDice.entries()) {
        const imprintRoll = applyImprintRoll(
          rollDie(die, random),
          index,
          pendingImprintRelay,
          enemy.poison,
        )
        const charmRoll = hasEquippedCharms
          ? applyRollCharms(
              imprintRoll.result,
              charms,
              charmState,
              {
                attackOnlyLoadout,
                isLastRoll: index === orderedDice.length - 1,
                loadoutSize: orderedDice.length,
                random,
              },
            )
          : { result: imprintRoll.result, state: charmState, triggers: [] }
        charmState = charmRoll.state
        charmTriggers += charmRoll.triggers.length
        const effects = addRollEffects(
          totals,
          charmRoll.result,
          index === orderedDice.length - 1,
          pendingFortify,
          {
            enemyHp: enemy.hp,
            enemyMaxHp: enemy.maxHp,
            pendingEmpower,
            pendingWeaken,
          },
        )
        totals = effects.totals
        pendingFortify = effects.pendingFortify
        pendingEmpower = effects.pendingEmpower
        pendingWeaken = effects.pendingWeaken
        pendingImprintRelay = imprintRoll.nextRelayBonus
      }

      roundsPlayed += 1
      totalPlayerAttack += totals.attack
      totalPlayerHeal += totals.heal
      totalPlayerShield += totals.shield
      roundsByFloor[floor.floor - 1] += 1
      const guardedIntent = hasEquippedCharms
        ? applyEnemyStatusGuard(totalEnemyRolls(enemy.intentRolls), charms, charmState)
        : { intent: totalEnemyRolls(enemy.intentRolls), state: charmState, triggers: [] }
      charmState = guardedIntent.state
      charmTriggers += guardedIntent.triggers.length
      const resolution = resolveRound({
        playerHp,
        playerMaxHp: build.playerMaxHp,
        enemyHp: enemy.hp,
        enemyMaxHp: enemy.maxHp,
        enemyShield: enemy.shield,
        enemyBleed: enemy.bleed,
        enemyIntent: guardedIntent.intent,
        totals,
        carriedShield,
        carriedHeal,
        shieldCarryRate,
        playerPoison,
        enemyPoison: enemy.poison,
        remainingPlayerWeaken: pendingWeaken,
        pendingPlayerEmpower: pendingEmpower,
      })
      carriedShield = resolution.nextRoundShield
      carriedHeal = resolution.nextRoundHeal
      playerPoison = resolution.nextPlayerPoison
      carriedEmpower = resolution.nextPlayerEmpower
      carriedWeaken = resolution.nextPlayerWeaken
      playerHp = resolution.playerHp
      enemy = {
        ...enemy,
        hp: resolution.enemyHp,
        shield: resolution.enemyShield,
        bleed: resolution.enemyBleed,
        poison: resolution.enemyPoison,
      }

      if (resolution.outcome === 'victory') {
        floorCleared = true
        highestFloorCleared = floor.floor
        const soulDraw = drawSoulDie(
          soulDieState,
          getSoulDieValues(build.talentRanks ?? {}),
          enemy.soulValue,
          random,
        )
        soulDieState = soulDraw.nextState
        const reward = getEnemyRewardBreakdown(
          enemy.xpReward,
          soulDraw.result,
          build.talentRanks ?? {},
        )
        const killCharm = hasEquippedCharms
          ? applyKillCharms(charms, charmState)
          : { heal: 0, soulBonus: 0, state: charmState, triggers: [] }
        charmState = killCharm.state
        charmTriggers += killCharm.triggers.length
        playerHp = Math.min(build.playerMaxHp, playerHp + killCharm.heal)
        soulsCollected += reward.souls + killCharm.soulBonus
        xpEarned += reward.xp
        if (hasCharmsUnlocked(build.talentRanks ?? {})) {
          const fateDrop = rollFateDrop(
            enemy.rewardTier,
            fatePity,
            random,
            getFateDropMultiplier(build.talentRanks ?? {})
              * (dungeonId === 'blighted-depths' ? 2.2 : dungeonId === 'iron-depths' ? 1.6 : 1)
              * getDungeonLootMultiplier(build.talentRanks ?? {}, dungeonId),
          )
          fateTokensCollected += fateDrop.tokens
          fatePity = fateDrop.nextPity
        }
        const imprintDrop = rollImprintDrop({
          dungeonId,
          floor: floor.floor,
          isBoss: floor.isBoss,
          clearCount: build.dungeonClearCount ?? 0,
          owned: imprints,
          random,
          dropMultiplier: getImprintDropMultiplier(build.talentRanks ?? {})
            * (dungeonId === 'blighted-depths' ? 2.2 : dungeonId === 'iron-depths' ? 1.6 : 1)
            * getDungeonLootMultiplier(build.talentRanks ?? {}, dungeonId),
          huntActive: build.imprintHuntActive,
        })
        if (imprintDrop) {
          imprints = grantImprint(
            imprints,
            imprintDrop,
            `simulation-imprint-${imprintDrop}-${dungeonId}-${floor.floor}-${imprints.length}`,
          )
        }
        break
      }

      if (resolution.outcome === 'defeat') {
        return {
          averagePlayerAttack: totalPlayerAttack / roundsPlayed,
          averagePlayerHeal: totalPlayerHeal / roundsPlayed,
          averagePlayerShield: totalPlayerShield / roundsPlayed,
          completedDungeon: false,
          charmTriggers,
          defeatedAtFloor: floor.floor,
          fatePity,
          fateTokensCollected,
          highestFloorCleared,
          hpRemaining: 0,
          imprints,
          roundsByFloor,
          roundsPlayed,
          soulsCollected,
          soulDieState,
          xpEarned,
        }
      }

      enemy = rollNextEnemyIntent(enemy, random)
      if (hasEquippedCharms) {
        const charmRound = beginCharmRound(charms, charmState)
        charmState = charmRound.state
        charmTriggers += charmRound.triggers.length
        carriedShield += charmRound.shield
      }
    }

    if (!floorCleared) {
      return {
        averagePlayerAttack: totalPlayerAttack / roundsPlayed,
        averagePlayerHeal: totalPlayerHeal / roundsPlayed,
        averagePlayerShield: totalPlayerShield / roundsPlayed,
        completedDungeon: false,
        charmTriggers,
        defeatedAtFloor: floor.floor,
        fatePity,
        fateTokensCollected,
        highestFloorCleared,
        hpRemaining: playerHp,
        imprints,
        roundsByFloor,
        roundsPlayed,
        soulsCollected,
        soulDieState,
        xpEarned,
      }
    }
  }

  const completedDungeon = highestFloorCleared === dungeon.floors.length
  return {
    averagePlayerAttack: totalPlayerAttack / roundsPlayed,
    averagePlayerHeal: totalPlayerHeal / roundsPlayed,
    averagePlayerShield: totalPlayerShield / roundsPlayed,
    completedDungeon,
    charmTriggers,
    defeatedAtFloor: null,
    fatePity,
    fateTokensCollected,
    highestFloorCleared,
    hpRemaining: playerHp,
    imprints,
    roundsByFloor,
    roundsPlayed,
    soulsCollected,
    soulDieState,
    xpEarned,
  }
}

export function summarizeDungeonSimulations(
  dungeonId: DungeonId,
  build: SimulationBuild,
  attempts: number,
  seed = 1,
): DungeonSimulationSummary {
  const dungeon = DUNGEONS[dungeonId]
  const floorReachCounts = dungeon.floors.map(() => 0)
  const floorRoundTotals = dungeon.floors.map(() => 0)
  const floorRoundSampleCounts = dungeon.floors.map(() => 0)
  let totalHighestFloor = 0
  let totalSouls = 0
  let totalXp = 0
  let totalRounds = 0
  let bossClears = 0

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const result = simulateDungeonRun(dungeonId, build, createSeededRandom(seed + attempt))
    totalHighestFloor += result.highestFloorCleared
    totalSouls += result.soulsCollected
    totalXp += result.xpEarned
    totalRounds += result.roundsPlayed
    if (result.completedDungeon) bossClears += 1
    for (let floorIndex = 0; floorIndex < dungeon.floors.length; floorIndex += 1) {
      if (result.highestFloorCleared >= floorIndex + 1) floorReachCounts[floorIndex] += 1
      if (result.roundsByFloor[floorIndex] > 0) {
        floorRoundTotals[floorIndex] += result.roundsByFloor[floorIndex]
        floorRoundSampleCounts[floorIndex] += 1
      }
    }
  }

  return {
    attempts,
    averageHighestFloor: totalHighestFloor / attempts,
    averageRoundsByReachedFloor: floorRoundTotals.map((rounds, index) => (
      floorRoundSampleCounts[index] > 0 ? rounds / floorRoundSampleCounts[index] : 0
    )),
    averageRoundsPlayed: totalRounds / attempts,
    averageSouls: totalSouls / attempts,
    averageXp: totalXp / attempts,
    bossClearRate: bossClears / attempts,
    floorReachRate: floorReachCounts.map((count) => count / attempts),
  }
}
