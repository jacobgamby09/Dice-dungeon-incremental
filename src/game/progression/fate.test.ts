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

  it('offers three different unowned charms during early protection', () => {
    const draw = createFateDraw({}, 'draw-1', () => 0)
    expect(draw?.cost).toBe(FATE_DRAW_COST)
    expect(new Set(draw?.offeredCharmIds).size).toBe(3)
    expect(draw?.offeredCharmIds).toEqual([
      'blade-rhythm',
      'echo-knot',
      'low-omen',
    ])
  })

  it('claims only an offered charm and raises its permanent rank', () => {
    const draw = createFateDraw({}, 'draw-1', () => 0)!
    expect(claimFateDraw({}, draw, 'soul-prism')).toBeNull()
    expect(claimFateDraw({}, draw, 'blade-rhythm')).toEqual({
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
    expect(draw?.offeredCharmIds).not.toContain('blade-rhythm')
  })
})
