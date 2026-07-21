export type RelicId =
  | 'bone_ledger'
  | 'black_candle'
  | 'banish'
  | 'iron_memory'
  | 'verdant_pulse'
  | 'retaliation_plate'
  | 'empty_promise'
  | 'careful_rhythm'

export interface RelicDefinition {
  id: RelicId
  name: string
  shortName: string
  description: string
  icon: string
  accent: string
}

export const MAX_RELICS = 3

export const RELICS: Record<RelicId, RelicDefinition> = {
  bone_ledger: {
    id: 'bone_ledger',
    name: 'Bone Ledger',
    shortName: 'Ledger',
    description: 'When you bust, gain +6 Shield before the enemy attacks.',
    icon: '/sprites/relics/bone-ledger.png',
    accent: '#60a5fa',
  },
  black_candle: {
    id: 'black_candle',
    name: 'Black Candle',
    shortName: 'Candle',
    description: 'The first Skull rolled each turn applies +1 Poison to the enemy.',
    icon: '/sprites/relics/black-candle.png',
    accent: '#4ade80',
  },
  banish: {
    id: 'banish',
    name: 'Banish',
    shortName: 'Banish',
    description: 'The first Skull rolled each turn is sealed back into the bag and does not count toward bust.',
    icon: '/sprites/relics/banish.png',
    accent: '#a78bfa',
  },
  iron_memory: {
    id: 'iron_memory',
    name: 'Iron Memory',
    shortName: 'Memory',
    description: 'After the enemy acts, keep 50% of unused Shield for the next turn.',
    icon: '/sprites/relics/iron-memory.png',
    accent: '#93c5fd',
  },
  verdant_pulse: {
    id: 'verdant_pulse',
    name: 'Verdant Pulse',
    shortName: 'Pulse',
    description: 'Whenever HoT actually heals you, gain Shield equal to the HP healed.',
    icon: '/sprites/relics/verdant-pulse.png',
    accent: '#86efac',
  },
  retaliation_plate: {
    id: 'retaliation_plate',
    name: 'Retaliation Plate',
    shortName: 'Plate',
    description: 'If Shield fully blocks an enemy attack, deal damage equal to 50% of that attack.',
    icon: '/sprites/relics/retaliation-plate.png',
    accent: '#fb7185',
  },
  empty_promise: {
    id: 'empty_promise',
    name: 'Empty Promise',
    shortName: 'Promise',
    description: 'The first Blank rolled each turn gives +6 Shield.',
    icon: '/sprites/relics/empty-promise.png',
    accent: '#7dd3fc',
  },
  careful_rhythm: {
    id: 'careful_rhythm',
    name: 'Careful Rhythm',
    shortName: 'Rhythm',
    description: 'If you Attack after drawing exactly 4 dice, gain +5 Damage and +5 Shield before resolving.',
    icon: '/sprites/relics/careful-rhythm.png',
    accent: '#fbbf24',
  },
}

export const RELIC_POOL: RelicId[] = [
  'bone_ledger',
  'black_candle',
  'banish',
  'iron_memory',
  'verdant_pulse',
  'retaliation_plate',
  'empty_promise',
  'careful_rhythm',
]
