import type { TalentRanks } from '../types/progression'
import type { SoulDieRollResult } from '../types/dice'
import { getXpRewardBonus } from './talents'

export interface EnemyRewardBreakdown {
  baseSouls: number
  baseXp: number
  bonusSouls: number
  bonusXp: number
  soulRoll: SoulDieRollResult
  souls: number
  xp: number
}

export function getEnemyRewardBreakdown(
  baseXp: number,
  soulRoll: SoulDieRollResult,
  talentRanks: Readonly<TalentRanks>,
): EnemyRewardBreakdown {
  const bonusXp = getXpRewardBonus(talentRanks)
  return {
    baseSouls: soulRoll.soulValue,
    baseXp,
    bonusSouls: Math.max(0, soulRoll.payout - soulRoll.soulValue),
    bonusXp,
    soulRoll,
    souls: soulRoll.payout,
    xp: baseXp + bonusXp,
  }
}
