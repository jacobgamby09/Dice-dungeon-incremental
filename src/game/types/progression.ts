import type { DieInstance } from './dice'
import type { DungeonId, DungeonProgress } from './dungeon'

export const TALENT_TRACKS = ['core', 'survival', 'arsenal', 'control'] as const
export type TalentTrack = (typeof TALENT_TRACKS)[number]

export const TALENT_ICON_KEYS = [
  'battle-heart',
  'twin-dice',
  'shieldcraft',
  'second-descent',
  'battle-heart-advanced',
  'third-grip',
  'quick-draw',
  'healing-arts',
  'auto-roll',
  'fourth-grip',
  'executioner-die',
  'tower-die',
] as const
export type TalentIconKey = (typeof TALENT_ICON_KEYS)[number]

export type TalentEffect =
  | { type: 'max_hp'; amount: number }
  | { type: 'dice_slots'; amount: number }
  | { type: 'grant_die'; dieId: string }
  | { type: 'roll_speed'; multiplier: number }
  | { type: 'unlock_auto_combat' }
  | { type: 'unlock_dungeon'; dungeonId: DungeonId }

export type TalentRequirement = {
  type: 'dungeon_clear'
  dungeonId: DungeonId
  count: number
}

export interface TalentRankDefinition {
  cost: number
  effects: TalentEffect[]
}

export interface TalentDefinition {
  id: string
  name: string
  description: string
  iconKey: TalentIconKey
  prerequisiteIds: string[]
  requirements?: TalentRequirement[]
  ranks: TalentRankDefinition[]
  track: TalentTrack
}

export type TalentRanks = Record<string, number>

export interface PlayerSettings {
  rollSpeed: number
  autoCombat: boolean
}

export interface PlayerProfile {
  saveVersion: number
  xp: number
  bankedSouls: number
  talentRanks: TalentRanks
  unlockedDungeonIds: DungeonId[]
  dungeonProgress: Record<DungeonId, DungeonProgress>
  diceCollection: DieInstance[]
  equippedDieIds: string[]
  recentForgeOperationIds: string[]
  settings: PlayerSettings
}
