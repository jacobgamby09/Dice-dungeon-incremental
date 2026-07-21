import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'
import { shuffleDieIds } from '../game/combat/drawBag'
import { addRollToTotals, rollDie } from '../game/combat/rollDie'
import { resolveRound } from '../game/combat/resolveRound'
import { createStartingDice } from '../game/content/dice'
import { DUNGEONS } from '../game/content/dungeons'
import { advanceEnemyIntent, createEnemyState } from '../game/content/enemies'
import { BASE_FACE_CAP, getFaceUpgradeCost } from '../game/content/upgradeCosts'
import type { CombatState, RoundResolution } from '../game/types/combat'
import { EMPTY_TOTALS } from '../game/types/combat'
import type { DieFaces, DieInstance, RollResult } from '../game/types/dice'
import { cloneDie } from '../game/types/dice'
import type { DungeonId, RunState } from '../game/types/dungeon'
import type { PlayerProfile } from '../game/types/progression'

export type AppScreen = 'hub' | 'dungeon_select' | 'combat' | 'post_combat' | 'workshop' | 'defeat'

export interface NewGameState {
  screen: AppScreen
  profile: PlayerProfile
  run: RunState
  combat: CombatState
  lastLostRunSouls: number
  openDungeonSelect: () => void
  openWorkshop: () => void
  goToHub: () => void
  startRun: (dungeonId: DungeonId) => void
  drawNextDie: () => RollResult | null
  beginRoundResolution: () => RoundResolution | null
  finishRoundResolution: () => void
  continueRun: () => void
  extractRun: () => void
  returnToHubAfterDefeat: () => void
  upgradeFace: (dieId: string, faceId: string) => boolean
  resetProgress: () => void
}

const SAVE_VERSION = 2
export const NEW_GAME_SAVE_KEY = 'new-dice-dungeon-save'
const BASE_PLAYER_HP = 10
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
    diceCollection,
    equippedDieIds: diceCollection.map((die) => die.id),
    settings: {
      rollSpeed: 1,
      autoRoll: false,
      autoResolve: false,
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
): CombatState {
  return {
    phase: 'awaiting_roll',
    roundNumber,
    drawPileDieIds: shuffleDieIds(equippedDice.map((die) => die.id)),
    results: [],
    totals: { ...EMPTY_TOTALS },
    lastResolution: null,
    resolutionVersion,
  }
}

function migrateNewGameState(persistedState: unknown, version: number): NewGameState {
  if (version >= SAVE_VERSION) return persistedState as NewGameState

  const persisted = persistedState as Partial<NewGameState>
  const freshProfile = createInitialProfile()
  const existingProfile = persisted.profile
  const existingAttackDie = existingProfile?.diceCollection.find(
    (die) => die.id === freshProfile.diceCollection[0].id,
  )
  const attackDie = cloneDie(existingAttackDie ?? freshProfile.diceCollection[0])

  return {
    ...persisted,
    screen: 'hub',
    profile: {
      ...freshProfile,
      ...existingProfile,
      saveVersion: SAVE_VERSION,
      diceCollection: [attackDie],
      equippedDieIds: [attackDie.id],
    },
    run: createInactiveRun(),
    combat: createCombatState(),
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

      goToHub: () => {
        if (get().run.status !== 'inactive') return
        set({ screen: 'hub' })
      },

      startRun: (dungeonId) => {
        const state = get()
        if (!state.profile.unlockedDungeonIds.includes(dungeonId)) return
        const dungeon = DUNGEONS[dungeonId]
        const firstEnemyId = dungeon.encounters[0]
        const equippedDiceSnapshot = getEquippedDice(state.profile)
        if (equippedDiceSnapshot.length === 0) return

        set({
          screen: 'combat',
          run: {
            status: 'active',
            dungeonId,
            encounterIndex: 0,
            runSouls: 0,
            playerHp: BASE_PLAYER_HP,
            playerMaxHp: BASE_PLAYER_HP,
            equippedDiceSnapshot,
            enemy: createEnemyState(firstEnemyId),
            lastReward: null,
          },
          combat: createCombatState(equippedDiceSnapshot, 1, state.combat.resolutionVersion),
          lastLostRunSouls: 0,
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

        const resolution = resolveRound({
          playerHp: state.run.playerHp,
          playerMaxHp: state.run.playerMaxHp,
          enemyHp: enemy.hp,
          enemyShield: enemy.shield,
          enemyIntent: enemy.intent,
          totals: state.combat.totals,
        })
        const resolutionVersion = state.combat.resolutionVersion + 1

        if (resolution.outcome === 'victory') {
          const dungeon = DUNGEONS[state.run.dungeonId!]
          const rewardAlreadyClaimed = enemy.rewardClaimed
          const xpReward = rewardAlreadyClaimed ? 0 : enemy.xpReward
          const soulReward = rewardAlreadyClaimed ? 0 : enemy.soulReward
          const dungeonComplete = state.run.encounterIndex >= dungeon.encounters.length - 1

          set({
            profile: {
              ...state.profile,
              xp: state.profile.xp + xpReward,
            },
            run: {
              ...state.run,
              status: 'victory',
              playerHp: resolution.playerHp,
              runSouls: state.run.runSouls + soulReward,
              enemy: {
                ...enemy,
                hp: resolution.enemyHp,
                shield: resolution.enemyShield,
                rewardClaimed: true,
              },
              lastReward: {
                enemyName: enemy.name,
                xp: xpReward,
                runSouls: soulReward,
                dungeonComplete,
              },
            },
            combat: {
              ...state.combat,
              phase: 'resolving',
              lastResolution: resolution,
              resolutionVersion,
            },
          })
          return resolution
        }

        if (resolution.outcome === 'defeat') {
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
            },
            lastLostRunSouls: state.run.runSouls,
          })
          return resolution
        }

        set({
          run: {
            ...state.run,
            playerHp: resolution.playerHp,
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
          },
        })
        return resolution
      },

      finishRoundResolution: () => {
        const state = get()
        if (state.combat.phase !== 'resolving' || !state.combat.lastResolution) return

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
            enemy: advanceEnemyIntent(enemy),
          },
          combat: createCombatState(
            state.run.equippedDiceSnapshot,
            state.combat.roundNumber + 1,
            state.combat.resolutionVersion,
          ),
        })
      },

      continueRun: () => {
        const state = get()
        if (state.screen !== 'post_combat' || state.run.status !== 'victory' || !state.run.dungeonId) return
        const dungeon = DUNGEONS[state.run.dungeonId]
        const nextEncounterIndex = state.run.encounterIndex + 1
        const nextEnemyId = dungeon.encounters[nextEncounterIndex]
        if (!nextEnemyId) return

        set({
          screen: 'combat',
          run: {
            ...state.run,
            status: 'active',
            encounterIndex: nextEncounterIndex,
            enemy: createEnemyState(nextEnemyId),
            lastReward: null,
          },
          combat: createCombatState(
            state.run.equippedDiceSnapshot,
            1,
            state.combat.resolutionVersion,
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
        lastLostRunSouls: state.lastLostRunSouls,
      }) as NewGameState,
    },
  ),
)
