import { describe, expect, it } from 'vitest'
import { TALENT_IDS, TALENTS_BY_ID } from '../content/talents'
import { isTalentRevealed } from './talents'

describe('talent progressive reveal', () => {
  it('shows only the current foundation node and one look-ahead node on a fresh profile', () => {
    expect(isTalentRevealed([], TALENTS_BY_ID[TALENT_IDS.battleHardenedOne])).toBe(true)
    expect(isTalentRevealed([], TALENTS_BY_ID[TALENT_IDS.twinArsenal])).toBe(true)
    expect(isTalentRevealed([], TALENTS_BY_ID[TALENT_IDS.shieldcraft])).toBe(false)
    expect(isTalentRevealed([], TALENTS_BY_ID[TALENT_IDS.thirdGrip])).toBe(false)
  })

  it('teases all three specialisations when Shieldcraft becomes the next purchase', () => {
    const unlocked = [TALENT_IDS.battleHardenedOne, TALENT_IDS.twinArsenal]

    expect(isTalentRevealed(unlocked, TALENTS_BY_ID[TALENT_IDS.shieldcraft])).toBe(true)
    expect(isTalentRevealed(unlocked, TALENTS_BY_ID[TALENT_IDS.battleHardenedTwo])).toBe(true)
    expect(isTalentRevealed(unlocked, TALENTS_BY_ID[TALENT_IDS.thirdGrip])).toBe(true)
    expect(isTalentRevealed(unlocked, TALENTS_BY_ID[TALENT_IDS.quickDraw])).toBe(true)
    expect(isTalentRevealed(unlocked, TALENTS_BY_ID[TALENT_IDS.healingArts])).toBe(false)
    expect(isTalentRevealed(unlocked, TALENTS_BY_ID[TALENT_IDS.autoRoll])).toBe(false)
  })

  it('reveals one future node down a branch without exposing the full tree', () => {
    const unlocked = [
      TALENT_IDS.battleHardenedOne,
      TALENT_IDS.twinArsenal,
      TALENT_IDS.shieldcraft,
      TALENT_IDS.thirdGrip,
    ]

    expect(isTalentRevealed(unlocked, TALENTS_BY_ID[TALENT_IDS.healingArts])).toBe(true)
    expect(isTalentRevealed(unlocked, TALENTS_BY_ID[TALENT_IDS.fourthGrip])).toBe(true)
  })
})
