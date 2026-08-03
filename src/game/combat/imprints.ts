import type { RollResult } from '../types/dice'

export interface ImprintRollResolution {
  result: RollResult
  nextRelayBonus: number
}

export function applyImprintRoll(
  result: RollResult,
  priorRollCount: number,
  pendingRelayMultiplier: number,
): ImprintRollResolution {
  const relayBonus = Math.ceil(result.value * Math.max(0, pendingRelayMultiplier))
  let value = result.value + relayBonus
  let localBonus = 0
  let nextRelayBonus = 0
  const effect = result.imprint?.effectKind

  if (effect === 'opener' && priorRollCount === 0) {
    localBonus = Math.ceil(result.value * 0.5)
  }
  if (effect === 'crescendo') {
    const multiplier = Math.min(1, Math.max(0, priorRollCount) * 0.25)
    localBonus = Math.ceil(result.value * multiplier)
  }
  if (effect === 'relay') nextRelayBonus = 0.5
  value += localBonus

  return {
    result: {
      ...result,
      value,
      imprintBonus: localBonus + relayBonus,
    },
    nextRelayBonus,
  }
}
