import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'
import { createCombatState } from '../game/combat/combatState'
import {
  applyKillCharms,
  applyRollCharms,
  beginCharmRound,
  createCharmRunState,
} from '../game/combat/charms'
import { addRollEffects, rollDie } from '../game/combat/rollDie'
import { findEnemyRollByValue, totalEnemyRolls } from '../game/combat/rollEnemyDie'
import { resolveRound } from '../game/combat/resolveRound'
import { createDieById, createStartingDice } from '../game/content/dice'
import { DUNGEONS } from '../game/content/dungeons'
import { getEnemyDie } from '../game/content/enemyDice'
import { createEnemyState, ENCOUNTERS, rollNextEnemyIntent } from '../game/content/enemies'
import { TALENT_IDS, TALENTS_BY_ID } from '../game/content/talents'
import {
  completeWorkshopForge,
  EVOLUTION_DEFINITIONS,
  evolveFaceOnDie,
  migrateLegacyFaceEvolution,
  prepareWorkshopForge,
  precisionForge,
  type ForgeResult,
} from '../game/forge/forge'
import { createPostDungeonOneDevProfile } from '../game/dev/postDungeonOnePreset'
import { createEarlyQolTestProfile } from '../game/dev/earlyQolPreset'
import { createCharmTestProfile } from '../game/dev/charmTestPreset'
import {
  BASE_PLAYER_HP,
  canPurchaseTalent,
  getCharmCapacity,
  getDiceCapacity,
  getNextTalentRank,
  getPlayerMaxHp,
  getTalentRank,
  getWorkshopDieFaces,
  getWorkshopFaceCap,
  getWorkshopCostMultiplier,
  hasAutoCombatUnlocked,
  hasCharmsUnlocked,
  normalizeTalentRanks,
} from '../game/progression/talents'
import { getEnemyRewardBreakdown } from '../game/progression/rewards'
import {
  claimFateDraw,
  createFateDraw,
  FATE_DRAW_COST,
  rollFateDrop,
} from '../game/progression/fate'
import type { CombatState, RoundResolution } from '../game/types/combat'
import type { DieFaces, DieInstance, FaceEvolutionId, RollResult } from '../game/types/dice'
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
import type { PendingWorkshopForge } from '../game/types/workshop'
import type { CharmId, CharmSnapshot, PendingFateDraw } from '../game/types/charms'

export type AppScreen =
  | 'hub'
  | 'dungeon_select'
  | 'combat'
  | 'post_combat'
  | 'workshop'
  | 'fate_sanctum'
  | 'talent_tree'
  | 'loadout'
  | 'defeat'

export interface NewGameState {
  screen: AppScreen
  profile: PlayerProfile
  run: RunState
  combat: CombatState
  runMenuOpen: boolean
  openDungeonSelect: () => void
  openWorkshop: () => void
  openFateSanctum: () => void
  openTalentTree: () => void
  openLoadout: () => void
  goToHub: () => void
  startRun: (dungeonId: DungeonId) => void
  finishEnemyIntentReveal: () => void
  drawNextDie: () => RollResult | null
  beginRoundResolution: (random?: () => number) => RoundResolution | null
  advanceRoundResolution: () => void
  finishRoundResolution: () => void
  advanceToNextFloor: () => void
  returnToHubAfterVictory: () => void
  returnToHubAfterDefeat: () => void
  purchaseTalent: (talentId: string) => boolean
  equipDie: (dieId: string) => boolean
  unequipDie: (dieId: string) => boolean
  setAutoCombat: (enabled: boolean) => void
  openRunMenu: () => void
  closeRunMenu: () => void
  leaveDungeonRun: () => void
  beginWorkshopForge: (
    dieId: string,
    operationId: string,
    random?: () => number,
  ) => PendingWorkshopForge | null
  completePendingWorkshopForge: (operationId: string) => ForgeResult | null
  precisionForgeFace: (dieId: string, faceId: string, operationId: string) => ForgeResult | null
  evolveFace: (dieId: string, faceId: string, evolutionId: FaceEvolutionId) => boolean
  beginFateDraw: (operationId: string, random?: () => number) => PendingFateDraw | null
  claimFateCharm: (charmId: CharmId) => boolean
  equipCharm: (charmId: CharmId) => boolean
  unequipCharm: (charmId: CharmId) => boolean
  loadEarlyQolDevPreset: () => void
  loadCharmTestDevPreset: () => void
  loadPostDungeonOneDevPreset: () => void
  resetProgress: () => void
}

