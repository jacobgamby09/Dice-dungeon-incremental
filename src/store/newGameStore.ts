import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'
import {
  fastForwardAutoCombat,
  type AutomationScreen,
} from '../game/automation/autoCombat'
import { createCombatState } from '../game/combat/combatState'
import { addRollEffects, rollDie } from '../game/combat/rollDie'
import { findEnemyRollByValue, totalEnemyRolls } from '../game/combat/rollEnemyDie'
import { resolveRound } from '../game/combat/resolveRound'
import { createDieById, createStartingDice } from '../game/content/dice'
import { DUNGEONS } from '../game/content/dungeons'
import { getEnemyDie } from '../game/content/enemyDice'
import { createEnemyState, ENCOUNTERS, rollNextEnemyIntent } from '../game/content/enemies'
import { TALENT_IDS, TALENTS_BY_ID } from '../game/content/talents'
import {
  chaosForge,
  evolveAttackFace,
  migrateLegacyAttackEvolution,
  precisionForge,
  type ForgeResult,
} from '../game/forge/forge'
import { createPostDungeonOneDevProfile } from '../game/dev/postDungeonOnePreset'
import { createEarlyQolTestProfile } from '../game/dev/earlyQolPreset'
import {
  BASE_PLAYER_HP,
  canPurchaseTalent,
  getDiceCapacity,
  getNextTalentRank,
  getPlayerMaxHp,
  getTalentRank,
  hasAutoCombatUnlocked,
  normalizeTalentRanks,
} from '../game/progression/talents'
import type { CombatState, RoundResolution } from '../game/types/combat'
import type { AttackEvolutionId, DieFaces, DieInstance, RollResult } from '../game/types/dice'
import { cloneDie } from '../game/types/dice'
import type {
  DungeonId,
  DungeonProgress,
  EncounterId,
  EnemyState,
  AwayRecap,
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
  awayRecap: AwayRecap | null
  runMenuOpen: boolean
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
  setAutoCombat: (enabled: boolean) => void
  checkpointAutoCombat: (now?: number) => void
  resumeAutoCombat: (now?: number) => AwayRecap | null
  dismissAwayRecap: () => void
  openRunMenu: () => void
  closeRunMenu: () => void
  leaveDungeonRun: () => void
  chaosForgeDie: (dieId: string, operationId: string, random?: () => number) => ForgeResult | null
  precisionForgeFace: (dieId: string, faceId: string, operationId: string) => ForgeResult | null
  evolveFace: (dieId: string, faceId: string, evolutionId: AttackEvolutionId) => boolean
  loadEarlyQolDevPreset: () => void
  loadPostDungeonOneDevPreset: () => void
  resetProgress: () => void
}

