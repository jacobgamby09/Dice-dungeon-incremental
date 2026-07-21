import type { DieInstance, RollResult } from '../types/dice'
import type { RoundTotals } from '../types/combat'

export function rollDie(die: DieInstance, rng: () => number = Math.random): RollResult {
  const boundedRoll = Math.min(0.999999999, Math.max(0, rng()))
  const faceIndex = Math.floor(boundedRoll * die.faces.length)
  const face = die.faces[faceIndex]
  return {
    dieId: die.id,
    dieName: die.name,
    faceId: face.id,
    faceIndex,
    type: face.type,
    value: face.value,
  }
}

export function addRollToTotals(totals: RoundTotals, result: RollResult): RoundTotals {
  return {
    ...totals,
    [result.type]: totals[result.type] + result.value,
  }
}

