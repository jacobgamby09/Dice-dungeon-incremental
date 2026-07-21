import type { DungeonDefinition, DungeonId } from '../types/dungeon'

export const DUNGEONS: Record<DungeonId, DungeonDefinition> = {
  'prototype-depths': {
    id: 'prototype-depths',
    name: 'The First Descent',
    description: 'Three encounters. Extract after a victory or risk everything and continue.',
    encounters: ['slime', 'goblin', 'skeleton'],
  },
}

