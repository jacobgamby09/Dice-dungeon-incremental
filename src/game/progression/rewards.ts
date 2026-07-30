import type { TalentRanks } from '../types/progression'
import { getSoulRewardBonus, getXpRewardBonus } from './talents'

export interface EnemyRewardBreakdown {
  baseSouls: number
  baseXp: number
  bonusSouls: number
  bonusXp: number
  souls: number
  xp: number
}

export function getEnemyRewardBreakdown(
  baseXp: number,
  baseSouls: number,
  talentRanks: Readonly<TalentRanks>,
): EnemyRewardBreakdown {
  const bonusXp = getXpRewardBonus(talentRanks)
  const bonusSouls = getSoulRewardBonus(talentRanks)
  return {
    baseSouls,
    baseXp,
    bonusSouls,
    bonusXp,
    souls: baseSouls + bonusSouls,
    xp: baseXp + bonusXp,
  }
}
