import type { DungeonDefinition, DungeonId } from '../types/dungeon'

export const DUNGEONS: Record<DungeonId, DungeonDefinition> = {
  'prototype-depths': {
    id: 'prototype-depths',
    name: 'The First Descent',
    description: 'Ten floors. Extract after a victory or risk everything and face the Demon below.',
    floors: [
      { floor: 1, enemyId: 'slime', isBoss: false },
      { floor: 2, enemyId: 'slime-crawler', isBoss: false },
      { floor: 3, enemyId: 'marrow-bat', isBoss: false },
      { floor: 4, enemyId: 'goblin', isBoss: false },
      { floor: 5, enemyId: 'shieldbearer', isBoss: false },
      { floor: 6, enemyId: 'cultist', isBoss: false },
      { floor: 7, enemyId: 'skeleton', isBoss: false },
      { floor: 8, enemyId: 'orc', isBoss: false },
      { floor: 9, enemyId: 'blood-orc', isBoss: false },
      { floor: 10, enemyId: 'demon', isBoss: true },
    ],
  },
}
