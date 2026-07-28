import { getFaceUpgradeCost } from '../content/upgradeCosts'
import type {
  AttackEvolutionId,
  DieFaces,
  DieInstance,
  FaceEvolution,
  FaceInstance,
} from '../types/dice'

export const ATTACK_EVOLUTIONS: Record<AttackEvolutionId, FaceEvolution & {
  description: string
  resultValue: number
}> = {
  power: {
    id: 'power',
    name: 'Power',
    description: 'Deal 5 Attack immediately.',
    resultValue: 5,
  },
  momentum: {
    id: 'momentum',
    name: 'Momentum',
    description: 'Deal 3 Attack and add +2 to the next rolled face. If last, gain +2 Attack.',
    resultValue: 3,
  },
  rend: {
    id: 'rend',
    name: 'Rend',
    description: 'Deal 2 Attack and apply 2 Bleed. Bleed starts next round and ignores Shield.',
    resultValue: 2,
  },
}

export interface ForgeResult {
  dieId: string
  faceId: string
  cost: number
  becameEvolutionReady: boolean
}

export function canForgeFace(face: FaceInstance): boolean {
  if (face.evolution || face.evolutionReady) return false
  if (face.type === 'attack') return face.value <= 3
  return getFaceUpgradeCost(face.value) !== null
}

export function getPrecisionForgeCost(face: FaceInstance): number | null {
  if (!canForgeFace(face)) return null
  const baseCost = getFaceUpgradeCost(face.value)
  return baseCost === null ? null : baseCost * 2
}

export function getChaosEligibleFaces(die: DieInstance): FaceInstance[] {
  return die.faces.filter(canForgeFace)
}

export function getChaosForgeCost(die: DieInstance): number | null {
  const eligibleFaces = getChaosEligibleFaces(die)
  if (eligibleFaces.length === 0) return null
  const costs = eligibleFaces
    .map(getPrecisionForgeCost)
    .filter((cost): cost is number => cost !== null)
  if (costs.length === 0) return null

  const cheapestPrecisionCost = Math.min(...costs)
  const discount = 0.35 * Math.min(1, Math.max(0, (eligibleFaces.length - 1) / 5))
  return Math.ceil(cheapestPrecisionCost * (1 - discount))
}

export function forgeFaceOnDie(die: DieInstance, faceId: string): {
  die: DieInstance
  becameEvolutionReady: boolean
} | null {
  const face = die.faces.find((candidate) => candidate.id === faceId)
  if (!face || !canForgeFace(face)) return null
  const becameEvolutionReady = face.type === 'attack' && face.value === 3

  return {
    becameEvolutionReady,
    die: {
      ...die,
      faces: die.faces.map((candidate) => (
        candidate.id === faceId
          ? {
              ...candidate,
              value: becameEvolutionReady ? candidate.value : candidate.value + 1,
              evolutionReady: becameEvolutionReady || undefined,
            }
          : candidate
      )) as DieFaces,
    },
  }
}

export function precisionForge(
  die: DieInstance,
  faceId: string,
): { die: DieInstance; result: ForgeResult } | null {
  const face = die.faces.find((candidate) => candidate.id === faceId)
  if (!face) return null
  const cost = getPrecisionForgeCost(face)
  const forged = forgeFaceOnDie(die, faceId)
  if (cost === null || !forged) return null
  return {
    die: forged.die,
    result: {
      dieId: die.id,
      faceId,
      cost,
      becameEvolutionReady: forged.becameEvolutionReady,
    },
  }
}

export function chaosForge(
  die: DieInstance,
  random: () => number = Math.random,
): { die: DieInstance; result: ForgeResult } | null {
  const eligibleFaces = getChaosEligibleFaces(die)
  const cost = getChaosForgeCost(die)
  if (eligibleFaces.length === 0 || cost === null) return null
  const boundedRoll = Math.min(0.999999999, Math.max(0, random()))
  const face = eligibleFaces[Math.floor(boundedRoll * eligibleFaces.length)]
  const forged = forgeFaceOnDie(die, face.id)
  if (!forged) return null
  return {
    die: forged.die,
    result: {
      dieId: die.id,
      faceId: face.id,
      cost,
      becameEvolutionReady: forged.becameEvolutionReady,
    },
  }
}

export function evolveAttackFace(
  die: DieInstance,
  faceId: string,
  evolutionId: AttackEvolutionId,
): DieInstance | null {
  const face = die.faces.find((candidate) => candidate.id === faceId)
  if (!face || face.type !== 'attack' || !face.evolutionReady || face.evolution) return null
  return {
    ...die,
    faces: die.faces.map((candidate) => (
      candidate.id === faceId
        ? {
            ...candidate,
            value: ATTACK_EVOLUTIONS[evolutionId].resultValue,
            evolutionReady: undefined,
            evolution: {
              id: ATTACK_EVOLUTIONS[evolutionId].id,
              name: ATTACK_EVOLUTIONS[evolutionId].name,
            },
          }
        : candidate
    )) as DieFaces,
  }
}

export function migrateLegacyAttackEvolution(face: FaceInstance): FaceInstance {
  if (face.type !== 'attack' || face.evolution || face.value <= 3) return face
  return {
    ...face,
    value: ATTACK_EVOLUTIONS.power.resultValue,
    evolutionReady: undefined,
    evolution: {
      id: ATTACK_EVOLUTIONS.power.id,
      name: ATTACK_EVOLUTIONS.power.name,
    },
  }
}
