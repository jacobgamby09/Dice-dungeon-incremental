import type { DieInstance } from './dice'
import type { DungeonId } from './dungeon'

export interface PlayerSettings {
  rollSpeed: number
  autoRoll: boolean
  autoResolve: boolean
}

export interface PlayerProfile {
  saveVersion: number
  xp: number
  bankedSouls: number
  unlockedTalentIds: string[]
  unlockedDungeonIds: DungeonId[]
  diceCollection: DieInstance[]
  equippedDieIds: string[]
  settings: PlayerSettings
}

