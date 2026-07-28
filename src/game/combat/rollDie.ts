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
    evolution: face.evolution ? { ...face.evolution } : undefined,
  }
}

export function addRollToTotals(totals: RoundTotals, result: RollResult): RoundTotals {
  return {
    ...totals,
    [result.type]: totals[result.type] + result.value,
  }
}

export function addRollEffects(
  totals: RoundTotals,
  pendingMomentum: number,
  result: RollResult,
  isLastRoll: boolean,
): { totals: RoundTotals; pendingMomentum: number } {
  let nextTotals = addRollToTotals(totals, result)
  if (pendingMomentum > 0) {
    nextTotals = {
      ...nextTotals,
      [result.type]: nextTotals[result.type] + pendingMomentum,
    }
  }

  if (result.evolution?.id === 'rend') {
    nextTotals = {
      ...nextTotals,
      bleed: nextTotals.bleed + 2,
    }
  }

  if (result.evolution?.id !== 'momentum') {
    return { totals: nextTotals, pendingMomentum: 0 }
  }

  if (isLastRoll) {
    return {
      totals: {
        ...nextTotals,
        attack: nextTotals.attack + 2,
      },
      pendingMomentum: 0,
    }
  }

  return { totals: nextTotals, pendingMomentum: 2 }
}
