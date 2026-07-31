import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { FateSanctumScreen } from './FateSanctumScreen'

const mockedStore = vi.hoisted(() => ({
  state: {
    profile: {
      charmRanks: {},
      charmRarityProgress: { epicMisses: 0, legendaryMisses: 0 },
      equippedCharmIds: [],
      fateTokens: 0,
      pendingFateDraw: null,
      talentRanks: {
        fatecraft: 1,
      },
    },
    beginFateDraw: () => null,
    claimFateCharm: () => false,
    equipCharm: () => false,
    unequipCharm: () => false,
    goToHub: () => undefined,
  },
}))

vi.mock('../store/newGameStore', () => ({
  useNewGameStore: <T,>(selector: (state: typeof mockedStore.state) => T): T => (
    selector(mockedStore.state)
  ),
}))

describe('Fate Sanctum player-facing rules', () => {
  it('keeps pity protection hidden while explaining the draw', () => {
    const markup = renderToStaticMarkup(<FateSanctumScreen />)

    expect(markup).toContain('Spend Fate Tokens to draw one permanent Charm')
    expect(markup).not.toContain('Fate signal')
    expect(markup).not.toContain('Pity')
    expect(markup).not.toContain('guaranteed')
    expect(markup).not.toContain('/5')
    expect(markup).toContain('Common')
    expect(markup).toContain('Rare')
    expect(markup).toContain('Epic')
    expect(markup).toContain('Legendary')
    expect(markup).not.toContain("Fate's Favor")
  })
})
