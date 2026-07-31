import { describe, expect, it } from 'vitest'
import {
  claimFateDraw,
  createFateDraw,
  FATE_DRAW_COST,
  FATE_PITY_THRESHOLD,
  rollFateDrop,
} from './fate'

describe('Fate drops and draws', () => {
  it('guarantees a normal drop on the pity threshold', () => {
    const result = rollFateDrop('normal', FATE_PITY_THRESHOLD - 1, () => 0.99)
    expect(result).toEqual({
      tokens: 1,
      nextPity: 0,
      pityTriggered: true,
    })
  })

  it('resets pity on random, elite and boss drops', () => {
    expect(rollFateDrop('normal', 3, () => 0.1)).toEqual({
      tokens: 1,
      nextPity: 0,
      pityTriggered: false,
    })
    expect(rollFateDrop('elite', 3, () => 0.99).tokens).toBe(1)
    expect(rollFateDrop('boss', 3, () => 0.99).tokens).toBe(3)
  })

  it('guarantees enough Fate Tokens for one draw across Dungeon 1', () => {
    const tiers = [
      'normal',
      'normal',
      'normal',
      'normal',
      'normal',
      'normal',
      'normal',
      'normal',
      'elite',
      'boss',
    ] as const
    let pity = 0
    let tokens = 0

    for (const tier of tiers) {
      const result = rollFateDrop(tier, pity, () => 0.99)
      pity = result.nextPity
      tokens += result.tokens
    }

    expect(tokens).toBeGreaterThanOrEqual(FATE_DRAW_COST)
  })

  it('guarantees a new single Charm for the first three acquisitions', () => {
    const first = createFateDraw({}, 'draw-1', () => 0)
    const second = createFateDraw({ 'blade-rhythm': 1 }, 'draw-2', () => 0)
    const third = createFateDraw({
      'blade-rhythm': 1,
      'echo-knot': 1,
    }, 'draw-3', () => 0)

    expect(first).toMatchObject({
      cost: FATE_DRAW_COST,
      selectedCharmId: 'blade-rhythm',
    })
    expect(second?.selectedCharmId).toBe('echo-knot')
    expect(third?.selectedCharmId).toBe('low-omen')
  })

  it('claims the persisted winner and raises its permanent rank', () => {
    const draw = createFateDraw({}, 'draw-1', () => 0)!
    expect(claimFateDraw({}, draw)).toEqual({
      'blade-rhythm': 1,
    })
  })

  it('excludes max-rank charms from future offers', () => {
    const draw = createFateDraw({
      'blade-rhythm': 3,
      'echo-knot': 1,
      'low-omen': 1,
      'ward-clock': 1,
    }, 'draw-2', () => 0)
    expect(draw?.selectedCharmId).not.toBe('blade-rhythm')
  })

  it('can still draw when only one Charm remains below max rank', () => {
    const draw = createFateDraw({
      'blade-rhythm': 3,
      'echo-knot': 3,
      'low-omen': 3,
      'ward-clock': 3,
      bloodroot: 3,
    }, 'draw-final', () => 0.99)
    expect(draw?.selectedCharmId).toBe('soul-prism')
  })
})
