import type { EnemyIntent } from './combat'
import type { DieInstance } from './dice'

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
  intentPattern: number[]
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
  intentIndex: number
  intent: EnemyIntent
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
  runSouls: number
  bankedSouls: number
  dungeonComplete: boolean
}

export type RunStatus = 'inactive' | 'active' | 'victory' | 'defeat'

export interface RunState {
  status: RunStatus
  dungeonId: DungeonId | null
  encounterIndex: number
  runSouls: number
  playerHp: number
  playerMaxHp: number
  equippedDiceSnapshot: DieInstance[]
  enemy: EnemyState | null
  lastReward: EncounterReward | null
}
