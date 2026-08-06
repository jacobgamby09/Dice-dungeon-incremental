import { normalizeRoundTotals } from '../types/combat'
import type { RoundResolution, RoundTotalsInput } from '../types/combat'

export interface ResolveRoundInput {
  playerHp: number
  playerMaxHp: number
  enemyHp: number
  enemyMaxHp: number
  enemyShield: number
  enemyBleed?: number
  enemyIntent: RoundTotalsInput
  totals: RoundTotalsInput
  playerRecoil?: number
  carriedShield?: number
  carriedHeal?: number
  shieldCarryRate?: number
  playerPoison?: number
  enemyPoison?: number
  remainingPlayerWeaken?: number
  pendingPlayerEmpower?: number
}

export function resolveRound(input: ResolveRoundInput): RoundResolution {
  const totals = normalizeRoundTotals(input.totals)
  const enemyIntent = normalizeRoundTotals(input.enemyIntent)
  const existingPlayerPoison = Math.max(0, input.playerPoison ?? 0)
  const existingEnemyPoison = Math.max(0, input.enemyPoison ?? 0)
  const playerPoisonDamage = Math.min(input.playerHp, existingPlayerPoison)
  const enemyPoisonDamage = Math.min(input.enemyHp, existingEnemyPoison)
  const playerHpAfterPoison = Math.max(0, input.playerHp - playerPoisonDamage)
  const enemyHpAfterPoison = Math.max(0, input.enemyHp - enemyPoisonDamage)
  const decayedPlayerPoison = Math.max(0, existingPlayerPoison - 1)
  const decayedEnemyPoison = Math.max(0, existingEnemyPoison - 1)
  const remainingPlayerWeaken = Math.max(0, input.remainingPlayerWeaken ?? 0)
  const hasDebuffToCleanse = decayedPlayerPoison > 0 || remainingPlayerWeaken > 0
  const cleansedPlayerPoison = Math.max(0, decayedPlayerPoison - totals.cleanse)
  const cleansedPlayerWeaken = Math.max(0, remainingPlayerWeaken - totals.cleanse)
  const cleanseShield = hasDebuffToCleanse ? 0 : totals.cleanse
  const pendingPlayerEmpower = Math.max(0, input.pendingPlayerEmpower ?? 0)
  const carriedHeal = Math.max(0, input.carriedHeal ?? 0)
  const carriedShield = Math.max(0, input.carriedShield ?? 0)
  const totalHealing = totals.heal + carriedHeal
  const healedPlayerHp = Math.min(input.playerMaxHp, playerHpAfterPoison + totalHealing)
  const healApplied = healedPlayerHp - playerHpAfterPoison
  const excessHealing = Math.max(0, playerHpAfterPoison + totalHealing - input.playerMaxHp)
  const overflowShield = Math.min(Math.max(0, totals.overflow), excessHealing)

  const existingBleed = Math.max(0, input.enemyBleed ?? 0)
  const poisonBurstDamage = Math.min(enemyHpAfterPoison, Math.max(0, totals.poisonBurst))
  const enemyHpAfterPoisonBurst = Math.max(0, enemyHpAfterPoison - poisonBurstDamage)
  const bleedDamageToEnemy = Math.min(enemyHpAfterPoisonBurst, existingBleed)
  const enemyHpAfterBleed = Math.max(0, enemyHpAfterPoisonBurst - bleedDamageToEnemy)
  const decayedBleed = Math.max(0, existingBleed - 1)
  const attackAbsorbedByEnemyShield = Math.min(input.enemyShield, totals.attack)
  const attackDamageToEnemy = Math.min(
    enemyHpAfterBleed,
    Math.max(0, totals.attack - attackAbsorbedByEnemyShield),
  )
  const enemyShieldAfterPlayerPhase = Math.max(
    0,
    input.enemyShield - attackAbsorbedByEnemyShield,
  )
  const enemyHpAfterPlayerPhase = Math.max(0, enemyHpAfterBleed - attackDamageToEnemy)
  const enemyBleed = enemyHpAfterPlayerPhase > 0
    ? decayedBleed + Math.max(0, totals.bleed)
    : 0

  const recoil = Math.max(0, input.playerRecoil ?? 0)
  const hpAfterRecoil = Math.max(0, healedPlayerHp - recoil)

  // Poison ticks at round start. Player death keeps priority on a real Double K.O.
  if (playerHpAfterPoison <= 0) {
    return {
      outcome: 'defeat',
      healedPlayerHp: 0,
      playerHpAfterPlayerPhase: 0,
      playerHp: 0,
      enemyHp: enemyHpAfterPoison,
      enemyHpAfterPlayerPhase: enemyHpAfterPoison,
      enemyShield: input.enemyShield,
      enemyShieldAfterPlayerPhase: input.enemyShield,
      enemyBleed: decayedBleed,
      healApplied: 0,
      overflowShield: 0,
      nextRoundShield: 0,
      nextRoundHeal: 0,
      bleedDamageToEnemy: 0,
      enemyHealApplied: 0,
      attackAbsorbedByEnemyShield: 0,
      attackDamageToEnemy: 0,
      enemyActed: false,
      enemyDamageBlocked: 0,
      playerDamageTaken: playerPoisonDamage,
      playerPoisonDamage,
      enemyPoisonDamage,
      enemyPoison: decayedEnemyPoison,
      nextPlayerPoison: 0,
      nextPlayerWeaken: 0,
      nextPlayerEmpower: 0,
    }
  }

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
      enemyBleed,
      healApplied,
      overflowShield,
      nextRoundShield: 0,
      nextRoundHeal: 0,
      bleedDamageToEnemy,
      enemyHealApplied: 0,
      attackAbsorbedByEnemyShield,
      attackDamageToEnemy,
      enemyActed: false,
      enemyDamageBlocked: 0,
      playerDamageTaken: playerPoisonDamage + recoil,
      playerPoisonDamage,
      enemyPoisonDamage,
      enemyPoison: enemyHpAfterPlayerPhase > 0
        ? decayedEnemyPoison + totals.poison
        : 0,
      nextPlayerPoison: 0,
      nextPlayerWeaken: 0,
      nextPlayerEmpower: 0,
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
      enemyBleed: 0,
      healApplied,
      overflowShield,
      nextRoundShield: 0,
      nextRoundHeal: 0,
      bleedDamageToEnemy,
      enemyHealApplied: 0,
      attackAbsorbedByEnemyShield,
      attackDamageToEnemy,
      enemyActed: false,
      enemyDamageBlocked: 0,
      playerDamageTaken: playerPoisonDamage + recoil,
      playerPoisonDamage,
      enemyPoisonDamage,
      enemyPoison: 0,
      nextPlayerPoison: 0,
      nextPlayerWeaken: 0,
      nextPlayerEmpower: 0,
    }
  }

  const enemyHp = Math.min(
    input.enemyMaxHp,
    enemyHpAfterPlayerPhase + Math.max(0, enemyIntent.heal),
  )
  const enemyHealApplied = enemyHp - enemyHpAfterPlayerPhase
  const incomingDamage = Math.max(0, enemyIntent.attack)
  const availableShield = totals.shield + carriedShield + overflowShield + cleanseShield
  const enemyDamageBlocked = Math.min(availableShield, incomingDamage)
  const unblockedDamage = incomingDamage - enemyDamageBlocked
  const playerHp = Math.max(0, hpAfterRecoil - unblockedDamage)
  const unusedShield = Math.max(0, availableShield - incomingDamage)
  const carriedUnusedShield = Math.floor(
    unusedShield * Math.min(1, Math.max(0, input.shieldCarryRate ?? 0)),
  )

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
    enemyBleed,
    healApplied,
    overflowShield,
    nextRoundShield: Math.max(0, totals.ward) + carriedUnusedShield,
    nextRoundHeal: Math.max(0, totals.regrowth),
    bleedDamageToEnemy,
    enemyHealApplied,
    attackAbsorbedByEnemyShield,
    attackDamageToEnemy,
    enemyActed: true,
    enemyDamageBlocked,
    playerDamageTaken: playerPoisonDamage + recoil + unblockedDamage,
    playerPoisonDamage,
    enemyPoisonDamage,
    enemyPoison: decayedEnemyPoison + Math.max(0, totals.poison),
    nextPlayerPoison: cleansedPlayerPoison + Math.max(0, enemyIntent.poison),
    nextPlayerWeaken: cleansedPlayerWeaken + Math.max(0, enemyIntent.weaken),
    nextPlayerEmpower: pendingPlayerEmpower,
  }
}
