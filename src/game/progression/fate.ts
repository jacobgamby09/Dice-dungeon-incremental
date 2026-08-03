import {
  CHARM_DEFINITIONS,
  CHARM_RARITY_DEFINITIONS,
  CHARMS,
} from '../content/charms'
import type {
  CharmRanks,
  CharmRarity,
  CharmRarityProgress,
  FateDropResult,
  FateRewardTier,
  PendingFateDraw,
} from '../types/charms'

export const FATE_DRAW_COST = 5
export const FATE_DROP_CHANCE = 0.2
export const FATE_PITY_THRESHOLD = 5
export const MAX_CHARM_RANK = 3

export interface CharmRarityProtection {
  epicThreshold: number
  legendaryThreshold?: number
}

export interface FateDrawCreationResult {
  draw: PendingFateDraw
  nextProgress: CharmRarityProgress
}

export const EMPTY_CHARM_RARITY_PROGRESS: CharmRarityProgress = {
  epicMisses: 0,
  legendaryMisses: 0,
}

function boundedRandom(random: () => number): number {
  return Math.min(0.999999999, Math.max(0, random()))
}

export function normalizeCharmRarityProgress(
  candidate?: Partial<CharmRarityProgress> | null,
): CharmRarityProgress {
  return {
    epicMisses: Number.isFinite(candidate?.epicMisses)
      ? Math.max(0, Math.floor(candidate?.epicMisses ?? 0))
      : 0,
    legendaryMisses: Number.isFinite(candidate?.legendaryMisses)
      ? Math.max(0, Math.floor(candidate?.legendaryMisses ?? 0))
      : 0,
  }
}

export function rollFateDrop(
  tier: FateRewardTier,
  currentPity: number,
  random: () => number = Math.random,
  chanceMultiplier = 1,
): FateDropResult {
  if (tier === 'boss') return { tokens: 3, nextPity: 0, pityTriggered: false }
  if (tier === 'elite') return { tokens: 1, nextPity: 0, pityTriggered: false }

  const nextMissCount = Math.max(0, currentPity) + 1
  const pityTriggered = nextMissCount >= FATE_PITY_THRESHOLD
  const randomDrop = boundedRandom(random) < Math.min(1, FATE_DROP_CHANCE * Math.max(0, chanceMultiplier))
  return pityTriggered || randomDrop
    ? { tokens: 1, nextPity: 0, pityTriggered }
    : { tokens: 0, nextPity: nextMissCount, pityTriggered: false }
}

function weightedPick<T>(
  source: readonly T[],
  getWeight: (value: T) => number,
  random: () => number,
): T | null {
  const totalWeight = source.reduce((total, value) => total + getWeight(value), 0)
  if (source.length === 0 || totalWeight <= 0) return null
  let cursor = boundedRandom(random) * totalWeight
  for (const value of source) {
    cursor -= getWeight(value)
    if (cursor < 0) return value
  }
  return source[source.length - 1]
}

function selectRarity(
  eligibleRarities: readonly CharmRarity[],
  progress: CharmRarityProgress,
  protection: CharmRarityProtection | null,
  random: () => number,
): { rarity: CharmRarity; protectionTriggered?: 'epic' | 'legendary' } | null {
  if (
    protection?.legendaryThreshold
    && progress.legendaryMisses >= protection.legendaryThreshold - 1
    && eligibleRarities.includes('legendary')
  ) return { rarity: 'legendary', protectionTriggered: 'legendary' }

  if (protection && progress.epicMisses >= protection.epicThreshold - 1) {
    const epicPlus = eligibleRarities.filter((rarity) => (
      rarity === 'epic' || rarity === 'legendary'
    ))
    const rarity = weightedPick(
      epicPlus,
      (candidate) => CHARM_RARITY_DEFINITIONS[candidate].weight,
      random,
    )
    return rarity ? { rarity, protectionTriggered: 'epic' } : null
  }

  const rarity = weightedPick(
    eligibleRarities,
    (candidate) => CHARM_RARITY_DEFINITIONS[candidate].weight,
    random,
  )
  return rarity ? { rarity } : null
}

function getNextProgress(
  rarity: CharmRarity,
  current: CharmRarityProgress,
  protection: CharmRarityProtection | null,
): CharmRarityProgress {
  if (!protection) return EMPTY_CHARM_RARITY_PROGRESS
  return {
    epicMisses: rarity === 'epic' || rarity === 'legendary'
      ? 0
      : current.epicMisses + 1,
    legendaryMisses: rarity === 'legendary' ? 0 : current.legendaryMisses + 1,
  }
}

export function createFateDraw(
  charmRanks: Readonly<CharmRanks>,
  operationId: string,
  rarityProgress: Readonly<CharmRarityProgress> = EMPTY_CHARM_RARITY_PROGRESS,
  protection: CharmRarityProtection | null = null,
  random: () => number = Math.random,
): FateDrawCreationResult | null {
  if (!operationId) return null
  const eligible = CHARMS.filter((charm) => (
    (charmRanks[charm.id] ?? 0) < MAX_CHARM_RANK
  ))
  const eligibleRarities = [...new Set(eligible.map((charm) => charm.rarity))]
  const progress = normalizeCharmRarityProgress(rarityProgress)
  const raritySelection = selectRarity(eligibleRarities, progress, protection, random)
  if (!raritySelection) return null

  const candidates = eligible.filter((charm) => charm.rarity === raritySelection.rarity)
  const selected = weightedPick(
    candidates,
    (charm) => (charmRanks[charm.id] ?? 0) === 0 ? 4 : 1,
    random,
  )
  if (!selected) return null
  return {
    draw: {
      operationId,
      selectedCharmId: selected.id,
      rarity: selected.rarity,
      cost: FATE_DRAW_COST,
      protectionTriggered: raritySelection.protectionTriggered,
    },
    nextProgress: getNextProgress(selected.rarity, progress, protection),
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
  return { ...charmRanks, [charmId]: currentRank + 1 }
}
