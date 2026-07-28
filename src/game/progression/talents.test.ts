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
    saveVersion: 11,
    xp,
    bankedSouls: 0,
    talentRanks,
    unlockedDungeonIds: ['prototype-depths'],
    dungeonProgress: {
      'prototype-depths': { highestFloorCleared: 0, clearCount: 0 },
      'iron-depths': { highestFloorCleared: 0, clearCount: 0 },
    },
    diceCollection: [],
    equippedDieIds: [],
    recentForgeOperationIds: [],
    settings: { rollSpeed: 1, autoCombat: false },
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

  it('makes Auto Combat available directly after Twin Arsenal for 12 XP', () => {
    const talent = TALENTS_BY_ID[TALENT_IDS.autoCombat]
    const ranks = {
      [TALENT_IDS.battleHardenedOne]: 1,
      [TALENT_IDS.twinArsenal]: 1,
    }

    expect(talent.ranks[0].cost).toBe(12)
    expect(getTalentPurchaseReason(createProfile(ranks, 11), talent)).toBe('xp')
    expect(getTalentPurchaseReason(createProfile(ranks, 12), talent)).toBeNull()
  })

  it('caps Battle-Hardened at rank three', () => {
    const talent = TALENTS_BY_ID[TALENT_IDS.battleHardenedOne]

    expect(getTalentPurchaseReason(
      createProfile({ [talent.id]: 3 }, 999),
      talent,
    )).toBe('maxed')
  })

  it('gates the Second Descent behind a clear and unlocks it for exactly the boss reward', () => {
    const talent = TALENTS_BY_ID[TALENT_IDS.secondDescent]
    const ranks = {
      [TALENT_IDS.battleHardenedOne]: 1,
      [TALENT_IDS.twinArsenal]: 1,
      [TALENT_IDS.shieldcraft]: 1,
    }
    const uncleared = createProfile(ranks, 60)
    const cleared = {
      ...uncleared,
      dungeonProgress: {
        ...uncleared.dungeonProgress,
        'prototype-depths': { highestFloorCleared: 10, clearCount: 1 },
      },
    }

    expect(getTalentPurchaseReason(uncleared, talent)).toBe('dungeon')
    expect(getTalentPurchaseReason(cleared, talent)).toBeNull()
  })

  it('keeps Healing Arts available before the first clear so the player learns Heal first', () => {
    const talent = TALENTS_BY_ID[TALENT_IDS.healingArts]
    const profile = createProfile({
      [TALENT_IDS.battleHardenedOne]: 1,
      [TALENT_IDS.twinArsenal]: 1,
      [TALENT_IDS.shieldcraft]: 1,
      [TALENT_IDS.thirdGrip]: 1,
    }, 55)

    expect(profile.dungeonProgress['prototype-depths'].clearCount).toBe(0)
    expect(getTalentPurchaseReason(profile, talent)).toBeNull()
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

  it('reveals Auto Combat beside Shieldcraft after Twin Arsenal', () => {
    const ranks = {
      [TALENT_IDS.battleHardenedOne]: 1,
      [TALENT_IDS.twinArsenal]: 1,
    }

    expect(getTalentVisibility(
      ranks,
      TALENTS_BY_ID[TALENT_IDS.autoCombat],
    )).toBe('revealed')
    expect(getTalentVisibility(
      ranks,
      TALENTS_BY_ID[TALENT_IDS.shieldcraft],
    )).toBe('revealed')
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
