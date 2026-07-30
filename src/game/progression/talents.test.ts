import { describe, expect, it } from 'vitest'
import { TALENT_IDS, TALENTS_BY_ID } from '../content/talents'
import type { PlayerProfile, TalentRanks } from '../types/progression'
import {
  canPurchaseTalent,
  getCharmCapacity,
  getDiceCapacity,
  getPlayerMaxHp,
  getSoulDieValues,
  getTalentPurchaseReason,
  getTalentVisibility,
  getWorkshopDieFaces,
  getWorkshopFaceCap,
  getWorkshopCostMultiplier,
  hasAutoCombatUnlocked,
  hasCharmsUnlocked,
  normalizeTalentRanks,
} from './talents'
import { createSoulDieState } from './soulDie'

function createProfile(talentRanks: TalentRanks = {}, xp = 0): PlayerProfile {
  return {
    saveVersion: 17,
    xp,
    bankedSouls: 0,
    fateTokens: 0,
    fatePity: 0,
    soulDie: createSoulDieState(),
    talentRanks,
    unlockedDungeonIds: ['prototype-depths'],
    dungeonProgress: {
      'prototype-depths': { highestFloorCleared: 0, clearCount: 0 },
      'iron-depths': { highestFloorCleared: 0, clearCount: 0 },
    },
    diceCollection: [],
    equippedDieIds: [],
    recentForgeOperationIds: [],
    charmRanks: {},
    equippedCharmIds: [],
    pendingFateDraw: null,
    recentFateOperationIds: [],
    pendingWorkshopForge: null,
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
      TALENT_IDS.fieldStudies,
      TALENT_IDS.soulHarvest,
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

  it('separates the second slot from the Striker Die purchase', () => {
    const slotTalent = TALENTS_BY_ID[TALENT_IDS.twinArsenal]
    const dieTalent = TALENTS_BY_ID[TALENT_IDS.strikerPattern]
    expect(slotTalent.ranks[0].effects).toEqual([
      { type: 'dice_slots', amount: 1 },
    ])
    expect(dieTalent.ranks[0].effects).toEqual([
      { type: 'grant_die', dieId: 'attack-die-2' },
    ])
    expect(getDiceCapacity({
      [TALENT_IDS.battleHardenedOne]: 1,
      [TALENT_IDS.twinArsenal]: 1,
    })).toBe(2)
  })

  it('upgrades the concrete Workshop Die distribution independently of face cap', () => {
    const ranks = {
      [TALENT_IDS.battleHardenedOne]: 1,
      [TALENT_IDS.volatileTemper]: 3,
      [TALENT_IDS.faceMastery]: 2,
    }

    expect(getWorkshopDieFaces({}).map((face) => face.value))
      .toEqual([1, 1, 1, 1, 1, 2])
    expect(getWorkshopDieFaces(ranks).map((face) => face.value))
      .toEqual([1, 1, 1, 2, 2, 3])
    expect(getWorkshopFaceCap(ranks)).toBe(7)
  })

  it('upgrades the same permanent Soul Die through three concrete distributions', () => {
    expect(getSoulDieValues({})).toEqual([1, 1, 1, 2, 2, 2])
    expect(getSoulDieValues({ [TALENT_IDS.soulHarvest]: 1 }))
      .toEqual([1, 1, 2, 2, 2, 2])
    expect(getSoulDieValues({ [TALENT_IDS.soulHarvest]: 3 }))
      .toEqual([1, 2, 2, 2, 2, 3])
  })

  it('supports alternative and counted junction prerequisites', () => {
    const shieldcraft = TALENTS_BY_ID[TALENT_IDS.shieldcraft]
    const thirdGrip = TALENTS_BY_ID[TALENT_IDS.thirdGrip]

    expect(getTalentPurchaseReason(createProfile({
      [TALENT_IDS.battleHardenedOne]: 1,
      [TALENT_IDS.strikerPattern]: 1,
    }, 999), shieldcraft)).toBeNull()
    expect(getTalentPurchaseReason(createProfile({
      [TALENT_IDS.battleHardenedOne]: 1,
      [TALENT_IDS.strikerPattern]: 1,
    }, 999), thirdGrip)).toBe('prerequisite')
    expect(getTalentPurchaseReason(createProfile({
      [TALENT_IDS.battleHardenedOne]: 1,
      [TALENT_IDS.strikerPattern]: 1,
      [TALENT_IDS.shieldcraft]: 1,
    }, 999), thirdGrip)).toBeNull()
  })

  it('stacks Workshop cost reductions multiplicatively', () => {
    expect(getWorkshopCostMultiplier({})).toBe(1)
    expect(getWorkshopCostMultiplier({ [TALENT_IDS.efficientTools]: 1 })).toBeCloseTo(0.8)
    expect(getWorkshopCostMultiplier({ [TALENT_IDS.efficientTools]: 3 })).toBeCloseTo(0.512)
  })

  it('opens Fatecraft after Dungeon 1 through either efficiency branch', () => {
    const talent = TALENTS_BY_ID[TALENT_IDS.fatecraft]
    const ranks = {
      [TALENT_IDS.battleHardenedOne]: 1,
      [TALENT_IDS.fieldStudies]: 1,
    }
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

    const charmRanks = { ...ranks, [TALENT_IDS.fatecraft]: 1 }
    expect(hasCharmsUnlocked(charmRanks)).toBe(true)
    expect(getCharmCapacity(charmRanks)).toBe(1)
    expect(getCharmCapacity({
      ...charmRanks,
      [TALENT_IDS.wovenPair]: 1,
      [TALENT_IDS.trinityKnot]: 1,
    })).toBe(3)
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
      TALENT_IDS.fieldStudies,
      TALENT_IDS.soulHarvest,
    ]) {
      expect(getTalentVisibility({}, TALENTS_BY_ID[talentId])).toBe('silhouette')
    }
    expect(getTalentVisibility(
      {},
      TALENTS_BY_ID[TALENT_IDS.fatecraft],
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
