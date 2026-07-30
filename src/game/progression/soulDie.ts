import { createSoulDie } from '../content/dice'
import type {
  SoulDieRollResult,
  SoulDieState,
  SoulDieValues,
} from '../types/dice'

function boundedRandom(random: () => number): number {
  return Math.min(0.999999999, Math.max(0, random()))
}

function shuffleFaceIds(
  faceIds: readonly string[],
  random: () => number,
): string[] {
  const shuffled = [...faceIds]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(boundedRandom(random) * (index + 1))
    const current = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = current
  }
  return shuffled
}

export function createSoulDieState(): SoulDieState {
  return { drawPileFaceIds: [] }
}

export function normalizeSoulDieState(candidate: unknown): SoulDieState {
  if (!candidate || typeof candidate !== 'object') return createSoulDieState()
  const drawPileFaceIds = (candidate as Partial<SoulDieState>).drawPileFaceIds
  if (!Array.isArray(drawPileFaceIds)) return createSoulDieState()

  const validIds = new Set(createSoulDie().faces.map((face) => face.id))
  const normalized = drawPileFaceIds.filter((faceId): faceId is string => (
    typeof faceId === 'string' && validIds.has(faceId)
  ))
  if (new Set(normalized).size !== normalized.length) return createSoulDieState()
  return { drawPileFaceIds: normalized }
}

export function drawSoulDie(
  state: Readonly<SoulDieState>,
  values: SoulDieValues,
  soulValue: number,
  random: () => number = Math.random,
): { nextState: SoulDieState; result: SoulDieRollResult } {
  const die = createSoulDie(values)
  const validFaceIds = new Set(die.faces.map((face) => face.id))
  const persistedPile = state.drawPileFaceIds.filter((faceId) => validFaceIds.has(faceId))
  const drawPile = persistedPile.length > 0
    ? [...persistedPile]
    : shuffleFaceIds(die.faces.map((face) => face.id), random)
  const faceId = drawPile.shift()
  const faceIndex = die.faces.findIndex((face) => face.id === faceId)
  const face = die.faces[faceIndex]

  if (!face) throw new Error('Soul Die draw pile produced an unknown face.')

  const normalizedSoulValue = Math.max(0, Math.floor(soulValue))
  return {
    nextState: { drawPileFaceIds: drawPile },
    result: {
      dieId: die.id,
      dieName: die.name,
      faceId: face.id,
      faceIndex,
      multiplier: face.multiplier,
      soulValue: normalizedSoulValue,
      payout: normalizedSoulValue * face.multiplier,
    },
  }
}
