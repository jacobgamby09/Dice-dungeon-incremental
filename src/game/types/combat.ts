import type { RollResult } from './dice'
import type { CharmTrigger } from './charms'

export interface RoundTotals {
  attack: number
  shield: number
  heal: number
  poison: number
  empower: number
  weaken: number
  cleanse: number
  poisonBurst: number
  bleed: number
  ward: number
  regrowth: number
  overflow: number
}

export type RoundTotalsInput = Pick<
  RoundTotals,
  'attack' | 'shield' | 'heal' | 'bleed'
>
  & Partial<Pick<RoundTotals, 'ward' | 'regrowth' | 'overflow'>>
  & Partial<Pick<RoundTotals, 'poison' | 'empower' | 'weaken' | 'cleanse' | 'poisonBurst'>>

export type CombatOutcome = 'ongoing' | 'victory' | 'defeat'
export type CombatPhase =
  | 'revealing_enemy_intent'
  | 'awaiting_roll'
  | 'awaiting_resolve'
  | 'resolving'
  | 'victory'
  | 'defeat'
export type ResolutionStep = 'player' | 'enemy_heal' | 'enemy_attack' | null

export interface RoundResolution {
  outcome: CombatOutcome
  healedPlayerHp: number
  playerHpAfterPlayerPhase: number
  playerHp: number
  enemyHp: number
  enemyHpAfterPlayerPhase: number
  enemyShield: number
  enemyShieldAfterPlayerPhase: number
  enemyBleed: number
  healApplied: number
  overflowShield: number
  nextRoundShield: number
  nextRoundHeal: number
  bleedDamageToEnemy: number
  enemyHealApplied: number
  attackAbsorbedByEnemyShield: number
  attackDamageToEnemy: number
  enemyActed: boolean
  enemyDamageBlocked: number
  playerDamageTaken: number
  playerPoisonDamage: number
  enemyPoisonDamage: number
  enemyPoison: number
  nextPlayerPoison: number
  nextPlayerWeaken: number
  nextPlayerEmpower: number
}

export interface CombatState {
  phase: CombatPhase
  roundNumber: number
  drawPileDieIds: string[]
  results: RollResult[]
  totals: RoundTotals
  pendingFortify: number
  pendingEmpower: number
  pendingWeaken: number
  playerPoison: number
  pendingImprintRelay: number
  lastCharmTriggers: CharmTrigger[]
  charmTriggerVersion: number
  carriedShield: number
  carriedHeal: number
  lastResolution: RoundResolution | null
  resolutionVersion: number
  resolutionStep: ResolutionStep
}

export const EMPTY_TOTALS: RoundTotals = {
  attack: 0,
  shield: 0,
  heal: 0,
  poison: 0,
  empower: 0,
  weaken: 0,
  cleanse: 0,
  poisonBurst: 0,
  bleed: 0,
  ward: 0,
  regrowth: 0,
  overflow: 0,
}

export function normalizeRoundTotals(totals: RoundTotalsInput): RoundTotals {
  return {
    attack: totals.attack,
    shield: totals.shield,
    heal: totals.heal,
    poison: totals.poison ?? 0,
    empower: totals.empower ?? 0,
    weaken: totals.weaken ?? 0,
    cleanse: totals.cleanse ?? 0,
    poisonBurst: totals.poisonBurst ?? 0,
    bleed: totals.bleed,
    ward: totals.ward ?? 0,
    regrowth: totals.regrowth ?? 0,
    overflow: totals.overflow ?? 0,
  }
}
