import type { DieFaces, DieFamily, DieInstance } from '../types/dice'
import { cloneDie } from '../types/dice'

function createFaces(dieId: string, family: DieFamily, values: number[]): DieFaces {
  if (values.length !== 6) throw new Error(`Die ${dieId} must have exactly six faces.`)
  return values.map((value, index) => ({
    id: `${dieId}-face-${index + 1}`,
    type: family,
    value,
  })) as DieFaces
}

const WORN_BLADE_DIE: DieInstance = {
  id: 'attack-die-1',
  name: 'Worn Blade Die',
  family: 'attack',
  faces: createFaces('attack-die-1', 'attack', [1, 1, 2, 2, 2, 3]),
}

const STRIKER_DIE: DieInstance = {
  id: 'attack-die-2',
  name: 'Striker Die',
  family: 'attack',
  faces: createFaces('attack-die-2', 'attack', [1, 1, 1, 2, 3, 3]),
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
  faces: createFaces('heal-die-1', 'heal', [1, 1, 1, 1, 2, 2]),
}

const DICE_CATALOG: DieInstance[] = [
  WORN_BLADE_DIE,
  STRIKER_DIE,
  IRON_GUARD_DIE,
  VITALITY_DIE,
]

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
