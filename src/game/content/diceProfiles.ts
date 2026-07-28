import type { DieInstance } from '../types/dice'

interface DieProfile {
  description: string
  tags: readonly string[]
}

const DIE_PROFILES: Record<string, DieProfile> = {
  'attack-die-1': {
    description: 'A balanced Attack-family foundation with six freely evolvable faces.',
    tags: ['Balanced', 'Full canvas'],
  },
  'attack-die-2': {
    description: 'A volatile Attack-family die with early access to high-value evolution candidates.',
    tags: ['Volatile', 'Full canvas'],
  },
  'shield-die-1': {
    description: 'A reliable Shield-family foundation built for steady mitigation and free evolution choices.',
    tags: ['Reliable', 'Full canvas'],
  },
  'heal-die-1': {
    description: 'A Heal-family foundation that trades low early values for flexible sustain evolutions.',
    tags: ['Sustain', 'Full canvas'],
  },
  'attack-die-executioner': {
    description: 'Four evolvable Attack faces surround two Execute signatures that become lethal below half enemy HP.',
    tags: ['Signature', 'Finisher'],
  },
  'shield-die-tower': {
    description: 'Four evolvable Shield faces surround two Fortify signatures that empower another Shield roll.',
    tags: ['Signature', 'Shield engine'],
  },
}

export function getDieProfile(die: DieInstance): DieProfile {
  return DIE_PROFILES[die.id] ?? {
    description: `A permanent ${die.family} family die with six individual faces.`,
    tags: [die.family, 'Permanent'],
  }
}
