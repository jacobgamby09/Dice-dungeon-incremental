import type { DungeonId } from './dungeon'
import type { FaceType } from './dice'

export const IMPRINT_RARITIES = ['rare', 'epic', 'legendary'] as const
export type ImprintRarity = (typeof IMPRINT_RARITIES)[number]

export const IMPRINT_IDS = [
  'lead-edge',
  'relay-strike',
  'crescendo',
  'venom-edge',
  'purging-aegis',
  'plague-bloom',
] as const
export type ImprintId = (typeof IMPRINT_IDS)[number]

export type ImprintEffectKind =
  | 'opener'
  | 'relay'
  | 'crescendo'
  | 'venom'
  | 'purging'
  | 'plague-bloom'

export interface ImprintDefinition {
  id: ImprintId
  name: string
  description: string
  shortDescription: string
  dungeonId: DungeonId
  rarity: ImprintRarity
  type: FaceType
  baseValue: number
  effectKind: ImprintEffectKind
}

export interface ImprintAttachment {
  dieId: string
  faceId: string
}

export interface ImprintInstance {
  id: string
  definitionId: ImprintId
  refinement: number
  attachment?: ImprintAttachment
}

export interface ImprintDropReceipt {
  definitionId: ImprintId
  instanceId: string
}

export interface ImprintSnapshot {
  instanceId: string
  definitionId: ImprintId
  name: string
  description: string
  rarity: ImprintRarity
  effectKind: ImprintEffectKind
  refinement: number
}
