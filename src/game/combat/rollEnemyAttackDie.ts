import type { EnemyAttackDieDefinition, EnemyAttackRollResult } from '../types/enemyDice'

function createRollResult(
  die: EnemyAttackDieDefinition,
  faceIndex: number,
): EnemyAttackRollResult {
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

export function rollEnemyAttackDie(
  die: EnemyAttackDieDefinition,
  rng: () => number = Math.random,
): EnemyAttackRollResult {
  const boundedRoll = Math.min(0.999999999, Math.max(0, rng()))
  return createRollResult(die, Math.floor(boundedRoll * die.faces.length))
}

export function findEnemyAttackRollByValue(
  die: EnemyAttackDieDefinition,
  value: number,
): EnemyAttackRollResult {
  const exactFaceIndex = die.faces.findIndex((face) => face.value === value)
  if (exactFaceIndex >= 0) return createRollResult(die, exactFaceIndex)

  const closestFaceIndex = die.faces.reduce((closestIndex, face, index) => (
    Math.abs(face.value - value) < Math.abs(die.faces[closestIndex].value - value)
      ? index
      : closestIndex
  ), 0)
  return createRollResult(die, closestFaceIndex)
}
