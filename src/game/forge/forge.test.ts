import { describe, expect, it } from 'vitest'
import { createDiceCatalog, createStartingDice } from '../content/dice'
import {
  chaosForge,
  evolveAttackFace,
  evolveFaceOnDie,
  getChaosForgeCost,
  getPrecisionForgeCost,
  precisionForge,
} from './forge'

describe('controlled Soul Forge', () => {
  it('prices Chaos below Precision while several random faces remain', () => {
    const die = createStartingDice()[0]
    expect(getChaosForgeCost(die)).toBe(7)
    expect(getPrecisionForgeCost(die.faces[0])).toBe(10)
  })

  it('precommits one eligible random face and changes no other face', () => {
    const die = createStartingDice()[0]
    const result = chaosForge(die, () => 0)

    expect(result?.result).toMatchObject({
      dieId: die.id,
      faceId: die.faces[0].id,
      cost: 7,
      becameEvolutionReady: false,
    })
    expect(result?.die.faces.map((face) => face.value)).toEqual([2, 1, 2, 2, 2, 3])
  })

  it('makes an Attack face evolution-ready instead of flattening past three', () => {
    const die = createStartingDice()[0]
    const result = precisionForge(die, die.faces[5].id)

    expect(result?.result.cost).toBe(80)
    expect(result?.result.becameEvolutionReady).toBe(true)
    expect(result?.die.faces[5]).toMatchObject({
      value: 3,
      evolutionReady: true,
    })
  })

  it.each([
    ['power', 5],
    ['momentum', 3],
    ['rend', 2],
  ] as const)('evolves an awakened face into permanent %s identity', (evolutionId, value) => {
    const die = createStartingDice()[0]
    const awakened = precisionForge(die, die.faces[5].id)!.die
    const evolved = evolveAttackFace(awakened, die.faces[5].id, evolutionId)

    expect(evolved?.faces[5]).toMatchObject({
      value,
      evolutionReady: undefined,
      evolution: { id: evolutionId },
    })
  })

  it.each([
    ['shield-die-1', 'reserve', 3],
    ['heal-die-1', 'overflow', 3],
  ] as const)('awakens and evolves normal %s family faces', (dieId, evolutionId, value) => {
    const die = createDiceCatalog().find((candidate) => candidate.id === dieId)!
    const face = {
      ...die.faces[0],
      value: 3,
    }
    const prepared = {
      ...die,
      faces: die.faces.map((candidate, index) => (index === 0 ? face : candidate)) as typeof die.faces,
    }
    const awakened = precisionForge(prepared, face.id)!.die
    const evolved = evolveFaceOnDie(awakened, face.id, evolutionId)

    expect(evolved?.faces[0]).toMatchObject({
      value,
      evolution: { id: evolutionId },
    })
  })

  it('keeps signature faces out of both Forge methods', () => {
    const executioner = createDiceCatalog().find(
      (candidate) => candidate.id === 'attack-die-executioner',
    )!
    const signatureFace = executioner.faces[4]

    expect(signatureFace.signature?.id).toBe('execute')
    expect(getPrecisionForgeCost(signatureFace)).toBeNull()
    expect(precisionForge(executioner, signatureFace.id)).toBeNull()
  })
})
