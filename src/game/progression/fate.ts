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

function sampleWithoutReplacement(
  source: readonly CharmId[],
  count: number,
  random: () => number,
): CharmId[] {
  const pool = [...source]
  const sampled: CharmId[] = []
  while (pool.length > 0 && sampled.length < count) {
    const index = Math.floor(boundedRandom(random) * pool.length)
    sampled.push(pool.splice(index, 1)[0])
  }
  return sampled
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
  if (eligible.length < 3) return null

  const guaranteeNew = Object.values(charmRanks).filter((rank) => (rank ?? 0) > 0).length < 3
  const unowned = eligible.filter((charmId) => (charmRanks[charmId] ?? 0) === 0)
  let offers: CharmId[]

  if (guaranteeNew && unowned.length >= 3) {
    offers = sampleWithoutReplacement(unowned, 3, random)
  } else {
    offers = []
    const remaining = [...eligible]
    while (offers.length < 3 && remaining.length > 0) {
      const weights = remaining.map((charmId) => (
        (charmRanks[charmId] ?? 0) === 0 ? 4 : 1
      ))
      const totalWeight = weights.reduce((total, weight) => total + weight, 0)
      let cursor = boundedRandom(random) * totalWeight
      let selectedIndex = 0
      for (let index = 0; index < weights.length; index += 1) {
        cursor -= weights[index]
        if (cursor < 0) {
          selectedIndex = index
          break
        }
      }
      offers.push(remaining.splice(selectedIndex, 1)[0])
    }
  }

  if (offers.length !== 3) return null
  return {
    operationId,
    offeredCharmIds: offers as [CharmId, CharmId, CharmId],
    cost: FATE_DRAW_COST,
  }
}

export function claimFateDraw(
  charmRanks: Readonly<CharmRanks>,
  pendingDraw: PendingFateDraw,
  charmId: CharmId,
): CharmRanks | null {
  if (!pendingDraw.offeredCharmIds.includes(charmId)) return null
  if (!CHARM_DEFINITIONS[charmId]) return null
  const currentRank = charmRanks[charmId] ?? 0
  if (currentRank >= MAX_CHARM_RANK) return null
  return {
    ...charmRanks,
    [charmId]: currentRank + 1,
  }
}
