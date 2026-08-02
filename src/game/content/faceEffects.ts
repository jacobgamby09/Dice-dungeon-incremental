import type {
  AttackEvolutionId,
  DieFamily,
  FaceEvolution,
  FaceEvolutionId,
  HealEvolutionId,
  ShieldEvolutionId,
  SignatureFaceId,
} from '../types/dice'

export interface EvolutionDefinition extends FaceEvolution {
  description: string
  family: DieFamily
  resultValue: number
}

export interface SignatureDefinition {
  description: string
  id: SignatureFaceId
  name: string
  shortDescription: string
}

export const ATTACK_EVOLUTIONS: Record<AttackEvolutionId, EvolutionDefinition> = {
  power: {
    id: 'power',
    name: 'Power',
    description: 'Deal 5 Attack immediately.',
    family: 'attack',
    resultValue: 5,
  },
  momentum: {
    id: 'momentum',
    name: 'Momentum',
    description: 'Deal 3 Attack and add +2 to the next rolled face. If last, gain +2 Attack.',
    family: 'attack',
    resultValue: 3,
  },
  rend: {
    id: 'rend',
    name: 'Rend',
    description: 'Deal 2 Attack and apply 2 Bleed. Bleed starts next round and ignores Shield.',
    family: 'attack',
    resultValue: 2,
  },
}

export const SHIELD_EVOLUTIONS: Record<ShieldEvolutionId, EvolutionDefinition> = {
  bastion: {
    id: 'bastion',
    name: 'Bastion',
    description: 'Gain 5 Shield immediately.',
    family: 'shield',
    resultValue: 5,
  },
  reserve: {
    id: 'reserve',
    name: 'Reserve',
    description: 'Gain 3 Shield and carry 2 Ward into the next round.',
    family: 'shield',
    resultValue: 3,
  },
  spikes: {
    id: 'spikes',
    name: 'Spikes',
    description: 'Gain 3 Shield and add 2 Attack this round.',
    family: 'shield',
    resultValue: 3,
  },
}

export const HEAL_EVOLUTIONS: Record<HealEvolutionId, EvolutionDefinition> = {
  restoration: {
    id: 'restoration',
    name: 'Restoration',
    description: 'Restore 5 HP immediately, up to Max HP.',
    family: 'heal',
    resultValue: 5,
  },
  regrowth: {
    id: 'regrowth',
    name: 'Regrowth',
    description: 'Restore 3 HP and carry 2 healing into the next round.',
    family: 'heal',
    resultValue: 3,
  },
  overflow: {
    id: 'overflow',
    name: 'Overflow',
    description: 'Restore 3 HP. Up to 2 excess healing becomes Shield this round.',
    family: 'heal',
    resultValue: 3,
  },
}

export const EVOLUTION_DEFINITIONS: Record<FaceEvolutionId, EvolutionDefinition> = {
  ...ATTACK_EVOLUTIONS,
  ...SHIELD_EVOLUTIONS,
  ...HEAL_EVOLUTIONS,
}

export const EVOLUTIONS_BY_FAMILY = {
  attack: Object.values(ATTACK_EVOLUTIONS),
  shield: Object.values(SHIELD_EVOLUTIONS),
  heal: Object.values(HEAL_EVOLUTIONS),
} satisfies Record<DieFamily, EvolutionDefinition[]>

export const SIGNATURE_DEFINITIONS: Record<SignatureFaceId, SignatureDefinition> = {
  execute: {
    id: 'execute',
    name: 'Execute',
    shortDescription: '3 Attack · 5 below half HP',
    description: 'Deal 3 Attack. If the enemy began the roll sequence at 50% HP or less, deal 5 Attack instead.',
  },
  fortify: {
    id: 'fortify',
    name: 'Fortify',
    shortDescription: '3 Shield · next Shield +2',
    description: 'Gain 3 Shield and empower the next Shield face by +2. If none follows, gain the +2 Shield immediately.',
  },
  drain: {
    id: 'drain',
    name: 'Drain',
    shortDescription: '1 Heal · 2 Attack',
    description: 'Restore 1 HP and add 2 Attack to the current round.',
  },
}
