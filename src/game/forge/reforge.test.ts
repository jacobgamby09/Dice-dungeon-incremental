import { describe, expect, it } from 'vitest'
import { createDieById } from '../content/dice'
import {
  createEmptyDieForgeRecord,
  getReforgeRefund,
  recordCompletedForge,
  resetDieToCanonical,
} from './reforge'

describe('die Reforge', () => {
  it('tracks actual Soul spend and applied Forge Power separately', () => {
    const record = recordCompletedForge(
      recordCompletedForge(createEmptyDieForgeRecord('attack-die-1'), 5, 2),
      8,
      1,
    )

    expect(record).toEqual({
      dieId: 'attack-die-1',
      soulsSpent: 13,
      forgePowerAdded: 3,
    })
    expect(getReforgeRefund(record, 0.6)).toBe(7)
    expect(getReforgeRefund(record, 0.9)).toBe(11)
    expect(getReforgeRefund(record, 1)).toBe(11)
  })

  it('restores canonical faces including Signature identity', () => {
    const die = createDieById('attack-die-executioner')!
    die.faces[0].value += 9
    die.faces[4].value += 4

    const reset = resetDieToCanonical(die)!
    expect(reset.faces.map((face) => face.value)).toEqual([2, 2, 3, 3, 3, 3])
    expect(reset.faces[4].signature?.id).toBe('execute')
  })
})
