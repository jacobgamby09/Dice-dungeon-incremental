import type {
  ImprintDefinition,
  ImprintId,
  ImprintInstance,
  ImprintSnapshot,
} from '../types/imprints'

export const IMPRINT_DEFINITIONS: Record<ImprintId, ImprintDefinition> = {
  'lead-edge': {
    id: 'lead-edge',
    name: 'Lead Edge',
    description: 'When this is the first die rolled each round, gain +50% Attack, rounded up.',
    shortDescription: 'First roll: +50% Attack',
    dungeonId: 'prototype-depths',
    rarity: 'rare',
    type: 'attack',
    baseValue: 3,
    effectKind: 'opener',
  },
  'relay-strike': {
    id: 'relay-strike',
    name: 'Relay Strike',
    description: 'The next die rolled gains +50% to its primary output, rounded up.',
    shortDescription: 'Next die: +50% output',
    dungeonId: 'prototype-depths',
    rarity: 'epic',
    type: 'attack',
    baseValue: 2,
    effectKind: 'relay',
  },
  crescendo: {
    id: 'crescendo',
    name: 'Crescendo',
    description: 'Gain +25% Attack for every die rolled before this one, up to +100%, rounded up.',
    shortDescription: '+25% per earlier die (max +100%)',
    dungeonId: 'prototype-depths',
    rarity: 'legendary',
    type: 'attack',
    baseValue: 3,
    effectKind: 'crescendo',
  },
  'venom-edge': {
    id: 'venom-edge',
    name: 'Venom Edge',
    description: "Deal this face's Attack and apply Poison equal to one quarter of its value, rounded down (minimum 1).",
    shortDescription: 'Attack + scaling Poison',
    dungeonId: 'blighted-depths',
    rarity: 'rare',
    type: 'attack',
    baseValue: 5,
    effectKind: 'venom',
  },
  'purging-aegis': {
    id: 'purging-aegis',
    name: 'Purging Aegis',
    description: "Gain this face's Shield and Cleanse equal to one fifth of its value, rounded down (minimum 1).",
    shortDescription: 'Shield + scaling Cleanse',
    dungeonId: 'blighted-depths',
    rarity: 'epic',
    type: 'shield',
    baseValue: 5,
    effectKind: 'purging',
  },
  'plague-bloom': {
    id: 'plague-bloom',
    name: 'Plague Bloom',
    description: "Heal this face's value, then immediately trigger the enemy's existing Poison without consuming it.",
    shortDescription: 'Heal + trigger enemy Poison',
    dungeonId: 'blighted-depths',
    rarity: 'legendary',
    type: 'heal',
    baseValue: 6,
    effectKind: 'plague-bloom',
  },
}

export function createImprintInstance(
  definitionId: ImprintId,
  instanceId: string,
): ImprintInstance {
  return { id: instanceId, definitionId, refinement: 0 }
}

export function getImprintMinimumValue(instance: Pick<ImprintInstance, 'definitionId' | 'refinement'>): number {
  return IMPRINT_DEFINITIONS[instance.definitionId].baseValue + Math.max(0, instance.refinement)
}

export function createImprintSnapshot(instance: ImprintInstance): ImprintSnapshot {
  const definition = IMPRINT_DEFINITIONS[instance.definitionId]
  return {
    instanceId: instance.id,
    definitionId: definition.id,
    name: definition.name,
    description: definition.description,
    rarity: definition.rarity,
    effectKind: definition.effectKind,
    refinement: Math.max(0, instance.refinement),
  }
}