const SAVE_VERSION = 16
const LEGACY_FATECRAFT_REFUND = 75
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
    fateTokens: 0,
    fatePity: 0,
    talentRanks: {},
    unlockedDungeonIds: ['prototype-depths'],
    dungeonProgress: createInitialDungeonProgress(),
    diceCollection,
    equippedDieIds: diceCollection.map((die) => die.id),
    recentForgeOperationIds: [],
    charmRanks: {},
    equippedCharmIds: [],
    pendingFateDraw: null,
    recentFateOperationIds: [],
    pendingWorkshopForge: null,
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
    baseSoulsEarned: 0,
    baseXpEarned: 0,
    bonusSoulsEarned: 0,
    bonusXpEarned: 0,
    charmBonusSoulsEarned: 0,
    fateTokensEarned: 0,
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
    equippedCharmSnapshot: [],
    charmState: createCharmRunState(),
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

function migrateDieInstance(existingDie: DieInstance): DieInstance | null {
  const canonicalDie = createDieById(existingDie.id)
  if (!canonicalDie) return null

  return {
    ...canonicalDie,
    faces: canonicalDie.faces.map((canonicalFace, index) => {
      const existingFace = existingDie.faces.find((face) => face.id === canonicalFace.id)
        ?? existingDie.faces[index]
      if (canonicalFace.signature || !existingFace) return canonicalFace

      const storedEvolution = existingFace.evolution
      const validEvolution = storedEvolution
        && EVOLUTION_DEFINITIONS[storedEvolution.id]?.family === canonicalFace.type
        ? {
            id: storedEvolution.id,
            name: EVOLUTION_DEFINITIONS[storedEvolution.id].name,
          }
        : undefined

      return migrateLegacyFaceEvolution({
        ...canonicalFace,
        value: Math.max(canonicalFace.value, existingFace.value),
        evolutionReady: validEvolution
          ? undefined
          : existingFace.evolutionReady ?? undefined,
        evolution: validEvolution,
      })
    }) as DieFaces,
  }
}

