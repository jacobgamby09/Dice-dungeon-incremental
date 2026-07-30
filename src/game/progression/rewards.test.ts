import { describe, expect, it } from 'vitest'
import { TALENT_IDS } from '../content/talents'
import type { SoulDieRollResult } from '../types/dice'
import { getEnemyRewardBreakdown } from './rewards'

function createSoulRoll(
  soulValue: number,
  multiplier: number,
): SoulDieRollResult {
  return {
    dieId: 'soul-die',
    dieName: 'Soul Die',
    faceId: 'soul-die-face-1',
    faceIndex: 0,
    multiplier,
    soulValue,
    payout: soulValue * multiplier,
  }
}

describe('enemy reward breakdown', () => {
  it('keeps XP efficiency separate from the Soul Die payout', () => {
    const soulRoll = createSoulRoll(5, 2)
    expect(getEnemyRewardBreakdown(4, soulRoll, {
      [TALENT_IDS.fieldStudies]: 2,
      [TALENT_IDS.soulHarvest]: 3,
    })).toEqual({
      baseSouls: 5,
      baseXp: 4,
      bonusSouls: 5,
      bonusXp: 2,
      soulRoll,
      souls: 10,
      xp: 6,
    })
  })

  it('uses the locked Soul Die result without a separate Soul bonus', () => {
    const soulRoll = createSoulRoll(5, 1)
    expect(getEnemyRewardBreakdown(4, soulRoll, {})).toMatchObject({
      bonusSouls: 0,
      bonusXp: 0,
      souls: 5,
      xp: 4,
    })
  })
})
