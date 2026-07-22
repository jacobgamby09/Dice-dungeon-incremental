import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'
import { shuffleDieIds } from '../game/combat/drawBag'
import { addRollToTotals, rollDie } from '../game/combat/rollDie'
import { findEnemyAttackRollByValue } from '../game/combat/rollEnemyAttackDie'
import { resolveRound } from '../game/combat/resolveRound'
import { createDieById, createStartingDice } from '../game/content/dice'
import { DUNGEONS } from '../game/content/dungeons'
import { getEnemyAttackDie } from '../game/content/enemyDice'
import { createEnemyState, ENEMIES, rollNextEnemyIntent } from '../game/content/enemies'
import { TALENTS_BY_ID } from '../game/content/talents'
import { BASE_FACE_CAP, getFaceUpgradeCost } from '../game/content/upgradeCosts'
import {
  BASE_PLAYER_HP,
  canPurchaseTalent,
  getDiceCapacity,
  getPlayerMaxHp,
  hasAutoRollUnlocked,
} from '../game/progression/talents'
import type { CombatState, RoundResolution } from '../game/types/combat'
import { EMPTY_TOTALS } from '../game/types/combat'
import type { DieFaces, DieInstance, RollResult } from '../game/types/dice'
import { cloneDie } from '../game/types/dice'
import type { DungeonId, DungeonProgress, EnemyState, RunState } from '../game/types/dungeon'
import type { PlayerProfile } from '../game/types/progression'

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
  lastLostRunSouls: number
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
  continueRun: () => void
  extractRun: () => void
  returnToHubAfterDefeat: () => void
  purchaseTalent: (talentId: string) => boolean
  equipDie: (dieId: string) => boolean
  unequipDie: (dieId: string) => boolean
  setAutoRoll: (enabled: boolean) => void
  upgradeFace: (dieId: string, faceId: string) => boolean
  resetProgress: () => void
}

const SAVE_VERSION = 4
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
    unlockedTalentIds: [],
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
  }
}

