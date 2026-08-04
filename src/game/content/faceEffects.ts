import type {
  SignatureFaceId,
} from '../types/dice'

export interface SignatureDefinition {
  description: string
  id: SignatureFaceId
  name: string
  shortDescription: string
}

export const SIGNATURE_DEFINITIONS: Record<SignatureFaceId, SignatureDefinition> = {
  execute: {
    id: 'execute',
    name: 'Execute',
    shortDescription: 'Face Attack · +3 below half HP',
    description: 'Deal this face\'s Attack. If the enemy began the roll sequence at 50% HP or less, gain +3 Attack.',
  },
  fortify: {
    id: 'fortify',
    name: 'Fortify',
    shortDescription: 'Face Shield · next Shield +2',
    description: 'Gain this face\'s Shield and empower the next Shield face by +2. If none follows, gain the +2 Shield immediately.',
  },
  drain: {
    id: 'drain',
    name: 'Drain',
    shortDescription: 'Face Heal · +2 Attack',
    description: 'Restore this face\'s HP and add 2 Attack to the current round.',
  },
}
