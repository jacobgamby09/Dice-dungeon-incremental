import type { DieInstance } from '../types/dice'

interface DieProfile {
  description: string
  tags: readonly string[]
}

const DIE_PROFILES: Record<string, DieProfile> = {
  'attack-die-1': {
    description: 'A balanced Attack-family foundation with six permanently upgradeable faces.',
    tags: ['Balanced', 'Full canvas'],
  },
  'attack-die-2': {
    description: 'A volatile Attack-family die built for aggressive permanent face growth.',
    tags: ['Volatile', 'Full canvas'],
  },
  'shield-die-1': {
    description: 'A reliable Shield-family foundation built for steady permanent mitigation.',
    tags: ['Reliable', 'Full canvas'],
  },
  'heal-die-1': {
    description: 'A Heal-family foundation that trades low early values for scalable sustain.',
    tags: ['Sustain', 'Full canvas'],
  },
  'attack-die-executioner': {
    description: 'Four standard Attack faces surround two Execute signatures that become lethal below half enemy HP.',
    tags: ['Signature', 'Finisher'],
  },
  'shield-die-tower': {
    description: 'Four standard Shield faces surround two Fortify signatures that empower another Shield roll.',
    tags: ['Signature', 'Shield engine'],
  },
  'heal-die-bloodwell': {
    description: 'Four standard Heal faces surround two Drain signatures that restore HP while adding Attack.',
    tags: ['Signature', 'Hybrid sustain'],
  },
}

export function getDieProfile(die: DieInstance): DieProfile {
  return DIE_PROFILES[die.id] ?? {
    description: `A permanent ${die.family} family die with six individual faces.`,
    tags: [die.family, 'Permanent'],
  }
}
