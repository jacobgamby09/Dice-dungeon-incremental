import type { RoundTotals } from '../types/combat'
import { EMPTY_TOTALS } from '../types/combat'
import type { EnemyDieDefinition, EnemyRollResult } from '../types/enemyDice'

function createRollResult(
  die: EnemyDieDefinition,
  faceIndex: number,
): EnemyRollResult {
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

export function rollEnemyDie(
  die: EnemyDieDefinition,
  rng: () => number = Math.random,
): EnemyRollResult {
  const boundedRoll = Math.min(0.999999999, Math.max(0, rng()))
  return createRollResult(die, Math.floor(boundedRoll * die.faces.length))
}

export function findEnemyRollByValue(
  die: EnemyDieDefinition,
  value: number,
): EnemyRollResult {
  const exactFaceIndex = die.faces.findIndex((face) => face.value === value)
  if (exactFaceIndex >= 0) return createRollResult(die, exactFaceIndex)

  const closestFaceIndex = die.faces.reduce((closestIndex, face, index) => (
    Math.abs(face.value - value) < Math.abs(die.faces[closestIndex].value - value)
      ? index
      : closestIndex
  ), 0)
  return createRollResult(die, closestFaceIndex)
}

export function totalEnemyRolls(
  rolls: readonly EnemyRollResult[],
): RoundTotals {
  let pendingEmpower = 0
  return rolls.reduce<RoundTotals>((totals, roll) => {
    if (roll.type === 'empower') {
      pendingEmpower += roll.value
      return { ...totals, empower: totals.empower + roll.value }
    }

    const isPrimary = roll.type === 'attack' || roll.type === 'shield' || roll.type === 'heal'
    const empowerBonus = isPrimary && pendingEmpower > 0
      ? Math.ceil(roll.value * 0.25)
      : 0
    if (isPrimary && pendingEmpower > 0) pendingEmpower -= 1
    return {
      ...totals,
      [roll.type]: totals[roll.type] + roll.value + empowerBonus,
    }
  }, { ...EMPTY_TOTALS })
}
