import { beforeEach, describe, expect, it } from 'vitest'
import type { PersistStorage, StorageValue } from 'zustand/middleware'
import { createDiceCatalog } from '../game/content/dice'
import type { NewGameState } from './newGameStore'
import { useNewGameStore } from './newGameStore'

function prepareResolvedRound(totals: { attack: number; shield: number; heal: number }) {
  const state = useNewGameStore.getState()
  useNewGameStore.setState({
    combat: {
      ...state.combat,
      phase: 'awaiting_resolve',
      drawPileDieIds: [],
      totals,
    },
  })
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

    expect(useNewGameStore.getState().beginRoundResolution()?.outcome).toBe('ongoing')
    useNewGameStore.getState().advanceRoundResolution()
    useNewGameStore.getState().finishRoundResolution()
    const nextRound = useNewGameStore.getState().combat
    expect(nextRound.roundNumber).toBe(2)
    expect([...nextRound.drawPileDieIds].sort()).toEqual(
      diceCollection.map((die) => die.id).sort(),
    )
    expect(nextRound.results).toEqual([])
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

  it('resolves the enemy attack after the player phase, then handles defeat', () => {
    useNewGameStore.getState().startRun('prototype-depths')
    const state = useNewGameStore.getState()
    useNewGameStore.setState({
      profile: { ...state.profile, xp: 13, bankedSouls: 7 },
      run: { ...state.run, playerHp: 1, runSouls: 17 },
    })
    const permanentDiceBeforeDeath = JSON.stringify(useNewGameStore.getState().profile.diceCollection)
    prepareResolvedRound({ attack: 0, shield: 0, heal: 0 })

    const resolution = useNewGameStore.getState().beginRoundResolution()
    const afterPlayerPhase = useNewGameStore.getState()

    expect(resolution?.outcome).toBe('defeat')
    expect(afterPlayerPhase.combat.resolutionStep).toBe('player')
    expect(afterPlayerPhase.run.playerHp).toBe(1)
    expect(afterPlayerPhase.run.runSouls).toBe(17)

    useNewGameStore.getState().finishRoundResolution()
    expect(useNewGameStore.getState().screen).toBe('combat')

    useNewGameStore.getState().advanceRoundResolution()
    const defeated = useNewGameStore.getState()

    expect(defeated.combat.resolutionStep).toBe('enemy')
    expect(defeated.run.playerHp).toBe(0)
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
      expect(migrated.profile.saveVersion).toBe(2)
      expect(migrated.profile.xp).toBe(21)
      expect(migrated.profile.bankedSouls).toBe(9)
      expect(migrated.profile.diceCollection.map((die) => die.id)).toEqual(['attack-die-1'])
      expect(migrated.profile.equippedDieIds).toEqual(['attack-die-1'])
    } finally {
      useNewGameStore.persist.setOptions({ storage: originalStorage })
      useNewGameStore.getState().resetProgress()
    }
  })
})
