import { describe, expect, it } from 'vitest'
import { createDiceCatalog, createStartingDice } from '../content/dice'
import {
  addRollEffects,
  addRollToTotals,
  getRollContributions,
  rollDie,
} from './rollDie'

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

    expect(totals).toMatchObject({ attack: 4, shield: 3, heal: 2, bleed: 0 })
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

    expect(first).toMatchObject({
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

    expect(applied.totals).toMatchObject({ attack: 2, shield: 0, heal: 0, bleed: 2 })
  })

  it('describes Momentum boosts and Rend payloads for readable combat feedback', () => {
    const baseResult = rollDie(createStartingDice()[0], () => 0)
    const momentum = {
      ...baseResult,
      faceId: 'momentum-face',
      value: 3,
      evolution: { id: 'momentum', name: 'Momentum' } as const,
    }
    const shield = {
      ...rollDie(createDiceCatalog().find((die) => die.family === 'shield')!, () => 0),
      faceId: 'shield-face',
    }
    const rend = {
      ...baseResult,
      faceId: 'rend-face',
      value: 2,
      evolution: { id: 'rend', name: 'Rend' } as const,
    }

    const contributions = getRollContributions([momentum, shield, rend], 0)

    expect(contributions[0]).toMatchObject({
      momentumArmed: 2,
      momentumBonus: 0,
      totalValue: 3,
    })
    expect(contributions[1]).toMatchObject({
      momentumArmed: 0,
      momentumBonus: 2,
      totalValue: 3,
    })
    expect(contributions[2]).toMatchObject({
      bleedValue: 2,
      momentumBonus: 0,
      totalValue: 2,
    })
  })

  it('activates Execute on both signature faces when the enemy is at half HP', () => {
    const executioner = createDiceCatalog().find(
      (die) => die.id === 'attack-die-executioner',
    )!
    const execute = rollDie(executioner, () => 0.75)
    const active = addRollEffects(
      { attack: 0, shield: 0, heal: 0, bleed: 0 },
      0,
      execute,
      true,
      0,
      { enemyHp: 5, enemyMaxHp: 10 },
    )
    const inactive = addRollEffects(
      { attack: 0, shield: 0, heal: 0, bleed: 0 },
      0,
      execute,
      true,
      0,
      { enemyHp: 6, enemyMaxHp: 10 },
    )

    expect(execute.signature?.id).toBe('execute')
    expect(active.totals.attack).toBe(5)
    expect(active.feedback.executeBonus).toBe(2)
    expect(inactive.totals.attack).toBe(3)
  })

  it('arms Fortify for the next Shield face and falls back when rolled last', () => {
    const catalog = createDiceCatalog()
    const tower = catalog.find((die) => die.id === 'shield-die-tower')!
    const fortify = rollDie(tower, () => 0.75)
    const first = addRollEffects(
      { attack: 0, shield: 0, heal: 0, bleed: 0 },
      0,
      fortify,
      false,
    )
    const nextShield = rollDie(catalog.find((die) => die.id === 'shield-die-1')!, () => 0)
    const second = addRollEffects(
      first.totals,
      first.pendingMomentum,
      nextShield,
      true,
      first.pendingFortify,
    )
    const fallback = addRollEffects(
      { attack: 0, shield: 0, heal: 0, bleed: 0 },
      0,
      fortify,
      true,
    )

    expect(first.pendingFortify).toBe(2)
    expect(second.totals.shield).toBe(6)
    expect(second.feedback.fortifyBonus).toBe(2)
    expect(fallback.totals.shield).toBe(5)
  })

  it.each([
    ['reserve', 'shield', 'ward', 2],
    ['spikes', 'shield', 'attack', 2],
    ['regrowth', 'heal', 'regrowth', 2],
    ['overflow', 'heal', 'overflow', 2],
  ] as const)('applies the %s family payload', (evolutionId, type, payload, value) => {
    const result = {
      ...rollDie(createStartingDice()[0], () => 0),
      type,
      value: 3,
      evolution: {
        id: evolutionId,
        name: evolutionId,
      },
    }
    const applied = addRollEffects(
      { attack: 0, shield: 0, heal: 0, bleed: 0 },
      0,
      result,
      true,
    )

    expect(applied.totals[payload]).toBe(value)
  })
})
