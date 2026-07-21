export const FACE_TYPES = ['attack', 'shield', 'heal'] as const

export type FaceType = (typeof FACE_TYPES)[number]
export type DieFamily = FaceType

export interface FaceEvolution {
  id: string
  name: string
}

export interface FaceInstance {
  id: string
  type: FaceType
  value: number
  evolution?: FaceEvolution
}

export type DieFaces = [
  FaceInstance,
  FaceInstance,
  FaceInstance,
  FaceInstance,
  FaceInstance,
  FaceInstance,
]

export interface DieInstance {
  id: string
  name: string
  family: DieFamily
  faces: DieFaces
}

export interface RollResult {
  dieId: string
  dieName: string
  faceId: string
  faceIndex: number
  type: FaceType
  value: number
}

export function cloneDie(die: DieInstance): DieInstance {
  return {
    ...die,
    faces: die.faces.map((face) => ({
      ...face,
      evolution: face.evolution ? { ...face.evolution } : undefined,
    })) as DieFaces,
  }
}

