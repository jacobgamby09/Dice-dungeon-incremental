import { describe, expect, it } from 'vitest'
import { getEnemyAttackDie } from '../content/enemyDice'
import { findEnemyAttackRollByValue, rollEnemyAttackDie } from './rollEnemyAttackDie'

describe('rollEnemyAttackDie', () => {
  it('returns the exact stable face selected by the injected RNG', () => {
    const die = getEnemyAttackDie('slime-attack-die')
    const result = rollEnemyAttackDie(die, () => 0.999)

    expect(result.dieId).toBe('slime-attack-die')
    expect(result.faceId).toBe('slime-attack-die-face-6')
    expect(result.faceIndex).toBe(5)
    expect(result.value).toBe(3)
  })

  it('maps a legacy numeric intent to a stable face without changing its value', () => {
    const die = getEnemyAttackDie('demon-attack-die')
    const result = findEnemyAttackRollByValue(die, 9)

    expect(result.faceId).toBe('demon-attack-die-face-6')
    expect(result.value).toBe(9)
  })
})
