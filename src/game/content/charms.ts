import type {
  CharmDefinition,
  CharmId,
  CharmRarity,
} from '../types/charms'

export interface CharmRarityDefinition {
  id: CharmRarity
  name: string
  accent: string
  dark: string
  weight: number
}

export const CHARM_RARITY_DEFINITIONS: Record<CharmRarity, CharmRarityDefinition> = {
  common: { id: 'common', name: 'Common', accent: '#e3e5ea', dark: '#24262b', weight: 50 },
  rare: { id: 'rare', name: 'Rare', accent: '#30e8ff', dark: '#09313a', weight: 30 },
  epic: { id: 'epic', name: 'Epic', accent: '#b45cff', dark: '#2a103d', weight: 15 },
  legendary: { id: 'legendary', name: 'Legendary', accent: '#ff8a2a', dark: '#3d1b08', weight: 5 },
}

export const CHARM_DEFINITIONS: Record<CharmId, CharmDefinition> = {
  'blade-rhythm': {
    id: 'blade-rhythm',
    name: 'Blade Rhythm',
    flavor: 'A blood-red metronome that rewards an unbroken assault.',
    assetPath: '/sprites/charms/blade-rhythm.png',
    accent: '#ff4d67',
    rarity: 'rare',
    ranks: [
      { description: 'Every 3rd Attack roll gains +4 Attack.', effect: { type: 'attack_rhythm', threshold: 3, bonus: 4 } },
      { description: 'Every 3rd Attack roll gains +6 Attack.', effect: { type: 'attack_rhythm', threshold: 3, bonus: 6 } },
      { description: 'Every 3rd Attack roll gains +8 Attack.', effect: { type: 'attack_rhythm', threshold: 3, bonus: 8 } },
    ],
  },
  'echo-knot': {
    id: 'echo-knot',
    name: 'Echo Knot',
    flavor: 'Twin loops make one result resonate twice.',
    assetPath: '/sprites/charms/echo-knot.png',
    accent: '#18d9ff',
    rarity: 'epic',
    ranks: [
      { description: 'Each die has an 18% chance to Echo its raw output.', effect: { type: 'echo_chance', chance: 0.18 } },
      { description: 'Each die has a 24% chance to Echo its raw output.', effect: { type: 'echo_chance', chance: 0.24 } },
      { description: 'Each die has a 30% chance to Echo its raw output.', effect: { type: 'echo_chance', chance: 0.3 } },
    ],
  },
  'low-omen': {
    id: 'low-omen',
    name: 'Loaded Star',
    flavor: 'A fixed constellation that forces fate to repeat on schedule.',
    assetPath: '/sprites/charms/low-omen.png',
    accent: '#b06cff',
    rarity: 'epic',
    ranks: [
      { description: 'Every 4th die Echoes its raw output.', effect: { type: 'roll_echo', threshold: 4 } },
      { description: 'Every 3rd die Echoes its raw output.', effect: { type: 'roll_echo', threshold: 3 } },
      { description: 'Every 2nd die Echoes its raw output.', effect: { type: 'roll_echo', threshold: 2 } },
    ],
  },
  'ward-clock': {
    id: 'ward-clock',
    name: 'Ward Clock',
    flavor: 'Its first pulse hardens the air around its bearer.',
    assetPath: '/sprites/charms/ward-clock.png',
    accent: '#4c8dff',
    rarity: 'common',
    ranks: [
      { description: 'Start every encounter with 3 Shield.', effect: { type: 'encounter_shield', amount: 3 } },
      { description: 'Start every encounter with 5 Shield.', effect: { type: 'encounter_shield', amount: 5 } },
      { description: 'Start every encounter with 7 Shield.', effect: { type: 'encounter_shield', amount: 7 } },
    ],
  },
  bloodroot: {
    id: 'bloodroot',
    name: 'Bloodroot',
    flavor: 'A living root that drinks victory and returns vitality.',
    assetPath: '/sprites/charms/bloodroot.png',
    accent: '#37e875',
    rarity: 'rare',
    ranks: [
      { description: 'Heal 1 HP after every defeated enemy.', effect: { type: 'kill_heal', threshold: 1, amount: 1 } },
      { description: 'Heal 2 HP after every defeated enemy.', effect: { type: 'kill_heal', threshold: 1, amount: 2 } },
      { description: 'Heal 3 HP after every defeated enemy.', effect: { type: 'kill_heal', threshold: 1, amount: 3 } },
    ],
  },
  'soul-prism': {
    id: 'soul-prism',
    name: 'Soul Prism',
    flavor: 'A violet shard that catches a little more from every soul.',
    assetPath: '/sprites/charms/soul-prism.png',
    accent: '#d650ff',
    rarity: 'common',
    ranks: [
      { description: 'Every defeated enemy grants +1 Soul.', effect: { type: 'soul_flat', amount: 1 } },
      { description: 'Every defeated enemy grants +2 Souls.', effect: { type: 'soul_flat', amount: 2 } },
      { description: 'Every defeated enemy grants +3 Souls.', effect: { type: 'soul_flat', amount: 3 } },
    ],
  },
  'crimson-oath': {
    id: 'crimson-oath',
    name: 'Crimson Oath',
    flavor: 'One weapon creed, sworn without compromise.',
    assetPath: '/sprites/charms/crimson-oath.png',
    accent: '#ff8a2a',
    rarity: 'legendary',
    ranks: [
      { description: 'With only Attack Dice equipped, every Attack gains +2.', effect: { type: 'attack_oath', bonus: 2 } },
      { description: 'With only Attack Dice equipped, every Attack gains +3.', effect: { type: 'attack_oath', bonus: 3 } },
      { description: 'With only Attack Dice equipped, every Attack gains +4.', effect: { type: 'attack_oath', bonus: 4 } },
    ],
  },
  'unbroken-wall': {
    id: 'unbroken-wall',
    name: 'Unbroken Wall',
    flavor: 'What survives the blow is never wasted.',
    assetPath: '/sprites/charms/unbroken-wall.png',
    accent: '#ff8a2a',
    rarity: 'legendary',
    ranks: [
      { description: 'Carry 40% of unused Shield into the next round.', effect: { type: 'shield_carry', rate: 0.4 } },
      { description: 'Carry 60% of unused Shield into the next round.', effect: { type: 'shield_carry', rate: 0.6 } },
      { description: 'Carry 80% of unused Shield into the next round.', effect: { type: 'shield_carry', rate: 0.8 } },
    ],
  },
  'third-spark': {
    id: 'third-spark',
    name: 'Third Spark',
    flavor: 'Every third pulse erupts brighter than the last.',
    assetPath: '/sprites/charms/third-spark.svg',
    accent: '#facc15',
    rarity: 'rare',
    minimumDungeonId: 'blighted-depths',
    ranks: [
      { description: 'Every 3rd die gains +3 primary output.', effect: { type: 'total_rhythm', threshold: 3, bonus: 3 } },
      { description: 'Every 3rd die gains +5 primary output.', effect: { type: 'total_rhythm', threshold: 3, bonus: 5 } },
      { description: 'Every 3rd die gains +7 primary output.', effect: { type: 'total_rhythm', threshold: 3, bonus: 7 } },
    ],
  },
  'clean-thread': {
    id: 'clean-thread',
    name: 'Clean Thread',
    flavor: 'A silver strand cuts corruption before it can take hold.',
    assetPath: '/sprites/charms/clean-thread.svg',
    accent: '#22d3ee',
    rarity: 'common',
    minimumDungeonId: 'blighted-depths',
    ranks: [
      { description: 'Ignore the first negative status die each encounter.', effect: { type: 'status_guard', amount: 1 } },
      { description: 'Ignore the first 2 negative status dice each encounter.', effect: { type: 'status_guard', amount: 2 } },
      { description: 'Ignore the first 3 negative status dice each encounter.', effect: { type: 'status_guard', amount: 3 } },
    ],
  },
  'last-echo': {
    id: 'last-echo',
    name: 'Last Echo',
    flavor: 'The final cast leaves an afterimage in the dark.',
    assetPath: '/sprites/charms/last-echo.svg',
    accent: '#c084fc',
    rarity: 'epic',
    minimumDungeonId: 'blighted-depths',
    ranks: [
      { description: 'The last die each round repeats 50% of its raw output.', effect: { type: 'last_echo', multiplier: 0.5 } },
      { description: 'The last die each round repeats 75% of its raw output.', effect: { type: 'last_echo', multiplier: 0.75 } },
      { description: 'The last die each round repeats 100% of its raw output.', effect: { type: 'last_echo', multiplier: 1 } },
    ],
  },
  'fivefold-crown': {
    id: 'fivefold-crown',
    name: 'Fivefold Crown',
    flavor: 'Five chosen faces form a single sovereign engine.',
    assetPath: '/sprites/charms/fivefold-crown.svg',
    accent: '#ff8a2a',
    rarity: 'legendary',
    minimumDungeonId: 'blighted-depths',
    ranks: [
      { description: 'With exactly 5 Dice equipped, every primary face gains +2.', effect: { type: 'fivefold_output', bonus: 2 } },
      { description: 'With exactly 5 Dice equipped, every primary face gains +3.', effect: { type: 'fivefold_output', bonus: 3 } },
      { description: 'With exactly 5 Dice equipped, every primary face gains +4.', effect: { type: 'fivefold_output', bonus: 4 } },
    ],
  },
}

export const CHARMS = Object.values(CHARM_DEFINITIONS)

export function getCharmRankDefinition(charmId: CharmId, rank: number) {
  const definition = CHARM_DEFINITIONS[charmId]
  return definition.ranks[Math.max(0, Math.min(definition.ranks.length - 1, rank - 1))]
}
