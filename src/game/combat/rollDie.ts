import type { DieInstance, RollResult } from '../types/dice'
import { normalizeRoundTotals } from '../types/combat'
import type { RoundTotals, RoundTotalsInput } from '../types/combat'

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
    signature: face.signature ? { ...face.signature } : undefined,
    imprint: face.imprint ? { ...face.imprint } : undefined,
  }
}

export function addRollToTotals(totals: RoundTotalsInput, result: RollResult): RoundTotals {
  const normalizedTotals = normalizeRoundTotals(totals)
  return {
    ...normalizedTotals,
    [result.type]: normalizedTotals[result.type] + result.value + (result.charmBonus ?? 0),
  }
}

export interface RollEffectContext {
  enemyHp?: number
  enemyMaxHp?: number
}

export interface RollEffectFeedback {
  drainAttackValue: number
  executeBonus: number
  fortifyArmed: number
  fortifyBonus: number
}

export function addRollEffects(
  totals: RoundTotalsInput,
  result: RollResult,
  isLastRoll: boolean,
  pendingFortify = 0,
  context: RollEffectContext = {},
): {
  totals: RoundTotals
  pendingFortify: number
  feedback: RollEffectFeedback
} {
  let nextTotals = addRollToTotals(totals, result)
  let nextFortify = pendingFortify
  const feedback: RollEffectFeedback = {
    drainAttackValue: 0,
    executeBonus: 0,
    fortifyArmed: 0,
    fortifyBonus: 0,
  }

  if (pendingFortify > 0 && result.type === 'shield') {
    nextTotals = {
      ...nextTotals,
      shield: nextTotals.shield + pendingFortify,
    }
    feedback.fortifyBonus += pendingFortify
    nextFortify = 0
  }


  const executeActive = result.signature?.id === 'execute'
    && Number.isFinite(context.enemyHp)
    && Number.isFinite(context.enemyMaxHp)
    && (context.enemyHp ?? 0) * 2 <= (context.enemyMaxHp ?? 0)
  if (executeActive) {
    nextTotals = {
      ...nextTotals,
      attack: nextTotals.attack + 3,
    }
    feedback.executeBonus = 3
  }

  if (result.signature?.id === 'fortify') {
    nextFortify += 2
    feedback.fortifyArmed = 2
  }

  if (result.signature?.id === 'drain') {
    nextTotals = {
      ...nextTotals,
      attack: nextTotals.attack + 2,
    }
    feedback.drainAttackValue = 2
  }

  if (isLastRoll && nextFortify > 0) {
    nextTotals = {
      ...nextTotals,
      shield: nextTotals.shield + nextFortify,
    }
    feedback.fortifyBonus += nextFortify
    feedback.fortifyArmed = 0
    nextFortify = 0
  }

  return {
    totals: nextTotals,
    pendingFortify: nextFortify,
    feedback,
  }
}

export interface RollContribution {
  drainAttackValue: number
  executeBonus: number
  fortifyArmed: number
  fortifyBonus: number
  result: RollResult
  totalValue: number
}

export function getRollContributions(
  results: readonly RollResult[],
  remainingDice: number,
  context: RollEffectContext = {},
): RollContribution[] {
  let totals: RoundTotals = {
    attack: 0,
    shield: 0,
    heal: 0,
    bleed: 0,
    ward: 0,
    regrowth: 0,
    overflow: 0,
  }
  let pendingFortify = 0

  return results.map((result, index) => {
    const beforeTotals = totals
    const isLastRoll = remainingDice === 0 && index === results.length - 1
    const effects = addRollEffects(
      totals,
      result,
      isLastRoll,
      pendingFortify,
      context,
    )
    totals = effects.totals
    pendingFortify = effects.pendingFortify

    return {
      ...effects.feedback,
      result,
      totalValue: totals[result.type] - beforeTotals[result.type],
    }
  })
}
