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
      { description: 'Every 3rd Attack roll gains +3 Attack.', effect: { type: 'attack_rhythm', threshold: 3, bonus: 3 } },
      { description: 'Every 3rd Attack roll gains +5 Attack.', effect: { type: 'attack_rhythm', threshold: 3, bonus: 5 } },
      { description: 'Every 3rd Attack roll gains +7 Attack.', effect: { type: 'attack_rhythm', threshold: 3, bonus: 7 } },
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
      { description: 'Each die has a 15% chance to Echo its raw output.', effect: { type: 'echo_chance', chance: 0.15 } },
      { description: 'Each die has a 20% chance to Echo its raw output.', effect: { type: 'echo_chance', chance: 0.2 } },
      { description: 'Each die has a 25% chance to Echo its raw output.', effect: { type: 'echo_chance', chance: 0.25 } },
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
      { description: 'Every 5th die Echoes its raw output.', effect: { type: 'roll_echo', threshold: 5 } },
      { description: 'Every 4th die Echoes its raw output.', effect: { type: 'roll_echo', threshold: 4 } },
      { description: 'Every 3rd die Echoes its raw output.', effect: { type: 'roll_echo', threshold: 3 } },
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
      { description: 'Start every encounter with 2 Shield.', effect: { type: 'encounter_shield', amount: 2 } },
      { description: 'Start every encounter with 3 Shield.', effect: { type: 'encounter_shield', amount: 3 } },
      { description: 'Start every encounter with 4 Shield.', effect: { type: 'encounter_shield', amount: 4 } },
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
      { description: 'Heal 1 HP after every 2nd defeated enemy.', effect: { type: 'kill_heal', threshold: 2, amount: 1 } },
      { description: 'Heal 1 HP after every defeated enemy.', effect: { type: 'kill_heal', threshold: 1, amount: 1 } },
      { description: 'Heal 2 HP after every defeated enemy.', effect: { type: 'kill_heal', threshold: 1, amount: 2 } },
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
      { description: 'With only Attack Dice equipped, every Attack gains +1.', effect: { type: 'attack_oath', bonus: 1 } },
      { description: 'With only Attack Dice equipped, every Attack gains +2.', effect: { type: 'attack_oath', bonus: 2 } },
      { description: 'With only Attack Dice equipped, every Attack gains +3.', effect: { type: 'attack_oath', bonus: 3 } },
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
      { description: 'Carry 25% of unused Shield into the next round.', effect: { type: 'shield_carry', rate: 0.25 } },
      { description: 'Carry 40% of unused Shield into the next round.', effect: { type: 'shield_carry', rate: 0.4 } },
      { description: 'Carry 60% of unused Shield into the next round.', effect: { type: 'shield_carry', rate: 0.6 } },
    ],
  },
}

export const CHARMS = Object.values(CHARM_DEFINITIONS)

export function getCharmRankDefinition(charmId: CharmId, rank: number) {
  const definition = CHARM_DEFINITIONS[charmId]
  return definition.ranks[Math.max(0, Math.min(definition.ranks.length - 1, rank - 1))]
}
