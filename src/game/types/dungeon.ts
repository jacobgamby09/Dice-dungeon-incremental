import type { DieInstance } from './dice'
import type { EnemyAttackDieId, EnemyAttackRollResult } from './enemyDice'

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
export type DungeonId = 'prototype-depths'

export interface EnemyDefinition {
  id: EnemyId
  name: string
  spriteName: string
  maxHp: number
  startingShield: number
  attackDieId: EnemyAttackDieId
  xpReward: number
  soulReward: number
}

export interface EnemyState {
  definitionId: EnemyId
  name: string
  spriteName: string
  hp: number
  maxHp: number
  shield: number
  attackDieId: EnemyAttackDieId
  intentRoll: EnemyAttackRollResult
  xpReward: number
  soulReward: number
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
  enemyId: EnemyId
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
  dungeonComplete: boolean
}

export type RunStatus = 'inactive' | 'active' | 'victory' | 'defeat'

export interface RunStats {
  enemiesDefeated: number
  soulsEarned: number
  xpEarned: number
}

export interface RunState {
  status: RunStatus
  dungeonId: DungeonId | null
  encounterIndex: number
  playerHp: number
  playerMaxHp: number
  runStats: RunStats
  equippedDiceSnapshot: DieInstance[]
  enemy: EnemyState | null
  lastReward: EncounterReward | null
}
