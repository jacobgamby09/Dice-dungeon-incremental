import type { RollResult } from './dice'

export interface EnemyIntent {
  type: 'attack'
  value: number
}

export interface RoundTotals {
  attack: number
  shield: number
  heal: number
}

export type CombatOutcome = 'ongoing' | 'victory' | 'defeat'
export type CombatPhase = 'awaiting_roll' | 'awaiting_resolve' | 'resolving' | 'victory' | 'defeat'

export interface RoundResolution {
  outcome: CombatOutcome
  healedPlayerHp: number
  playerHp: number
  enemyHp: number
  enemyShield: number
  healApplied: number
  attackAbsorbedByEnemyShield: number
  attackDamageToEnemy: number
  enemyActed: boolean
  enemyDamageBlocked: number
  playerDamageTaken: number
}

export interface CombatState {
  phase: CombatPhase
  roundNumber: number
  drawPileDieIds: string[]
  results: RollResult[]
  totals: RoundTotals
  lastResolution: RoundResolution | null
  resolutionVersion: number
}

export const EMPTY_TOTALS: RoundTotals = {
  attack: 0,
  shield: 0,
  heal: 0,
}
