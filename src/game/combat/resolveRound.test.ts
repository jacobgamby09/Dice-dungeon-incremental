import { describe, expect, it } from 'vitest'
import { resolveRound } from './resolveRound'

describe('resolveRound', () => {
  it('heals, attacks, blocks and applies remaining enemy damage', () => {
    const result = resolveRound({
      playerHp: 6,
      playerMaxHp: 10,
      enemyHp: 12,
      enemyShield: 0,
      enemyIntent: { type: 'attack', value: 6 },
      totals: { attack: 5, shield: 2, heal: 1 },
    })

    expect(result.outcome).toBe('ongoing')
    expect(result.playerHp).toBe(3)
    expect(result.enemyHp).toBe(7)
    expect(result.healApplied).toBe(1)
    expect(result.enemyDamageBlocked).toBe(2)
    expect(result.playerDamageTaken).toBe(4)
  })

  it('caps healing at max HP', () => {
    const result = resolveRound({
      playerHp: 9,
      playerMaxHp: 10,
      enemyHp: 20,
      enemyShield: 0,
      enemyIntent: { type: 'attack', value: 0 },
      totals: { attack: 1, shield: 0, heal: 5 },
    })

    expect(result.healedPlayerHp).toBe(10)
    expect(result.healApplied).toBe(1)
  })

  it('does not let a dead enemy act', () => {
    const result = resolveRound({
      playerHp: 2,
      playerMaxHp: 10,
      enemyHp: 5,
      enemyShield: 0,
      enemyIntent: { type: 'attack', value: 99 },
      totals: { attack: 5, shield: 0, heal: 0 },
    })

    expect(result.outcome).toBe('victory')
    expect(result.enemyActed).toBe(false)
    expect(result.playerHp).toBe(2)
  })

  it('lets enemy shield absorb player attack before HP', () => {
    const result = resolveRound({
      playerHp: 10,
      playerMaxHp: 10,
      enemyHp: 10,
      enemyShield: 3,
      enemyIntent: { type: 'attack', value: 0 },
      totals: { attack: 5, shield: 0, heal: 0 },
    })

    expect(result.attackAbsorbedByEnemyShield).toBe(3)
    expect(result.enemyShield).toBe(0)
    expect(result.enemyHp).toBe(8)
  })

  it('prioritizes player death on a real recoil Double K.O.', () => {
    const result = resolveRound({
      playerHp: 2,
      playerMaxHp: 10,
      enemyHp: 2,
      enemyShield: 0,
      enemyIntent: { type: 'attack', value: 10 },
      totals: { attack: 2, shield: 0, heal: 0 },
      playerRecoil: 2,
    })

    expect(result.enemyHp).toBe(0)
    expect(result.playerHp).toBe(0)
    expect(result.outcome).toBe('defeat')
    expect(result.enemyActed).toBe(false)
  })
})

