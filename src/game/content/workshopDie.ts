import type { WorkshopDieFace, WorkshopDieValues } from '../types/workshop'

export const WORKSHOP_DIE_FACE_IDS = [
  'workshop-die-face-1',
  'workshop-die-face-2',
  'workshop-die-face-3',
  'workshop-die-face-4',
  'workshop-die-face-5',
  'workshop-die-face-6',
] as const

export const BASE_WORKSHOP_DIE_VALUES: WorkshopDieValues = [1, 1, 1, 1, 1, 2]

export function createWorkshopDieFaces(
  values: WorkshopDieValues = BASE_WORKSHOP_DIE_VALUES,
): WorkshopDieFace[] {
  return WORKSHOP_DIE_FACE_IDS.map((id, index) => ({
    id,
    value: Math.max(1, Math.floor(values[index])),
  }))
}

export function getWorkshopDieAverage(faces: readonly WorkshopDieFace[]): number {
  if (faces.length === 0) return 0
  return faces.reduce((total, face) => total + face.value, 0) / faces.length
}
