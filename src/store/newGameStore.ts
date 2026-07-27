import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'
import { shuffleDieIds } from '../game/combat/drawBag'
import { addRollToTotals, rollDie } from '../game/combat/rollDie'
import { findEnemyRollByValue, totalEnemyRolls } from '../game/combat/rollEnemyDie'
import { resolveRound } from '../game/combat/resolveRound'
import { createDieById, createStartingDice } from '../game/content/dice'
import { DUNGEONS } from '../game/content/dungeons'
import { getEnemyDie } from '../game/content/enemyDice'
import { createEnemyState, ENCOUNTERS, rollNextEnemyIntent } from '../game/content/enemies'
import { TALENTS_BY_ID } from '../game/content/talents'
import { BASE_FACE_CAP, getFaceUpgradeCost } from '../game/content/upgradeCosts'
import {
  BASE_PLAYER_HP,
  canPurchaseTalent,
  getDiceCapacity,
  getNextTalentRank,
  getPlayerMaxHp,
  getTalentRank,
  hasAutoRollUnlocked,
  normalizeTalentRanks,
} from '../game/progression/talents'
import type { CombatState, RoundResolution } from '../game/types/combat'
import { EMPTY_TOTALS } from '../game/types/combat'
import type { DieFaces, DieInstance, RollResult } from '../game/types/dice'
import { cloneDie } from '../game/types/dice'
import type {
  DungeonId,
  DungeonProgress,
  EncounterId,
  EnemyState,
  RunState,
  RunStats,
} from '../game/types/dungeon'
import type { PlayerProfile, TalentRanks } from '../game/types/progression'

export type AppScreen =
  | 'hub'
  | 'dungeon_select'
  | 'combat'
  | 'post_combat'
  | 'workshop'
  | 'talent_tree'
  | 'loadout'
  | 'defeat'

export interface NewGameState {
  screen: AppScreen
  profile: PlayerProfile
  run: RunState
  combat: CombatState
  openDungeonSelect: () => void
  openWorkshop: () => void
  openTalentTree: () => void
  openLoadout: () => void
  goToHub: () => void
  startRun: (dungeonId: DungeonId) => void
  finishEnemyIntentReveal: () => void
  drawNextDie: () => RollResult | null
  beginRoundResolution: () => RoundResolution | null
  advanceRoundResolution: () => void
  finishRoundResolution: () => void
  advanceToNextFloor: () => void
  returnToHubAfterVictory: () => void
  returnToHubAfterDefeat: () => void
  purchaseTalent: (talentId: string) => boolean
  equipDie: (dieId: string) => boolean
  unequipDie: (dieId: string) => boolean
  setAutoRoll: (enabled: boolean) => void
  upgradeFace: (dieId: string, faceId: string) => boolean
  resetProgress: () => void
}

const SAVE_VERSION = 9
export const NEW_GAME_SAVE_KEY = 'new-dice-dungeon-save'
const NON_BROWSER_STORAGE: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}

function createInitialProfile(): PlayerProfile {
  const diceCollection = createStartingDice()
  return {
    saveVersion: SAVE_VERSION,
    xp: 0,
    bankedSouls: 0,
    talentRanks: {},
    unlockedDungeonIds: ['prototype-depths'],
    dungeonProgress: createInitialDungeonProgress(),
    diceCollection,
    equippedDieIds: diceCollection.map((die) => die.id),
    settings: {
      rollSpeed: 1,
      autoRoll: false,
      autoResolve: false,
    },
  }
}

function createInitialDungeonProgress(): Record<DungeonId, DungeonProgress> {
  return {
    'prototype-depths': {
      highestFloorCleared: 0,
      clearCount: 0,
    },
    'iron-depths': {
      highestFloorCleared: 0,
      clearCount: 0,
    },
  }
}

function createEmptyRunStats(): RunStats {
  return {
    enemiesDefeated: 0,
    soulsEarned: 0,
    xpEarned: 0,
  }
}

function createInactiveRun(): RunState {
  return {
    status: 'inactive',
    dungeonId: null,
    encounterIndex: 0,
    playerHp: BASE_PLAYER_HP,
    playerMaxHp: BASE_PLAYER_HP,
    runStats: createEmptyRunStats(),
    equippedDiceSnapshot: [],
    enemy: null,
    lastReward: null,
  }
}

