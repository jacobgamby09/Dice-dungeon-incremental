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

const ATTACK_DIE: DieInstance = {
  id: 'attack-die-1',
  name: 'Attack Die',
  family: 'attack',
  faces: createFaces('attack-die-1', 'attack', [1, 1, 2, 2, 2, 3]),
}

const SHIELD_DIE: DieInstance = {
  id: 'shield-die-1',
  name: 'Shield Die',
  family: 'shield',
  faces: createFaces('shield-die-1', 'shield', [1, 1, 2, 2, 2, 3]),
}

const HEAL_DIE: DieInstance = {
  id: 'heal-die-1',
  name: 'Heal Die',
  family: 'heal',
  faces: createFaces('heal-die-1', 'heal', [1, 1, 1, 1, 2, 2]),
}

const DICE_CATALOG: DieInstance[] = [ATTACK_DIE, SHIELD_DIE, HEAL_DIE]

export function createDiceCatalog(): DieInstance[] {
  return DICE_CATALOG.map(cloneDie)
}

export function createStartingDice(): DieInstance[] {
  return [cloneDie(ATTACK_DIE)]
}
