import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { DefeatScreen } from './DefeatScreen'

const mockedStore = vi.hoisted(() => ({
  state: {
    profile: {
      bankedSouls: 15,
      fatePity: 0,
      fateTokens: 0,
      talentRanks: {},
      xp: 24,
    },
    run: {
      dungeonId: 'prototype-depths',
      encounterIndex: 3,
      runStats: {
        enemiesDefeated: 3,
        soulsEarned: 15,
        xpEarned: 24,
      },
    },
    returnToHubAfterDefeat: () => undefined,
  },
}))

vi.mock('../store/newGameStore', () => ({
  useNewGameStore: <T,>(selector: (state: typeof mockedStore.state) => T): T => (
    selector(mockedStore.state)
  ),
}))

describe('DefeatScreen descent summary', () => {
  it('shows the depth and progress earned without legacy risk language', () => {
    const markup = renderToStaticMarkup(<DefeatScreen />)

    expect(markup).toContain('Floor reached')
    expect(markup).toContain('4/10')
    expect(markup).toContain('This descent')
    expect(markup).toContain('+24')
    expect(markup).toContain('+15')
    expect(markup).toContain('lucide-flame')
    expect(markup).toContain('Loot')
    expect(markup).toContain('No special loot this descent.')
    expect(markup).toContain('3 enemies defeated')
    expect(markup).toContain('Return to Hub')
    expect(markup).not.toContain('Permanent')
    expect(markup).not.toContain('kept')
    expect(markup).not.toContain('lost')
  })
})
