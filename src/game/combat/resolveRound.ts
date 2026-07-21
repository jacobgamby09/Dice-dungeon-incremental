import type { EnemyIntent, RoundResolution, RoundTotals } from '../types/combat'

export interface ResolveRoundInput {
  playerHp: number
  playerMaxHp: number
  enemyHp: number
  enemyShield: number
  enemyIntent: EnemyIntent
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
  const enemyShield = Math.max(0, input.enemyShield - attackAbsorbedByEnemyShield)
  const enemyHp = Math.max(0, input.enemyHp - attackDamageToEnemy)

  const recoil = Math.max(0, input.playerRecoil ?? 0)
  const hpAfterRecoil = Math.max(0, healedPlayerHp - recoil)

  // Player death has priority if a future player effect creates a real Double K.O.
  if (hpAfterRecoil <= 0) {
    return {
      outcome: 'defeat',
      healedPlayerHp,
      playerHpAfterPlayerPhase: 0,
      playerHp: 0,
      enemyHp,
      enemyShield,
      healApplied,
      attackAbsorbedByEnemyShield,
      attackDamageToEnemy,
      enemyActed: false,
      enemyDamageBlocked: 0,
      playerDamageTaken: recoil,
    }
  }

  // A dead enemy never executes its intent.
  if (enemyHp <= 0) {
    return {
      outcome: 'victory',
      healedPlayerHp,
      playerHpAfterPlayerPhase: hpAfterRecoil,
      playerHp: hpAfterRecoil,
      enemyHp: 0,
      enemyShield,
      healApplied,
      attackAbsorbedByEnemyShield,
      attackDamageToEnemy,
      enemyActed: false,
      enemyDamageBlocked: 0,
      playerDamageTaken: recoil,
    }
  }

  const incomingDamage = input.enemyIntent.type === 'attack' ? input.enemyIntent.value : 0
  const enemyDamageBlocked = Math.min(input.totals.shield, incomingDamage)
  const unblockedDamage = incomingDamage - enemyDamageBlocked
  const playerHp = Math.max(0, hpAfterRecoil - unblockedDamage)

  return {
    outcome: playerHp <= 0 ? 'defeat' : 'ongoing',
    healedPlayerHp,
    playerHpAfterPlayerPhase: hpAfterRecoil,
    playerHp,
    enemyHp,
    enemyShield,
    healApplied,
    attackAbsorbedByEnemyShield,
    attackDamageToEnemy,
    enemyActed: true,
    enemyDamageBlocked,
    playerDamageTaken: recoil + unblockedDamage,
  }
}
