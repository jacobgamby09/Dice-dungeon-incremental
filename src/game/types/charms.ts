import type { FaceType } from './dice'

export const CHARM_IDS = [
  'blade-rhythm',
  'echo-knot',
  'low-omen',
  'ward-clock',
  'bloodroot',
  'soul-prism',
] as const

export type CharmId = (typeof CHARM_IDS)[number]
export type CharmRanks = Partial<Record<CharmId, number>>

export type CharmEffect =
  | { type: 'attack_rhythm'; threshold: number; bonus: number }
  | { type: 'matching_roll'; bonus: number }
  | { type: 'low_omen'; threshold: number; bonus: number }
  | { type: 'round_shield'; threshold: number; amount: number }
  | { type: 'kill_heal'; threshold: number; amount: number }
  | { type: 'soul_echo'; threshold: number }

export interface CharmRankDefinition {
  description: string
  effect: CharmEffect
}

export interface CharmDefinition {
  id: CharmId
  name: string
  flavor: string
  assetPath: string
  accent: string
  ranks: [CharmRankDefinition, CharmRankDefinition, CharmRankDefinition]
}

export interface CharmSnapshot {
  id: CharmId
  rank: number
}

export interface CharmTrigger {
  charmId: CharmId
  charmName: string
  kind: 'roll_bonus' | 'shield' | 'heal' | 'souls'
  amount: number
  targetType?: FaceType
}

export interface CharmRunState {
  attackRolls: number
  lowRolls: number
  pendingLowOmenBonus: number
  previousRollValue: number | null
  roundsStarted: number
  enemiesDefeated: number
}

export interface PendingFateDraw {
  operationId: string
  selectedCharmId: CharmId
  cost: number
}

export type FateRewardTier = 'normal' | 'elite' | 'boss'

export interface FateDropResult {
  tokens: number
  nextPity: number
  pityTriggered: boolean
}
