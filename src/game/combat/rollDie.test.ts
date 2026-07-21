import { describe, expect, it } from 'vitest'
import { createStartingDice } from '../content/dice'
import { addRollToTotals, rollDie } from './rollDie'

describe('rollDie', () => {
  it('returns the exact persistent face id selected by the RNG', () => {
    const die = createStartingDice()[0]
    const result = rollDie(die, () => 0.999)

    expect(result.faceIndex).toBe(5)
    expect(result.faceId).toBe('attack-die-1-face-6')
    expect(result.value).toBe(3)
  })

  it('adds a result to only its matching total', () => {
    const die = createStartingDice()[1]
    const result = rollDie(die, () => 0.5)
    const totals = addRollToTotals({ attack: 4, shield: 1, heal: 2 }, result)

    expect(totals).toEqual({ attack: 4, shield: 3, heal: 2 })
  })
})

