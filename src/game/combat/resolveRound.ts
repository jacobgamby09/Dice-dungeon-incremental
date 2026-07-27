import type { RoundResolution, RoundTotals } from '../types/combat'

export interface ResolveRoundInput {
  playerHp: number
  playerMaxHp: number
  enemyHp: number
  enemyMaxHp: number
  enemyShield: number
  enemyIntent: RoundTotals
  totals: RoundTotals
  playerRecoil?: number
}

export function resolveRound(input: ResolveRoundInput): RoundResolution {
  const healedPlayerHp = Math.min(input.playerMaxHp, input.playerHp + input.totals.heal)
  const healApplied = healedPlayerHp - input.playerHp

  const attackAbsorbedByEnemyShield = Math.min(input.enemyShield, input.totals.attack)
  const attackDamageToEnemy = Math.min(
    input.enemyHp,
    Math.max(0, input.totals.attack - attackAbsorbedByEnemyShield),
  )
  const enemyShieldAfterPlayerPhase = Math.max(
    0,
    input.enemyShield - attackAbsorbedByEnemyShield,
  )
  const enemyHpAfterPlayerPhase = Math.max(0, input.enemyHp - attackDamageToEnemy)

  const recoil = Math.max(0, input.playerRecoil ?? 0)
  const hpAfterRecoil = Math.max(0, healedPlayerHp - recoil)

  // Player death has priority if a future player effect creates a real Double K.O.
  if (hpAfterRecoil <= 0) {
    return {
      outcome: 'defeat',
      healedPlayerHp,
      playerHpAfterPlayerPhase: 0,
      playerHp: 0,
      enemyHp: enemyHpAfterPlayerPhase,
      enemyHpAfterPlayerPhase,
      enemyShield: enemyShieldAfterPlayerPhase,
      enemyShieldAfterPlayerPhase,
      healApplied,
      enemyHealApplied: 0,
      attackAbsorbedByEnemyShield,
      attackDamageToEnemy,
      enemyActed: false,
      enemyDamageBlocked: 0,
      playerDamageTaken: recoil,
    }
  }

  // A dead enemy never heals or attacks.
  if (enemyHpAfterPlayerPhase <= 0) {
    return {
      outcome: 'victory',
      healedPlayerHp,
      playerHpAfterPlayerPhase: hpAfterRecoil,
      playerHp: hpAfterRecoil,
      enemyHp: 0,
      enemyHpAfterPlayerPhase: 0,
      enemyShield: enemyShieldAfterPlayerPhase,
      enemyShieldAfterPlayerPhase,
      healApplied,
      enemyHealApplied: 0,
      attackAbsorbedByEnemyShield,
      attackDamageToEnemy,
      enemyActed: false,
      enemyDamageBlocked: 0,
      playerDamageTaken: recoil,
    }
  }

  const enemyHp = Math.min(
    input.enemyMaxHp,
    enemyHpAfterPlayerPhase + Math.max(0, input.enemyIntent.heal),
  )
  const enemyHealApplied = enemyHp - enemyHpAfterPlayerPhase
  const incomingDamage = Math.max(0, input.enemyIntent.attack)
  const enemyDamageBlocked = Math.min(input.totals.shield, incomingDamage)
  const unblockedDamage = incomingDamage - enemyDamageBlocked
  const playerHp = Math.max(0, hpAfterRecoil - unblockedDamage)

  return {
    outcome: playerHp <= 0 ? 'defeat' : 'ongoing',
    healedPlayerHp,
    playerHpAfterPlayerPhase: hpAfterRecoil,
    playerHp,
    enemyHp,
    enemyHpAfterPlayerPhase,
    // Enemy shield is temporary and expires after the enemy phase.
    enemyShield: 0,
    enemyShieldAfterPlayerPhase,
    healApplied,
    enemyHealApplied,
    attackAbsorbedByEnemyShield,
    attackDamageToEnemy,
    enemyActed: true,
    enemyDamageBlocked,
    playerDamageTaken: recoil + unblockedDamage,
  }
}
