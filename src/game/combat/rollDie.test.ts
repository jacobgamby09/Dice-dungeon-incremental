import { describe, expect, it } from 'vitest'
import { createDiceCatalog, createStartingDice } from '../content/dice'
import { addRollEffects, addRollToTotals, getRollContributions, rollDie } from './rollDie'

describe('rollDie', () => {
  it('returns the exact persistent face id selected by the RNG', () => {
    const result = rollDie(createStartingDice()[0], () => 0.999)
    expect(result).toMatchObject({ faceIndex: 5, faceId: 'attack-die-1-face-6', value: 1 })
  })

  it('adds a result to only its matching total', () => {
    const die = createDiceCatalog().find((candidate) => candidate.id === 'shield-die-1')!
    const totals = addRollToTotals(
      { attack: 4, shield: 1, heal: 2, bleed: 0 },
      rollDie(die, () => 0.5),
    )
    expect(totals).toMatchObject({ attack: 4, shield: 3, heal: 2, bleed: 0 })
  })

  it('activates scalable Execute signatures at half enemy HP', () => {
    const die = createDiceCatalog().find((candidate) => candidate.id === 'attack-die-executioner')!
    die.faces[4].value = 7
    const execute = rollDie(die, () => 0.75)
    const active = addRollEffects(
      { attack: 0, shield: 0, heal: 0, bleed: 0 }, execute, true, 0,
      { enemyHp: 5, enemyMaxHp: 10 },
    )
    const inactive = addRollEffects(
      { attack: 0, shield: 0, heal: 0, bleed: 0 }, execute, true, 0,
      { enemyHp: 6, enemyMaxHp: 10 },
    )
    expect(active.totals.attack).toBe(10)
    expect(active.feedback.executeBonus).toBe(3)
    expect(inactive.totals.attack).toBe(7)
  })

  it('arms Fortify for the next Shield face and falls back when rolled last', () => {
    const catalog = createDiceCatalog()
    const fortify = rollDie(catalog.find((die) => die.id === 'shield-die-tower')!, () => 0.75)
    const first = addRollEffects({ attack: 0, shield: 0, heal: 0, bleed: 0 }, fortify, false)
    const nextShield = rollDie(catalog.find((die) => die.id === 'shield-die-1')!, () => 0)
    const second = addRollEffects(first.totals, nextShield, true, first.pendingFortify)
    const fallback = addRollEffects({ attack: 0, shield: 0, heal: 0, bleed: 0 }, fortify, true)
    expect(first.pendingFortify).toBe(2)
    expect(second.totals.shield).toBe(6)
    expect(second.feedback.fortifyBonus).toBe(2)
    expect(fallback.totals.shield).toBe(5)
  })

  it('turns a Bloodwell Drain signature into Heal plus Attack', () => {
    const die = createDiceCatalog().find((candidate) => candidate.id === 'heal-die-bloodwell')!
    const drain = rollDie(die, () => 0.9)
    const applied = addRollEffects({ attack: 0, shield: 0, heal: 0, bleed: 0 }, drain, true)
    expect(applied.totals).toMatchObject({ attack: 2, heal: 1 })
    expect(applied.feedback.drainAttackValue).toBe(2)
  })

  it('keeps contribution feedback limited to active signature mechanics', () => {
    const die = createDiceCatalog().find((candidate) => candidate.id === 'attack-die-executioner')!
    const contributions = getRollContributions(
      [rollDie(die, () => 0.75)], 0, { enemyHp: 3, enemyMaxHp: 10 },
    )
    expect(contributions[0]).toMatchObject({ executeBonus: 3, totalValue: 6 })
  })
})
