import { SIGNATURE_DEFINITIONS } from './faceEffects'
import type {
  DieFaces,
  DieFamily,
  DieInstance,
  SoulDieDefinition,
  SoulDieValues,
  SignatureFaceId,
} from '../types/dice'
import { cloneDie } from '../types/dice'

function createFaces(
  dieId: string,
  family: DieFamily,
  values: number[],
  signatures: Partial<Record<number, SignatureFaceId>> = {},
): DieFaces {
  if (values.length !== 6) throw new Error(`Die ${dieId} must have exactly six faces.`)
  return values.map((value, index) => ({
    id: `${dieId}-face-${index + 1}`,
    type: family,
    value,
    signature: signatures[index]
      ? {
          id: signatures[index],
          name: SIGNATURE_DEFINITIONS[signatures[index]].name,
        }
      : undefined,
  })) as DieFaces
}

const WORN_BLADE_DIE: DieInstance = {
  id: 'attack-die-1',
  name: 'Worn Blade Die',
  family: 'attack',
  faces: createFaces('attack-die-1', 'attack', [1, 1, 1, 1, 1, 1]),
}

const STRIKER_DIE: DieInstance = {
  id: 'attack-die-2',
  name: 'Striker Die',
  family: 'attack',
  faces: createFaces('attack-die-2', 'attack', [1, 1, 1, 2, 2, 3]),
}

const IRON_GUARD_DIE: DieInstance = {
  id: 'shield-die-1',
  name: 'Iron Guard Die',
  family: 'shield',
  faces: createFaces('shield-die-1', 'shield', [1, 1, 2, 2, 2, 3]),
}

const VITALITY_DIE: DieInstance = {
  id: 'heal-die-1',
  name: 'Vitality Die',
  family: 'heal',
  faces: createFaces('heal-die-1', 'heal', [1, 1, 1, 2, 2, 3]),
}

const EXECUTIONER_DIE: DieInstance = {
  id: 'attack-die-executioner',
  name: 'Executioner Die',
  family: 'attack',
  faces: createFaces(
    'attack-die-executioner',
    'attack',
    [2, 2, 3, 3, 3, 3],
    { 4: 'execute', 5: 'execute' },
  ),
}

const TOWER_DIE: DieInstance = {
  id: 'shield-die-tower',
  name: 'Tower Die',
  family: 'shield',
  faces: createFaces(
    'shield-die-tower',
    'shield',
    [2, 2, 3, 3, 3, 3],
    { 4: 'fortify', 5: 'fortify' },
  ),
}

const BLOODWELL_DIE: DieInstance = {
  id: 'heal-die-bloodwell',
  name: 'Bloodwell Die',
  family: 'heal',
  faces: createFaces(
    'heal-die-bloodwell',
    'heal',
    [2, 2, 2, 2, 1, 1],
    { 4: 'drain', 5: 'drain' },
  ),
}

const FOCUS_DIE: DieInstance = {
  id: 'empower-die-focus',
  name: 'Focus Die',
  family: 'empower',
  faces: createFaces('empower-die-focus', 'empower', [0, 0, 0, 1, 1, 2]),
}

const PURIFIER_DIE: DieInstance = {
  id: 'cleanse-die-purifier',
  name: 'Purifier Die',
  family: 'cleanse',
  faces: createFaces('cleanse-die-purifier', 'cleanse', [0, 0, 1, 1, 1, 2]),
}

const DICE_CATALOG: DieInstance[] = [
  WORN_BLADE_DIE,
  STRIKER_DIE,
  IRON_GUARD_DIE,
  VITALITY_DIE,
  EXECUTIONER_DIE,
  TOWER_DIE,
  BLOODWELL_DIE,
  FOCUS_DIE,
  PURIFIER_DIE,
]

const SOUL_DIE_FACE_IDS = Array.from(
  { length: 6 },
  (_, index) => `soul-die-face-${index + 1}`,
) as [string, string, string, string, string, string]

export const BASE_SOUL_DIE_VALUES: SoulDieValues = [1, 1, 1, 2, 2, 2]

export function createSoulDie(
  values: SoulDieValues = BASE_SOUL_DIE_VALUES,
): SoulDieDefinition {
  return {
    id: 'soul-die',
    name: 'Soul Die',
    faces: values.map((multiplier, index) => ({
      id: SOUL_DIE_FACE_IDS[index],
      multiplier,
    })) as SoulDieDefinition['faces'],
  }
}

export function createDiceCatalog(): DieInstance[] {
  return DICE_CATALOG.map(cloneDie)
}

export function createStartingDice(): DieInstance[] {
  return [cloneDie(WORN_BLADE_DIE)]
}

export function createDieById(dieId: string): DieInstance | null {
  const die = DICE_CATALOG.find((candidate) => candidate.id === dieId)
  return die ? cloneDie(die) : null
}
