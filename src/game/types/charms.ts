import type { FaceType } from './dice'
import type { DungeonId } from './dungeon'

export const CHARM_IDS = [
  'blade-rhythm',
  'echo-knot',
  'low-omen',
  'ward-clock',
  'bloodroot',
  'soul-prism',
  'crimson-oath',
  'unbroken-wall',
  'third-spark',
  'clean-thread',
  'last-echo',
  'fivefold-crown',
] as const

export const CHARM_RARITIES = ['common', 'rare', 'epic', 'legendary'] as const

export type CharmId = (typeof CHARM_IDS)[number]
export type CharmRarity = (typeof CHARM_RARITIES)[number]
export type CharmRanks = Partial<Record<CharmId, number>>

export type CharmEffect =
  | { type: 'attack_rhythm'; threshold: number; bonus: number }
  | { type: 'echo_chance'; chance: number }
  | { type: 'roll_echo'; threshold: number }
  | { type: 'encounter_shield'; amount: number }
  | { type: 'kill_heal'; threshold: number; amount: number }
  | { type: 'soul_flat'; amount: number }
  | { type: 'attack_oath'; bonus: number }
  | { type: 'shield_carry'; rate: number }
  | { type: 'total_rhythm'; threshold: number; bonus: number }
  | { type: 'status_guard'; amount: number }
  | { type: 'last_echo'; multiplier: number }
  | { type: 'fivefold_output'; bonus: number }

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
  rarity: CharmRarity
  minimumDungeonId?: DungeonId
  ranks: [CharmRankDefinition, CharmRankDefinition, CharmRankDefinition]
}

export interface CharmSnapshot {
  id: CharmId
  rank: number
}

export interface CharmTrigger {
  charmId: CharmId
  charmName: string
  kind: 'roll_bonus' | 'echo' | 'shield' | 'heal' | 'souls' | 'cleanse'
  amount: number
  targetType?: FaceType
}

export interface CharmRunState {
  attackRolls: number
  totalRolls: number
  roundsStarted: number
  encountersStarted: number
  enemiesDefeated: number
  statusGuardsUsed: number
}

export interface CharmRarityProgress {
  epicMisses: number
  legendaryMisses: number
}

export interface PendingFateDraw {
  operationId: string
  selectedCharmId: CharmId
  rarity: CharmRarity
  cost: number
  protectionTriggered?: 'epic' | 'legendary'
}

export type FateRewardTier = 'normal' | 'elite' | 'boss'

export interface FateDropResult {
  tokens: number
  nextPity: number
  pityTriggered: boolean
}
