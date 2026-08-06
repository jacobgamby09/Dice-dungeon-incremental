import type { DungeonId, DungeonKeyId } from '../types/dungeon'

export interface DungeonKeyDefinition {
  description: string
  id: DungeonKeyId
  name: string
  unlocksDungeonId: DungeonId
}

export const DUNGEON_KEYS: Record<DungeonKeyId, DungeonKeyDefinition> = {
  'iron-descent-key': {
    id: 'iron-descent-key',
    name: 'Iron Descent Key',
    description: 'Unlocks The Iron Descent.',
    unlocksDungeonId: 'iron-depths',
  },
  'blighted-descent-key': {
    id: 'blighted-descent-key',
    name: 'Blighted Descent Key',
    description: 'Unlocks The Blighted Descent.',
    unlocksDungeonId: 'blighted-depths',
  },
}
