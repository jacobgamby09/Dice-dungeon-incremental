import { describe, expect, it } from 'vitest'
import { TALENT_IDS } from '../content/talents'
import { getEnemyRewardBreakdown } from './rewards'

describe('talent reward efficiency', () => {
  it('adds flat, readable XP and Soul bonuses to every defeated enemy', () => {
    expect(getEnemyRewardBreakdown(4, 5, {
      [TALENT_IDS.fieldStudies]: 2,
      [TALENT_IDS.soulHarvest]: 3,
    })).toEqual({
      baseSouls: 5,
      baseXp: 4,
      bonusSouls: 3,
      bonusXp: 2,
      souls: 8,
      xp: 6,
    })
  })

  it('does not change rewards without efficiency talents', () => {
    expect(getEnemyRewardBreakdown(4, 5, {})).toMatchObject({
      bonusSouls: 0,
      bonusXp: 0,
      souls: 5,
      xp: 4,
    })
  })
})
