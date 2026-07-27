import type { DungeonDefinition, DungeonId } from '../types/dungeon'

export const DUNGEONS: Record<DungeonId, DungeonDefinition> = {
  'prototype-depths': {
    id: 'prototype-depths',
    name: 'The First Descent',
    description: 'Master the core loop across ten attack-only encounters and defeat the Demon.',
    floors: [
      { floor: 1, encounterId: 'descent-1-slime-l1', isBoss: false },
      { floor: 2, encounterId: 'descent-1-slime-crawler-l1', isBoss: false },
      { floor: 3, encounterId: 'descent-1-goblin-l1', isBoss: false },
      { floor: 4, encounterId: 'descent-1-skeleton-l1', isBoss: false },
      { floor: 5, encounterId: 'descent-1-slime-l2', isBoss: false },
      { floor: 6, encounterId: 'descent-1-slime-crawler-l2', isBoss: false },
      { floor: 7, encounterId: 'descent-1-goblin-l2', isBoss: false },
      { floor: 8, encounterId: 'descent-1-skeleton-l2', isBoss: false },
      { floor: 9, encounterId: 'descent-1-skeleton-elite', isBoss: false },
      { floor: 10, encounterId: 'descent-1-demon', isBoss: true },
    ],
  },
  'iron-depths': {
    id: 'iron-depths',
    name: 'The Iron Descent',
    description: 'Break recurring shields, survive layered intents and overcome the Spiked Behemoth.',
    floors: [
      { floor: 1, encounterId: 'descent-2-shieldbearer-l1', isBoss: false },
      { floor: 2, encounterId: 'descent-2-cultist-l1', isBoss: false },
      { floor: 3, encounterId: 'descent-2-orc-l1', isBoss: false },
      { floor: 4, encounterId: 'descent-2-blood-orc-l1', isBoss: false },
      { floor: 5, encounterId: 'descent-2-shieldbearer-l2', isBoss: false },
      { floor: 6, encounterId: 'descent-2-cultist-l2', isBoss: false },
      { floor: 7, encounterId: 'descent-2-orc-l2', isBoss: false },
      { floor: 8, encounterId: 'descent-2-blood-orc-l2', isBoss: false },
      { floor: 9, encounterId: 'descent-2-blood-orc-elite', isBoss: false },
      { floor: 10, encounterId: 'descent-2-spiked-behemoth', isBoss: true },
    ],
  },
}
