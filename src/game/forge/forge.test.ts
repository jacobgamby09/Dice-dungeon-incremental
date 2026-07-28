import { describe, expect, it } from 'vitest'
import { createStartingDice } from '../content/dice'
import {
  chaosForge,
  evolveAttackFace,
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
})