const SAVE_VERSION = 11
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
    recentForgeOperationIds: [],
    settings: {
      rollSpeed: 1,
      autoCombat: false,
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

function createRunAutomation() {
  return {
    bankedMilliseconds: 0,
    lastCheckpointAt: null,
    randomSeed: 0x9E3779B9,
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
    automation: createRunAutomation(),
    equippedDiceSnapshot: [],
    enemy: null,
    lastReward: null,
  }
}

type LegacyEnemyState = Partial<EnemyState> & {
  attackDieId?: string
  intentRoll?: {
    value?: number
  }
  intent?: { type?: 'attack'; value?: number }
}

type LegacyPlayerSettings = {
  autoCombat?: boolean
  autoResolve?: boolean
  autoRoll?: boolean
  rollSpeed?: number
}

type LegacyPlayerProfile = Omit<Partial<PlayerProfile>, 'settings'> & {
  settings?: LegacyPlayerSettings
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
    bleed: Math.max(0, existingEnemy.bleed ?? 0),
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
        faces: existingDie.faces.map((face) => migrateLegacyAttackEvolution({
          ...face,
          evolutionReady: face.evolutionReady ?? undefined,
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
  const legacyAutoCombatRefund = version < 10
    && getTalentRank(talentRanks, TALENT_IDS.autoCombat) > 0
    ? 28
    : 0
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
    xp: (existingProfile?.xp ?? freshProfile.xp) + legacyAutoCombatRefund,
    bankedSouls: existingProfile?.bankedSouls ?? freshProfile.bankedSouls,
    talentRanks,
    unlockedDungeonIds: existingProfile?.unlockedDungeonIds ?? freshProfile.unlockedDungeonIds,
    dungeonProgress: {
      ...createInitialDungeonProgress(),
      ...existingProfile?.dungeonProgress,
    },
    diceCollection,
    equippedDieIds,
    recentForgeOperationIds: existingProfile?.recentForgeOperationIds?.slice(-20) ?? [],
    settings: {
      rollSpeed: Math.max(
        0.25,
        existingProfile?.settings?.rollSpeed ?? freshProfile.settings.rollSpeed,
      ),
      autoCombat: hasAutoCombatUnlocked(talentRanks)
        ? Boolean(
            existingProfile?.settings?.autoCombat
            ?? existingProfile?.settings?.autoRoll,
          )
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
        automation: existingRun.automation
          ? {
              bankedMilliseconds: Math.max(
                0,
                existingRun.automation.bankedMilliseconds ?? 0,
              ),
              lastCheckpointAt: Number.isFinite(existingRun.automation.lastCheckpointAt)
                ? existingRun.automation.lastCheckpointAt
                : null,
              randomSeed: Number.isFinite(existingRun.automation.randomSeed)
                ? existingRun.automation.randomSeed >>> 0
                : createRunAutomation().randomSeed,
            }
          : createRunAutomation(),
        equippedDiceSnapshot: (existingRun.equippedDiceSnapshot ?? []).map((die) => ({
          ...die,
          faces: die.faces.map((face) => migrateLegacyAttackEvolution({
            ...face,
            evolutionReady: face.evolutionReady ?? undefined,
            evolution: face.evolution ? { ...face.evolution } : undefined,
          })) as DieFaces,
        })),
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
          pendingMomentum: Math.max(0, existingCombat.pendingMomentum ?? 0),
        }
      : createCombatState()

  return {
    screen: canPreserveRun ? persisted.screen ?? 'combat' : 'hub',
    profile: migratedProfile,
    run: migratedRun,
    combat: migratedCombat,
    awayRecap: null,
    runMenuOpen: false,
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
  awayRecap: null,
  runMenuOpen: false,
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
        const startedAt = Date.now()

        set({
          screen: 'combat',
          awayRecap: null,
          runMenuOpen: false,
          run: {
            status: 'active',
            dungeonId,
            encounterIndex: 0,
            playerHp: playerMaxHp,
            playerMaxHp,
            runStats: createEmptyRunStats(),
            automation: {
              bankedMilliseconds: 0,
              lastCheckpointAt: state.profile.settings.autoCombat ? startedAt : null,
              randomSeed: (startedAt ^ state.combat.resolutionVersion ^ 0x9E3779B9) >>> 0,
            },
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
        const rollEffects = addRollEffects(
          state.combat.totals,
          state.combat.pendingMomentum,
          result,
          allDiceDrawn,
        )

        set({
          combat: {
            ...state.combat,
            phase: allDiceDrawn ? 'awaiting_resolve' : 'awaiting_roll',
            drawPileDieIds: remainingDieIds,
            results: [...state.combat.results, result],
            totals: rollEffects.totals,
            pendingMomentum: rollEffects.pendingMomentum,
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
          enemyBleed: enemy.bleed,
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
                bleed: resolution.enemyBleed,
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
                bleed: resolution.enemyBleed,
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
              bleed: resolution.enemyBleed,
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
                    bleed: resolution.enemyBleed,
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
                  bleed: resolution.enemyBleed,
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

      setAutoCombat: (enabled) => {
        const state = get()
        const autoCombat = enabled && hasAutoCombatUnlocked(state.profile.talentRanks)
        const canContinueRun = state.run.status === 'active'
          || (
            state.run.status === 'victory'
            && !state.run.lastReward?.dungeonComplete
          )
        set({
          profile: {
            ...state.profile,
            settings: {
              ...state.profile.settings,
              autoCombat,
            },
          },
          run: {
            ...state.run,
            automation: {
              ...state.run.automation,
              bankedMilliseconds: 0,
              lastCheckpointAt: autoCombat && canContinueRun ? Date.now() : null,
            },
          },
        })
      },

      checkpointAutoCombat: (now = Date.now()) => {
        const state = get()
        if (
          state.runMenuOpen ||
          !state.profile.settings.autoCombat
          || !hasAutoCombatUnlocked(state.profile.talentRanks)
          || (
            state.run.status !== 'active'
            && !(
              state.run.status === 'victory'
              && !state.run.lastReward?.dungeonComplete
            )
          )
        ) {
          return
        }
        set({
          run: {
            ...state.run,
            automation: {
            ...state.run.automation,
              bankedMilliseconds: 0,
              lastCheckpointAt: Math.max(0, now),
            },
          },
        })
      },

      resumeAutoCombat: (now = Date.now()) => {
        const state = get()
        const checkpointAt = state.run.automation.lastCheckpointAt
        if (
          state.runMenuOpen ||
          !state.profile.settings.autoCombat
          || !hasAutoCombatUnlocked(state.profile.talentRanks)
          || state.run.status === 'inactive'
          || checkpointAt === null
          || !(['combat', 'post_combat', 'defeat'] as AppScreen[]).includes(state.screen)
        ) {
          return null
        }

        const elapsedMilliseconds = Math.max(0, now - checkpointAt)
        if (elapsedMilliseconds <= 0) return null
        const result = fastForwardAutoCombat({
          screen: state.screen as AutomationScreen,
          profile: state.profile,
          run: state.run,
          combat: state.combat,
        }, elapsedMilliseconds)
        const terminal = result.screen === 'defeat'
          || (result.screen === 'post_combat' && result.run.lastReward?.dungeonComplete)

        set({
          screen: result.screen,
          profile: result.profile,
          run: {
            ...result.run,
            automation: {
              bankedMilliseconds: terminal ? 0 : result.bankedMilliseconds,
              lastCheckpointAt: terminal ? null : Math.max(0, now),
              randomSeed: result.randomSeed,
            },
          },
          combat: result.combat,
          awayRecap: result.recap ?? state.awayRecap,
        })
        return result.recap
      },

      dismissAwayRecap: () => {
        set({ awayRecap: null })
      },

      openRunMenu: () => {
        const state = get()
        if (state.screen !== 'combat' || state.run.status !== 'active') return
        if (state.combat.phase === 'resolving') return
        set({
          runMenuOpen: true,
          run: {
            ...state.run,
            automation: {
              ...state.run.automation,
              bankedMilliseconds: 0,
              lastCheckpointAt: null,
            },
          },
        })
      },

      closeRunMenu: () => {
        const state = get()
        if (!state.runMenuOpen) return
        const canResumeAutoCombat = (
          state.screen === 'combat'
          && state.run.status === 'active'
          && state.profile.settings.autoCombat
          && hasAutoCombatUnlocked(state.profile.talentRanks)
        )
        set({
          runMenuOpen: false,
          run: {
            ...state.run,
            automation: {
              ...state.run.automation,
              bankedMilliseconds: 0,
              lastCheckpointAt: canResumeAutoCombat ? Date.now() : null,
            },
          },
        })
      },

      leaveDungeonRun: () => {
        const state = get()
        if (state.screen !== 'combat' || state.run.status !== 'active') return
        set({
          screen: 'hub',
          run: createInactiveRun(),
          combat: createCombatState([], 1, state.combat.resolutionVersion),
          awayRecap: null,
          runMenuOpen: false,
        })
      },

      chaosForgeDie: (dieId, operationId, random = Math.random) => {
        const state = get()
        if (state.run.status !== 'inactive') return null
        if (!operationId || state.profile.recentForgeOperationIds.includes(operationId)) return null
        const die = state.profile.diceCollection.find((candidate) => candidate.id === dieId)
        if (!die) return null
        const forged = chaosForge(die, random)
        if (!forged || state.profile.bankedSouls < forged.result.cost) return null
        set({
          profile: {
            ...state.profile,
            bankedSouls: state.profile.bankedSouls - forged.result.cost,
            diceCollection: state.profile.diceCollection.map((candidate) => (
              candidate.id === dieId ? forged.die : candidate
            )),
            recentForgeOperationIds: [
              ...state.profile.recentForgeOperationIds,
              operationId,
            ].slice(-20),
          },
        })
        return forged.result
      },

      precisionForgeFace: (dieId, faceId, operationId) => {
        const state = get()
        if (state.run.status !== 'inactive') return null
        if (!operationId || state.profile.recentForgeOperationIds.includes(operationId)) return null
        const die = state.profile.diceCollection.find((candidate) => candidate.id === dieId)
        if (!die) return null
        const forged = precisionForge(die, faceId)
        if (!forged || state.profile.bankedSouls < forged.result.cost) return null
        set({
          profile: {
            ...state.profile,
            bankedSouls: state.profile.bankedSouls - forged.result.cost,
            diceCollection: state.profile.diceCollection.map((candidate) => (
              candidate.id === dieId ? forged.die : candidate
            )),
            recentForgeOperationIds: [
              ...state.profile.recentForgeOperationIds,
              operationId,
            ].slice(-20),
          },
        })
        return forged.result
      },

      evolveFace: (dieId, faceId, evolutionId) => {
        const state = get()
        if (state.run.status !== 'inactive') return false
        const die = state.profile.diceCollection.find((candidate) => candidate.id === dieId)
        if (!die) return false
        const evolvedDie = evolveAttackFace(die, faceId, evolutionId)
        if (!evolvedDie) return false
        set({
          profile: {
            ...state.profile,
            diceCollection: state.profile.diceCollection.map((candidate) => (
              candidate.id === dieId ? evolvedDie : candidate
            )),
          },
        })
        return true
      },

      loadEarlyQolDevPreset: () => {
        const state = get()
        set({
          ...initialState,
          profile: createEarlyQolTestProfile(createInitialProfile()),
          run: createInactiveRun(),
          combat: createCombatState([], 1, state.combat.resolutionVersion),
          awayRecap: null,
          runMenuOpen: false,
        })
      },

      loadPostDungeonOneDevPreset: () => {
        const state = get()
        set({
          ...initialState,
          profile: createPostDungeonOneDevProfile(createInitialProfile()),
          run: createInactiveRun(),
          combat: createCombatState([], 1, state.combat.resolutionVersion),
          awayRecap: null,
          runMenuOpen: false,
        })
      },

      resetProgress: () => {
        set({
          ...initialState,
          profile: createInitialProfile(),
          run: createInactiveRun(),
          combat: createCombatState(),
          awayRecap: null,
          runMenuOpen: false,
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
        awayRecap: state.awayRecap,
      }) as NewGameState,
    },
  ),
)
