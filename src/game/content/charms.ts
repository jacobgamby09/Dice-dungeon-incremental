import type { CharmDefinition, CharmId } from '../types/charms'

export const CHARM_DEFINITIONS: Record<CharmId, CharmDefinition> = {
  'blade-rhythm': {
    id: 'blade-rhythm',
    name: 'Blade Rhythm',
    flavor: 'A blood-red metronome that rewards an unbroken assault.',
    assetPath: '/sprites/charms/blade-rhythm.png',
    accent: '#ff4d67',
    ranks: [
      {
        description: 'Every 5th Attack roll gains +2 Attack.',
        effect: { type: 'attack_rhythm', threshold: 5, bonus: 2 },
      },
      {
        description: 'Every 5th Attack roll gains +3 Attack.',
        effect: { type: 'attack_rhythm', threshold: 5, bonus: 3 },
      },
      {
        description: 'Every 5th Attack roll gains +4 Attack.',
        effect: { type: 'attack_rhythm', threshold: 5, bonus: 4 },
      },
    ],
  },
  'echo-knot': {
    id: 'echo-knot',
    name: 'Echo Knot',
    flavor: 'Twin loops resonate when fate repeats itself.',
    assetPath: '/sprites/charms/echo-knot.png',
    accent: '#18d9ff',
    ranks: [
      {
        description: 'Matching consecutive raw rolls give the second roll +1 output.',
        effect: { type: 'matching_roll', bonus: 1 },
      },
      {
        description: 'Matching consecutive raw rolls give the second roll +2 output.',
        effect: { type: 'matching_roll', bonus: 2 },
      },
      {
        description: 'Matching consecutive raw rolls give the second roll +3 output.',
        effect: { type: 'matching_roll', bonus: 3 },
      },
    ],
  },
  'low-omen': {
    id: 'low-omen',
    name: 'Low Omen',
    flavor: 'Three weak signs bend the next outcome upward.',
    assetPath: '/sprites/charms/low-omen.png',
    accent: '#b06cff',
    ranks: [
      {
        description: 'After three 1-rolls, the next die gains +2 output.',
        effect: { type: 'low_omen', threshold: 3, bonus: 2 },
      },
      {
        description: 'After three 1-rolls, the next die gains +3 output.',
        effect: { type: 'low_omen', threshold: 3, bonus: 3 },
      },
      {
        description: 'After three 1-rolls, the next die gains +4 output.',
        effect: { type: 'low_omen', threshold: 3, bonus: 4 },
      },
    ],
  },
  'ward-clock': {
    id: 'ward-clock',
    name: 'Ward Clock',
    flavor: 'Its sixth pulse hardens the air around its bearer.',
    assetPath: '/sprites/charms/ward-clock.png',
    accent: '#4c8dff',
    ranks: [
      {
        description: 'Every 6th round starts with 2 Shield.',
        effect: { type: 'round_shield', threshold: 6, amount: 2 },
      },
      {
        description: 'Every 6th round starts with 3 Shield.',
        effect: { type: 'round_shield', threshold: 6, amount: 3 },
      },
      {
        description: 'Every 6th round starts with 4 Shield.',
        effect: { type: 'round_shield', threshold: 6, amount: 4 },
      },
    ],
  },
  bloodroot: {
    id: 'bloodroot',
    name: 'Bloodroot',
    flavor: 'A living root that drinks victory and returns vitality.',
    assetPath: '/sprites/charms/bloodroot.png',
    accent: '#37e875',
    ranks: [
      {
        description: 'Heal 1 HP after every 3rd defeated enemy.',
        effect: { type: 'kill_heal', threshold: 3, amount: 1 },
      },
      {
        description: 'Heal 2 HP after every 3rd defeated enemy.',
        effect: { type: 'kill_heal', threshold: 3, amount: 2 },
      },
      {
        description: 'Heal 3 HP after every 3rd defeated enemy.',
        effect: { type: 'kill_heal', threshold: 3, amount: 3 },
      },
    ],
  },
  'soul-prism': {
    id: 'soul-prism',
    name: 'Soul Prism',
    flavor: 'A violet shard that catches a departing soul twice.',
    assetPath: '/sprites/charms/soul-prism.png',
    accent: '#d650ff',
    ranks: [
      {
        description: 'Every 5th kill repeats its base Soul reward.',
        effect: { type: 'soul_echo', threshold: 5 },
      },
      {
        description: 'Every 4th kill repeats its base Soul reward.',
        effect: { type: 'soul_echo', threshold: 4 },
      },
      {
        description: 'Every 3rd kill repeats its base Soul reward.',
        effect: { type: 'soul_echo', threshold: 3 },
      },
    ],
  },
}

export const CHARMS = Object.values(CHARM_DEFINITIONS)

export function getCharmRankDefinition(charmId: CharmId, rank: number) {
  const definition = CHARM_DEFINITIONS[charmId]
  return definition.ranks[Math.max(0, Math.min(definition.ranks.length - 1, rank - 1))]
}
