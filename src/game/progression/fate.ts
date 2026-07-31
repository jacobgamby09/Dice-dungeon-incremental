import { CHARM_DEFINITIONS, CHARMS } from '../content/charms'
import type {
  CharmId,
  CharmRanks,
  FateDropResult,
  FateRewardTier,
  PendingFateDraw,
} from '../types/charms'

export const FATE_DRAW_COST = 5
export const FATE_DROP_CHANCE = 0.2
export const FATE_PITY_THRESHOLD = 5
export const MAX_CHARM_RANK = 3

function boundedRandom(random: () => number): number {
  return Math.min(0.999999999, Math.max(0, random()))
}

export function rollFateDrop(
  tier: FateRewardTier,
  currentPity: number,
  random: () => number = Math.random,
): FateDropResult {
  if (tier === 'boss') {
    return { tokens: 3, nextPity: 0, pityTriggered: false }
  }
  if (tier === 'elite') {
    return { tokens: 1, nextPity: 0, pityTriggered: false }
  }

  const nextMissCount = Math.max(0, currentPity) + 1
  const pityTriggered = nextMissCount >= FATE_PITY_THRESHOLD
  const randomDrop = boundedRandom(random) < FATE_DROP_CHANCE
  if (pityTriggered || randomDrop) {
    return { tokens: 1, nextPity: 0, pityTriggered }
  }
  return { tokens: 0, nextPity: nextMissCount, pityTriggered: false }
}

function selectWeightedCharm(
  source: readonly CharmId[],
  charmRanks: Readonly<CharmRanks>,
  random: () => number,
): CharmId | null {
  if (source.length === 0) return null
  const weights = source.map((charmId) => (
    (charmRanks[charmId] ?? 0) === 0 ? 4 : 1
  ))
  const totalWeight = weights.reduce((total, weight) => total + weight, 0)
  let cursor = boundedRandom(random) * totalWeight
  for (let index = 0; index < source.length; index += 1) {
    cursor -= weights[index]
    if (cursor < 0) return source[index]
  }
  return source[source.length - 1]
}

export function createFateDraw(
  charmRanks: Readonly<CharmRanks>,
  operationId: string,
  random: () => number = Math.random,
): PendingFateDraw | null {
  if (!operationId) return null
  const eligible = CHARMS
    .filter((charm) => (charmRanks[charm.id] ?? 0) < MAX_CHARM_RANK)
    .map((charm) => charm.id)
  if (eligible.length === 0) return null

  const guaranteeNew = Object.values(charmRanks).filter((rank) => (rank ?? 0) > 0).length < 3
  const unowned = eligible.filter((charmId) => (charmRanks[charmId] ?? 0) === 0)
  const selectionPool = guaranteeNew && unowned.length > 0 ? unowned : eligible
  const selectedCharmId = selectWeightedCharm(selectionPool, charmRanks, random)
  if (!selectedCharmId) return null
  return {
    operationId,
    selectedCharmId,
    cost: FATE_DRAW_COST,
  }
}

export function claimFateDraw(
  charmRanks: Readonly<CharmRanks>,
  pendingDraw: PendingFateDraw,
): CharmRanks | null {
  const charmId = pendingDraw.selectedCharmId
  if (!CHARM_DEFINITIONS[charmId]) return null
  const currentRank = charmRanks[charmId] ?? 0
  if (currentRank >= MAX_CHARM_RANK) return null
  return {
    ...charmRanks,
    [charmId]: currentRank + 1,
  }
}
