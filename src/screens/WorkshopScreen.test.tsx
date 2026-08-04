import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createDieById } from '../game/content/dice'
import { WorkshopScreen } from './WorkshopScreen'

const mockedStore = vi.hoisted(() => ({
  state: {
    profile: {
      bankedSouls: 100,
      diceCollection: [] as ReturnType<typeof createDieById>[],
      equippedDieIds: [] as string[],
      imprints: [],
      pendingWorkshopForge: null,
      talentRanks: {},
    },
    beginWorkshopForge: () => null,
    completePendingWorkshopForge: () => null,
    goToHub: () => undefined,
    rerollPendingWorkshopTarget: () => null,
  },
}))

vi.mock('../store/newGameStore', () => ({
  useNewGameStore: <T,>(selector: (state: typeof mockedStore.state) => T): T => (
    selector(mockedStore.state)
  ),
}))

describe('Workshop signature faces', () => {
  it.each([
    ['attack-die-executioner', 'execute', 'Execute'],
    ['shield-die-tower', 'fortify', 'Fortify'],
    ['heal-die-bloodwell', 'drain', 'Drain'],
  ])('shows the %s signature directly on its physical Workshop faces', (dieId, signatureId, name) => {
    const die = createDieById(dieId)!
    mockedStore.state.profile.diceCollection = [die]
    mockedStore.state.profile.equippedDieIds = [die.id]

    const markup = renderToStaticMarkup(<WorkshopScreen />)

    expect(markup.match(new RegExp(`data-signature-icon="${signatureId}"`, 'g'))).toHaveLength(2)
    expect(markup.match(new RegExp(`workshop-target__face--signature-${signatureId}`, 'g'))).toHaveLength(2)
    expect(markup.match(new RegExp(`>${name}<`, 'g'))).toHaveLength(2)
    expect(markup).toContain(`${name} Signature`)
  })
})
