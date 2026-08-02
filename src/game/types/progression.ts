import type { DieInstance } from './dice'
import type { SoulDieState, SoulDieValues } from './dice'
import type { DungeonId, DungeonProgress } from './dungeon'
import type { PendingWorkshopForge, WorkshopDieValues } from './workshop'
import type { CharmId, CharmRanks, CharmRarityProgress, PendingFateDraw } from './charms'

export const TALENT_TRACKS = [
  'core',
  'arsenal',
  'workshop',
  'descent',
  'fate',
] as const
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
  'bloodwell-die',
  'volatile-temper',
  'face-mastery',
  'fate-seal',
  'striker-pattern',
  'soul-efficiency',
  'xp-efficiency',
  'workshop-efficiency',
  'charm-pair',
  'charm-trinity',
  'fate-favor',
] as const
export type TalentIconKey = (typeof TALENT_ICON_KEYS)[number]

export type TalentEffect =
  | { type: 'max_hp'; amount: number }
  | { type: 'dice_slots'; amount: number }
  | { type: 'grant_die'; dieId: string }
  | { type: 'roll_speed'; multiplier: number }
  | { type: 'workshop_die_faces'; values: WorkshopDieValues }
  | { type: 'workshop_target_rerolls'; amount: number }
  | { type: 'xp_per_kill'; amount: number }
  | { type: 'soul_die_faces'; values: SoulDieValues }
  | { type: 'workshop_cost_multiplier'; multiplier: number }
  | { type: 'charm_slots'; amount: number }
  | { type: 'unlock_auto_combat' }
  | { type: 'unlock_charms' }
  | { type: 'charm_rarity_protection'; epicThreshold: number; legendaryThreshold?: number }
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
  prerequisiteCount?: number
  availability?: 'available' | 'future'
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
  fateTokens: number
  fatePity: number
  charmRarityProgress: CharmRarityProgress
  soulDie: SoulDieState
  talentRanks: TalentRanks
  unlockedDungeonIds: DungeonId[]
  dungeonProgress: Record<DungeonId, DungeonProgress>
  diceCollection: DieInstance[]
  equippedDieIds: string[]
  recentForgeOperationIds: string[]
  charmRanks: CharmRanks
  equippedCharmIds: CharmId[]
  pendingFateDraw: PendingFateDraw | null
  recentFateOperationIds: string[]
  pendingWorkshopForge: PendingWorkshopForge | null
  settings: PlayerSettings
}
