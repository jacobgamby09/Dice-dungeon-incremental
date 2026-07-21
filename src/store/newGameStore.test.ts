import { beforeEach, describe, expect, it } from 'vitest'
import type { PersistStorage, StorageValue } from 'zustand/middleware'
import type { NewGameState } from './newGameStore'
import { useNewGameStore } from './newGameStore'

function prepareResolvedRound(totals: { attack: number; shield: number; heal: number }) {
  const state = useNewGameStore.getState()
  useNewGameStore.setState({
    combat: {
      ...state.combat,
      phase: 'awaiting_resolve',
      currentDieIndex: state.run.equippedDiceSnapshot.length,
      totals,
    },
  })
}

describe('new game progression loop', () => {
  beforeEach(() => {
    useNewGameStore.getState().resetProgress()
  })

  it('awards permanent XP immediately and lets a lethal player hit cancel the enemy intent', () => {
    const store = useNewGameStore.getState()
    store.startRun('prototype-depths')
    prepareResolvedRound({ attack: 99, shield: 0, heal: 0 })

    const resolution = useNewGameStore.getState().beginRoundResolution()
    const state = useNewGameStore.getState()

    expect(resolution?.outcome).toBe('victory')
    expect(resolution?.enemyActed).toBe(false)
    expect(state.profile.xp).toBe(8)
    expect(state.run.playerHp).toBe(10)
    expect(state.run.runSouls).toBe(5)
  })

  it('cannot claim the same encounter reward twice', () => {
    useNewGameStore.getState().startRun('prototype-depths')
    prepareResolvedRound({ attack: 99, shield: 0, heal: 0 })

    expect(useNewGameStore.getState().beginRoundResolution()?.outcome).toBe('victory')
    expect(useNewGameStore.getState().beginRoundResolution()).toBeNull()
    expect(useNewGameStore.getState().profile.xp).toBe(8)
    expect(useNewGameStore.getState().run.runSouls).toBe(5)
  })

  it('moves all run Souls into the permanent bank on extraction', () => {
    useNewGameStore.getState().startRun('prototype-depths')
    prepareResolvedRound({ attack: 99, shield: 0, heal: 0 })
    useNewGameStore.getState().beginRoundResolution()
    useNewGameStore.getState().finishRoundResolution()
    useNewGameStore.getState().extractRun()

    const state = useNewGameStore.getState()
    expect(state.screen).toBe('hub')
    expect(state.profile.bankedSouls).toBe(5)
    expect(state.run.status).toBe('inactive')
    expect(state.run.runSouls).toBe(0)
  })

  it('loses only unbanked Souls on defeat while permanent XP survives', () => {
    useNewGameStore.getState().startRun('prototype-depths')
    const state = useNewGameStore.getState()
    useNewGameStore.setState({
      profile: { ...state.profile, xp: 13, bankedSouls: 7 },
      run: { ...state.run, playerHp: 1, runSouls: 17 },
    })
    const permanentDiceBeforeDeath = JSON.stringify(useNewGameStore.getState().profile.diceCollection)
    prepareResolvedRound({ attack: 0, shield: 0, heal: 0 })

    const resolution = useNewGameStore.getState().beginRoundResolution()
    const defeated = useNewGameStore.getState()

    expect(resolution?.outcome).toBe('defeat')
    expect(defeated.run.runSouls).toBe(0)
    expect(defeated.lastLostRunSouls).toBe(17)
    expect(defeated.profile.xp).toBe(13)
    expect(defeated.profile.bankedSouls).toBe(7)
    expect(JSON.stringify(defeated.profile.diceCollection)).toBe(permanentDiceBeforeDeath)
  })

  it('carries current HP and Run Souls into the next encounter', () => {
    useNewGameStore.getState().startRun('prototype-depths')
    const state = useNewGameStore.getState()
    useNewGameStore.setState({
      run: { ...state.run, playerHp: 6 },
    })
    prepareResolvedRound({ attack: 99, shield: 0, heal: 0 })
    useNewGameStore.getState().beginRoundResolution()
    useNewGameStore.getState().finishRoundResolution()
    useNewGameStore.getState().continueRun()

    const continued = useNewGameStore.getState()
    expect(continued.screen).toBe('combat')
    expect(continued.run.status).toBe('active')
    expect(continued.run.encounterIndex).toBe(1)
    expect(continued.run.playerHp).toBe(6)
    expect(continued.run.runSouls).toBe(5)
    expect(continued.run.enemy?.definitionId).toBe('goblin')
  })

  it('upgrades exactly the selected permanent face and charges its cost', () => {
    const state = useNewGameStore.getState()
    const die = state.profile.diceCollection[0]
    const selectedFace = die.faces[0]
    const untouchedValues = die.faces.slice(1).map((face) => face.value)
    useNewGameStore.setState({
      profile: { ...state.profile, bankedSouls: 5 },
    })

    const upgraded = useNewGameStore.getState().upgradeFace(die.id, selectedFace.id)
    const profile = useNewGameStore.getState().profile
    const upgradedDie = profile.diceCollection.find((candidate) => candidate.id === die.id)!

    expect(upgraded).toBe(true)
    expect(profile.bankedSouls).toBe(0)
    expect(upgradedDie.faces[0].value).toBe(selectedFace.value + 1)
    expect(upgradedDie.faces.slice(1).map((face) => face.value)).toEqual(untouchedValues)
  })

  it('rejects an upgrade at the base face cap without charging Souls', () => {
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

    expect(useNewGameStore.getState().upgradeFace(die.id, cappedFace.id)).toBe(false)
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
      const committedRoll = useNewGameStore.getState().rollNextDie()
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
      expect(rehydrated.combat.currentDieIndex).toBe(1)
    } finally {
      useNewGameStore.persist.setOptions({ storage: originalStorage })
      useNewGameStore.getState().resetProgress()
    }
  })
})
