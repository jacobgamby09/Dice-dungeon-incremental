import { describe, expect, it } from 'vitest'
import { createDiceCatalog, createStartingDice } from '../content/dice'
import { createWorkshopDieFaces } from '../content/workshopDie'
import {
  completeWorkshopForge,
  getChaosEligibleFaces,
  getChaosForgeCost,
  getDieUpgradeCount,
  getPrecisionForgeCost,
  precisionForge,
  prepareWorkshopForge,
} from './forge'

describe('Classic V2 Workshop Forge', () => {
  it('starts with a one-Soul upgrade and scales every three applied points', () => {
    const die = createStartingDice()[0]
    expect(getChaosForgeCost(die)).toBe(1)

    let forged = die
    for (let index = 0; index < 3; index += 1) {
      const pending = prepareWorkshopForge(
        forged,
        `operation-${index}`,
        createWorkshopDieFaces(),
        () => 0,
      )!
      forged = completeWorkshopForge(forged, pending)!.die
    }

    expect(getDieUpgradeCount(forged)).toBe(3)
    expect(getChaosForgeCost(forged)).toBe(2)
  })

  it('locks one stable target face and a separate Workshop Die face', () => {
    const die = createStartingDice()[0]
    const rolls = [0.99, 0.99]
    const pending = prepareWorkshopForge(
      die,
      'operation-six',
      createWorkshopDieFaces(),
      () => rolls.shift() ?? 0,
    )

    expect(pending).toMatchObject({
      operationId: 'operation-six',
      dieId: die.id,
      targetFaceId: die.faces[5].id,
      workshopFaceId: 'workshop-die-face-6',
      rolledAmount: 2,
      appliedAmount: 2,
      previousValue: 1,
      cost: 1,
    })

    const result = completeWorkshopForge(die, pending!)
    expect(result?.result).toMatchObject({
      amount: 2,
      rolledAmount: 2,
      faceId: die.faces[5].id,
      newValue: 3,
      previousValue: 1,
      isJackpot: true,
    })
    expect(result?.die.faces.map((face) => face.value)).toEqual([1, 1, 1, 1, 1, 3])
  })

  it('caps the visible Workshop result to the selected face headroom', () => {
    const die = createStartingDice()[0]
    die.faces[0].value = 4
    const rolls = [0, 0.99]
    const pending = prepareWorkshopForge(
      die,
      'operation-cap',
      createWorkshopDieFaces(),
      () => rolls.shift() ?? 0,
      { faceCap: 5 },
    )

    expect(pending).toMatchObject({
      rolledAmount: 2,
      appliedAmount: 1,
    })
    expect(completeWorkshopForge(die, pending!, 5)?.result).toMatchObject({
      amount: 1,
      rolledAmount: 2,
      newValue: 5,
      isJackpot: false,
    })
  })

  it('rejects completion when the target changed after the result was locked', () => {
    const die = createStartingDice()[0]
    const pending = prepareWorkshopForge(
      die,
      'operation-stale',
      createWorkshopDieFaces(),
      () => 0,
    )!
    die.faces[0].value = 2

    expect(completeWorkshopForge(die, pending)).toBeNull()
  })

  it('removes capped faces from the target pool and respects mastery caps', () => {
    const die = createStartingDice()[0]
    die.faces.forEach((face) => {
      face.value = 5
    })

    expect(getChaosEligibleFaces(die)).toHaveLength(0)
    expect(getChaosForgeCost(die)).toBeNull()
    expect(getChaosEligibleFaces(die, 6)).toHaveLength(6)
  })

  it('keeps Precision as an internal compatibility path but prices it above Workshop', () => {
    const die = createStartingDice()[0]
    expect(getPrecisionForgeCost(die.faces[0])).toBe(2)
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
