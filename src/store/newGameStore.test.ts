import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PersistStorage, StorageValue } from 'zustand/middleware'
import { createDiceCatalog } from '../game/content/dice'
import { DUNGEONS } from '../game/content/dungeons'
import { createEnemyState } from '../game/content/enemies'
import { TALENT_IDS } from '../game/content/talents'
import { getDiceCapacity, getPlayerMaxHp } from '../game/progression/talents'
import type { NewGameState } from './newGameStore'
import { useNewGameStore } from './newGameStore'

function prepareResolvedRound(totals: { attack: number; shield: number; heal: number; bleed?: number }) {
  const state = useNewGameStore.getState()
  useNewGameStore.setState({
    combat: {
      ...state.combat,
      phase: 'awaiting_resolve',
      drawPileDieIds: [],
      totals: { ...totals, bleed: totals.bleed ?? 0 },
    },
  })
}

function revealEnemyIntent() {
  useNewGameStore.getState().finishEnemyIntentReveal()
}

describe('new game progression loop', () => {
  beforeEach(() => {
    useNewGameStore.getState().resetProgress()
  })

  it('starts the player with exactly one permanent Attack Die', () => {
    const profile = useNewGameStore.getState().profile

    expect(profile.diceCollection).toHaveLength(1)
    expect(profile.equippedDieIds).toEqual(['attack-die-1'])
    expect(profile.diceCollection[0].family).toBe('attack')
  })

  it('resets permanent progression and an active run to the fresh-game state', () => {
    const freshProfile = structuredClone(useNewGameStore.getState().profile)
    const state = useNewGameStore.getState()
    useNewGameStore.setState({
      profile: {
        ...state.profile,
        bankedSouls: 73,
        talentRanks: { [TALENT_IDS.battleHardenedOne]: 2 },
        xp: 144,
      },
    })
    useNewGameStore.getState().startRun('prototype-depths')

    useNewGameStore.getState().resetProgress()
    const resetState = useNewGameStore.getState()

    expect(resetState.screen).toBe('hub')
    expect(resetState.profile).toEqual(freshProfile)
    expect(resetState.run).toMatchObject({
      status: 'inactive',
      dungeonId: null,
      enemy: null,
      runStats: {
        enemiesDefeated: 0,
        soulsEarned: 0,
        xpEarned: 0,
      },
    })
    expect(resetState.combat).toMatchObject({
      phase: 'awaiting_roll',
      drawPileDieIds: [],
      results: [],
      totals: { attack: 0, heal: 0, shield: 0 },
    })
    expect('runSouls' in resetState.run).toBe(false)
  })

  it('leaves an active dungeon without changing already-earned XP or Souls', () => {
    const state = useNewGameStore.getState()
    useNewGameStore.setState({
      profile: {
        ...state.profile,
        bankedSouls: 37,
        xp: 52,
      },
    })
    useNewGameStore.getState().startRun('prototype-depths')
    revealEnemyIntent()
    useNewGameStore.getState().drawNextDie()

    useNewGameStore.getState().openRunMenu()
    expect(useNewGameStore.getState().runMenuOpen).toBe(true)
    expect(useNewGameStore.getState().run.status).toBe('active')

    useNewGameStore.getState().leaveDungeonRun()
    const leftState = useNewGameStore.getState()

    expect(leftState.screen).toBe('hub')
    expect(leftState.runMenuOpen).toBe(false)
    expect(leftState.profile.xp).toBe(52)
    expect(leftState.profile.bankedSouls).toBe(37)
    expect(leftState.run).toMatchObject({
      status: 'inactive',
      dungeonId: null,
      enemy: null,
      runStats: {
        enemiesDefeated: 0,
        soulsEarned: 0,
        xpEarned: 0,
      },
    })
    expect(leftState.combat).toMatchObject({
      phase: 'awaiting_roll',
      drawPileDieIds: [],
      results: [],
    })

    useNewGameStore.getState().leaveDungeonRun()
    expect(useNewGameStore.getState()).toEqual(leftState)
  })

  it('pauses Auto Combat and background progress while the run menu is open', () => {
    useNewGameStore.getState().loadPostDungeonOneDevPreset()
    useNewGameStore.getState().setAutoCombat(true)
    useNewGameStore.getState().startRun('iron-depths')

    expect(useNewGameStore.getState().run.automation.lastCheckpointAt).not.toBeNull()

    useNewGameStore.getState().openRunMenu()
    const pausedState = useNewGameStore.getState()
    expect(pausedState.runMenuOpen).toBe(true)
    expect(pausedState.run.automation.lastCheckpointAt).toBeNull()
    expect(pausedState.resumeAutoCombat(Date.now() + 60_000)).toBeNull()
    expect(useNewGameStore.getState().run.encounterIndex).toBe(0)

    useNewGameStore.getState().closeRunMenu()
    const resumedState = useNewGameStore.getState()
    expect(resumedState.runMenuOpen).toBe(false)
    expect(resumedState.run.automation.lastCheckpointAt).not.toBeNull()
    expect(resumedState.screen).toBe('combat')
    expect(resumedState.run.status).toBe('active')
  })

  it('loads the post-Dungeon-1 dev profile atomically and starts Dungeon 2', () => {
    const state = useNewGameStore.getState()
    useNewGameStore.setState({
      profile: {
        ...state.profile,
        xp: 999,
        bankedSouls: 999,
      },
    })
    useNewGameStore.getState().startRun('prototype-depths')

    useNewGameStore.getState().loadPostDungeonOneDevPreset()
    const presetState = useNewGameStore.getState()

    expect(presetState.screen).toBe('hub')
    expect(presetState.run.status).toBe('inactive')
    expect(presetState.run.enemy).toBeNull()
    expect(presetState.profile.xp).toBe(0)
    expect(presetState.profile.bankedSouls).toBe(0)
    expect(presetState.profile.dungeonProgress['prototype-depths']).toEqual({
      highestFloorCleared: 10,
      clearCount: 1,
    })
    expect(presetState.profile.unlockedDungeonIds).toContain('iron-depths')
    expect(presetState.profile.equippedDieIds).toEqual([
      'attack-die-1',
      'attack-die-2',
      'shield-die-1',
      'heal-die-1',
    ])
    expect(getPlayerMaxHp(presetState.profile.talentRanks)).toBe(15)
    expect(getDiceCapacity(presetState.profile.talentRanks)).toBe(4)

    const canonicalProfile = structuredClone(presetState.profile)
    useNewGameStore.getState().loadPostDungeonOneDevPreset()
    expect(useNewGameStore.getState().profile).toEqual(canonicalProfile)

    presetState.startRun('iron-depths')
    const ironRun = useNewGameStore.getState()
    expect(ironRun.screen).toBe('combat')
    expect(ironRun.run.dungeonId).toBe('iron-depths')
    expect(ironRun.run.playerHp).toBe(15)
    expect(ironRun.run.equippedDiceSnapshot).toEqual(presetState.profile.diceCollection)
    expect(ironRun.run.enemy?.intentRolls.map((roll) => roll.type)).toEqual([
      'attack',
      'shield',
    ])
  })

  it('loads a fresh 88-XP test save that can buy Auto Combat and Quick Draw exactly', () => {
    const state = useNewGameStore.getState()
    useNewGameStore.setState({
      profile: {
        ...state.profile,
        xp: 999,
        bankedSouls: 999,
      },
    })
    useNewGameStore.getState().startRun('prototype-depths')

    useNewGameStore.getState().loadEarlyQolDevPreset()
    const freshTestState = useNewGameStore.getState()

    expect(freshTestState.screen).toBe('hub')
    expect(freshTestState.run.status).toBe('inactive')
    expect(freshTestState.profile.xp).toBe(88)
    expect(freshTestState.profile.bankedSouls).toBe(0)
    expect(freshTestState.profile.talentRanks).toEqual({})
    expect(freshTestState.profile.diceCollection).toHaveLength(1)

    for (const talentId of [
      TALENT_IDS.battleHardenedOne,
      TALENT_IDS.twinArsenal,
      TALENT_IDS.autoCombat,
      TALENT_IDS.shieldcraft,
      TALENT_IDS.quickDraw,
    ]) {
      expect(useNewGameStore.getState().purchaseTalent(talentId)).toBe(true)
    }

    expect(useNewGameStore.getState().profile.xp).toBe(0)
    expect(useNewGameStore.getState().profile.talentRanks).toMatchObject({
      [TALENT_IDS.autoCombat]: 1,
      [TALENT_IDS.quickDraw]: 1,
    })
  })

  it('draws every equipped die once in the persisted shuffled-bag order', () => {
    const state = useNewGameStore.getState()
    const diceCollection = createDiceCatalog()
    useNewGameStore.setState({
      profile: {
        ...state.profile,
        diceCollection,
        equippedDieIds: diceCollection.map((die) => die.id),
      },
    })
    useNewGameStore.getState().startRun('prototype-depths')
    revealEnemyIntent()
    const drawOrder = [...useNewGameStore.getState().combat.drawPileDieIds]

    expect([...drawOrder].sort()).toEqual(diceCollection.map((die) => die.id).sort())
    for (const [index, expectedDieId] of drawOrder.entries()) {
      expect(useNewGameStore.getState().drawNextDie()?.dieId).toBe(expectedDieId)
      if (index < drawOrder.length - 1) {
        expect(useNewGameStore.getState().combat.phase).toBe('awaiting_roll')
        expect(useNewGameStore.getState().beginRoundResolution()).toBeNull()
      }
    }

    const combat = useNewGameStore.getState().combat
    expect(combat.drawPileDieIds).toEqual([])
    expect(combat.results.map((result) => result.dieId)).toEqual(drawOrder)
    expect(combat.phase).toBe('awaiting_resolve')

    const activeRun = useNewGameStore.getState().run
    useNewGameStore.setState({
      run: {
        ...activeRun,
        enemy: activeRun.enemy ? { ...activeRun.enemy, hp: 99, maxHp: 99 } : null,
      },
    })
    expect(useNewGameStore.getState().beginRoundResolution()?.outcome).toBe('ongoing')
    useNewGameStore.getState().advanceRoundResolution()
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.999)
    useNewGameStore.getState().finishRoundResolution()
    random.mockRestore()
    const nextRound = useNewGameStore.getState().combat
    expect(nextRound.roundNumber).toBe(2)
    expect(nextRound.phase).toBe('revealing_enemy_intent')
    expect([...nextRound.drawPileDieIds].sort()).toEqual(
      diceCollection.map((die) => die.id).sort(),
    )
    expect(nextRound.results).toEqual([])
    expect(useNewGameStore.getState().run.enemy?.intentRolls[0].faceId).toBe(
      'slime-l1-attack-face-6',
    )
  })

  it('precommits a stable enemy face before revealing intent or enabling player draw', () => {
    useNewGameStore.getState().startRun('prototype-depths')
    const started = useNewGameStore.getState()
    const intentRolls = started.run.enemy?.intentRolls

    expect(started.combat.phase).toBe('revealing_enemy_intent')
    expect(intentRolls).toHaveLength(1)
    expect(intentRolls?.[0].dieId).toBe('slime-l1-attack')
    expect(intentRolls?.[0].faceId).toMatch(/^slime-l1-attack-face-[1-6]$/)
    expect(useNewGameStore.getState().drawNextDie()).toBeNull()

    revealEnemyIntent()
    expect(useNewGameStore.getState().combat.phase).toBe('awaiting_roll')
    expect(useNewGameStore.getState().run.enemy?.intentRolls).toEqual(intentRolls)
  })

  it('awards permanent XP and Souls immediately and lets a lethal player hit cancel the enemy intent', () => {
    const store = useNewGameStore.getState()
    store.startRun('prototype-depths')
    prepareResolvedRound({ attack: 99, shield: 0, heal: 0 })

    const resolution = useNewGameStore.getState().beginRoundResolution()
    const state = useNewGameStore.getState()

    expect(resolution?.outcome).toBe('victory')
    expect(resolution?.enemyActed).toBe(false)
    expect(state.profile.xp).toBe(8)
    expect(state.profile.bankedSouls).toBe(5)
    expect(state.run.playerHp).toBe(10)
    expect(state.run.lastReward?.souls).toBe(5)
    expect(state.run.runStats).toEqual({
      enemiesDefeated: 1,
      soulsEarned: 5,
      xpEarned: 8,
    })
  })

  it('cannot claim the same encounter reward twice', () => {
    useNewGameStore.getState().startRun('prototype-depths')
    prepareResolvedRound({ attack: 99, shield: 0, heal: 0 })

    expect(useNewGameStore.getState().beginRoundResolution()?.outcome).toBe('victory')
    expect(useNewGameStore.getState().beginRoundResolution()).toBeNull()
    expect(useNewGameStore.getState().profile.xp).toBe(8)
    expect(useNewGameStore.getState().profile.bankedSouls).toBe(5)
    expect(useNewGameStore.getState().run.runStats).toEqual({
      enemiesDefeated: 1,
      soulsEarned: 5,
      xpEarned: 8,
    })
  })

  it('keeps awarded Souls permanent after leaving the victory screen', () => {
    useNewGameStore.getState().startRun('prototype-depths')
    prepareResolvedRound({ attack: 99, shield: 0, heal: 0 })
    useNewGameStore.getState().beginRoundResolution()
    useNewGameStore.getState().finishRoundResolution()
    useNewGameStore.getState().advanceToNextFloor()

    const state = useNewGameStore.getState()
    expect(state.screen).toBe('combat')
    expect(state.profile.bankedSouls).toBe(5)
    expect(state.run.status).toBe('active')
    expect(state.run.runStats).toEqual({
      enemiesDefeated: 1,
      soulsEarned: 5,
      xpEarned: 8,
    })
  })

  it('resolves the enemy attack after the player phase, then handles defeat', () => {
    useNewGameStore.getState().startRun('prototype-depths')
    const state = useNewGameStore.getState()
    useNewGameStore.setState({
      profile: { ...state.profile, xp: 13, bankedSouls: 7 },
      run: { ...state.run, playerHp: 1 },
    })
    const permanentDiceBeforeDeath = JSON.stringify(useNewGameStore.getState().profile.diceCollection)
    prepareResolvedRound({ attack: 0, shield: 0, heal: 0 })

    const resolution = useNewGameStore.getState().beginRoundResolution()
    const afterPlayerPhase = useNewGameStore.getState()

    expect(resolution?.outcome).toBe('defeat')
    expect(afterPlayerPhase.combat.resolutionStep).toBe('player')
    expect(afterPlayerPhase.run.playerHp).toBe(1)

    useNewGameStore.getState().finishRoundResolution()
    expect(useNewGameStore.getState().screen).toBe('combat')

    useNewGameStore.getState().advanceRoundResolution()
    const defeated = useNewGameStore.getState()

    expect(defeated.combat.resolutionStep).toBe('enemy_attack')
    expect(defeated.run.playerHp).toBe(0)
    expect(defeated.profile.xp).toBe(13)
    expect(defeated.profile.bankedSouls).toBe(7)
    expect(JSON.stringify(defeated.profile.diceCollection)).toBe(permanentDiceBeforeDeath)
  })

  it('keeps the earned descent summary through floor transitions and defeat', () => {
    useNewGameStore.getState().startRun('prototype-depths')
    prepareResolvedRound({ attack: 99, shield: 0, heal: 0 })
    useNewGameStore.getState().beginRoundResolution()
    useNewGameStore.getState().finishRoundResolution()
    useNewGameStore.getState().advanceToNextFloor()

    const activeState = useNewGameStore.getState()
    useNewGameStore.setState({
      run: { ...activeState.run, playerHp: 1 },
    })
    prepareResolvedRound({ attack: 0, shield: 0, heal: 0 })
    expect(useNewGameStore.getState().beginRoundResolution()?.outcome).toBe('defeat')
    useNewGameStore.getState().advanceRoundResolution()
    useNewGameStore.getState().finishRoundResolution()

    const defeated = useNewGameStore.getState()
    expect(defeated.screen).toBe('defeat')
    expect(defeated.run.encounterIndex).toBe(1)
    expect(defeated.run.runStats).toEqual({
      enemiesDefeated: 1,
      soulsEarned: 5,
      xpEarned: 8,
    })
  })

  it('carries current HP and permanent Souls into the next encounter', () => {
    useNewGameStore.getState().startRun('prototype-depths')
    const state = useNewGameStore.getState()
    useNewGameStore.setState({
      run: { ...state.run, playerHp: 6 },
    })
    prepareResolvedRound({ attack: 99, shield: 0, heal: 0 })
    useNewGameStore.getState().beginRoundResolution()
    useNewGameStore.getState().finishRoundResolution()
    useNewGameStore.getState().advanceToNextFloor()

    const continued = useNewGameStore.getState()
    expect(continued.screen).toBe('combat')
    expect(continued.run.status).toBe('active')
    expect(continued.run.encounterIndex).toBe(1)
    expect(continued.run.playerHp).toBe(6)
    expect(continued.profile.bankedSouls).toBe(5)
    expect(continued.run.enemy?.definitionId).toBe('slime-crawler')
  })

  it('uses XP to unlock capability while granting one unique unequipped die', () => {
    const state = useNewGameStore.getState()
    useNewGameStore.setState({ profile: { ...state.profile, xp: 100 } })

    expect(useNewGameStore.getState().purchaseTalent(TALENT_IDS.twinArsenal)).toBe(false)
    expect(useNewGameStore.getState().purchaseTalent(TALENT_IDS.battleHardenedOne)).toBe(true)
    expect(useNewGameStore.getState().purchaseTalent(TALENT_IDS.twinArsenal)).toBe(true)

    const profile = useNewGameStore.getState().profile
    expect(profile.xp).toBe(76)
    expect(profile.diceCollection.filter((die) => die.id === 'attack-die-2')).toHaveLength(1)
    expect(profile.equippedDieIds).toEqual(['attack-die-1'])
    expect(getDiceCapacity(profile.talentRanks)).toBe(2)
    expect(getPlayerMaxHp(profile.talentRanks)).toBe(12)

    expect(useNewGameStore.getState().equipDie('attack-die-2')).toBe(true)
    expect(useNewGameStore.getState().profile.equippedDieIds).toEqual([
      'attack-die-1',
      'attack-die-2',
    ])
    expect(useNewGameStore.getState().purchaseTalent(TALENT_IDS.twinArsenal)).toBe(false)
    expect(useNewGameStore.getState().profile.diceCollection.filter((die) => die.id === 'attack-die-2')).toHaveLength(1)
  })

  it('buys exactly three Battle-Hardened ranks for a total of +6 Max HP', () => {
    const state = useNewGameStore.getState()
    useNewGameStore.setState({ profile: { ...state.profile, xp: 100 } })

    expect(useNewGameStore.getState().purchaseTalent(TALENT_IDS.battleHardenedOne)).toBe(true)
    expect(useNewGameStore.getState().purchaseTalent(TALENT_IDS.battleHardenedOne)).toBe(true)
    expect(useNewGameStore.getState().purchaseTalent(TALENT_IDS.battleHardenedOne)).toBe(true)
    expect(useNewGameStore.getState().purchaseTalent(TALENT_IDS.battleHardenedOne)).toBe(false)

    const profile = useNewGameStore.getState().profile
    expect(profile.xp).toBe(44)
    expect(profile.talentRanks[TALENT_IDS.battleHardenedOne]).toBe(3)
    expect(getPlayerMaxHp(profile.talentRanks)).toBe(16)
  })

  it('opens every specialization after Shieldcraft without branch exclusion', () => {
    const state = useNewGameStore.getState()
    useNewGameStore.setState({ profile: { ...state.profile, xp: 500 } })

    expect(useNewGameStore.getState().purchaseTalent(TALENT_IDS.battleHardenedOne)).toBe(true)
    expect(useNewGameStore.getState().purchaseTalent(TALENT_IDS.twinArsenal)).toBe(true)
    expect(useNewGameStore.getState().purchaseTalent(TALENT_IDS.shieldcraft)).toBe(true)
    expect(useNewGameStore.getState().purchaseTalent(TALENT_IDS.battleHardenedTwo)).toBe(true)
    expect(useNewGameStore.getState().purchaseTalent(TALENT_IDS.thirdGrip)).toBe(true)
    expect(useNewGameStore.getState().purchaseTalent(TALENT_IDS.quickDraw)).toBe(true)

    const profile = useNewGameStore.getState().profile
    expect(profile.talentRanks).toMatchObject({
      [TALENT_IDS.battleHardenedTwo]: 1,
      [TALENT_IDS.thirdGrip]: 1,
      [TALENT_IDS.quickDraw]: 1,
    })
    expect(profile.diceCollection.filter((die) => die.id === 'shield-die-1')).toHaveLength(1)
    expect(profile.equippedDieIds).not.toContain('shield-die-1')
  })

  it('locks loadout edits during a run and snapshots the equipped permanent dice', () => {
    const state = useNewGameStore.getState()
    useNewGameStore.setState({ profile: { ...state.profile, xp: 100 } })
    useNewGameStore.getState().purchaseTalent(TALENT_IDS.battleHardenedOne)
    useNewGameStore.getState().purchaseTalent(TALENT_IDS.twinArsenal)
    useNewGameStore.getState().equipDie('attack-die-2')
    useNewGameStore.getState().startRun('prototype-depths')

    const runSnapshot = useNewGameStore.getState().run.equippedDiceSnapshot
    expect(runSnapshot.map((die) => die.id)).toEqual(['attack-die-1', 'attack-die-2'])
    expect(useNewGameStore.getState().unequipDie('attack-die-2')).toBe(false)
    expect(useNewGameStore.getState().equipDie('attack-die-2')).toBe(false)
    expect(useNewGameStore.getState().run.equippedDiceSnapshot).toEqual(runSnapshot)
  })

  it('starts a run with talent-derived Max HP', () => {
    const state = useNewGameStore.getState()
    useNewGameStore.setState({ profile: { ...state.profile, xp: 8 } })
    useNewGameStore.getState().purchaseTalent(TALENT_IDS.battleHardenedOne)
    useNewGameStore.getState().startRun('prototype-depths')

    expect(useNewGameStore.getState().run.playerHp).toBe(12)
    expect(useNewGameStore.getState().run.playerMaxHp).toBe(12)
  })

  it('only enables Auto Combat after the talent is unlocked', () => {
    useNewGameStore.getState().setAutoCombat(true)
    expect(useNewGameStore.getState().profile.settings.autoCombat).toBe(false)

    const state = useNewGameStore.getState()
    useNewGameStore.setState({
      profile: {
        ...state.profile,
        talentRanks: { [TALENT_IDS.autoCombat]: 1 },
      },
    })
    useNewGameStore.getState().setAutoCombat(true)
    expect(useNewGameStore.getState().profile.settings.autoCombat).toBe(true)
    useNewGameStore.getState().setAutoCombat(false)
    expect(useNewGameStore.getState().profile.settings.autoCombat).toBe(false)
  })

  it('fast-forwards an active Auto Combat run from a persisted checkpoint exactly once', () => {
    const state = useNewGameStore.getState()
    useNewGameStore.setState({
      profile: {
        ...state.profile,
        talentRanks: { [TALENT_IDS.autoCombat]: 1 },
      },
    })
    useNewGameStore.getState().setAutoCombat(true)
    useNewGameStore.getState().startRun('prototype-depths')
    useNewGameStore.getState().checkpointAutoCombat(1_000)

    const active = useNewGameStore.getState()
    useNewGameStore.setState({
      run: {
        ...active.run,
        equippedDiceSnapshot: active.run.equippedDiceSnapshot.map((die) => ({
          ...die,
          faces: die.faces.map((face) => ({ ...face, value: 99 })) as typeof die.faces,
        })),
      },
    })

    const recap = useNewGameStore.getState().resumeAutoCombat(301_000)
    const completed = useNewGameStore.getState()

    expect(recap).toMatchObject({
      enemiesDefeated: 10,
      outcome: 'boss_victory',
      soulsEarned: 210,
      xpEarned: 242,
    })
    expect(completed.screen).toBe('post_combat')
    expect(completed.run.lastReward?.dungeonComplete).toBe(true)
    expect(completed.profile.xp).toBe(242)
    expect(completed.profile.bankedSouls).toBe(210)
    expect(completed.run.automation.lastCheckpointAt).toBeNull()

    expect(useNewGameStore.getState().resumeAutoCombat(301_000)).toBeNull()
    expect(useNewGameStore.getState().profile.xp).toBe(242)
    expect(useNewGameStore.getState().profile.bankedSouls).toBe(210)
  })

  it('migrates the old Auto Roll purchase into early Auto Combat with a one-time XP refund', async () => {
    const current = useNewGameStore.getState()
    const legacyState = {
      ...current,
      profile: {
        ...current.profile,
        saveVersion: 9,
        xp: 5,
        talentRanks: { [TALENT_IDS.autoCombat]: 1 },
        settings: {
          rollSpeed: 1,
          autoRoll: true,
          autoResolve: false,
        },
      },
    }
    let saved: StorageValue<NewGameState> | null = {
      state: legacyState as unknown as NewGameState,
      version: 9,
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

      expect(migrated.profile.saveVersion).toBe(11)
      expect(migrated.profile.xp).toBe(33)
      expect(migrated.profile.settings).toEqual({
        rollSpeed: 1,
        autoCombat: true,
      })
      expect(migrated.profile.talentRanks[TALENT_IDS.autoCombat]).toBe(1)
    } finally {
      useNewGameStore.persist.setOptions({ storage: originalStorage })
      useNewGameStore.getState().resetProgress()
    }
  })

  it('unlocks The Iron Descent through XP after clearing Dungeon 1', () => {
    const state = useNewGameStore.getState()
    useNewGameStore.setState({
      profile: {
        ...state.profile,
        xp: 60,
        talentRanks: {
          [TALENT_IDS.battleHardenedOne]: 1,
          [TALENT_IDS.twinArsenal]: 1,
          [TALENT_IDS.shieldcraft]: 1,
        },
        dungeonProgress: {
          ...state.profile.dungeonProgress,
          'prototype-depths': { highestFloorCleared: 10, clearCount: 1 },
        },
      },
    })

    expect(useNewGameStore.getState().purchaseTalent(TALENT_IDS.secondDescent)).toBe(true)
    expect(useNewGameStore.getState().profile.xp).toBe(0)
    expect(useNewGameStore.getState().profile.unlockedDungeonIds).toContain('iron-depths')

    useNewGameStore.getState().startRun('iron-depths')
    const ironRun = useNewGameStore.getState()
    expect(ironRun.run.enemy?.intentRolls.map((roll) => roll.type)).toEqual([
      'attack',
      'shield',
    ])
    expect(ironRun.combat.phase).toBe('revealing_enemy_intent')
    expect(ironRun.run.enemy?.shield).toBeGreaterThanOrEqual(0)
  })

  it('separates a surviving boss heal from its later attack step', () => {
    const state = useNewGameStore.getState()
    useNewGameStore.setState({
      profile: {
        ...state.profile,
        unlockedDungeonIds: ['prototype-depths', 'iron-depths'],
      },
    })
    useNewGameStore.getState().startRun('iron-depths')
    const active = useNewGameStore.getState()
    const boss = createEnemyState('descent-2-spiked-behemoth', () => 0.999)
    useNewGameStore.setState({
      run: {
        ...active.run,
        encounterIndex: 9,
        playerHp: 100,
        playerMaxHp: 100,
        enemy: { ...boss, hp: 40 },
      },
    })
    prepareResolvedRound({ attack: 1, shield: 99, heal: 0 })

    const resolution = useNewGameStore.getState().beginRoundResolution()
    expect(resolution?.enemyHpAfterPlayerPhase).toBe(40)
    expect(resolution?.enemyHealApplied).toBe(3)
    expect(useNewGameStore.getState().combat.resolutionStep).toBe('player')

    useNewGameStore.getState().advanceRoundResolution()
    expect(useNewGameStore.getState().combat.resolutionStep).toBe('enemy_heal')
    expect(useNewGameStore.getState().run.enemy?.hp).toBe(43)

    useNewGameStore.getState().advanceRoundResolution()
    expect(useNewGameStore.getState().combat.resolutionStep).toBe('enemy_attack')
    expect(useNewGameStore.getState().run.playerHp).toBe(100)
  })

  it('defines ten ordered floors and awards the boss Soul loot exactly once', () => {
    expect(DUNGEONS['prototype-depths'].floors).toHaveLength(10)
    expect(DUNGEONS['prototype-depths'].floors[9]).toMatchObject({
      floor: 10,
      isBoss: true,
      encounterId: 'descent-1-demon',
    })

    useNewGameStore.getState().startRun('prototype-depths')
    const state = useNewGameStore.getState()
    useNewGameStore.setState({
      profile: {
        ...state.profile,
        bankedSouls: 100,
      },
      run: {
        ...state.run,
        encounterIndex: 9,
        enemy: createEnemyState('descent-1-demon'),
      },
    })
    prepareResolvedRound({ attack: 999, shield: 0, heal: 0 })

    expect(useNewGameStore.getState().beginRoundResolution()?.outcome).toBe('victory')
    expect(useNewGameStore.getState().profile.bankedSouls).toBe(160)
    expect(useNewGameStore.getState().run.lastReward?.souls).toBe(60)
    expect(useNewGameStore.getState().run.runStats).toEqual({
      enemiesDefeated: 1,
      soulsEarned: 60,
      xpEarned: 60,
    })
    expect(useNewGameStore.getState().profile.dungeonProgress['prototype-depths']).toEqual({
      highestFloorCleared: 10,
      clearCount: 1,
    })

    expect(useNewGameStore.getState().beginRoundResolution()).toBeNull()
    expect(useNewGameStore.getState().profile.bankedSouls).toBe(160)
    const claimedState = useNewGameStore.getState()
    useNewGameStore.setState({
      combat: { ...claimedState.combat, phase: 'awaiting_resolve' },
      run: { ...claimedState.run, status: 'active' },
    })
    expect(useNewGameStore.getState().beginRoundResolution()).toBeNull()
    expect(useNewGameStore.getState().profile.bankedSouls).toBe(160)
    useNewGameStore.setState({
      combat: { ...useNewGameStore.getState().combat, phase: 'resolving' },
      run: { ...useNewGameStore.getState().run, status: 'victory' },
    })
    useNewGameStore.getState().finishRoundResolution()
    useNewGameStore.getState().returnToHubAfterVictory()
    expect(useNewGameStore.getState().profile.bankedSouls).toBe(160)
    expect(useNewGameStore.getState().screen).toBe('hub')
  })

  it('precision-forges exactly the selected permanent face and charges its premium', () => {
    const state = useNewGameStore.getState()
    const die = state.profile.diceCollection[0]
    const selectedFace = die.faces[0]
    const untouchedValues = die.faces.slice(1).map((face) => face.value)
    useNewGameStore.setState({
      profile: { ...state.profile, bankedSouls: 10 },
    })

    const upgraded = useNewGameStore.getState().precisionForgeFace(
      die.id,
      selectedFace.id,
      'precision-test-1',
    )
    const profile = useNewGameStore.getState().profile
    const upgradedDie = profile.diceCollection.find((candidate) => candidate.id === die.id)!

    expect(upgraded?.cost).toBe(10)
    expect(profile.bankedSouls).toBe(0)
    expect(upgradedDie.faces[0].value).toBe(selectedFace.value + 1)
    expect(upgradedDie.faces.slice(1).map((face) => face.value)).toEqual(untouchedValues)
  })

  it('charges a Forge operation id at most once across repeated calls', () => {
    const state = useNewGameStore.getState()
    const die = state.profile.diceCollection[0]
    useNewGameStore.setState({
      profile: { ...state.profile, bankedSouls: 100 },
    })

    const first = useNewGameStore.getState().chaosForgeDie(die.id, 'same-forge-op', () => 0)
    const second = useNewGameStore.getState().chaosForgeDie(die.id, 'same-forge-op', () => 0.99)
    const profile = useNewGameStore.getState().profile

    expect(first?.cost).toBe(7)
    expect(second).toBeNull()
    expect(profile.bankedSouls).toBe(93)
    expect(profile.recentForgeOperationIds).toEqual(['same-forge-op'])
  })

  it('rejects precision forging an unavailable face without charging Souls', () => {
    const state = useNewGameStore.getState()
    const die = state.profile.diceCollection[0]
    const cappedFace = die.faces[0]
    const cappedDiceCollection = state.profile.diceCollection.map((candidate) => (
      candidate.id === die.id
        ? {
            ...candidate,
            faces: candidate.faces.map((face) => (
              face.id === cappedFace.id ? { ...face, value: 5 } : face
            )) as typeof candidate.faces,
          }
        : candidate
    ))
    useNewGameStore.setState({
      profile: { ...state.profile, bankedSouls: 1000, diceCollection: cappedDiceCollection },
    })

    expect(useNewGameStore.getState().precisionForgeFace(
      die.id,
      cappedFace.id,
      'precision-test-2',
    )).toBeNull()
    expect(useNewGameStore.getState().profile.bankedSouls).toBe(1000)
    expect(useNewGameStore.getState().profile.diceCollection[0].faces[0].value).toBe(5)
  })

  it('rehydrates the same active run and already committed roll result', async () => {
    let saved: StorageValue<NewGameState> | null = null
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
      useNewGameStore.getState().resetProgress()
      useNewGameStore.getState().startRun('prototype-depths')
      revealEnemyIntent()
      const committedRoll = useNewGameStore.getState().drawNextDie()
      const activeRunBeforeReload = useNewGameStore.getState().run
      const persistedSnapshot = structuredClone(
        saved as unknown as StorageValue<NewGameState>,
      )

      useNewGameStore.getState().resetProgress()
      saved = persistedSnapshot
      await useNewGameStore.persist.rehydrate()

      const rehydrated = useNewGameStore.getState()
      expect(rehydrated.screen).toBe('combat')
      expect(rehydrated.run.status).toBe('active')
      expect(rehydrated.run.enemy).toEqual(activeRunBeforeReload.enemy)
      expect(rehydrated.combat.results).toEqual([committedRoll])
      expect(rehydrated.combat.drawPileDieIds).toEqual([])
    } finally {
      useNewGameStore.persist.setOptions({ storage: originalStorage })
      useNewGameStore.getState().resetProgress()
    }
  })

  it('migrates version 6 Run Souls into permanent Souls without ending a compatible run', async () => {
    useNewGameStore.getState().startRun('prototype-depths')
    const state = useNewGameStore.getState()
    const legacyState = {
      ...state,
      profile: {
        ...state.profile,
        saveVersion: 6,
        bankedSouls: 9,
      },
      run: {
        ...state.run,
        runStats: undefined,
        runSouls: 17,
      },
      lastLostRunSouls: 4,
    }
    let saved: StorageValue<NewGameState> | null = {
      state: legacyState as unknown as NewGameState,
      version: 6,
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

      expect(migrated.profile.saveVersion).toBe(11)
      expect(migrated.profile.bankedSouls).toBe(26)
      expect(migrated.run.status).toBe('active')
      expect(migrated.run.runStats).toEqual({
        enemiesDefeated: 0,
        soulsEarned: 17,
        xpEarned: 0,
      })
      expect('runSouls' in migrated.run).toBe(false)
      expect('lastLostRunSouls' in migrated).toBe(false)
    } finally {
      useNewGameStore.persist.setOptions({ storage: originalStorage })
      useNewGameStore.getState().resetProgress()
    }
  })

  it('reconstructs descent stats when migrating a compatible version 7 run', async () => {
    useNewGameStore.getState().startRun('prototype-depths')
    const state = useNewGameStore.getState()
    const legacyState = {
      ...state,
      profile: {
        ...state.profile,
        saveVersion: 7,
        bankedSouls: 12,
        xp: 18,
      },
      run: {
        ...state.run,
        encounterIndex: 2,
        enemy: createEnemyState('descent-1-goblin-l1'),
        runStats: undefined,
      },
    }
    let saved: StorageValue<NewGameState> | null = {
      state: legacyState as unknown as NewGameState,
      version: 7,
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

      expect(migrated.profile.saveVersion).toBe(11)
      expect(migrated.profile.bankedSouls).toBe(12)
      expect(migrated.profile.xp).toBe(18)
      expect(migrated.run.status).toBe('active')
      expect(migrated.run.encounterIndex).toBe(2)
      expect(migrated.run.runStats).toEqual({
        enemiesDefeated: 2,
        soulsEarned: 12,
        xpEarned: 18,
      })
    } finally {
      useNewGameStore.persist.setOptions({ storage: originalStorage })
      useNewGameStore.getState().resetProgress()
    }
  })

  it('migrates the old three-die prototype save to the one-Attack-die start', async () => {
    const state = useNewGameStore.getState()
    const oldDiceCollection = createDiceCatalog()
    const oldState: NewGameState = {
      ...state,
      screen: 'combat',
      profile: {
        ...state.profile,
        saveVersion: 1,
        xp: 21,
        bankedSouls: 9,
        diceCollection: oldDiceCollection,
        equippedDieIds: oldDiceCollection.map((die) => die.id),
      },
    }
    let saved: StorageValue<NewGameState> | null = {
      state: oldState,
      version: 1,
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
      expect(migrated.run.status).toBe('inactive')
      expect(migrated.profile.saveVersion).toBe(11)
      expect(migrated.profile.xp).toBe(21)
      expect(migrated.profile.bankedSouls).toBe(9)
      expect(migrated.profile.diceCollection.map((die) => die.id)).toEqual(['attack-die-1'])
      expect(migrated.profile.equippedDieIds).toEqual(['attack-die-1'])
    } finally {
      useNewGameStore.persist.setOptions({ storage: originalStorage })
      useNewGameStore.getState().resetProgress()
    }
  })

  it('migrates version 5 unlocked talent IDs to canonical rank-one talents', async () => {
    const state = useNewGameStore.getState()
    const legacyState = {
      ...state,
      profile: {
        ...state.profile,
        saveVersion: 5,
        talentRanks: undefined,
        unlockedTalentIds: [
          TALENT_IDS.battleHardenedOne,
          TALENT_IDS.twinArsenal,
        ],
      },
    }
    let saved: StorageValue<NewGameState> | null = {
      state: legacyState as unknown as NewGameState,
      version: 5,
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

      expect(migrated.profile.saveVersion).toBe(11)
      expect(migrated.profile.talentRanks).toEqual({
        [TALENT_IDS.battleHardenedOne]: 1,
        [TALENT_IDS.twinArsenal]: 1,
      })
      expect(getPlayerMaxHp(migrated.profile.talentRanks)).toBe(12)
      expect(getDiceCapacity(migrated.profile.talentRanks)).toBe(2)
    } finally {
      useNewGameStore.persist.setOptions({ storage: originalStorage })
      useNewGameStore.getState().resetProgress()
    }
  })

  it('migrates a version 3 numeric intent to the matching stable enemy face', async () => {
    useNewGameStore.getState().startRun('prototype-depths')
    const state = useNewGameStore.getState()
    const enemy = state.run.enemy!
    const legacyEnemy = {
      definitionId: enemy.definitionId,
      name: enemy.name,
      spriteName: enemy.spriteName,
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      shield: enemy.shield,
      intentIndex: 0,
      intent: { type: 'attack' as const, value: 3 },
      xpReward: enemy.xpReward,
      soulReward: enemy.soulReward,
      rewardClaimed: false,
    }
    const legacyState = {
      ...state,
      profile: { ...state.profile, saveVersion: 3 },
      run: { ...state.run, enemy: legacyEnemy },
      combat: { ...state.combat, phase: 'awaiting_roll' as const },
    }
    let saved: StorageValue<NewGameState> | null = {
      state: legacyState as unknown as NewGameState,
      version: 3,
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

      expect(migrated.profile.saveVersion).toBe(11)
      expect(migrated.run.status).toBe('active')
      expect(migrated.run.enemy?.intentRolls[0]).toMatchObject({
        dieId: 'slime-l1-attack',
        faceId: 'slime-l1-attack-face-6',
        value: 3,
      })
      expect(migrated.combat.phase).toBe('awaiting_roll')
    } finally {
      useNewGameStore.persist.setOptions({ storage: originalStorage })
      useNewGameStore.getState().resetProgress()
    }
  })

  it('maps a version 8 active run onto the new repeated Dungeon 1 encounter', async () => {
    useNewGameStore.getState().startRun('prototype-depths')
    const state = useNewGameStore.getState()
    const legacyEnemy = {
      definitionId: 'shieldbearer',
      name: 'Shieldbearer',
      spriteName: 'Shieldbearer',
      hp: 19,
      maxHp: 19,
      shield: 4,
      attackDieId: 'shieldbearer-attack',
      intentRoll: {
        dieId: 'shieldbearer-attack',
        faceId: 'shieldbearer-attack-face-4',
        value: 4,
      },
      xpReward: 18,
      soulReward: 15,
      rewardClaimed: false,
    }
    const legacyState = {
      ...state,
      profile: {
        ...state.profile,
        saveVersion: 8,
        xp: 91,
        bankedSouls: 73,
      },
      run: {
        ...state.run,
        encounterIndex: 4,
        playerHp: 7,
        enemy: legacyEnemy,
      },
      combat: {
        ...state.combat,
        phase: 'awaiting_roll' as const,
      },
    }
    let saved: StorageValue<NewGameState> | null = {
      state: legacyState as unknown as NewGameState,
      version: 8,
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

      expect(migrated.profile.saveVersion).toBe(11)
      expect(migrated.profile.xp).toBe(91)
      expect(migrated.profile.bankedSouls).toBe(73)
      expect(migrated.run.status).toBe('active')
      expect(migrated.run.encounterIndex).toBe(4)
      expect(migrated.run.playerHp).toBe(7)
      expect(migrated.run.enemy).toMatchObject({
        encounterId: 'descent-1-slime-l2',
        definitionId: 'slime',
        level: 2,
        hp: 14,
        maxHp: 14,
        shield: 0,
        dieIds: ['slime-l2-attack'],
      })
      expect(migrated.run.enemy?.intentRolls[0]).toMatchObject({
        dieId: 'slime-l2-attack',
        value: 4,
      })
    } finally {
      useNewGameStore.persist.setOptions({ storage: originalStorage })
      useNewGameStore.getState().resetProgress()
    }
  })

  it('recovers an active save with the legacy combat shape instead of blanking the app', async () => {
    useNewGameStore.getState().startRun('prototype-depths')
    const state = useNewGameStore.getState()
    const incompatibleCombat = {
      phase: 'awaiting_roll' as const,
      roundNumber: 3,
      currentDieIndex: 1,
      results: [],
      totals: { attack: 0, shield: 0, heal: 0 },
      lastResolution: null,
      resolutionVersion: 2,
    }
    const legacyState = {
      ...state,
      screen: 'combat' as const,
      profile: { ...state.profile, saveVersion: 4 },
      combat: incompatibleCombat,
    }
    let saved: StorageValue<NewGameState> | null = {
      state: legacyState as unknown as NewGameState,
      version: 4,
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

      expect(migrated.profile.saveVersion).toBe(11)
      expect(migrated.screen).toBe('hub')
      expect(migrated.run.status).toBe('inactive')
      expect(migrated.combat.drawPileDieIds).toEqual([])
      expect(migrated.combat.results).toEqual([])
    } finally {
      useNewGameStore.persist.setOptions({ storage: originalStorage })
      useNewGameStore.getState().resetProgress()
    }
  })
})