function createCombatState(
  equippedDice: readonly DieInstance[] = [],
  roundNumber = 1,
  resolutionVersion = 0,
  revealEnemyIntent = false,
): CombatState {
  return {
    phase: revealEnemyIntent ? 'revealing_enemy_intent' : 'awaiting_roll',
    roundNumber,
    drawPileDieIds: shuffleDieIds(equippedDice.map((die) => die.id)),
    results: [],
    totals: { ...EMPTY_TOTALS },
    lastResolution: null,
    resolutionVersion,
    resolutionStep: null,
  }
}

type LegacyEnemyState = Partial<EnemyState> & {
  attackDieId?: string
  intentRoll?: {
    value?: number
  }
  intent?: { type?: 'attack'; value?: number }
}

type LegacyPlayerProfile = Partial<PlayerProfile> & {
  unlockedTalentIds?: string[]
}

type LegacyRunState = Partial<RunState> & {
  runSouls?: number
  lastReward?: (Partial<NonNullable<RunState['lastReward']>> & {
    runSouls?: number
    bankedSouls?: number
  }) | null
}

function migrateEnemyState(
  existingEnemy: LegacyEnemyState | null | undefined,
  encounterId: EncounterId | null,
): EnemyState | null {
  if (!existingEnemy || !encounterId) return null
  const canonicalEnemy = createEnemyState(encounterId, () => 0)
  const existingRolls = Array.isArray(existingEnemy.intentRolls)
    ? existingEnemy.intentRolls
    : []
  const legacyIntentValue = existingEnemy.intentRoll?.value
    ?? existingEnemy.intent?.value
  const intentRolls = canonicalEnemy.dieIds.map((dieId, index) => {
    const die = getEnemyDie(dieId)
    const existingValue = existingRolls[index]?.value
      ?? (index === 0 ? legacyIntentValue : undefined)
      ?? canonicalEnemy.intentRolls[index].value
    return findEnemyRollByValue(die, existingValue)
  })

  return {
    ...canonicalEnemy,
    hp: Math.min(
      canonicalEnemy.maxHp,
      Math.max(0, existingEnemy.hp ?? canonicalEnemy.hp),
    ),
    shield: totalEnemyRolls(intentRolls).shield,
    rewardClaimed: existingEnemy.rewardClaimed ?? false,
    intentRolls,
  }
}

function isCompatibleCombatState(combat: Partial<CombatState> | null | undefined): combat is CombatState {
  return Boolean(
    combat
    && Array.isArray(combat.drawPileDieIds)
    && Array.isArray(combat.results)
    && combat.totals
    && Number.isFinite(combat.totals.attack)
    && Number.isFinite(combat.totals.shield)
    && Number.isFinite(combat.totals.heal),
  )
}

function isValidRunStats(runStats: RunStats | null | undefined): runStats is RunStats {
  return Boolean(
    runStats
    && Number.isFinite(runStats.enemiesDefeated)
    && Number.isFinite(runStats.soulsEarned)
    && Number.isFinite(runStats.xpEarned),
  )
}

function reconstructRunStats(
  dungeonId: DungeonId,
  encounterIndex: number,
  currentEnemy: EnemyState | null,
  legacyRunSouls: number,
): RunStats {
  const dungeon = DUNGEONS[dungeonId]
  const completedEncounterCount = Math.min(
    dungeon.floors.length,
    Math.max(0, encounterIndex + (currentEnemy?.rewardClaimed ? 1 : 0)),
  )
  const completedEnemies = dungeon.floors
    .slice(0, completedEncounterCount)
    .map((floor) => ENCOUNTERS[floor.encounterId])

  return {
    enemiesDefeated: completedEnemies.length,
    soulsEarned: legacyRunSouls > 0
      ? legacyRunSouls
      : completedEnemies.reduce((total, enemy) => total + enemy.soulReward, 0),
    xpEarned: completedEnemies.reduce((total, enemy) => total + enemy.xpReward, 0),
  }
}

