import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { PostCombatScreen } from './PostCombatScreen'

const mockedStore = vi.hoisted(() => ({
  state: {
    profile: {
      bankedSouls: 5,
      xp: 8,
    },
    run: {
      lastReward: {
        enemyName: 'Slime',
        floor: 1,
        isBoss: false,
        xp: 8,
        souls: 5,
        dungeonComplete: false,
      },
      dungeonId: 'prototype-depths',
      enemy: {
        spriteName: 'Slime',
      },
      encounterIndex: 0,
      playerHp: 10,
      playerMaxHp: 10,
    },
    advanceToNextFloor: () => undefined,
    returnToHubAfterVictory: () => undefined,
  },
}))

vi.mock('../store/newGameStore', () => ({
  useNewGameStore: <T,>(selector: (state: typeof mockedStore.state) => T): T => (
    selector(mockedStore.state)
  ),
}))

describe('PostCombatScreen permanent reward flow', () => {
  it('shows permanent Souls and one forward path without extraction risk', () => {
    const markup = renderToStaticMarkup(<PostCombatScreen />)

    expect(markup).toContain('Permanent Souls')
    expect(markup).toContain('Descend Deeper')
    expect(markup).not.toContain('Extract')
    expect(markup).not.toContain('At risk')
  })
})
