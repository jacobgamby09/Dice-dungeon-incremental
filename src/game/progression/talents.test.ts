import { describe, expect, it } from 'vitest'
import { TALENT_IDS, TALENTS_BY_ID } from '../content/talents'
import type { PlayerProfile, TalentRanks } from '../types/progression'
import {
  canPurchaseTalent,
  getDiceCapacity,
  getForgeCriticalChance,
  getPlayerMaxHp,
  getTalentPurchaseReason,
  getTalentVisibility,
  getWorkshopFaceCap,
  hasAutoCombatUnlocked,
  hasCharmsUnlocked,
  normalizeTalentRanks,
} from './talents'

function createProfile(talentRanks: TalentRanks = {}, xp = 0): PlayerProfile {
  return {
    saveVersion: 13,
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

describe('Classic V2 directional talent progression', () => {
  it('stacks five optional Inner Spark ranks for +5 Max HP', () => {
    expect(getPlayerMaxHp({})).toBe(10)
    expect(getPlayerMaxHp({ [TALENT_IDS.battleHardenedOne]: 1 })).toBe(11)
    expect(getPlayerMaxHp({ [TALENT_IDS.battleHardenedOne]: 3 })).toBe(13)
    expect(getPlayerMaxHp({ [TALENT_IDS.battleHardenedOne]: 5 })).toBe(15)
  })

  it('opens all four directions after only the first central rank', () => {
    const ranks = { [TALENT_IDS.battleHardenedOne]: 1 }
    for (const talentId of [
      TALENT_IDS.twinArsenal,
      TALENT_IDS.volatileTemper,
      TALENT_IDS.autoCombat,
      TALENT_IDS.fatecraft,
    ]) {
      expect(getTalentVisibility(ranks, TALENTS_BY_ID[talentId])).toBe('revealed')
    }
  })

  it('unlocks Auto Combat in the first few runs for six XP', () => {
    const talent = TALENTS_BY_ID[TALENT_IDS.autoCombat]
    const ranks = { [TALENT_IDS.battleHardenedOne]: 1 }

    expect(talent.ranks[0].cost).toBe(6)
    expect(getTalentPurchaseReason(createProfile(ranks, 5), talent)).toBe('xp')
    expect(canPurchaseTalent(createProfile(ranks, 6), talent.id)).toBe(true)
    expect(hasAutoCombatUnlocked({ ...ranks, [talent.id]: 1 })).toBe(true)
  })

  it('grants the second die and its second slot as one Arsenal purchase', () => {
    const talent = TALENTS_BY_ID[TALENT_IDS.twinArsenal]
    expect(talent.ranks[0].effects).toEqual([
      { type: 'dice_slots', amount: 1 },
      { type: 'grant_die', dieId: 'attack-die-2' },
    ])
    expect(getDiceCapacity({
      [TALENT_IDS.battleHardenedOne]: 1,
      [TALENT_IDS.twinArsenal]: 1,
    })).toBe(2)
  })

  it('stacks the Workshop critical chance and face cap independently', () => {
    const ranks = {
      [TALENT_IDS.battleHardenedOne]: 1,
      [TALENT_IDS.volatileTemper]: 3,
      [TALENT_IDS.faceMastery]: 2,
    }

    expect(getForgeCriticalChance(ranks)).toBeCloseTo(0.2)
    expect(getWorkshopFaceCap(ranks)).toBe(7)
  })

  it('keeps Fatecraft locked behind the first dungeon clear', () => {
    const talent = TALENTS_BY_ID[TALENT_IDS.fatecraft]
    const ranks = { [TALENT_IDS.battleHardenedOne]: 1 }
    const uncleared = createProfile(ranks, 999)
    const cleared = {
      ...uncleared,
      dungeonProgress: {
        ...uncleared.dungeonProgress,
        'prototype-depths': { highestFloorCleared: 10, clearCount: 1 },
      },
    }

    expect(getTalentPurchaseReason(uncleared, talent)).toBe('dungeon')
    expect(getTalentPurchaseReason(cleared, talent)).toBeNull()
    expect(hasCharmsUnlocked({ ...ranks, [TALENT_IDS.fatecraft]: 1 })).toBe(true)
  })

  it('caps and cleans persisted ranks against the V2 registry', () => {
    expect(normalizeTalentRanks({
      [TALENT_IDS.battleHardenedOne]: 99,
      [TALENT_IDS.twinArsenal]: 0.8,
      [TALENT_IDS.faceMastery]: 2.9,
      unknown: 4,
    })).toEqual({
      [TALENT_IDS.battleHardenedOne]: 5,
      [TALENT_IDS.faceMastery]: 2,
    })
  })
})

describe('radial fog and silhouette visibility', () => {
  it('starts with one central node and four weak silhouettes', () => {
    expect(getTalentVisibility(
      {},
      TALENTS_BY_ID[TALENT_IDS.battleHardenedOne],
    )).toBe('revealed')

    for (const talentId of [
      TALENT_IDS.twinArsenal,
      TALENT_IDS.volatileTemper,
      TALENT_IDS.autoCombat,
      TALENT_IDS.fatecraft,
    ]) {
      expect(getTalentVisibility({}, TALENTS_BY_ID[talentId])).toBe('silhouette')
    }
    expect(getTalentVisibility(
      {},
      TALENTS_BY_ID[TALENT_IDS.shieldcraft],
    )).toBe('hidden')
  })

  it('reveals only one deeper layer along a purchased direction', () => {
    const ranks = {
      [TALENT_IDS.battleHardenedOne]: 1,
      [TALENT_IDS.volatileTemper]: 1,
    }

    expect(getTalentVisibility(
      ranks,
      TALENTS_BY_ID[TALENT_IDS.faceMastery],
    )).toBe('revealed')
    expect(getTalentVisibility(
      ranks,
      TALENTS_BY_ID[TALENT_IDS.shieldcraft],
    )).toBe('silhouette')
  })
})
