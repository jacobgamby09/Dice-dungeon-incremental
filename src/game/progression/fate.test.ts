import { describe, expect, it } from 'vitest'
import {
  claimFateDraw,
  createFateDraw,
  EMPTY_CHARM_RARITY_PROGRESS,
  FATE_DRAW_COST,
  FATE_PITY_THRESHOLD,
  rollFateDrop,
} from './fate'

function sequence(...values: number[]): () => number {
  let index = 0
  return () => values[Math.min(index++, values.length - 1)]
}

describe('Fate drops and draws', () => {
  it('guarantees a normal token drop on the token pity threshold', () => {
    expect(rollFateDrop('normal', FATE_PITY_THRESHOLD - 1, () => 0.99)).toEqual({
      tokens: 1,
      nextPity: 0,
      pityTriggered: true,
    })
  })

  it('guarantees enough Fate Tokens for one draw across Dungeon 1', () => {
    const tiers = ['normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'elite', 'boss'] as const
    let pity = 0
    let tokens = 0
    for (const tier of tiers) {
      const result = rollFateDrop(tier, pity, () => 0.99)
      pity = result.nextPity
      tokens += result.tokens
    }
    expect(tokens).toBeGreaterThanOrEqual(FATE_DRAW_COST)
  })

  it('allows a Legendary on the first Draw without guaranteeing any rarity', () => {
    const result = createFateDraw(
      {},
      'draw-1',
      EMPTY_CHARM_RARITY_PROGRESS,
      null,
      sequence(0.999, 0.2),
    )
    expect(result?.draw.rarity).toBe('legendary')
    expect(result?.draw.protectionTriggered).toBeUndefined()
    expect(result?.nextProgress).toEqual(EMPTY_CHARM_RARITY_PROGRESS)
  })

  it('activates Epic protection only when the talent supplies it', () => {
    const result = createFateDraw(
      {},
      'draw-protected',
      { epicMisses: 7, legendaryMisses: 7 },
      { epicThreshold: 8 },
      sequence(0, 0),
    )
    expect(['epic', 'legendary']).toContain(result?.draw.rarity)
    expect(result?.draw.protectionTriggered).toBe('epic')
    expect(result?.nextProgress.epicMisses).toBe(0)
  })

  it('activates separate Legendary protection at rank three', () => {
    const result = createFateDraw(
      {},
      'draw-legendary',
      { epicMisses: 0, legendaryMisses: 14 },
      { epicThreshold: 6, legendaryThreshold: 15 },
      sequence(0, 0),
    )
    expect(result?.draw.rarity).toBe('legendary')
    expect(result?.draw.protectionTriggered).toBe('legendary')
  })

  it('claims the persisted winner and raises its permanent rank', () => {
    const result = createFateDraw({}, 'draw-1', EMPTY_CHARM_RARITY_PROGRESS, null, sequence(0, 0))!
    expect(claimFateDraw({}, result.draw)).toEqual({ [result.draw.selectedCharmId]: 1 })
  })

  it('excludes max-rank Charms and can draw the sole remaining candidate', () => {
    const result = createFateDraw({
      'blade-rhythm': 3,
      'echo-knot': 3,
      'low-omen': 3,
      'ward-clock': 3,
      bloodroot: 3,
      'crimson-oath': 3,
      'unbroken-wall': 3,
    }, 'draw-final', EMPTY_CHARM_RARITY_PROGRESS, null, sequence(0.5, 0.5))
    expect(result?.draw.selectedCharmId).toBe('soul-prism')
  })

  it('keeps Dungeon 3 Charms out of Fate Draws until that dungeon is unlocked', () => {
    const completedEarlyPool = {
      'blade-rhythm': 3,
      'echo-knot': 3,
      'low-omen': 3,
      'ward-clock': 3,
      bloodroot: 3,
      'soul-prism': 3,
      'crimson-oath': 3,
      'unbroken-wall': 3,
    }
    expect(createFateDraw(
      completedEarlyPool,
      'draw-before-d3',
      EMPTY_CHARM_RARITY_PROGRESS,
      null,
      sequence(0, 0),
      ['prototype-depths', 'iron-depths'],
    )).toBeNull()

    const unlocked = createFateDraw(
      completedEarlyPool,
      'draw-in-d3',
      EMPTY_CHARM_RARITY_PROGRESS,
      null,
      sequence(0, 0),
      ['prototype-depths', 'iron-depths', 'blighted-depths'],
    )
    expect(['third-spark', 'clean-thread', 'last-echo', 'fivefold-crown'])
      .toContain(unlocked?.draw.selectedCharmId)
  })
})