function migrateNewGameState(persistedState: unknown, version: number): NewGameState {
  if (version >= SAVE_VERSION) return persistedState as NewGameState

  const persisted = persistedState as Partial<NewGameState>
  const freshProfile = createInitialProfile()
  const existingProfile = persisted.profile as LegacyPlayerProfile | undefined
  const allowedExistingDice = version < 2
    ? existingProfile?.diceCollection?.filter((die) => die.id === 'attack-die-1') ?? []
    : existingProfile?.diceCollection ?? []
  const diceCollection = allowedExistingDice
    .map((existingDie) => {
      const canonicalDie = createDieById(existingDie.id)
      if (!canonicalDie) return null
      return {
        ...canonicalDie,
        faces: existingDie.faces.map((face) => ({
          ...face,
          evolution: face.evolution ? { ...face.evolution } : undefined,
        })) as DieFaces,
      }
    })
    .filter((die): die is DieInstance => die !== null)
  if (!diceCollection.some((die) => die.id === 'attack-die-1')) {
    diceCollection.unshift(cloneDie(freshProfile.diceCollection[0]))
  }

  const legacyTalentRanks: TalentRanks = Object.fromEntries(
    (existingProfile?.unlockedTalentIds ?? [])
      .filter((talentId) => TALENTS_BY_ID[talentId] !== undefined)
      .map((talentId) => [talentId, 1]),
  )
  const talentRanks = normalizeTalentRanks(existingProfile?.talentRanks ?? legacyTalentRanks)
  const capacity = getDiceCapacity(talentRanks)
  const equippedDieIds = (existingProfile?.equippedDieIds ?? ['attack-die-1'])
    .filter((dieId, index, ids) => (
      ids.indexOf(dieId) === index && diceCollection.some((die) => die.id === dieId)
    ))
    .slice(0, capacity)
  if (equippedDieIds.length === 0) equippedDieIds.push('attack-die-1')

  const migratedProfile: PlayerProfile = {
    ...freshProfile,
    saveVersion: SAVE_VERSION,
    xp: existingProfile?.xp ?? freshProfile.xp,
    bankedSouls: existingProfile?.bankedSouls ?? freshProfile.bankedSouls,
    talentRanks,
    unlockedDungeonIds: existingProfile?.unlockedDungeonIds ?? freshProfile.unlockedDungeonIds,
    dungeonProgress: {
      ...createInitialDungeonProgress(),
      ...existingProfile?.dungeonProgress,
    },
    diceCollection,
    equippedDieIds,
    settings: {
      ...freshProfile.settings,
      ...existingProfile?.settings,
      autoRoll: hasAutoRollUnlocked(talentRanks)
        ? Boolean(existingProfile?.settings?.autoRoll)
        : false,
    },
  }

  const existingRun = persisted.run as LegacyRunState | undefined
  const legacyRunSouls = Number.isFinite(existingRun?.runSouls)
    ? Math.max(0, existingRun?.runSouls ?? 0)
    : 0
  migratedProfile.bankedSouls += legacyRunSouls
  const existingCombat = persisted.combat as Partial<CombatState> | undefined
  const migratedDungeonId = existingRun?.dungeonId && DUNGEONS[existingRun.dungeonId]
    ? existingRun.dungeonId
    : 'prototype-depths'
  const requestedEncounterIndex = Number.isInteger(existingRun?.encounterIndex)
    ? Math.max(0, existingRun?.encounterIndex ?? 0)
    : 0
  const mappedEncounterIndex = DUNGEONS[migratedDungeonId].floors[requestedEncounterIndex]
    ? requestedEncounterIndex
    : -1
  const migratedEncounterId = mappedEncounterIndex >= 0
    ? DUNGEONS[migratedDungeonId].floors[mappedEncounterIndex].encounterId
    : null
  const migratedEnemy = migrateEnemyState(
    existingRun?.enemy as LegacyEnemyState | null | undefined,
    migratedEncounterId,
  )
  const canPreserveRun = Boolean(
    existingRun
    && existingRun.status !== 'inactive'
    && migratedEnemy
    && mappedEncounterIndex >= 0
    && isCompatibleCombatState(existingCombat),
  )
  const migratedRunStats = isValidRunStats(existingRun?.runStats)
    ? {
        enemiesDefeated: Math.max(0, existingRun.runStats.enemiesDefeated),
        soulsEarned: Math.max(0, existingRun.runStats.soulsEarned),
        xpEarned: Math.max(0, existingRun.runStats.xpEarned),
      }
    : reconstructRunStats(
        migratedDungeonId,
        mappedEncounterIndex,
        migratedEnemy,
        legacyRunSouls,
      )
  const migratedRun: RunState = canPreserveRun && existingRun
    ? {
        status: existingRun.status ?? 'active',
        dungeonId: migratedDungeonId,
        encounterIndex: mappedEncounterIndex,
        playerHp: existingRun.playerHp ?? BASE_PLAYER_HP,
        playerMaxHp: existingRun.playerMaxHp ?? BASE_PLAYER_HP,
        runStats: migratedRunStats,
        equippedDiceSnapshot: existingRun.equippedDiceSnapshot ?? [],
        enemy: migratedEnemy,
        lastReward: existingRun.lastReward
          ? {
              enemyName: existingRun.lastReward.enemyName ?? migratedEnemy?.name ?? 'Enemy',
              floor: existingRun.lastReward.floor ?? mappedEncounterIndex + 1,
              isBoss: existingRun.lastReward.isBoss ?? false,
              xp: existingRun.lastReward.xp ?? 0,
              souls: existingRun.lastReward.souls
                ?? existingRun.lastReward.runSouls
                ?? existingRun.lastReward.bankedSouls
                ?? 0,
              dungeonComplete: existingRun.lastReward.dungeonComplete ?? false,
            }
          : null,
      }
    : createInactiveRun()

  const shouldRestartResolvingRound = Boolean(
    canPreserveRun
    && existingRun?.status === 'active'
    && existingCombat?.phase === 'resolving',
  )
  const migratedCombat = shouldRestartResolvingRound
    ? createCombatState(
        migratedRun.equippedDiceSnapshot,
        existingCombat?.roundNumber ?? 1,
        existingCombat?.resolutionVersion ?? 0,
        true,
      )
    : canPreserveRun && existingCombat
      ? {
          ...existingCombat,
          resolutionStep: (existingCombat.resolutionStep as string | null | undefined) === 'enemy'
            ? 'enemy_attack'
            : existingCombat.resolutionStep ?? null,
        }
      : createCombatState()

  return {
    screen: canPreserveRun ? persisted.screen ?? 'combat' : 'hub',
    profile: migratedProfile,
    run: migratedRun,
    combat: migratedCombat,
  } as NewGameState
}

