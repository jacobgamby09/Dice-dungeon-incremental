import { getFaceUpgradeCost } from '../content/upgradeCosts'
import {
  ATTACK_EVOLUTIONS,
  EVOLUTION_DEFINITIONS,
  EVOLUTIONS_BY_FAMILY,
  HEAL_EVOLUTIONS,
  SHIELD_EVOLUTIONS,
} from '../content/faceEffects'
import type {
  DieFaces,
  DieInstance,
  FaceEvolutionId,
  FaceInstance,
} from '../types/dice'

export {
  ATTACK_EVOLUTIONS,
  EVOLUTION_DEFINITIONS,
  EVOLUTIONS_BY_FAMILY,
  HEAL_EVOLUTIONS,
  SHIELD_EVOLUTIONS,
}

export interface ForgeResult {
  dieId: string
  faceId: string
  cost: number
  becameEvolutionReady: boolean
}

export function canForgeFace(face: FaceInstance): boolean {
  if (face.signature || face.evolution || face.evolutionReady) return false
  return face.value <= 3
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
  const becameEvolutionReady = face.value === 3

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

export function evolveFaceOnDie(
  die: DieInstance,
  faceId: string,
  evolutionId: FaceEvolutionId,
): DieInstance | null {
  const face = die.faces.find((candidate) => candidate.id === faceId)
  const evolution = EVOLUTION_DEFINITIONS[evolutionId]
  if (
    !face
    || face.signature
    || !face.evolutionReady
    || face.evolution
    || evolution.family !== face.type
  ) return null
  return {
    ...die,
    faces: die.faces.map((candidate) => (
      candidate.id === faceId
        ? {
            ...candidate,
            value: evolution.resultValue,
            evolutionReady: undefined,
            evolution: {
              id: evolution.id,
              name: evolution.name,
            },
          }
        : candidate
    )) as DieFaces,
  }
}

export function migrateLegacyFaceEvolution(face: FaceInstance): FaceInstance {
  if (face.signature || face.evolution || face.value <= 3) return face
  const evolution = EVOLUTIONS_BY_FAMILY[face.type][0]
  return {
    ...face,
    value: evolution.resultValue,
    evolutionReady: undefined,
    evolution: {
      id: evolution.id,
      name: evolution.name,
    },
  }
}

export const evolveAttackFace = evolveFaceOnDie
export const migrateLegacyAttackEvolution = migrateLegacyFaceEvolution
