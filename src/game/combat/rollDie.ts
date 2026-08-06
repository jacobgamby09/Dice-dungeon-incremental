import type { DieInstance, RollResult } from '../types/dice'
import { EMPTY_TOTALS, normalizeRoundTotals } from '../types/combat'
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
  pendingEmpower?: number
  pendingWeaken?: number
}

export interface RollEffectFeedback {
  drainAttackValue: number
  executeBonus: number
  fortifyArmed: number
  fortifyBonus: number
  empowerBonus: number
  weakenPenalty: number
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
  pendingEmpower: number
  pendingWeaken: number
  feedback: RollEffectFeedback
} {
  let nextTotals = addRollToTotals(totals, result)
  let nextFortify = pendingFortify
  let nextEmpower = Math.max(0, context.pendingEmpower ?? 0)
  let nextWeaken = Math.max(0, context.pendingWeaken ?? 0)
  const feedback: RollEffectFeedback = {
    drainAttackValue: 0,
    executeBonus: 0,
    fortifyArmed: 0,
    fortifyBonus: 0,
    empowerBonus: 0,
    weakenPenalty: 0,
  }

  if (result.type === 'empower') {
    nextEmpower += result.value
  }

  if (result.type === 'attack' || result.type === 'shield' || result.type === 'heal') {
    const baseOutput = Math.max(0, result.value + (result.charmBonus ?? 0))
    if (nextEmpower > 0) {
      const bonus = Math.ceil(baseOutput * 0.25)
      nextTotals = { ...nextTotals, [result.type]: nextTotals[result.type] + bonus }
      feedback.empowerBonus = bonus
      nextEmpower -= 1
    }
    if (nextWeaken > 0) {
      const penalty = Math.floor(baseOutput * 0.25)
      nextTotals = {
        ...nextTotals,
        [result.type]: Math.max(0, nextTotals[result.type] - penalty),
      }
      feedback.weakenPenalty = penalty
      nextWeaken -= 1
    }
  }

  if (result.appliedPoison) {
    nextTotals = { ...nextTotals, poison: nextTotals.poison + result.appliedPoison }
  }
  if (result.appliedCleanse) {
    nextTotals = { ...nextTotals, cleanse: nextTotals.cleanse + result.appliedCleanse }
  }
  if (result.poisonBurst) {
    nextTotals = { ...nextTotals, poisonBurst: nextTotals.poisonBurst + result.poisonBurst }
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
    pendingEmpower: nextEmpower,
    pendingWeaken: nextWeaken,
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
  let totals: RoundTotals = { ...EMPTY_TOTALS }
  let pendingFortify = 0
  let pendingEmpower = 0
  let pendingWeaken = 0

  return results.map((result, index) => {
    const beforeTotals = totals
    const isLastRoll = remainingDice === 0 && index === results.length - 1
    const effects = addRollEffects(
      totals,
      result,
      isLastRoll,
      pendingFortify,
      { ...context, pendingEmpower, pendingWeaken },
    )
    totals = effects.totals
    pendingFortify = effects.pendingFortify
    pendingEmpower = effects.pendingEmpower
    pendingWeaken = effects.pendingWeaken

    return {
      ...effects.feedback,
      result,
      totalValue: totals[result.type] - beforeTotals[result.type],
    }
  })
}
