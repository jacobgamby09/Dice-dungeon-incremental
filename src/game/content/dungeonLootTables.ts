import { DUNGEON_KEYS } from './dungeonKeys'
import { IMPRINT_DEFINITIONS } from './imprints'
import type { DungeonId, DungeonKeyId } from '../types/dungeon'
import type { ImprintId, ImprintRarity } from '../types/imprints'

export interface DungeonKeyLootEntry {
  id: DungeonKeyId
  kind: 'dungeon-key'
  name: string
  source: string
}

export interface DungeonImprintLootEntry {
  id: ImprintId
  kind: 'imprint'
  name: string
  rarity: ImprintRarity
  source: string
}

export type DungeonLootEntry = DungeonKeyLootEntry | DungeonImprintLootEntry

export const DUNGEON_LOOT_TABLES: Record<DungeonId, readonly DungeonLootEntry[]> = {
  'prototype-depths': [
    {
      id: 'iron-descent-key',
      kind: 'dungeon-key',
      name: DUNGEON_KEYS['iron-descent-key'].name,
      source: 'First boss victory',
    },
    {
      id: 'lead-edge',
      kind: 'imprint',
      name: IMPRINT_DEFINITIONS['lead-edge'].name,
      rarity: IMPRINT_DEFINITIONS['lead-edge'].rarity,
      source: 'Any enemy · first boss clear guarantees it',
    },
    {
      id: 'relay-strike',
      kind: 'imprint',
      name: IMPRINT_DEFINITIONS['relay-strike'].name,
      rarity: IMPRINT_DEFINITIONS['relay-strike'].rarity,
      source: 'Any enemy',
    },
    {
      id: 'crescendo',
      kind: 'imprint',
      name: IMPRINT_DEFINITIONS.crescendo.name,
      rarity: IMPRINT_DEFINITIONS.crescendo.rarity,
      source: 'Any enemy',
    },
  ],
  'iron-depths': [
    {
      id: 'blighted-descent-key',
      kind: 'dungeon-key',
      name: DUNGEON_KEYS['blighted-descent-key'].name,
      source: 'First boss victory',
    },
  ],
  'blighted-depths': [
    {
      id: 'venom-edge',
      kind: 'imprint',
      name: IMPRINT_DEFINITIONS['venom-edge'].name,
      rarity: IMPRINT_DEFINITIONS['venom-edge'].rarity,
      source: 'Any enemy - first boss clear guarantees it',
    },
    {
      id: 'purging-aegis',
      kind: 'imprint',
      name: IMPRINT_DEFINITIONS['purging-aegis'].name,
      rarity: IMPRINT_DEFINITIONS['purging-aegis'].rarity,
      source: 'Any enemy',
    },
    {
      id: 'plague-bloom',
      kind: 'imprint',
      name: IMPRINT_DEFINITIONS['plague-bloom'].name,
      rarity: IMPRINT_DEFINITIONS['plague-bloom'].rarity,
      source: 'Any enemy',
    },
  ],
}

export function getDungeonLootTable(dungeonId: DungeonId): readonly DungeonLootEntry[] {
  return DUNGEON_LOOT_TABLES[dungeonId]
}