function createInactiveRun(): RunState {
  return {
    status: 'inactive',
    dungeonId: null,
    encounterIndex: 0,
    runSouls: 0,
    playerHp: BASE_PLAYER_HP,
    playerMaxHp: BASE_PLAYER_HP,
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
  intent?: { type?: 'attack'; value?: number }
}

function migrateEnemyState(existingEnemy: LegacyEnemyState | null | undefined): EnemyState | null {
  if (!existingEnemy?.definitionId) return null
  const definition = ENEMIES[existingEnemy.definitionId]
  if (!definition) return null

  const canonicalEnemy = createEnemyState(definition.id, () => 0)
  const legacyIntentValue = existingEnemy.intentRoll?.value
    ?? existingEnemy.intent?.value
    ?? canonicalEnemy.intentRoll.value
  const attackDie = getEnemyAttackDie(definition.attackDieId)

  return {
    ...canonicalEnemy,
    hp: existingEnemy.hp ?? canonicalEnemy.hp,
    maxHp: existingEnemy.maxHp ?? canonicalEnemy.maxHp,
    shield: existingEnemy.shield ?? canonicalEnemy.shield,
    xpReward: existingEnemy.xpReward ?? canonicalEnemy.xpReward,
    soulReward: existingEnemy.soulReward ?? canonicalEnemy.soulReward,
    rewardClaimed: existingEnemy.rewardClaimed ?? false,
    intentRoll: findEnemyAttackRollByValue(attackDie, legacyIntentValue),
  }
}

function migrateNewGameState(persistedState: unknown, version: number): NewGameState {
  if (version >= SAVE_VERSION) return persistedState as NewGameState

  const persisted = persistedState as Partial<NewGameState>
  const freshProfile = createInitialProfile()
  const existingProfile = persisted.profile
  const allowedExistingDice = version < 2
    ? existingProfile?.diceCollection.filter((die) => die.id === 'attack-die-1') ?? []
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

  const unlockedTalentIds = existingProfile?.unlockedTalentIds.filter(
    (talentId) => TALENTS_BY_ID[talentId] !== undefined,
  ) ?? []
  const capacity = getDiceCapacity(unlockedTalentIds)
  const equippedDieIds = (existingProfile?.equippedDieIds ?? ['attack-die-1'])
    .filter((dieId, index, ids) => (
      ids.indexOf(dieId) === index && diceCollection.some((die) => die.id === dieId)
    ))
    .slice(0, capacity)
  if (equippedDieIds.length === 0) equippedDieIds.push('attack-die-1')

  const migratedProfile: PlayerProfile = {
    ...freshProfile,
    ...existingProfile,
    saveVersion: SAVE_VERSION,
    unlockedTalentIds,
    dungeonProgress: {
      ...createInitialDungeonProgress(),
      ...existingProfile?.dungeonProgress,
    },
    diceCollection,
    equippedDieIds,
    settings: {
      ...freshProfile.settings,
      ...existingProfile?.settings,
      autoRoll: hasAutoRollUnlocked(unlockedTalentIds)
        ? Boolean(existingProfile?.settings.autoRoll)
        : false,
    },
  }

  const existingRun = persisted.run
  const migratedEnemy = migrateEnemyState(existingRun?.enemy as LegacyEnemyState | null | undefined)
  const mappedEncounterIndex = migratedEnemy
    ? DUNGEONS['prototype-depths'].floors.findIndex(
        (floor) => floor.enemyId === migratedEnemy.definitionId,
      )
    : -1
  const canPreserveRun = existingRun?.status !== 'inactive' && mappedEncounterIndex >= 0
  const migratedRun = canPreserveRun
    ? {
        ...existingRun,
        encounterIndex: mappedEncounterIndex,
        enemy: migratedEnemy,
      }
    : createInactiveRun()

  return {
    ...persisted,
    screen: canPreserveRun ? persisted.screen ?? 'combat' : 'hub',
    profile: migratedProfile,
    run: migratedRun,
    combat: canPreserveRun && persisted.combat ? persisted.combat : createCombatState(),
    lastLostRunSouls: persisted.lastLostRunSouls ?? 0,
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
  lastLostRunSouls: 0,
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
        const firstEnemyId = dungeon.floors[0].enemyId
        const equippedDiceSnapshot = getEquippedDice(state.profile)
        if (equippedDiceSnapshot.length === 0) return
        const playerMaxHp = getPlayerMaxHp(state.profile.unlockedTalentIds)

        set({
          screen: 'combat',
          run: {
            status: 'active',
            dungeonId,
            encounterIndex: 0,
            runSouls: 0,
            playerHp: playerMaxHp,
            playerMaxHp,
            equippedDiceSnapshot,
            enemy: createEnemyState(firstEnemyId),
            lastReward: null,
          },
          combat: createCombatState(
            equippedDiceSnapshot,
            1,
            state.combat.resolutionVersion,
            true,
          ),
          lastLostRunSouls: 0,
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
          enemyShield: enemy.shield,
          enemyIntent: enemy.intentRoll,
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
          const earnedRunSouls = state.run.runSouls + soulReward
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
              bankedSouls: state.profile.bankedSouls + (dungeonComplete ? earnedRunSouls : 0),
              dungeonProgress,
            },
            run: {
              ...state.run,
              status: 'victory',
              playerHp: resolution.playerHp,
              runSouls: dungeonComplete ? 0 : earnedRunSouls,
              enemy: {
                ...enemy,
                hp: resolution.enemyHp,
                shield: resolution.enemyShield,
                rewardClaimed: true,
              },
              lastReward: {
                enemyName: enemy.name,
                floor: floorDefinition.floor,
                isBoss: floorDefinition.isBoss,
                xp: xpReward,
                runSouls: soulReward,
                bankedSouls: dungeonComplete ? earnedRunSouls : 0,
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
              runSouls: 0,
              enemy: {
                ...enemy,
                hp: resolution.enemyHp,
                shield: resolution.enemyShield,
              },
            },
            combat: {
              ...state.combat,
              phase: 'resolving',
              lastResolution: resolution,
              resolutionVersion,
              resolutionStep: 'player',
            },
            lastLostRunSouls: state.run.runSouls,
          })
          return resolution
        }

        set({
          run: {
            ...state.run,
            playerHp: resolution.playerHpAfterPlayerPhase,
            enemy: {
              ...enemy,
              hp: resolution.enemyHp,
              shield: resolution.enemyShield,
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
        if (state.combat.phase !== 'resolving' || (state.combat.resolutionStep ?? 'player') !== 'player') return
        if (!resolution?.enemyActed) return

        const playerDefeated = resolution.outcome === 'defeat'
        set({
          run: {
            ...state.run,
            status: playerDefeated ? 'defeat' : state.run.status,
            playerHp: resolution.playerHp,
            runSouls: playerDefeated ? 0 : state.run.runSouls,
          },
          combat: {
            ...state.combat,
            resolutionStep: 'enemy',
          },
          ...(playerDefeated ? { lastLostRunSouls: state.run.runSouls } : {}),
        })
      },

      finishRoundResolution: () => {
        const state = get()
        if (state.combat.phase !== 'resolving' || !state.combat.lastResolution) return
        if (state.combat.lastResolution.enemyActed && state.combat.resolutionStep !== 'enemy') return

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

      continueRun: () => {
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
            enemy: createEnemyState(nextFloor.enemyId),
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

      extractRun: () => {
        const state = get()
        if (state.screen !== 'post_combat' || state.run.status !== 'victory') return
        set({
          screen: 'hub',
          profile: {
            ...state.profile,
            bankedSouls: state.profile.bankedSouls + state.run.runSouls,
          },
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

        const diceCollection = [...state.profile.diceCollection]
        for (const effect of talent.effects) {
          if (effect.type !== 'grant_die') continue
          if (diceCollection.some((die) => die.id === effect.dieId)) continue
          const grantedDie = createDieById(effect.dieId)
          if (grantedDie) diceCollection.push(grantedDie)
        }

        set({
          profile: {
            ...state.profile,
            xp: state.profile.xp - talent.cost,
            unlockedTalentIds: [...state.profile.unlockedTalentIds, talent.id],
            diceCollection,
          },
        })
        return true
      },

      equipDie: (dieId) => {
        const state = get()
        if (state.run.status !== 'inactive') return false
        if (!state.profile.diceCollection.some((die) => die.id === dieId)) return false
        if (state.profile.equippedDieIds.includes(dieId)) return false
        if (state.profile.equippedDieIds.length >= getDiceCapacity(state.profile.unlockedTalentIds)) return false

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
        const autoRoll = enabled && hasAutoRollUnlocked(state.profile.unlockedTalentIds)
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
          lastLostRunSouls: 0,
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
        lastLostRunSouls: state.lastLostRunSouls,
      }) as NewGameState,
    },
  ),
)
