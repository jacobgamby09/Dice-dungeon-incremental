export const FACE_TYPES = ['attack', 'shield', 'heal'] as const

export type FaceType = (typeof FACE_TYPES)[number]
export type DieFamily = FaceType

export const ATTACK_EVOLUTION_IDS = ['power', 'momentum', 'rend'] as const
export const SHIELD_EVOLUTION_IDS = ['bastion', 'reserve', 'spikes'] as const
export const HEAL_EVOLUTION_IDS = ['restoration', 'regrowth', 'overflow'] as const
export const FACE_EVOLUTION_IDS = [
  ...ATTACK_EVOLUTION_IDS,
  ...SHIELD_EVOLUTION_IDS,
  ...HEAL_EVOLUTION_IDS,
] as const
export type AttackEvolutionId = (typeof ATTACK_EVOLUTION_IDS)[number]
export type ShieldEvolutionId = (typeof SHIELD_EVOLUTION_IDS)[number]
export type HealEvolutionId = (typeof HEAL_EVOLUTION_IDS)[number]
export type FaceEvolutionId = (typeof FACE_EVOLUTION_IDS)[number]

export const SIGNATURE_FACE_IDS = ['execute', 'fortify'] as const
export type SignatureFaceId = (typeof SIGNATURE_FACE_IDS)[number]

export interface FaceEvolution {
  id: FaceEvolutionId
  name: string
}

export interface FaceSignature {
  id: SignatureFaceId
  name: string
}

export interface FaceInstance {
  id: string
  type: FaceType
  value: number
  evolutionReady?: boolean
  evolution?: FaceEvolution
  signature?: FaceSignature
}

export type DieFaces = [
  FaceInstance,
  FaceInstance,
  FaceInstance,
  FaceInstance,
  FaceInstance,
  FaceInstance,
]

export interface SoulDieFace {
  id: string
  multiplier: number
}

export type SoulDieFaces = [
  SoulDieFace,
  SoulDieFace,
  SoulDieFace,
  SoulDieFace,
  SoulDieFace,
  SoulDieFace,
]

export interface SoulDieDefinition {
  id: 'soul-die'
  name: string
  faces: SoulDieFaces
}

export type SoulDieValues = [
  number,
  number,
  number,
  number,
  number,
  number,
]

export interface SoulDieState {
  drawPileFaceIds: string[]
}

export interface SoulDieRollResult {
  dieId: SoulDieDefinition['id']
  dieName: string
  faceId: string
  faceIndex: number
  multiplier: number
  soulValue: number
  payout: number
}

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
  charmBonus?: number
  charmTriggers?: import('./charms').CharmTrigger[]
  evolution?: FaceEvolution
  signature?: FaceSignature
}

export function cloneDie(die: DieInstance): DieInstance {
  return {
    ...die,
    faces: die.faces.map((face) => ({
      ...face,
      evolution: face.evolution ? { ...face.evolution } : undefined,
      signature: face.signature ? { ...face.signature } : undefined,
    })) as DieFaces,
  }
}
