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
    evolution: face.evolution ? { ...face.evolution } : undefined,
    signature: face.signature ? { ...face.signature } : undefined,
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
  bleedValue: number
  drainAttackValue: number
  executeBonus: number
  fortifyArmed: number
  fortifyBonus: number
  momentumArmed: number
  momentumBonus: number
  overflowValue: number
  regrowthValue: number
  secondaryAttackValue: number
  wardValue: number
}

export function addRollEffects(
  totals: RoundTotalsInput,
  pendingMomentum: number,
  result: RollResult,
  isLastRoll: boolean,
  pendingFortify = 0,
  context: RollEffectContext = {},
): {
  totals: RoundTotals
  pendingMomentum: number
  pendingFortify: number
  feedback: RollEffectFeedback
} {
  let nextTotals = addRollToTotals(totals, result)
  let nextMomentum = pendingMomentum
  let nextFortify = pendingFortify
  const feedback: RollEffectFeedback = {
    bleedValue: 0,
    drainAttackValue: 0,
    executeBonus: 0,
    fortifyArmed: 0,
    fortifyBonus: 0,
    momentumArmed: 0,
    momentumBonus: 0,
    overflowValue: 0,
    regrowthValue: 0,
    secondaryAttackValue: 0,
    wardValue: 0,
  }

  if (pendingMomentum > 0) {
    nextTotals = {
      ...nextTotals,
      [result.type]: nextTotals[result.type] + pendingMomentum,
    }
    feedback.momentumBonus += pendingMomentum
    nextMomentum = 0
  }

  if (pendingFortify > 0 && result.type === 'shield') {
    nextTotals = {
      ...nextTotals,
      shield: nextTotals.shield + pendingFortify,
    }
    feedback.fortifyBonus += pendingFortify
    nextFortify = 0
  }

  if (result.evolution?.id === 'rend') {
    nextTotals = {
      ...nextTotals,
      bleed: nextTotals.bleed + 2,
    }
    feedback.bleedValue = 2
  }

  if (result.evolution?.id === 'reserve') {
    nextTotals = {
      ...nextTotals,
      ward: nextTotals.ward + 2,
    }
    feedback.wardValue = 2
  }

  if (result.evolution?.id === 'spikes') {
    nextTotals = {
      ...nextTotals,
      attack: nextTotals.attack + 2,
    }
    feedback.secondaryAttackValue = 2
  }

  if (result.evolution?.id === 'regrowth') {
    nextTotals = {
      ...nextTotals,
      regrowth: nextTotals.regrowth + 2,
    }
    feedback.regrowthValue = 2
  }

  if (result.evolution?.id === 'overflow') {
    nextTotals = {
      ...nextTotals,
      overflow: nextTotals.overflow + 2,
    }
    feedback.overflowValue = 2
  }

  const executeActive = result.signature?.id === 'execute'
    && Number.isFinite(context.enemyHp)
    && Number.isFinite(context.enemyMaxHp)
    && (context.enemyHp ?? 0) * 2 <= (context.enemyMaxHp ?? 0)
  if (executeActive) {
    nextTotals = {
      ...nextTotals,
      attack: nextTotals.attack + 2,
    }
    feedback.executeBonus = 2
  }

  if (result.evolution?.id === 'momentum') {
    nextMomentum += 2
    feedback.momentumArmed = 2
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

  if (isLastRoll && nextMomentum > 0) {
    nextTotals = {
      ...nextTotals,
      attack: nextTotals.attack + nextMomentum,
    }
    feedback.momentumBonus += nextMomentum
    feedback.momentumArmed = 0
    nextMomentum = 0
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
    pendingMomentum: nextMomentum,
    pendingFortify: nextFortify,
    feedback,
  }
}

export interface RollContribution {
  bleedValue: number
  drainAttackValue: number
  executeBonus: number
  fortifyArmed: number
  fortifyBonus: number
  momentumArmed: number
  momentumBonus: number
  overflowValue: number
  regrowthValue: number
  result: RollResult
  secondaryAttackValue: number
  totalValue: number
  wardValue: number
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
  let pendingMomentum = 0
  let pendingFortify = 0

  return results.map((result, index) => {
    const beforeTotals = totals
    const isLastRoll = remainingDice === 0 && index === results.length - 1
    const effects = addRollEffects(
      totals,
      pendingMomentum,
      result,
      isLastRoll,
      pendingFortify,
      context,
    )
    totals = effects.totals
    pendingMomentum = effects.pendingMomentum
    pendingFortify = effects.pendingFortify

    return {
      ...effects.feedback,
      result,
      totalValue: totals[result.type] - beforeTotals[result.type],
    }
  })
}
