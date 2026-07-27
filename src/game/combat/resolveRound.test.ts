import { describe, expect, it } from 'vitest'
import { resolveRound } from './resolveRound'

describe('resolveRound', () => {
  it('heals, attacks, blocks and applies remaining enemy damage', () => {
    const result = resolveRound({
      playerHp: 6,
      playerMaxHp: 10,
      enemyHp: 12,
      enemyMaxHp: 12,
      enemyShield: 0,
      enemyIntent: { attack: 6, shield: 0, heal: 0 },
      totals: { attack: 5, shield: 2, heal: 1 },
    })

    expect(result.outcome).toBe('ongoing')
    expect(result.playerHp).toBe(3)
    expect(result.enemyHp).toBe(7)
    expect(result.healApplied).toBe(1)
    expect(result.playerHpAfterPlayerPhase).toBe(7)
    expect(result.enemyDamageBlocked).toBe(2)
    expect(result.playerDamageTaken).toBe(4)
  })

  it('caps player healing at max HP', () => {
    const result = resolveRound({
      playerHp: 9,
      playerMaxHp: 10,
      enemyHp: 20,
      enemyMaxHp: 20,
      enemyShield: 0,
      enemyIntent: { attack: 0, shield: 0, heal: 0 },
      totals: { attack: 1, shield: 0, heal: 5 },
    })

    expect(result.healedPlayerHp).toBe(10)
    expect(result.healApplied).toBe(1)
  })

  it('does not let a dead enemy heal or attack', () => {
    const result = resolveRound({
      playerHp: 2,
      playerMaxHp: 10,
      enemyHp: 5,
      enemyMaxHp: 20,
      enemyShield: 0,
      enemyIntent: { attack: 99, shield: 0, heal: 10 },
      totals: { attack: 5, shield: 0, heal: 0 },
    })

    expect(result.outcome).toBe('victory')
    expect(result.enemyActed).toBe(false)
    expect(result.enemyHealApplied).toBe(0)
    expect(result.enemyHp).toBe(0)
    expect(result.playerHp).toBe(2)
  })

  it('lets temporary enemy shield absorb attack and expire after the enemy phase', () => {
    const result = resolveRound({
      playerHp: 10,
      playerMaxHp: 10,
      enemyHp: 10,
      enemyMaxHp: 10,
      enemyShield: 3,
      enemyIntent: { attack: 0, shield: 3, heal: 0 },
      totals: { attack: 5, shield: 0, heal: 0 },
    })

    expect(result.attackAbsorbedByEnemyShield).toBe(3)
    expect(result.enemyShieldAfterPlayerPhase).toBe(0)
    expect(result.enemyShield).toBe(0)
    expect(result.enemyHp).toBe(8)
  })

  it('heals a surviving enemy before its attack and caps at max HP', () => {
    const result = resolveRound({
      playerHp: 10,
      playerMaxHp: 10,
      enemyHp: 8,
      enemyMaxHp: 10,
      enemyShield: 0,
      enemyIntent: { attack: 2, shield: 0, heal: 5 },
      totals: { attack: 1, shield: 0, heal: 0 },
    })

    expect(result.enemyHpAfterPlayerPhase).toBe(7)
    expect(result.enemyHealApplied).toBe(3)
    expect(result.enemyHp).toBe(10)
    expect(result.playerHp).toBe(8)
  })

  it('prioritizes player death on a real recoil Double K.O.', () => {
    const result = resolveRound({
      playerHp: 2,
      playerMaxHp: 10,
      enemyHp: 2,
      enemyMaxHp: 2,
      enemyShield: 0,
      enemyIntent: { attack: 10, shield: 0, heal: 0 },
      totals: { attack: 2, shield: 0, heal: 0 },
      playerRecoil: 2,
    })

    expect(result.enemyHp).toBe(0)
    expect(result.playerHp).toBe(0)
    expect(result.outcome).toBe('defeat')
    expect(result.enemyActed).toBe(false)
  })
})
