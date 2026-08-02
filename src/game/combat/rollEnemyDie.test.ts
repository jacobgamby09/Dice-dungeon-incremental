import { describe, expect, it } from 'vitest'
import { getEnemyDie } from '../content/enemyDice'
import { createEnemyState, rollNextEnemyIntent } from '../content/enemies'
import { findEnemyRollByValue, rollEnemyDie, totalEnemyRolls } from './rollEnemyDie'

describe('enemy dice', () => {
  it('precommits the stable face selected by the random source', () => {
    const die = getEnemyDie('slime-l1-attack')
    const result = rollEnemyDie(die, () => 0.999)

    expect(result).toMatchObject({
      dieId: 'slime-l1-attack',
      faceId: 'slime-l1-attack-face-6',
      type: 'attack',
      value: 2,
    })
  })

  it('maps a legacy numeric intent to the nearest stable canonical face', () => {
    const die = getEnemyDie('demon-attack')
    const result = findEnemyRollByValue(die, 9)

    expect(result.faceId).toBe('demon-attack-face-4')
    expect(result.value).toBe(8)
  })

  it('aggregates mixed attack, shield and heal results', () => {
    const results = [
      rollEnemyDie(getEnemyDie('spiked-behemoth-attack'), () => 0),
      rollEnemyDie(getEnemyDie('spiked-behemoth-shield'), () => 0),
      rollEnemyDie(getEnemyDie('spiked-behemoth-heal'), () => 0.999),
    ]

    expect(totalEnemyRolls(results)).toMatchObject({ attack: 8, shield: 3, heal: 3, bleed: 0 })
  })

  it('replaces temporary enemy Shield with the next round roll instead of stacking it', () => {
    const shielded = createEnemyState('descent-2-shieldbearer-l1', () => 0.999)
    const nextRound = rollNextEnemyIntent(shielded, () => 0)

    expect(shielded.shield).toBe(2)
    expect(nextRound.shield).toBe(0)
  })
})
