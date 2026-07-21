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

const STARTING_DICE: DieInstance[] = [
  {
    id: 'attack-die-1',
    name: 'Attack Die',
    family: 'attack',
    faces: createFaces('attack-die-1', 'attack', [1, 1, 2, 2, 2, 3]),
  },
  {
    id: 'shield-die-1',
    name: 'Shield Die',
    family: 'shield',
    faces: createFaces('shield-die-1', 'shield', [1, 1, 2, 2, 2, 3]),
  },
  {
    id: 'heal-die-1',
    name: 'Heal Die',
    family: 'heal',
    faces: createFaces('heal-die-1', 'heal', [1, 1, 1, 1, 2, 2]),
  },
]

export function createStartingDice(): DieInstance[] {
  return STARTING_DICE.map(cloneDie)
}