function migrateNewGameState(persistedState: unknown, version: number): NewGameState {
  if (version >= SAVE_VERSION) return persistedState as NewGameState
  if (version === 15) {
    const persisted = persistedState as NewGameState
    return {
      ...persisted,
      profile: {
        ...persisted.profile,
        saveVersion: SAVE_VERSION,
        fateTokens: 0,
        fatePity: 0,
        charmRanks: {},
        equippedCharmIds: [],
        pendingFateDraw: null,
        recentFateOperationIds: [],
      },
      run: {
        ...persisted.run,
        equippedCharmSnapshot: [],
        charmState: createCharmRunState(),
        runStats: {
          ...createEmptyRunStats(),
          ...persisted.run?.runStats,
        },
      },
      combat: {
        ...persisted.combat,
        lastCharmTriggers: [],
        charmTriggerVersion: 0,
      },
    }
  }
  if (version === 14) {
    const persisted = persistedState as NewGameState
    const existingRanks = normalizeTalentRanks(persisted.profile?.talentRanks)
    const hadTwinArsenal = getTalentRank(existingRanks, TALENT_IDS.twinArsenal) > 0
    const hadFatecraft = getTalentRank(existingRanks, TALENT_IDS.fatecraft) > 0
    const talentRanks = hadTwinArsenal
      ? { ...existingRanks, [TALENT_IDS.strikerPattern]: 1 }
      : existingRanks
    if (hadFatecraft) delete talentRanks[TALENT_IDS.fatecraft]
    const diceCollection = [...(persisted.profile?.diceCollection ?? createStartingDice())]
    if (
      hadTwinArsenal
      && !diceCollection.some((die) => die.id === 'attack-die-2')
    ) {
      const strikerDie = createDieById('attack-die-2')
      if (strikerDie) diceCollection.push(strikerDie)
    }
    return {
      ...persisted,
      profile: {
        ...persisted.profile,
        saveVersion: SAVE_VERSION,
        xp: (persisted.profile?.xp ?? 0)
          + (hadFatecraft ? LEGACY_FATECRAFT_REFUND : 0),
        talentRanks,
        diceCollection,
        fateTokens: 0,
        fatePity: 0,
        charmRanks: {},
        equippedCharmIds: [],
        pendingFateDraw: null,
        recentFateOperationIds: [],
      },
      run: {
        ...persisted.run,
        equippedCharmSnapshot: [],
        charmState: createCharmRunState(),
        runStats: {
          ...createEmptyRunStats(),
          ...persisted.run?.runStats,
        },
      },
      combat: {
        ...persisted.combat,
        lastCharmTriggers: [],
        charmTriggerVersion: 0,
      },
    }
  }
  if (version === 13) {
    const persisted = persistedState as Partial<NewGameState>
    const existingProfile = persisted.profile as Partial<PlayerProfile> | undefined
    const existingRanks = normalizeTalentRanks(existingProfile?.talentRanks)
    const hadTwinArsenal = getTalentRank(existingRanks, TALENT_IDS.twinArsenal) > 0
    const hadFatecraft = getTalentRank(existingRanks, TALENT_IDS.fatecraft) > 0
    const talentRanks = hadTwinArsenal
      ? { ...existingRanks, [TALENT_IDS.strikerPattern]: 1 }
      : existingRanks
    if (hadFatecraft) delete talentRanks[TALENT_IDS.fatecraft]
    return {
      ...persisted,
      profile: {
        ...createInitialProfile(),
        ...existingProfile,
        saveVersion: SAVE_VERSION,
        xp: (existingProfile?.xp ?? 0)
          + (hadFatecraft ? LEGACY_FATECRAFT_REFUND : 0),
        talentRanks,
        pendingWorkshopForge: null,
      },
    } as NewGameState
  }
  if (version < SAVE_VERSION) {
    return {
      screen: 'hub',
      profile: createInitialProfile(),
      run: createInactiveRun(),
      combat: createCombatState([], 1),
      runMenuOpen: false,
    } as NewGameState
  }

  const persisted = persistedState as Partial<NewGameState>
  const freshProfile = createInitialProfile()
  const existingProfile = persisted.profile as LegacyPlayerProfile | undefined
  const allowedExistingDice = version < 2
    ? existingProfile?.diceCollection?.filter((die) => die.id === 'attack-die-1') ?? []
    : existingProfile?.diceCollection ?? []
  const diceCollection = allowedExistingDice
    .map(migrateDieInstance)
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
    pendingWorkshopForge: null,
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
        equippedDiceSnapshot: (existingRun.equippedDiceSnapshot ?? [])
          .map(migrateDieInstance)
          .filter((die): die is DieInstance => die !== null),
        equippedCharmSnapshot: [],
        charmState: createCharmRunState(),
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
          pendingFortify: Math.max(0, existingCombat.pendingFortify ?? 0),
          lastCharmTriggers: [],
          charmTriggerVersion: 0,
          carriedShield: Math.max(0, existingCombat.carriedShield ?? 0),
          carriedHeal: Math.max(0, existingCombat.carriedHeal ?? 0),
        }
      : createCombatState()

  return {
    screen: canPreserveRun ? persisted.screen ?? 'combat' : 'hub',
    profile: migratedProfile,
    run: migratedRun,
    combat: migratedCombat,
    runMenuOpen: false,
  } as NewGameState
}