function getEquippedDice(profile: PlayerProfile): DieInstance[] {
  return profile.equippedDieIds
    .map((dieId) => profile.diceCollection.find((die) => die.id === dieId))
    .filter((die): die is DieInstance => die !== undefined)
    .map(cloneDie)
}

const initialState = {
  screen: 'hub' as const,
  profile: createInitialProfile(),
  run: createInactiveRun(),
  combat: createCombatState(),
}

export const useNewGameStore = create<NewGameState>()(
  persist(
    (set, get) => ({
      ...initialState,

      openDungeonSelect: () => {
        if (get().run.status !== 'inactive') return
        set({ screen: 'dungeon_select' })
      },

      openWorkshop: () => {
        if (get().run.status !== 'inactive') return
        set({ screen: 'workshop' })
      },

      openTalentTree: () => {
        if (get().run.status !== 'inactive') return
        set({ screen: 'talent_tree' })
      },

      openLoadout: () => {
        if (get().run.status !== 'inactive') return
        set({ screen: 'loadout' })
      },

      goToHub: () => {
        if (get().run.status !== 'inactive') return
        set({ screen: 'hub' })
      },

      startRun: (dungeonId) => {
        const state = get()
        if (!state.profile.unlockedDungeonIds.includes(dungeonId)) return
        const dungeon = DUNGEONS[dungeonId]
        const firstEncounterId = dungeon.floors[0].encounterId
        const equippedDiceSnapshot = getEquippedDice(state.profile)
        if (equippedDiceSnapshot.length === 0) return
        const playerMaxHp = getPlayerMaxHp(state.profile.talentRanks)

        set({
          screen: 'combat',
          run: {
            status: 'active',
            dungeonId,
            encounterIndex: 0,
            playerHp: playerMaxHp,
            playerMaxHp,
            runStats: createEmptyRunStats(),
            equippedDiceSnapshot,
            enemy: createEnemyState(firstEncounterId),
            lastReward: null,
          },
          combat: createCombatState(
            equippedDiceSnapshot,
            1,
            state.combat.resolutionVersion,
            true,
          ),
        })
      },

      finishEnemyIntentReveal: () => {
        const state = get()
        if (state.screen !== 'combat' || state.run.status !== 'active') return
        if (state.combat.phase !== 'revealing_enemy_intent') return
        set({
          combat: {
            ...state.combat,
            phase: 'awaiting_roll',
          },
        })
      },

      drawNextDie: () => {
        const state = get()
        if (state.screen !== 'combat' || state.run.status !== 'active') return null
        if (state.combat.phase !== 'awaiting_roll') return null

        const [nextDieId, ...remainingDieIds] = state.combat.drawPileDieIds
        const die = state.run.equippedDiceSnapshot.find((candidate) => candidate.id === nextDieId)
        if (!die) return null

        const result = rollDie(die)
        const allDiceDrawn = remainingDieIds.length === 0

        set({
          combat: {
            ...state.combat,
            phase: allDiceDrawn ? 'awaiting_resolve' : 'awaiting_roll',
            drawPileDieIds: remainingDieIds,
            results: [...state.combat.results, result],
            totals: addRollToTotals(state.combat.totals, result),
          },
        })
        return result
      },

      beginRoundResolution: () => {
        const state = get()
        const enemy = state.run.enemy
        if (state.screen !== 'combat' || state.run.status !== 'active' || !enemy) return null
        if (state.combat.phase !== 'awaiting_resolve') return null
        if (enemy.rewardClaimed) return null

        const resolution = resolveRound({
          playerHp: state.run.playerHp,
          playerMaxHp: state.run.playerMaxHp,
          enemyHp: enemy.hp,
          enemyMaxHp: enemy.maxHp,
          enemyShield: enemy.shield,
          enemyIntent: totalEnemyRolls(enemy.intentRolls),
          totals: state.combat.totals,
        })
        const resolutionVersion = state.combat.resolutionVersion + 1

        if (resolution.outcome === 'victory') {
          const dungeon = DUNGEONS[state.run.dungeonId!]
          const rewardAlreadyClaimed = enemy.rewardClaimed
          const xpReward = rewardAlreadyClaimed ? 0 : enemy.xpReward
          const soulReward = rewardAlreadyClaimed ? 0 : enemy.soulReward
          const floorDefinition = dungeon.floors[state.run.encounterIndex]
          const dungeonComplete = floorDefinition.isBoss
          const previousProgress = state.profile.dungeonProgress[state.run.dungeonId!]
          const dungeonProgress = {
            ...state.profile.dungeonProgress,
            [state.run.dungeonId!]: {
              highestFloorCleared: Math.max(
                previousProgress.highestFloorCleared,
                floorDefinition.floor,
              ),
              clearCount: previousProgress.clearCount + (dungeonComplete && !rewardAlreadyClaimed ? 1 : 0),
            },
          }

          set({
            profile: {
              ...state.profile,
              xp: state.profile.xp + xpReward,
              bankedSouls: state.profile.bankedSouls + soulReward,
              dungeonProgress,
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
              phase: 'resolving',
              lastResolution: resolution,
              resolutionVersion,
              resolutionStep: 'player',
            },
          })
          return resolution
        }

        if (resolution.outcome === 'defeat' && !resolution.enemyActed) {
          set({
            run: {
              ...state.run,
              status: 'defeat',
              playerHp: 0,
              enemy: {
                ...enemy,
                hp: resolution.enemyHpAfterPlayerPhase,
                shield: resolution.enemyShieldAfterPlayerPhase,
              },
            },
            combat: {
              ...state.combat,
              phase: 'resolving',
              lastResolution: resolution,
              resolutionVersion,
              resolutionStep: 'player',
            },
          })
          return resolution
        }

        set({
          run: {
            ...state.run,
            playerHp: resolution.playerHpAfterPlayerPhase,
            enemy: {
              ...enemy,
              hp: resolution.enemyHpAfterPlayerPhase,
              shield: resolution.enemyShieldAfterPlayerPhase,
            },
          },
          combat: {
            ...state.combat,
            phase: 'resolving',
            lastResolution: resolution,
            resolutionVersion,
            resolutionStep: 'player',
          },
        })
        return resolution
      },

      advanceRoundResolution: () => {
        const state = get()
        const resolution = state.combat.lastResolution
        if (state.combat.phase !== 'resolving') return
        if (!resolution?.enemyActed) return

        const currentStep = state.combat.resolutionStep ?? 'player'
        if (currentStep === 'player' && resolution.enemyHealApplied > 0) {
          set({
            run: {
              ...state.run,
              enemy: state.run.enemy
                ? {
                    ...state.run.enemy,
                    hp: resolution.enemyHp,
                    shield: 0,
                  }
                : null,
            },
            combat: {
              ...state.combat,
              resolutionStep: 'enemy_heal',
            },
          })
          return
        }

        if (currentStep !== 'player' && currentStep !== 'enemy_heal') return
        const playerDefeated = resolution.outcome === 'defeat'
        set({
          run: {
            ...state.run,
            status: playerDefeated ? 'defeat' : state.run.status,
            playerHp: resolution.playerHp,
            enemy: state.run.enemy
              ? {
                  ...state.run.enemy,
                  hp: resolution.enemyHp,
                  shield: 0,
                }
              : null,
          },
          combat: {
            ...state.combat,
            resolutionStep: 'enemy_attack',
          },
        })
      },

      finishRoundResolution: () => {
        const state = get()
        if (state.combat.phase !== 'resolving' || !state.combat.lastResolution) return
        if (state.combat.lastResolution.enemyActed && state.combat.resolutionStep !== 'enemy_attack') return

        if (state.combat.lastResolution.outcome === 'victory') {
          set({
            screen: 'post_combat',
            combat: { ...state.combat, phase: 'victory' },
          })
          return
        }

        if (state.combat.lastResolution.outcome === 'defeat') {
          set({
            screen: 'defeat',
            combat: { ...state.combat, phase: 'defeat' },
          })
          return
        }

        const enemy = state.run.enemy
        if (!enemy) return
        set({
          run: {
            ...state.run,
            enemy: rollNextEnemyIntent(enemy),
          },
          combat: createCombatState(
            state.run.equippedDiceSnapshot,
            state.combat.roundNumber + 1,
            state.combat.resolutionVersion,
            true,
          ),
        })
      },

      advanceToNextFloor: () => {
        const state = get()
        if (state.screen !== 'post_combat' || state.run.status !== 'victory' || !state.run.dungeonId) return
        const dungeon = DUNGEONS[state.run.dungeonId]
        const nextEncounterIndex = state.run.encounterIndex + 1
        const nextFloor = dungeon.floors[nextEncounterIndex]
        if (!nextFloor) return

        set({
          screen: 'combat',
          run: {
            ...state.run,
            status: 'active',
            encounterIndex: nextEncounterIndex,
            enemy: createEnemyState(nextFloor.encounterId),
            lastReward: null,
          },
          combat: createCombatState(
            state.run.equippedDiceSnapshot,
            1,
            state.combat.resolutionVersion,
            true,
          ),
        })
      },

      returnToHubAfterVictory: () => {
        const state = get()
        if (state.screen !== 'post_combat' || state.run.status !== 'victory') return
        if (!state.run.lastReward?.dungeonComplete) return
        set({
          screen: 'hub',
          run: createInactiveRun(),
          combat: createCombatState([], 1, state.combat.resolutionVersion),
        })
      },

      returnToHubAfterDefeat: () => {
        const state = get()
        if (state.screen !== 'defeat') return
        set({
          screen: 'hub',
          run: createInactiveRun(),
          combat: createCombatState([], 1, state.combat.resolutionVersion),
        })
      },

      purchaseTalent: (talentId) => {
        const state = get()
        const talent = TALENTS_BY_ID[talentId]
        if (state.run.status !== 'inactive' || !talent) return false
        if (!canPurchaseTalent(state.profile, talentId)) return false

        const currentRank = getTalentRank(state.profile.talentRanks, talent.id)
        const nextRank = getNextTalentRank(state.profile.talentRanks, talent)
        if (!nextRank) return false

        const diceCollection = [...state.profile.diceCollection]
        const unlockedDungeonIds = [...state.profile.unlockedDungeonIds]
        for (const effect of nextRank.effects) {
          if (effect.type === 'grant_die') {
            if (diceCollection.some((die) => die.id === effect.dieId)) continue
            const grantedDie = createDieById(effect.dieId)
            if (grantedDie) diceCollection.push(grantedDie)
          }
          if (
            effect.type === 'unlock_dungeon'
            && !unlockedDungeonIds.includes(effect.dungeonId)
          ) {
            unlockedDungeonIds.push(effect.dungeonId)
          }
        }

        set({
          profile: {
            ...state.profile,
            xp: state.profile.xp - nextRank.cost,
            talentRanks: {
              ...state.profile.talentRanks,
              [talent.id]: currentRank + 1,
            },
            diceCollection,
            unlockedDungeonIds,
          },
        })
        return true
      },

      equipDie: (dieId) => {
        const state = get()
        if (state.run.status !== 'inactive') return false
        if (!state.profile.diceCollection.some((die) => die.id === dieId)) return false
        if (state.profile.equippedDieIds.includes(dieId)) return false
        if (state.profile.equippedDieIds.length >= getDiceCapacity(state.profile.talentRanks)) return false

        set({
          profile: {
            ...state.profile,
            equippedDieIds: [...state.profile.equippedDieIds, dieId],
          },
        })
        return true
      },

      unequipDie: (dieId) => {
        const state = get()
        if (state.run.status !== 'inactive') return false
        if (!state.profile.equippedDieIds.includes(dieId)) return false
        if (state.profile.equippedDieIds.length <= 1) return false

        set({
          profile: {
            ...state.profile,
            equippedDieIds: state.profile.equippedDieIds.filter((id) => id !== dieId),
          },
        })
        return true
      },

      setAutoRoll: (enabled) => {
        const state = get()
        const autoRoll = enabled && hasAutoRollUnlocked(state.profile.talentRanks)
        set({
          profile: {
            ...state.profile,
            settings: {
              ...state.profile.settings,
              autoRoll,
            },
          },
        })
      },

      upgradeFace: (dieId, faceId) => {
        const state = get()
        if (state.run.status !== 'inactive') return false

        const die = state.profile.diceCollection.find((candidate) => candidate.id === dieId)
        const face = die?.faces.find((candidate) => candidate.id === faceId)
        if (!die || !face) return false

        const cost = getFaceUpgradeCost(face.value)
        if (cost === null || face.value >= BASE_FACE_CAP || state.profile.bankedSouls < cost) return false

        const diceCollection = state.profile.diceCollection.map((candidate) => {
          if (candidate.id !== dieId) return candidate
          return {
            ...candidate,
            faces: candidate.faces.map((candidateFace) => (
              candidateFace.id === faceId
                ? { ...candidateFace, value: candidateFace.value + 1 }
                : candidateFace
            )) as DieFaces,
          }
        })

        set({
          profile: {
            ...state.profile,
            bankedSouls: state.profile.bankedSouls - cost,
            diceCollection,
          },
        })
        return true
      },

      resetProgress: () => {
        set({
          ...initialState,
          profile: createInitialProfile(),
          run: createInactiveRun(),
          combat: createCombatState(),
        })
      },
    }),
    {
      name: NEW_GAME_SAVE_KEY,
      version: SAVE_VERSION,
      storage: createJSONStorage(() => (
        typeof localStorage === 'undefined' ? NON_BROWSER_STORAGE : localStorage
      )),
      migrate: migrateNewGameState,
      partialize: (state) => ({
        screen: state.screen,
        profile: state.profile,
        run: state.run,
        combat: state.combat,
      }) as NewGameState,
    },
  ),
)
