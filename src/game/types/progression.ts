import type { DieInstance } from './dice'
import type { DungeonId, DungeonProgress } from './dungeon'

export const TALENT_TRACKS = ['core', 'survival', 'arsenal', 'control'] as const
export type TalentTrack = (typeof TALENT_TRACKS)[number]

export type TalentEffect =
  | { type: 'max_hp'; amount: number }
  | { type: 'dice_slots'; amount: number }
  | { type: 'grant_die'; dieId: string }
  | { type: 'roll_speed'; multiplier: number }
  | { type: 'unlock_auto_roll' }

export interface TalentDefinition {
  id: string
  name: string
  description: string
  cost: number
  prerequisiteIds: string[]
  track: TalentTrack
  effects: TalentEffect[]
}

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
  dungeonProgress: Record<DungeonId, DungeonProgress>
  diceCollection: DieInstance[]
  equippedDieIds: string[]
  settings: PlayerSettings
}
