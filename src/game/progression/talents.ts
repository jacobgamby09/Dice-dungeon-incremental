import { TALENTS, TALENTS_BY_ID } from '../content/talents'
import type { PlayerProfile, TalentDefinition, TalentEffect } from '../types/progression'

export const BASE_PLAYER_HP = 10
export const BASE_DICE_SLOTS = 1

function getPurchasedEffects(unlockedTalentIds: readonly string[]): TalentEffect[] {
  const unlocked = new Set(unlockedTalentIds)
  return TALENTS
    .filter((talent) => unlocked.has(talent.id))
    .flatMap((talent) => talent.effects)
}

export function getPlayerMaxHp(unlockedTalentIds: readonly string[]): number {
  return getPurchasedEffects(unlockedTalentIds).reduce(
    (total, effect) => total + (effect.type === 'max_hp' ? effect.amount : 0),
    BASE_PLAYER_HP,
  )
}

export function getDiceCapacity(unlockedTalentIds: readonly string[]): number {
  return getPurchasedEffects(unlockedTalentIds).reduce(
    (total, effect) => total + (effect.type === 'dice_slots' ? effect.amount : 0),
    BASE_DICE_SLOTS,
  )
}

export function getRollSpeed(
  unlockedTalentIds: readonly string[],
  baseRollSpeed: number,
): number {
  return getPurchasedEffects(unlockedTalentIds).reduce(
    (speed, effect) => speed * (effect.type === 'roll_speed' ? effect.multiplier : 1),
    Math.max(0.25, baseRollSpeed),
  )
}

export function hasAutoRollUnlocked(unlockedTalentIds: readonly string[]): boolean {
  return getPurchasedEffects(unlockedTalentIds).some((effect) => effect.type === 'unlock_auto_roll')
}

export function getTalentPurchaseReason(
  profile: PlayerProfile,
  talent: TalentDefinition,
): 'purchased' | 'prerequisite' | 'xp' | null {
  const unlocked = new Set(profile.unlockedTalentIds)
  if (unlocked.has(talent.id)) return 'purchased'
  if (talent.prerequisiteIds.some((id) => !unlocked.has(id))) return 'prerequisite'
  if (profile.xp < talent.cost) return 'xp'
  return null
}

export function canPurchaseTalent(profile: PlayerProfile, talentId: string): boolean {
  const talent = TALENTS_BY_ID[talentId]
  return Boolean(talent && getTalentPurchaseReason(profile, talent) === null)
}

export function isTalentRevealed(
  unlockedTalentIds: readonly string[],
  talent: TalentDefinition,
): boolean {
  const unlocked = new Set(unlockedTalentIds)
  if (unlocked.has(talent.id) || talent.prerequisiteIds.length === 0) return true
  if (talent.prerequisiteIds.every((id) => unlocked.has(id))) return true

  return talent.prerequisiteIds.every((prerequisiteId) => {
    const prerequisite = TALENTS_BY_ID[prerequisiteId]
    return Boolean(
      prerequisite
      && prerequisite.prerequisiteIds.every((id) => unlocked.has(id)),
    )
  })
}
