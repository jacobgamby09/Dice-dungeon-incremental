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

export interface RollContribution {
  bleedValue: number
  momentumArmed: number
  momentumBonus: number
  result: RollResult
  totalValue: number
}

export function getRollContributions(
  results: readonly RollResult[],
  remainingDice: number,
): RollContribution[] {
  let totals: RoundTotals = {
    attack: 0,
    shield: 0,
    heal: 0,
    bleed: 0,
  }
  let pendingMomentum = 0

  return results.map((result, index) => {
    const beforeTotals = totals
    const appliedMomentum = pendingMomentum
    const isLastRoll = remainingDice === 0 && index === results.length - 1
    const effects = addRollEffects(
      totals,
      pendingMomentum,
      result,
      isLastRoll,
    )
    totals = effects.totals
    pendingMomentum = effects.pendingMomentum

    return {
      bleedValue: totals.bleed - beforeTotals.bleed,
      momentumArmed: result.evolution?.id === 'momentum'
        ? effects.pendingMomentum
        : 0,
      momentumBonus: appliedMomentum
        + (result.evolution?.id === 'momentum' && isLastRoll ? 2 : 0),
      result,
      totalValue: totals[result.type] - beforeTotals[result.type],
    }
  })
}
