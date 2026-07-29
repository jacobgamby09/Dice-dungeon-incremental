import { describe, expect, it } from 'vitest'
import { createDiceCatalog, createStartingDice } from '../content/dice'
import {
  chaosForge,
  getChaosEligibleFaces,
  getChaosForgeCost,
  getDieUpgradeCount,
  getPrecisionForgeCost,
  precisionForge,
} from './forge'

describe('Classic V2 Chaos Workshop', () => {
  it('starts with a five-Soul random upgrade and scales every three upgrades', () => {
    const die = createStartingDice()[0]
    expect(getChaosForgeCost(die)).toBe(5)

    let forged = die
    for (let index = 0; index < 3; index += 1) {
      forged = chaosForge(forged, () => 0)!.die
    }

    expect(getDieUpgradeCount(forged)).toBe(3)
    expect(getChaosForgeCost(forged)).toBe(7)
  })

  it('chooses one stable face uniformly and changes no other face', () => {
    const die = createStartingDice()[0]
    const result = chaosForge(die, () => 0)

    expect(result?.result).toMatchObject({
      amount: 1,
      cost: 5,
      dieId: die.id,
      faceId: die.faces[0].id,
      newValue: 2,
      previousValue: 1,
      wasCritical: false,
    })
    expect(result?.die.faces.map((face) => face.value)).toEqual([2, 1, 1, 1, 1, 1])
  })

  it('uses the second random roll for a critical +2 upgrade', () => {
    const rolls = [0.99, 0.09]
    const result = chaosForge(
      createStartingDice()[0],
      () => rolls.shift() ?? 0.99,
      { criticalChance: 0.1 },
    )

    expect(result?.result).toMatchObject({
      amount: 2,
      faceId: 'attack-die-1-face-6',
      newValue: 3,
      previousValue: 1,
      wasCritical: true,
    })
  })

  it('clamps a critical result to the current face cap', () => {
    const die = createStartingDice()[0]
    die.faces[0].value = 4
    const result = chaosForge(die, () => 0, {
      criticalChance: 1,
      faceCap: 5,
    })

    expect(result?.result).toMatchObject({
      amount: 1,
      newValue: 5,
      wasCritical: false,
    })
  })

  it('removes capped faces from the random pool and respects mastery caps', () => {
    const die = createStartingDice()[0]
    die.faces.forEach((face) => {
      face.value = 5
    })

    expect(getChaosEligibleFaces(die)).toHaveLength(0)
    expect(getChaosForgeCost(die)).toBeNull()
    expect(getChaosEligibleFaces(die, 6)).toHaveLength(6)
  })

  it('keeps Precision as an internal compatibility path but prices it above Chaos', () => {
    const die = createStartingDice()[0]
    expect(getPrecisionForgeCost(die.faces[0])).toBe(10)
    expect(precisionForge(die, die.faces[0].id)?.die.faces[0].value).toBe(2)
  })

  it('never includes signature faces in the normal Workshop pool', () => {
    const executioner = createDiceCatalog().find(
      (candidate) => candidate.id === 'attack-die-executioner',
    )!
    const signatureFace = executioner.faces[4]

    expect(signatureFace.signature?.id).toBe('execute')
    expect(getPrecisionForgeCost(signatureFace)).toBeNull()
    expect(getChaosEligibleFaces(executioner)).not.toContain(signatureFace)
  })
})
