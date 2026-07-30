import type { DieInstance } from './dice'
import type { SoulDieRollResult } from './dice'
import type { EnemyDieId, EnemyRollResult } from './enemyDice'
import type {
  CharmRunState,
  CharmSnapshot,
  CharmTrigger,
  FateRewardTier,
} from './charms'

export type EnemyId =
  | 'slime'
  | 'slime-crawler'
  | 'marrow-bat'
  | 'goblin'
  | 'shieldbearer'
  | 'cultist'
  | 'skeleton'
  | 'orc'
  | 'blood-orc'
  | 'demon'
  | 'spiked-behemoth'
export type DungeonId = 'prototype-depths' | 'iron-depths'
export type EncounterId =
  | 'descent-1-slime-l1'
  | 'descent-1-slime-crawler-l1'
  | 'descent-1-goblin-l1'
  | 'descent-1-skeleton-l1'
  | 'descent-1-slime-l2'
  | 'descent-1-slime-crawler-l2'
  | 'descent-1-goblin-l2'
  | 'descent-1-skeleton-l2'
  | 'descent-1-skeleton-elite'
  | 'descent-1-demon'
  | 'descent-2-shieldbearer-l1'
  | 'descent-2-cultist-l1'
  | 'descent-2-orc-l1'
  | 'descent-2-blood-orc-l1'
  | 'descent-2-shieldbearer-l2'
  | 'descent-2-cultist-l2'
  | 'descent-2-orc-l2'
  | 'descent-2-blood-orc-l2'
  | 'descent-2-blood-orc-elite'
  | 'descent-2-spiked-behemoth'

export interface EnemyDefinition {
  id: EnemyId
  name: string
  spriteName: string
}

export interface EncounterDefinition {
  id: EncounterId
  enemyId: EnemyId
  level: number
  maxHp: number
  dieIds: EnemyDieId[]
  xpReward: number
  soulValue: number
  rewardTier?: FateRewardTier
}

export interface EnemyState {
  encounterId: EncounterId
  definitionId: EnemyId
  name: string
  spriteName: string
  level: number
  hp: number
  maxHp: number
  shield: number
  bleed: number
  dieIds: EnemyDieId[]
  intentRolls: EnemyRollResult[]
  xpReward: number
  soulValue: number
  rewardTier: FateRewardTier
  rewardClaimed: boolean
}

export interface DungeonDefinition {
  id: DungeonId
  name: string
  description: string
  floors: DungeonFloorDefinition[]
}

export interface DungeonFloorDefinition {
  floor: number
  encounterId: EncounterId
  isBoss: boolean
}

export interface DungeonProgress {
  highestFloorCleared: number
  clearCount: number
}

export interface EncounterReward {
  enemyName: string
  floor: number
  isBoss: boolean
  xp: number
  souls: number
  baseXp?: number
  baseSouls?: number
  bonusXp?: number
  bonusSouls?: number
  charmBonusSouls?: number
  soulRoll?: SoulDieRollResult
  charmHealing?: number
  charmTriggers?: CharmTrigger[]
  fateTokens?: number
  fatePity?: number
  fatePityTriggered?: boolean
  dungeonComplete: boolean
}

export type RunStatus = 'inactive' | 'active' | 'victory' | 'defeat'

export interface RunStats {
  enemiesDefeated: number
  soulsEarned: number
  xpEarned: number
  baseXpEarned?: number
  baseSoulsEarned?: number
  soulValueEarned?: number
  bonusXpEarned?: number
  bonusSoulsEarned?: number
  charmBonusSoulsEarned?: number
  fateTokensEarned?: number
}

export interface RunState {
  status: RunStatus
  dungeonId: DungeonId | null
  encounterIndex: number
  playerHp: number
  playerMaxHp: number
  runStats: RunStats
  equippedDiceSnapshot: DieInstance[]
  equippedCharmSnapshot: CharmSnapshot[]
  charmState: CharmRunState
  enemy: EnemyState | null
  lastReward: EncounterReward | null
}
