import { describe, expect, it } from 'vitest'
import { createDiceCatalog, createStartingDice } from '../content/dice'
import { addRollEffects, addRollToTotals, rollDie } from './rollDie'

describe('rollDie', () => {
  it('returns the exact persistent face id selected by the RNG', () => {
    const die = createStartingDice()[0]
    const result = rollDie(die, () => 0.999)

    expect(result.faceIndex).toBe(5)
    expect(result.faceId).toBe('attack-die-1-face-6')
    expect(result.value).toBe(3)
  })

  it('adds a result to only its matching total', () => {
    const die = createDiceCatalog().find((candidate) => candidate.id === 'shield-die-1')!
    const result = rollDie(die, () => 0.5)
    const totals = addRollToTotals({ attack: 4, shield: 1, heal: 2, bleed: 0 }, result)

    expect(totals).toEqual({ attack: 4, shield: 3, heal: 2, bleed: 0 })
  })

  it('carries Momentum into the next rolled face and falls back to Attack when last', () => {
    const momentumResult = {
      ...rollDie(createStartingDice()[0], () => 0),
      value: 3,
      evolution: { id: 'momentum', name: 'Momentum' } as const,
    }
    const first = addRollEffects(
      { attack: 0, shield: 0, heal: 0, bleed: 0 },
      0,
      momentumResult,
      false,
    )
    const shieldResult = rollDie(
      createDiceCatalog().find((die) => die.family === 'shield')!,
      () => 0,
    )
    const second = addRollEffects(first.totals, first.pendingMomentum, shieldResult, true)
    const last = addRollEffects(
      { attack: 0, shield: 0, heal: 0, bleed: 0 },
      0,
      momentumResult,
      true,
    )

    expect(first).toEqual({
      totals: { attack: 3, shield: 0, heal: 0, bleed: 0 },
      pendingMomentum: 2,
    })
    expect(second.totals.shield).toBe(3)
    expect(last.totals.attack).toBe(5)
    expect(last.pendingMomentum).toBe(0)
  })

  it('turns Rend into immediate Attack plus delayed Bleed', () => {
    const result = {
      ...rollDie(createStartingDice()[0], () => 0),
      value: 2,
      evolution: { id: 'rend', name: 'Rend' } as const,
    }
    const applied = addRollEffects(
      { attack: 0, shield: 0, heal: 0, bleed: 0 },
      0,
      result,
      true,
    )

    expect(applied.totals).toEqual({ attack: 2, shield: 0, heal: 0, bleed: 2 })
  })
})
