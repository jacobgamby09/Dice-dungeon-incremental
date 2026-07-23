import { describe, expect, it } from 'vitest'
import { TALENT_IDS, TALENTS_BY_ID } from '../content/talents'
import type { PlayerProfile, TalentRanks } from '../types/progression'
import {
  canPurchaseTalent,
  getPlayerMaxHp,
  getTalentPurchaseReason,
  getTalentVisibility,
  normalizeTalentRanks,
} from './talents'

function createProfile(talentRanks: TalentRanks = {}, xp = 0): PlayerProfile {
  return {
    saveVersion: 6,
    xp,
    bankedSouls: 0,
    talentRanks,
    unlockedDungeonIds: ['prototype-depths'],
    dungeonProgress: {
      'prototype-depths': { highestFloorCleared: 0, clearCount: 0 },
    },
    diceCollection: [],
    equippedDieIds: [],
    settings: { rollSpeed: 1, autoRoll: false, autoResolve: false },
  }
}

describe('ranked talent progression', () => {
  it('stacks all three Battle-Hardened ranks for +6 Max HP', () => {
    expect(getPlayerMaxHp({})).toBe(10)
    expect(getPlayerMaxHp({ [TALENT_IDS.battleHardenedOne]: 1 })).toBe(12)
    expect(getPlayerMaxHp({ [TALENT_IDS.battleHardenedOne]: 2 })).toBe(14)
    expect(getPlayerMaxHp({ [TALENT_IDS.battleHardenedOne]: 3 })).toBe(16)
  })

  it('makes Twin Arsenal available after rank one without requiring later HP ranks', () => {
    const talent = TALENTS_BY_ID[TALENT_IDS.twinArsenal]

    expect(getTalentPurchaseReason(createProfile({}, 100), talent)).toBe('prerequisite')
    expect(canPurchaseTalent(
      createProfile({ [TALENT_IDS.battleHardenedOne]: 1 }, 16),
      talent.id,
    )).toBe(true)
  })

  it('caps Battle-Hardened at rank three', () => {
    const talent = TALENTS_BY_ID[TALENT_IDS.battleHardenedOne]

    expect(getTalentPurchaseReason(
      createProfile({ [talent.id]: 3 }, 999),
      talent,
    )).toBe('maxed')
  })

  it('normalizes unknown, fractional, negative, and over-cap ranks', () => {
    expect(normalizeTalentRanks({
      [TALENT_IDS.battleHardenedOne]: 99,
      [TALENT_IDS.twinArsenal]: 0.8,
      [TALENT_IDS.shieldcraft]: -2,
      unknown: 4,
    })).toEqual({
      [TALENT_IDS.battleHardenedOne]: 3,
    })
  })
})

describe('talent fog and silhouette visibility', () => {
  it('shows the foundation, silhouettes its child, and hides deeper nodes on a fresh profile', () => {
    const ranks = {}

    expect(getTalentVisibility(
      ranks,
      TALENTS_BY_ID[TALENT_IDS.battleHardenedOne],
    )).toBe('revealed')
    expect(getTalentVisibility(
      ranks,
      TALENTS_BY_ID[TALENT_IDS.twinArsenal],
    )).toBe('silhouette')
    expect(getTalentVisibility(
      ranks,
      TALENTS_BY_ID[TALENT_IDS.shieldcraft],
    )).toBe('hidden')
  })

  it('reveals Dice Slot 2 after HP rank one and silhouettes Shieldcraft', () => {
    const ranks = { [TALENT_IDS.battleHardenedOne]: 1 }

    expect(getTalentVisibility(
      ranks,
      TALENTS_BY_ID[TALENT_IDS.twinArsenal],
    )).toBe('revealed')
    expect(getTalentVisibility(
      ranks,
      TALENTS_BY_ID[TALENT_IDS.shieldcraft],
    )).toBe('silhouette')
  })

  it('reveals all three branches after Shieldcraft and silhouettes one deeper layer', () => {
    const ranks = {
      [TALENT_IDS.battleHardenedOne]: 1,
      [TALENT_IDS.twinArsenal]: 1,
      [TALENT_IDS.shieldcraft]: 1,
    }

    for (const talentId of [
      TALENT_IDS.battleHardenedTwo,
      TALENT_IDS.thirdGrip,
      TALENT_IDS.quickDraw,
    ]) {
      expect(getTalentVisibility(ranks, TALENTS_BY_ID[talentId])).toBe('revealed')
    }
    expect(getTalentVisibility(
      ranks,
      TALENTS_BY_ID[TALENT_IDS.healingArts],
    )).toBe('silhouette')
    expect(getTalentVisibility(
      ranks,
      TALENTS_BY_ID[TALENT_IDS.fourthGrip],
    )).toBe('hidden')
  })
})