function getEquippedDice(profile: PlayerProfile): DieInstance[] {
  return profile.equippedDieIds
    .map((dieId) => profile.diceCollection.find((die) => die.id === dieId))
    .filter((die): die is DieInstance => die !== undefined)
    .map(cloneDie)
}

function getEquippedCharms(profile: PlayerProfile): CharmSnapshot[] {
  return profile.equippedCharmIds
    .map((charmId) => ({
      id: charmId,
      rank: profile.charmRanks[charmId] ?? 0,
    }))
    .filter((snapshot) => snapshot.rank > 0)
}

const initialState = {
  screen: 'hub' as const,
  profile: createInitialProfile(),
  run: createInactiveRun(),
  combat: createCombatState(),
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

      openFateSanctum: () => {
        const state = get()
        if (state.run.status !== 'inactive') return
        if (!hasCharmsUnlocked(state.profile.talentRanks)) return
        set({ screen: 'fate_sanctum' })
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
        const equippedCharmSnapshot = getEquippedCharms(state.profile)
        if (equippedDiceSnapshot.length === 0) return
        const playerMaxHp = getPlayerMaxHp(state.profile.talentRanks)
        const firstCharmRound = beginCharmRound(
          equippedCharmSnapshot,
          createCharmRunState(),
        )
        set({
          screen: 'combat',
          runMenuOpen: false,
          run: {
            status: 'active',
            dungeonId,
            encounterIndex: 0,
            playerHp: playerMaxHp,
            playerMaxHp,
            runStats: createEmptyRunStats(),
            equippedDiceSnapshot,
            equippedCharmSnapshot,
            charmState: firstCharmRound.state,
            enemy: createEnemyState(firstEncounterId),
            lastReward: null,
          },
          combat: createCombatState(
            equippedDiceSnapshot,
            1,
            state.combat.resolutionVersion,
            true,
            Math.random,
            { shield: firstCharmRound.shield },
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

        const rolledResult = rollDie(die)
        const charmRoll = applyRollCharms(
          rolledResult,
          state.run.equippedCharmSnapshot,
          state.run.charmState,
        )
        const result = charmRoll.result
        const allDiceDrawn = remainingDieIds.length === 0
        const rollEffects = addRollEffects(
          state.combat.totals,
          state.combat.pendingMomentum,
          result,
          allDiceDrawn,
          state.combat.pendingFortify,
          {
            enemyHp: state.run.enemy?.hp,
            enemyMaxHp: state.run.enemy?.maxHp,
          },
        )

        set({
          run: {
            ...state.run,
            charmState: charmRoll.state,
          },
          combat: {
            ...state.combat,
            phase: allDiceDrawn ? 'awaiting_resolve' : 'awaiting_roll',
            drawPileDieIds: remainingDieIds,
            results: [...state.combat.results, result],
            totals: rollEffects.totals,
            pendingMomentum: rollEffects.pendingMomentum,
            pendingFortify: rollEffects.pendingFortify,
            lastCharmTriggers: charmRoll.triggers,
            charmTriggerVersion: state.combat.charmTriggerVersion
              + (charmRoll.triggers.length > 0 ? 1 : 0),
          },
        })
        return result
      },

      beginRoundResolution: (random = Math.random) => {
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
          carriedShield: state.combat.carriedShield,
          carriedHeal: state.combat.carriedHeal,
        })
        const resolutionVersion = state.combat.resolutionVersion + 1

        if (resolution.outcome === 'victory') {
          const dungeon = DUNGEONS[state.run.dungeonId!]
          const rewardAlreadyClaimed = enemy.rewardClaimed
          const reward = rewardAlreadyClaimed
            ? getEnemyRewardBreakdown(0, 0, {})
            : getEnemyRewardBreakdown(
                enemy.xpReward,
                enemy.soulReward,
                state.profile.talentRanks,
              )
          const charmKill = rewardAlreadyClaimed
            ? {
                heal: 0,
                soulBonus: 0,
                state: state.run.charmState,
                triggers: [],
              }
            : applyKillCharms(
                state.run.equippedCharmSnapshot,
                state.run.charmState,
                reward.baseSouls,
              )
          const fateDrop = !rewardAlreadyClaimed
            && hasCharmsUnlocked(state.profile.talentRanks)
            ? rollFateDrop(enemy.rewardTier, state.profile.fatePity, random)
            : {
                tokens: 0,
                nextPity: state.profile.fatePity,
                pityTriggered: false,
              }
          const totalSouls = reward.souls + charmKill.soulBonus
          const playerHpAfterCharms = Math.min(
            state.run.playerMaxHp,
            resolution.playerHp + charmKill.heal,
          )
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
              xp: state.profile.xp + reward.xp,
              bankedSouls: state.profile.bankedSouls + totalSouls,
              fateTokens: state.profile.fateTokens + fateDrop.tokens,
              fatePity: fateDrop.nextPity,
              dungeonProgress,
            },
            run: {
              ...state.run,
              status: 'victory',
              playerHp: playerHpAfterCharms,
              charmState: charmKill.state,
              runStats: rewardAlreadyClaimed
                ? state.run.runStats
                : {
                    enemiesDefeated: state.run.runStats.enemiesDefeated + 1,
                    soulsEarned: state.run.runStats.soulsEarned + totalSouls,
                    xpEarned: state.run.runStats.xpEarned + reward.xp,
                    baseSoulsEarned: (state.run.runStats.baseSoulsEarned ?? 0) + reward.baseSouls,
                    baseXpEarned: (state.run.runStats.baseXpEarned ?? 0) + reward.baseXp,
                    bonusSoulsEarned: (state.run.runStats.bonusSoulsEarned ?? 0) + reward.bonusSouls,
                    bonusXpEarned: (state.run.runStats.bonusXpEarned ?? 0) + reward.bonusXp,
                    charmBonusSoulsEarned: (state.run.runStats.charmBonusSoulsEarned ?? 0)
                      + charmKill.soulBonus,
                    fateTokensEarned: (state.run.runStats.fateTokensEarned ?? 0)
                      + fateDrop.tokens,
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
                xp: reward.xp,
                souls: totalSouls,
                baseXp: reward.baseXp,
                baseSouls: reward.baseSouls,
                bonusXp: reward.bonusXp,
                bonusSouls: reward.bonusSouls,
                charmBonusSouls: charmKill.soulBonus,
                charmHealing: playerHpAfterCharms - resolution.playerHp,
                charmTriggers: charmKill.triggers,
                fateTokens: fateDrop.tokens,
                fatePity: fateDrop.nextPity,
                fatePityTriggered: fateDrop.pityTriggered,
                dungeonComplete,
              },
            },
            combat: {
              ...state.combat,
              phase: 'resolving',
              lastResolution: resolution,
              resolutionVersion,
              resolutionStep: 'player',
              lastCharmTriggers: charmKill.triggers,
              charmTriggerVersion: state.combat.charmTriggerVersion
                + (charmKill.triggers.length > 0 ? 1 : 0),
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
        const charmRound = beginCharmRound(
          state.run.equippedCharmSnapshot,
          state.run.charmState,
        )
        set({
          run: {
            ...state.run,
            enemy: rollNextEnemyIntent(enemy),
            charmState: charmRound.state,
          },
          combat: {
            ...createCombatState(
            state.run.equippedDiceSnapshot,
            state.combat.roundNumber + 1,
            state.combat.resolutionVersion,
            true,
            Math.random,
            {
              shield: state.combat.lastResolution.nextRoundShield + charmRound.shield,
              heal: state.combat.lastResolution.nextRoundHeal,
            },
            ),
            lastCharmTriggers: charmRound.triggers,
            charmTriggerVersion: state.combat.charmTriggerVersion
              + (charmRound.triggers.length > 0 ? 1 : 0),
          },
        })
      },

      advanceToNextFloor: () => {
        const state = get()
        if (state.screen !== 'post_combat' || state.run.status !== 'victory' || !state.run.dungeonId) return
        const dungeon = DUNGEONS[state.run.dungeonId]
        const nextEncounterIndex = state.run.encounterIndex + 1
        const nextFloor = dungeon.floors[nextEncounterIndex]
        if (!nextFloor) return
        const charmRound = beginCharmRound(
          state.run.equippedCharmSnapshot,
          state.run.charmState,
        )

        set({
          screen: 'combat',
          run: {
            ...state.run,
            status: 'active',
            encounterIndex: nextEncounterIndex,
            charmState: charmRound.state,
            enemy: createEnemyState(nextFloor.encounterId),
            lastReward: null,
          },
          combat: {
            ...createCombatState(
            state.run.equippedDiceSnapshot,
            1,
            state.combat.resolutionVersion,
            true,
            Math.random,
            { shield: charmRound.shield },
            ),
            lastCharmTriggers: charmRound.triggers,
            charmTriggerVersion: state.combat.charmTriggerVersion
              + (charmRound.triggers.length > 0 ? 1 : 0),
          },
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
        set({
          profile: {
            ...state.profile,
            settings: {
              ...state.profile.settings,
              autoCombat,
            },
          },
        })
      },

      openRunMenu: () => {
        const state = get()
        if (state.screen !== 'combat' || state.run.status !== 'active') return
        if (state.combat.phase === 'resolving') return
        set({
          runMenuOpen: true,
        })
      },

      closeRunMenu: () => {
        const state = get()
        if (!state.runMenuOpen) return
        set({ runMenuOpen: false })
      },

      leaveDungeonRun: () => {
        const state = get()
        if (state.screen !== 'combat' || state.run.status !== 'active') return
        set({
          screen: 'hub',
          run: createInactiveRun(),
          combat: createCombatState([], 1, state.combat.resolutionVersion),
          runMenuOpen: false,
        })
      },

      beginWorkshopForge: (dieId, operationId, random = Math.random) => {
        const state = get()
        if (state.run.status !== 'inactive') return null
        if (!operationId || state.profile.recentForgeOperationIds.includes(operationId)) return null
        if (state.profile.pendingWorkshopForge) return null
        const die = state.profile.diceCollection.find((candidate) => candidate.id === dieId)
        if (!die) return null
        const pendingForge = prepareWorkshopForge(
          die,
          operationId,
          getWorkshopDieFaces(state.profile.talentRanks),
          random,
          {
            costMultiplier: getWorkshopCostMultiplier(state.profile.talentRanks),
            faceCap: getWorkshopFaceCap(state.profile.talentRanks),
          },
        )
        if (!pendingForge || state.profile.bankedSouls < pendingForge.cost) return null
        set({
          profile: {
            ...state.profile,
            bankedSouls: state.profile.bankedSouls - pendingForge.cost,
            pendingWorkshopForge: pendingForge,
          },
        })
        return pendingForge
      },

      completePendingWorkshopForge: (operationId) => {
        const state = get()
        if (state.run.status !== 'inactive') return null
        const pendingForge = state.profile.pendingWorkshopForge
        if (
          !pendingForge
          || pendingForge.operationId !== operationId
          || state.profile.recentForgeOperationIds.includes(operationId)
        ) return null
        const die = state.profile.diceCollection.find(
          (candidate) => candidate.id === pendingForge.dieId,
        )
        if (!die) return null
        const forged = completeWorkshopForge(
          die,
          pendingForge,
          getWorkshopFaceCap(state.profile.talentRanks),
        )
        if (!forged) return null
        set({
          profile: {
            ...state.profile,
            diceCollection: state.profile.diceCollection.map((candidate) => (
              candidate.id === die.id ? forged.die : candidate
            )),
            pendingWorkshopForge: null,
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
        if (state.profile.pendingWorkshopForge) return null
        if (!operationId || state.profile.recentForgeOperationIds.includes(operationId)) return null
        const die = state.profile.diceCollection.find((candidate) => candidate.id === dieId)
        if (!die) return null
        const forged = precisionForge(
          die,
          faceId,
          getWorkshopFaceCap(state.profile.talentRanks),
          getWorkshopCostMultiplier(state.profile.talentRanks),
        )
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
        const evolvedDie = evolveFaceOnDie(die, faceId, evolutionId)
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

      beginFateDraw: (operationId, random = Math.random) => {
        const state = get()
        if (state.run.status !== 'inactive') return null
        if (!hasCharmsUnlocked(state.profile.talentRanks)) return null
        if (!operationId || state.profile.recentFateOperationIds.includes(operationId)) return null
        if (state.profile.pendingFateDraw) return null
        if (state.profile.fateTokens < FATE_DRAW_COST) return null

        const pendingFateDraw = createFateDraw(
          state.profile.charmRanks,
          operationId,
          random,
        )
        if (!pendingFateDraw) return null
        set({
          profile: {
            ...state.profile,
            fateTokens: state.profile.fateTokens - pendingFateDraw.cost,
            pendingFateDraw,
          },
        })
        return pendingFateDraw
      },

      claimFateCharm: (charmId) => {
        const state = get()
        const pendingDraw = state.profile.pendingFateDraw
        if (state.run.status !== 'inactive' || !pendingDraw) return false
        if (state.profile.recentFateOperationIds.includes(pendingDraw.operationId)) return false
        const charmRanks = claimFateDraw(state.profile.charmRanks, pendingDraw, charmId)
        if (!charmRanks) return false
        set({
          profile: {
            ...state.profile,
            charmRanks,
            pendingFateDraw: null,
            recentFateOperationIds: [
              ...state.profile.recentFateOperationIds,
              pendingDraw.operationId,
            ].slice(-20),
          },
        })
        return true
      },

      equipCharm: (charmId) => {
        const state = get()
        if (state.run.status !== 'inactive') return false
        if ((state.profile.charmRanks[charmId] ?? 0) <= 0) return false
        if (state.profile.equippedCharmIds.includes(charmId)) return false
        if (
          state.profile.equippedCharmIds.length
          >= getCharmCapacity(state.profile.talentRanks)
        ) return false
        set({
          profile: {
            ...state.profile,
            equippedCharmIds: [...state.profile.equippedCharmIds, charmId],
          },
        })
        return true
      },

      unequipCharm: (charmId) => {
        const state = get()
        if (state.run.status !== 'inactive') return false
        if (!state.profile.equippedCharmIds.includes(charmId)) return false
        set({
          profile: {
            ...state.profile,
            equippedCharmIds: state.profile.equippedCharmIds.filter(
              (candidate) => candidate !== charmId,
            ),
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
          runMenuOpen: false,
        })
      },

      loadCharmTestDevPreset: () => {
        const state = get()
        set({
          ...initialState,
          profile: createCharmTestProfile(createInitialProfile()),
          run: createInactiveRun(),
          combat: createCombatState([], 1, state.combat.resolutionVersion),
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
          runMenuOpen: false,
        })
      },

      resetProgress: () => {
        set({
          ...initialState,
          profile: createInitialProfile(),
          run: createInactiveRun(),
          combat: createCombatState(),
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
      }) as NewGameState,
    },
  ),
)
