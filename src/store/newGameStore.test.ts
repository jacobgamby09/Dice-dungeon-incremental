import { beforeEach, describe, expect, it } from 'vitest'
import type { PersistStorage, StorageValue } from 'zustand/middleware'
import { createDiceCatalog } from '../game/content/dice'
import { DUNGEONS } from '../game/content/dungeons'
import { createEnemyState } from '../game/content/enemies'
import { TALENT_IDS } from '../game/content/talents'
import {
  getDiceCapacity,
  getPlayerMaxHp,
  getWorkshopDieFaces,
  hasAutoCombatUnlocked,
} from '../game/progression/talents'
import type { NewGameState } from './newGameStore'
import { useNewGameStore } from './newGameStore'

function prepareResolvedRound(totals: {
  attack: number
  bleed?: number
  heal: number
  shield: number
}) {
  const state = useNewGameStore.getState()
  useNewGameStore.setState({
    combat: {
      ...state.combat,
      phase: 'awaiting_resolve',
      drawPileDieIds: [],
      totals: {
        ...totals,
        bleed: totals.bleed ?? 0,
        ward: 0,
        regrowth: 0,
        overflow: 0,
      },
    },
  })
}

describe('Classic V2 store progression loop', () => {
  beforeEach(() => {
    useNewGameStore.getState().resetProgress()
  })

  it('starts with one permanent Attack die containing six one-value faces', () => {
    const profile = useNewGameStore.getState().profile

    expect(profile.saveVersion).toBe(15)
    expect(profile.diceCollection).toHaveLength(1)
    expect(profile.equippedDieIds).toEqual(['attack-die-1'])
    expect(profile.diceCollection[0].family).toBe('attack')
    expect(profile.diceCollection[0].faces.map((face) => face.value))
      .toEqual([1, 1, 1, 1, 1, 1])
  })

  it('resets permanent progression and an active run atomically', () => {
    const freshProfile = structuredClone(useNewGameStore.getState().profile)
    const state = useNewGameStore.getState()
    useNewGameStore.setState({
      profile: { ...state.profile, bankedSouls: 73, xp: 144 },
    })
    useNewGameStore.getState().startRun('prototype-depths')

    useNewGameStore.getState().resetProgress()
    const reset = useNewGameStore.getState()

    expect(reset.screen).toBe('hub')
    expect(reset.profile).toEqual(freshProfile)
    expect(reset.run).toMatchObject({
      dungeonId: null,
      enemy: null,
      status: 'inactive',
    })
    expect(reset.combat.results).toEqual([])
  })

  it('snapshots the loadout and draws every equipped die once', () => {
    const state = useNewGameStore.getState()
    const diceCollection = createDiceCatalog().slice(0, 2)
    useNewGameStore.setState({
      profile: {
        ...state.profile,
        diceCollection,
        equippedDieIds: diceCollection.map((die) => die.id),
      },
    })
    useNewGameStore.getState().startRun('prototype-depths')
    useNewGameStore.getState().finishEnemyIntentReveal()
    const drawOrder = [...useNewGameStore.getState().combat.drawPileDieIds]

    for (const expectedDieId of drawOrder) {
      expect(useNewGameStore.getState().drawNextDie()?.dieId).toBe(expectedDieId)
    }

    expect([...drawOrder].sort()).toEqual(['attack-die-1', 'attack-die-2'])
    expect(useNewGameStore.getState().run.equippedDiceSnapshot.map((die) => die.id).sort())
      .toEqual(['attack-die-1', 'attack-die-2'])
    expect(useNewGameStore.getState().combat.phase).toBe('awaiting_resolve')
  })

  it('awards the first enemy exactly four XP and five permanent Souls once', () => {
    useNewGameStore.getState().startRun('prototype-depths')
    prepareResolvedRound({ attack: 99, shield: 0, heal: 0 })

    expect(useNewGameStore.getState().beginRoundResolution()?.outcome).toBe('victory')
    expect(useNewGameStore.getState().beginRoundResolution()).toBeNull()

    const state = useNewGameStore.getState()
    expect(state.profile.xp).toBe(4)
    expect(state.profile.bankedSouls).toBe(5)
    expect(state.run.runStats).toMatchObject({
      enemiesDefeated: 1,
      soulsEarned: 5,
      xpEarned: 4,
    })
  })

  it('keeps all earned currency after defeat or a voluntary exit', () => {
    const state = useNewGameStore.getState()
    useNewGameStore.setState({
      profile: { ...state.profile, bankedSouls: 19, xp: 14 },
    })
    useNewGameStore.getState().startRun('prototype-depths')
    const active = useNewGameStore.getState()
    useNewGameStore.setState({ run: { ...active.run, playerHp: 1 } })
    prepareResolvedRound({ attack: 0, shield: 0, heal: 0 })

    expect(useNewGameStore.getState().beginRoundResolution()?.outcome).toBe('defeat')
    useNewGameStore.getState().advanceRoundResolution()
    useNewGameStore.getState().finishRoundResolution()
    useNewGameStore.getState().returnToHubAfterDefeat()

    expect(useNewGameStore.getState().profile).toMatchObject({
      bankedSouls: 19,
      xp: 14,
    })

    useNewGameStore.getState().startRun('prototype-depths')
    useNewGameStore.getState().openRunMenu()
    useNewGameStore.getState().leaveDungeonRun()
    expect(useNewGameStore.getState().profile).toMatchObject({
      bankedSouls: 19,
      xp: 14,
    })
  })

  it('buys up to five optional Inner Spark ranks while rank one opens paths', () => {
    const state = useNewGameStore.getState()
    useNewGameStore.setState({ profile: { ...state.profile, xp: 100 } })

    for (let rank = 0; rank < 5; rank += 1) {
      expect(useNewGameStore.getState().purchaseTalent(TALENT_IDS.battleHardenedOne))
        .toBe(true)
    }
    expect(useNewGameStore.getState().purchaseTalent(TALENT_IDS.battleHardenedOne))
      .toBe(false)

    const profile = useNewGameStore.getState().profile
    expect(profile.xp).toBe(38)
    expect(profile.talentRanks[TALENT_IDS.battleHardenedOne]).toBe(5)
    expect(getPlayerMaxHp(profile.talentRanks)).toBe(15)
  })

  it('unlocks full Auto Combat directly after the first central rank', () => {
    const state = useNewGameStore.getState()
    useNewGameStore.setState({ profile: { ...state.profile, xp: 10 } })

    expect(useNewGameStore.getState().purchaseTalent(TALENT_IDS.battleHardenedOne))
      .toBe(true)
    expect(useNewGameStore.getState().purchaseTalent(TALENT_IDS.autoCombat)).toBe(true)
    expect(hasAutoCombatUnlocked(useNewGameStore.getState().profile.talentRanks)).toBe(true)

    useNewGameStore.getState().setAutoCombat(true)
    expect(useNewGameStore.getState().profile.settings.autoCombat).toBe(true)
  })

  it('lets the player buy the second slot and Striker Die separately', () => {
    const state = useNewGameStore.getState()
    useNewGameStore.setState({ profile: { ...state.profile, xp: 36 } })

    expect(useNewGameStore.getState().purchaseTalent(TALENT_IDS.battleHardenedOne))
      .toBe(true)
    expect(useNewGameStore.getState().purchaseTalent(TALENT_IDS.twinArsenal)).toBe(true)
    expect(useNewGameStore.getState().purchaseTalent(TALENT_IDS.strikerPattern)).toBe(true)

    const profile = useNewGameStore.getState().profile
    expect(profile.diceCollection.map((die) => die.id))
      .toEqual(['attack-die-1', 'attack-die-2'])
    expect(profile.equippedDieIds).toEqual(['attack-die-1'])
    expect(getDiceCapacity(profile.talentRanks)).toBe(2)
    expect(useNewGameStore.getState().equipDie('attack-die-2')).toBe(true)
  })

  it('locks the target and Loaded Alloy Workshop result before applying it', () => {
    const state = useNewGameStore.getState()
    useNewGameStore.setState({
      profile: {
        ...state.profile,
        bankedSouls: 20,
        talentRanks: {
          [TALENT_IDS.battleHardenedOne]: 1,
          [TALENT_IDS.volatileTemper]: 1,
        },
      },
    })

    const rolls = [0, 0.99]
    const pending = useNewGameStore.getState().beginWorkshopForge(
      'attack-die-1',
      'loaded-op',
      () => rolls.shift() ?? 0,
    )
    const lockedProfile = useNewGameStore.getState().profile

    expect(getWorkshopDieFaces(lockedProfile.talentRanks).map((face) => face.value))
      .toEqual([1, 1, 1, 1, 2, 2])
    expect(pending).toMatchObject({
      operationId: 'loaded-op',
      appliedAmount: 2,
      cost: 5,
      targetFaceId: 'attack-die-1-face-1',
      workshopFaceId: 'workshop-die-face-6',
    })
    expect(lockedProfile.bankedSouls).toBe(15)
    expect(lockedProfile.diceCollection[0].faces[0].value).toBe(1)
    expect(lockedProfile.pendingWorkshopForge).toEqual(pending)

    const result = useNewGameStore.getState().completePendingWorkshopForge('loaded-op')
    const completedProfile = useNewGameStore.getState().profile
    expect(result).toMatchObject({
      amount: 2,
      faceId: 'attack-die-1-face-1',
      isJackpot: true,
    })
    expect(completedProfile.diceCollection[0].faces[0].value).toBe(3)
    expect(completedProfile.pendingWorkshopForge).toBeNull()
  })

  it('charges a pending Forge once and resumes the same locked outcome', () => {
    const state = useNewGameStore.getState()
    useNewGameStore.setState({
      profile: { ...state.profile, bankedSouls: 100 },
    })

    const first = useNewGameStore.getState().beginWorkshopForge(
      'attack-die-1',
      'same-op',
      () => 0,
    )
    const second = useNewGameStore.getState().beginWorkshopForge(
      'attack-die-1',
      'different-op',
      () => 0.99,
    )

    expect(first?.cost).toBe(5)
    expect(second).toBeNull()
    expect(useNewGameStore.getState().profile.bankedSouls).toBe(95)
    expect(useNewGameStore.getState().profile.pendingWorkshopForge).toEqual(first)

    expect(useNewGameStore.getState().completePendingWorkshopForge('wrong-op')).toBeNull()
    expect(useNewGameStore.getState().completePendingWorkshopForge('same-op')?.amount).toBe(1)
    expect(useNewGameStore.getState().completePendingWorkshopForge('same-op')).toBeNull()
    expect(useNewGameStore.getState().profile.bankedSouls).toBe(95)
  })

  it('rejects Workshop mutations while a run is active', () => {
    const state = useNewGameStore.getState()
    useNewGameStore.setState({
      profile: { ...state.profile, bankedSouls: 100 },
    })
    useNewGameStore.getState().startRun('prototype-depths')

    expect(useNewGameStore.getState().beginWorkshopForge(
      'attack-die-1',
      'during-run',
      () => 0,
    )).toBeNull()
    expect(useNewGameStore.getState().profile.bankedSouls).toBe(100)
  })

  it('loads a fresh 20-XP preset that buys the early automation path exactly', () => {
    useNewGameStore.getState().loadEarlyQolDevPreset()

    expect(useNewGameStore.getState().profile.xp).toBe(20)
    for (const talentId of [
      TALENT_IDS.battleHardenedOne,
      TALENT_IDS.autoCombat,
      TALENT_IDS.quickDraw,
    ]) {
      expect(useNewGameStore.getState().purchaseTalent(talentId)).toBe(true)
    }
    expect(useNewGameStore.getState().profile.xp).toBe(0)
  })

  it('loads a stable post-Dungeon-1 profile ready for Dungeon 2', () => {
    useNewGameStore.getState().loadPostDungeonOneDevPreset()
    const state = useNewGameStore.getState()

    expect(state.profile.unlockedDungeonIds).toContain('iron-depths')
    expect(state.profile.equippedDieIds).toEqual([
      'attack-die-1',
      'attack-die-2',
      'shield-die-1',
    ])
    expect(getPlayerMaxHp(state.profile.talentRanks)).toBe(17)
    expect(getDiceCapacity(state.profile.talentRanks)).toBe(3)

    state.startRun('iron-depths')
    expect(useNewGameStore.getState().run.enemy?.intentRolls.map((roll) => roll.type))
      .toEqual(['attack', 'shield'])
  })

  it('unlocks The Iron Descent only after its path and Dungeon 1 clear', () => {
    const state = useNewGameStore.getState()
    useNewGameStore.setState({
      profile: {
        ...state.profile,
        xp: 75,
        talentRanks: {
          [TALENT_IDS.battleHardenedOne]: 1,
          [TALENT_IDS.autoCombat]: 1,
          [TALENT_IDS.quickDraw]: 1,
          [TALENT_IDS.battleHardenedTwo]: 1,
        },
        dungeonProgress: {
          ...state.profile.dungeonProgress,
          'prototype-depths': { highestFloorCleared: 10, clearCount: 1 },
        },
      },
    })

    expect(useNewGameStore.getState().purchaseTalent(TALENT_IDS.secondDescent)).toBe(true)
    expect(useNewGameStore.getState().profile.unlockedDungeonIds).toContain('iron-depths')
  })

  it('defines ten floors and awards the boss reward exactly once', () => {
    expect(DUNGEONS['prototype-depths'].floors).toHaveLength(10)
    expect(DUNGEONS['prototype-depths'].floors[9]).toMatchObject({
      encounterId: 'descent-1-demon',
      floor: 10,
      isBoss: true,
    })

    useNewGameStore.getState().startRun('prototype-depths')
    const state = useNewGameStore.getState()
    useNewGameStore.setState({
      profile: { ...state.profile, bankedSouls: 100 },
      run: {
        ...state.run,
        encounterIndex: 9,
        enemy: createEnemyState('descent-1-demon'),
      },
    })
    prepareResolvedRound({ attack: 999, shield: 0, heal: 0 })

    expect(useNewGameStore.getState().beginRoundResolution()?.outcome).toBe('victory')
    expect(useNewGameStore.getState().profile.bankedSouls).toBe(165)
    expect(useNewGameStore.getState().profile.xp).toBe(55)
    expect(useNewGameStore.getState().beginRoundResolution()).toBeNull()
    expect(useNewGameStore.getState().profile.bankedSouls).toBe(165)
  })

  it('intentionally resets a V1 save when entering the isolated V2 branch', async () => {
    const current = useNewGameStore.getState()
    let saved: StorageValue<NewGameState> | null = {
      state: {
        ...current,
        screen: 'combat',
        profile: {
          ...current.profile,
          saveVersion: 12,
          xp: 999,
          bankedSouls: 888,
          diceCollection: createDiceCatalog(),
        },
      },
      version: 12,
    }
    const storage: PersistStorage<NewGameState> = {
      getItem: () => saved,
      setItem: (_name, value) => {
        saved = structuredClone(value)
      },
      removeItem: () => {
        saved = null
      },
    }
    const originalStorage = useNewGameStore.persist.getOptions().storage
    useNewGameStore.persist.setOptions({ storage: storage as PersistStorage<unknown> })

    try {
      await useNewGameStore.persist.rehydrate()
      const migrated = useNewGameStore.getState()

      expect(migrated.screen).toBe('hub')
      expect(migrated.profile).toMatchObject({
        bankedSouls: 0,
        saveVersion: 15,
        xp: 0,
      })
      expect(migrated.profile.diceCollection).toHaveLength(1)
      expect(migrated.run.status).toBe('inactive')
    } finally {
      useNewGameStore.persist.setOptions({ storage: originalStorage })
      useNewGameStore.getState().resetProgress()
    }
  })

  it('preserves the isolated V2 profile when migrating version 13', async () => {
    const current = useNewGameStore.getState()
    let saved: StorageValue<NewGameState> | null = {
      state: {
        ...current,
        profile: {
          ...current.profile,
          saveVersion: 13,
          xp: 27,
          bankedSouls: 41,
        },
      },
      version: 13,
    }
    const storage: PersistStorage<NewGameState> = {
      getItem: () => saved,
      setItem: (_name, value) => {
        saved = structuredClone(value)
      },
      removeItem: () => {
        saved = null
      },
    }
    const originalStorage = useNewGameStore.persist.getOptions().storage
    useNewGameStore.persist.setOptions({ storage: storage as PersistStorage<unknown> })

    try {
      await useNewGameStore.persist.rehydrate()
      expect(useNewGameStore.getState().profile).toMatchObject({
        bankedSouls: 41,
        pendingWorkshopForge: null,
        saveVersion: 15,
        xp: 27,
      })
    } finally {
      useNewGameStore.persist.setOptions({ storage: originalStorage })
      useNewGameStore.getState().resetProgress()
    }
  })

  it('splits a purchased version-14 Twin Arsenal without removing either reward', async () => {
    const current = useNewGameStore.getState()
    let saved: StorageValue<NewGameState> | null = {
      state: {
        ...current,
        profile: {
          ...current.profile,
          saveVersion: 14,
          talentRanks: {
            [TALENT_IDS.battleHardenedOne]: 1,
            [TALENT_IDS.twinArsenal]: 1,
            [TALENT_IDS.fatecraft]: 1,
          },
          diceCollection: createDiceCatalog().slice(0, 2),
        },
      },
      version: 14,
    }
    const storage: PersistStorage<NewGameState> = {
      getItem: () => saved,
      setItem: (_name, value) => {
        saved = structuredClone(value)
      },
      removeItem: () => {
        saved = null
      },
    }
    const originalStorage = useNewGameStore.persist.getOptions().storage
    useNewGameStore.persist.setOptions({ storage: storage as PersistStorage<unknown> })

    try {
      await useNewGameStore.persist.rehydrate()
      const profile = useNewGameStore.getState().profile
      expect(profile.saveVersion).toBe(15)
      expect(profile.talentRanks).toMatchObject({
        [TALENT_IDS.twinArsenal]: 1,
        [TALENT_IDS.strikerPattern]: 1,
      })
      expect(profile.talentRanks[TALENT_IDS.fatecraft]).toBeUndefined()
      expect(profile.xp).toBe(75)
      expect(profile.diceCollection.map((die) => die.id)).toContain('attack-die-2')
      expect(getDiceCapacity(profile.talentRanks)).toBe(2)
    } finally {
      useNewGameStore.persist.setOptions({ storage: originalStorage })
      useNewGameStore.getState().resetProgress()
    }
  })
})
