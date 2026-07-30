import { BASE_FACE_CAP } from '../content/upgradeCosts'
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
import type {
  PendingWorkshopForge,
  WorkshopDieFace,
} from '../types/workshop'

export {
  ATTACK_EVOLUTIONS,
  EVOLUTION_DEFINITIONS,
  EVOLUTIONS_BY_FAMILY,
  HEAL_EVOLUTIONS,
  SHIELD_EVOLUTIONS,
}

export interface ForgeResult {
  amount: number
  rolledAmount: number
  dieId: string
  faceId: string
  workshopFaceId: string | null
  cost: number
  newValue: number
  previousValue: number
  isJackpot: boolean
  becameEvolutionReady: boolean
}

export const BASE_CHAOS_FORGE_COST = 5

export function canForgeFace(
  face: FaceInstance,
  faceCap = BASE_FACE_CAP,
): boolean {
  if (face.signature || face.evolution || face.evolutionReady) return false
  return face.value < faceCap
}

export function getDieUpgradeCount(die: DieInstance): number {
  return die.faces.reduce(
    (total, face) => total + Math.max(0, face.value - 1),
    0,
  )
}

export function getPrecisionForgeCost(
  face: FaceInstance,
  faceCap = BASE_FACE_CAP,
  costMultiplier = 1,
): number | null {
  if (!canForgeFace(face, faceCap)) return null
  return Math.max(1, Math.ceil(BASE_CHAOS_FORGE_COST * 2 * Math.max(0, costMultiplier)))
}

export function getChaosEligibleFaces(
  die: DieInstance,
  faceCap = BASE_FACE_CAP,
): FaceInstance[] {
  return die.faces.filter((face) => canForgeFace(face, faceCap))
}

export function getChaosForgeCost(
  die: DieInstance,
  faceCap = BASE_FACE_CAP,
  costMultiplier = 1,
): number | null {
  const eligibleFaces = getChaosEligibleFaces(die, faceCap)
  if (eligibleFaces.length === 0) return null

  const upgradeTier = Math.floor(getDieUpgradeCount(die) / 3)
  const baseCost = BASE_CHAOS_FORGE_COST + upgradeTier * 2
  return Math.max(1, Math.ceil(baseCost * Math.max(0, costMultiplier)))
}

export function forgeFaceOnDie(
  die: DieInstance,
  faceId: string,
  amount = 1,
  faceCap = BASE_FACE_CAP,
): {
  die: DieInstance
  newValue: number
  previousValue: number
} | null {
  const face = die.faces.find((candidate) => candidate.id === faceId)
  if (!face || !canForgeFace(face, faceCap)) return null
  const previousValue = face.value
  const newValue = Math.min(faceCap, face.value + Math.max(1, Math.floor(amount)))

  return {
    newValue,
    previousValue,
    die: {
      ...die,
      faces: die.faces.map((candidate) => (
        candidate.id === faceId
          ? {
              ...candidate,
              value: newValue,
              evolutionReady: undefined,
            }
          : candidate
      )) as DieFaces,
    },
  }
}

export function precisionForge(
  die: DieInstance,
  faceId: string,
  faceCap = BASE_FACE_CAP,
  costMultiplier = 1,
): { die: DieInstance; result: ForgeResult } | null {
  const face = die.faces.find((candidate) => candidate.id === faceId)
  if (!face) return null
  const cost = getPrecisionForgeCost(face, faceCap, costMultiplier)
  const forged = forgeFaceOnDie(die, faceId, 1, faceCap)
  if (cost === null || !forged) return null
  return {
    die: forged.die,
    result: {
      amount: forged.newValue - forged.previousValue,
      rolledAmount: 1,
      dieId: die.id,
      faceId,
      workshopFaceId: null,
      cost,
      newValue: forged.newValue,
      previousValue: forged.previousValue,
      isJackpot: false,
      becameEvolutionReady: false,
    },
  }
}

function clampRandomRoll(random: () => number): number {
  return Math.min(0.999999999, Math.max(0, random()))
}

export function prepareWorkshopForge(
  die: DieInstance,
  operationId: string,
  workshopFaces: readonly WorkshopDieFace[],
  random: () => number = Math.random,
  options: {
    costMultiplier?: number
    faceCap?: number
  } = {},
): PendingWorkshopForge | null {
  if (!operationId || workshopFaces.length === 0) return null
  const faceCap = options.faceCap ?? BASE_FACE_CAP
  const eligibleFaces = getChaosEligibleFaces(die, faceCap)
  const cost = getChaosForgeCost(die, faceCap, options.costMultiplier)
  if (eligibleFaces.length === 0 || cost === null) return null

  const faceRoll = clampRandomRoll(random)
  const targetFace = eligibleFaces[Math.floor(faceRoll * eligibleFaces.length)]
  const workshopRoll = clampRandomRoll(random)
  const workshopFace = workshopFaces[Math.floor(workshopRoll * workshopFaces.length)]
  const rolledAmount = Math.max(1, Math.floor(workshopFace.value))
  const appliedAmount = Math.min(faceCap - targetFace.value, rolledAmount)

  return {
    operationId,
    dieId: die.id,
    targetFaceId: targetFace.id,
    workshopFaceId: workshopFace.id,
    rolledAmount,
    appliedAmount,
    previousValue: targetFace.value,
    cost,
  }
}

export function completeWorkshopForge(
  die: DieInstance,
  pending: PendingWorkshopForge,
  faceCap = BASE_FACE_CAP,
): { die: DieInstance; result: ForgeResult } | null {
  if (pending.dieId !== die.id) return null
  const targetFace = die.faces.find((face) => face.id === pending.targetFaceId)
  if (
    !targetFace
    || targetFace.value !== pending.previousValue
    || !canForgeFace(targetFace, faceCap)
  ) return null

  const appliedAmount = Math.min(
    faceCap - targetFace.value,
    Math.max(1, Math.floor(pending.appliedAmount)),
  )
  const forged = forgeFaceOnDie(die, targetFace.id, appliedAmount, faceCap)
  if (!forged) return null

  return {
    die: forged.die,
    result: {
      amount: forged.newValue - forged.previousValue,
      rolledAmount: pending.rolledAmount,
      dieId: die.id,
      faceId: targetFace.id,
      workshopFaceId: pending.workshopFaceId,
      cost: pending.cost,
      newValue: forged.newValue,
      previousValue: forged.previousValue,
      isJackpot: pending.rolledAmount > 1 && forged.newValue - forged.previousValue > 1,
      becameEvolutionReady: false,
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
