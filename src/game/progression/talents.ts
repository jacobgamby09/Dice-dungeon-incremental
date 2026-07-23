import { TALENTS, TALENTS_BY_ID } from '../content/talents'
import type {
  PlayerProfile,
  TalentDefinition,
  TalentEffect,
  TalentRanks,
} from '../types/progression'

export const BASE_PLAYER_HP = 10
export const BASE_DICE_SLOTS = 1

export type TalentPurchaseReason = 'maxed' | 'prerequisite' | 'xp'
export type TalentVisibility = 'hidden' | 'silhouette' | 'revealed'

export function getTalentRank(
  talentRanks: Readonly<TalentRanks>,
  talentId: string,
): number {
  const rank = talentRanks[talentId]
  return Number.isInteger(rank) && rank > 0 ? rank : 0
}

export function getTalentMaxRank(talent: TalentDefinition): number {
  return talent.ranks.length
}

export function getNextTalentRank(
  talentRanks: Readonly<TalentRanks>,
  talent: TalentDefinition,
) {
  return talent.ranks[getTalentRank(talentRanks, talent.id)] ?? null
}

export function isTalentPurchased(
  talentRanks: Readonly<TalentRanks>,
  talentId: string,
): boolean {
  return getTalentRank(talentRanks, talentId) > 0
}

function getPurchasedEffects(talentRanks: Readonly<TalentRanks>): TalentEffect[] {
  return TALENTS.flatMap((talent) => (
    talent.ranks
      .slice(0, Math.min(getTalentRank(talentRanks, talent.id), getTalentMaxRank(talent)))
      .flatMap((rank) => rank.effects)
  ))
}

export function getPlayerMaxHp(talentRanks: Readonly<TalentRanks>): number {
  return getPurchasedEffects(talentRanks).reduce(
    (total, effect) => total + (effect.type === 'max_hp' ? effect.amount : 0),
    BASE_PLAYER_HP,
  )
}

export function getDiceCapacity(talentRanks: Readonly<TalentRanks>): number {
  return getPurchasedEffects(talentRanks).reduce(
    (total, effect) => total + (effect.type === 'dice_slots' ? effect.amount : 0),
    BASE_DICE_SLOTS,
  )
}

export function getRollSpeed(
  talentRanks: Readonly<TalentRanks>,
  baseRollSpeed: number,
): number {
  return getPurchasedEffects(talentRanks).reduce(
    (speed, effect) => speed * (effect.type === 'roll_speed' ? effect.multiplier : 1),
    Math.max(0.25, baseRollSpeed),
  )
}

export function hasAutoRollUnlocked(talentRanks: Readonly<TalentRanks>): boolean {
  return getPurchasedEffects(talentRanks).some((effect) => effect.type === 'unlock_auto_roll')
}

export function areTalentPrerequisitesMet(
  talentRanks: Readonly<TalentRanks>,
  talent: TalentDefinition,
): boolean {
  return talent.prerequisiteIds.every((id) => isTalentPurchased(talentRanks, id))
}

export function getTalentPurchaseReason(
  profile: PlayerProfile,
  talent: TalentDefinition,
): TalentPurchaseReason | null {
  const nextRank = getNextTalentRank(profile.talentRanks, talent)
  if (!nextRank) return 'maxed'
  if (!areTalentPrerequisitesMet(profile.talentRanks, talent)) return 'prerequisite'
  if (profile.xp < nextRank.cost) return 'xp'
  return null
}

export function canPurchaseTalent(profile: PlayerProfile, talentId: string): boolean {
  const talent = TALENTS_BY_ID[talentId]
  return Boolean(talent && getTalentPurchaseReason(profile, talent) === null)
}

export function getTalentVisibility(
  talentRanks: Readonly<TalentRanks>,
  talent: TalentDefinition,
  visited: ReadonlySet<string> = new Set(),
): TalentVisibility {
  if (talent.prerequisiteIds.length === 0) return 'revealed'
  if (isTalentPurchased(talentRanks, talent.id)) return 'revealed'
  if (areTalentPrerequisitesMet(talentRanks, talent)) return 'revealed'
  if (visited.has(talent.id)) return 'hidden'

  const nextVisited = new Set(visited)
  nextVisited.add(talent.id)
  const prerequisitesAreRevealed = talent.prerequisiteIds.every((prerequisiteId) => {
    const prerequisite = TALENTS_BY_ID[prerequisiteId]
    return Boolean(
      prerequisite
      && getTalentVisibility(talentRanks, prerequisite, nextVisited) === 'revealed',
    )
  })

  return prerequisitesAreRevealed ? 'silhouette' : 'hidden'
}

export function normalizeTalentRanks(candidate: unknown): TalentRanks {
  if (!candidate || typeof candidate !== 'object') return {}

  return Object.fromEntries(
    Object.entries(candidate)
      .map(([talentId, rank]) => {
        const talent = TALENTS_BY_ID[talentId]
        if (!talent || !Number.isFinite(rank)) return null
        const normalizedRank = Math.min(
          getTalentMaxRank(talent),
          Math.max(0, Math.floor(Number(rank))),
        )
        return normalizedRank > 0 ? [talentId, normalizedRank] as const : null
      })
      .filter((entry): entry is readonly [string, number] => entry !== null),
  )
}
