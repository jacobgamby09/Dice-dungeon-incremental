import { describe, expect, it } from 'vitest'
import { createDiceCatalog, createStartingDice } from '../content/dice'
import { TALENT_IDS, TALENTS_BY_ID } from '../content/talents'
import { getDiceCapacity, getPlayerMaxHp } from '../progression/talents'
import { createSoulDieState } from '../progression/soulDie'
import type { PlayerProfile } from '../types/progression'
import {
  createPostDungeonOneDevProfile,
  POST_DUNGEON_ONE_DEV_PRESET,
} from './postDungeonOnePreset'

function createBaseProfile(): PlayerProfile {
  const diceCollection = createStartingDice()
  return {
    saveVersion: 19,
    xp: 0,
    bankedSouls: 0,
    fateTokens: 0,
    fatePity: 0,
    charmRarityProgress: { epicMisses: 0, legendaryMisses: 0 },
    soulDie: createSoulDieState(),
    talentRanks: {},
    unlockedDungeonIds: ['prototype-depths'],
    dungeonProgress: {
      'prototype-depths': { highestFloorCleared: 0, clearCount: 0 },
      'iron-depths': { highestFloorCleared: 0, clearCount: 0 },
    },
    diceCollection,
    equippedDieIds: diceCollection.map((die) => die.id),
    recentForgeOperationIds: [],
    charmRanks: {},
    equippedCharmIds: [],
    pendingFateDraw: null,
    recentFateOperationIds: [],
    pendingWorkshopForge: null,
    settings: {
      rollSpeed: 1,
      autoCombat: false,
    },
  }
}

describe('post-Dungeon-1 developer preset', () => {
  it('creates the canonical Classic V2 boss-clear profile', () => {
    const profile = createPostDungeonOneDevProfile(createBaseProfile())

    expect(profile.xp).toBe(0)
    expect(profile.bankedSouls).toBe(0)
    expect(profile.unlockedDungeonIds).toEqual(['prototype-depths', 'iron-depths'])
    expect(profile.dungeonProgress).toEqual({
      'prototype-depths': { highestFloorCleared: 10, clearCount: 1 },
      'iron-depths': { highestFloorCleared: 0, clearCount: 0 },
    })
    expect(getPlayerMaxHp(profile.talentRanks)).toBe(POST_DUNGEON_ONE_DEV_PRESET.maxHp)
    expect(getDiceCapacity(profile.talentRanks)).toBe(POST_DUNGEON_ONE_DEV_PRESET.diceSlots)
    expect(profile.talentRanks[TALENT_IDS.quickDraw]).toBe(3)
    expect(profile.talentRanks[TALENT_IDS.autoCombat]).toBe(1)
    expect(profile.settings).toEqual({
      rollSpeed: 1,
      autoCombat: false,
    })
  })

  it('owns every basic family and equips the four-die Dungeon 2 transition loadout', () => {
    const profile = createPostDungeonOneDevProfile(createBaseProfile())
    const catalog = createDiceCatalog()

    expect(profile.diceCollection).toHaveLength(POST_DUNGEON_ONE_DEV_PRESET.collectionCount)
    expect(profile.equippedDieIds).toHaveLength(POST_DUNGEON_ONE_DEV_PRESET.equippedCount)
    expect(profile.diceCollection.length).toBeGreaterThan(profile.equippedDieIds.length)
    expect(profile.equippedDieIds).toEqual([
      'attack-die-1',
      'attack-die-2',
      'shield-die-1',
      'heal-die-bloodwell',
    ])
    expect(new Set(profile.diceCollection.map((die) => die.family))).toEqual(
      new Set(['attack', 'shield', 'heal']),
    )

    for (const die of profile.diceCollection) {
      const original = catalog.find((candidate) => candidate.id === die.id)!
      expect(die.faces.map((face) => face.id)).toEqual(
        original.faces.map((face) => face.id),
      )
      expect(die.faces.every(
        (face) => face.signature
          ? face.value === original.faces.find((candidate) => candidate.id === face.id)?.value
          : face.value >= POST_DUNGEON_ONE_DEV_PRESET.faceMinimum,
      )).toBe(true)
    }
    expect(profile.diceCollection.flatMap((die) => die.faces)
      .filter((face) => face.evolution)).toHaveLength(0)
  })

  it('keeps the displayed XP and Soul spend derived from actual content costs', () => {
    const profile = createPostDungeonOneDevProfile(createBaseProfile())
    const xpSpent = Object.entries(profile.talentRanks).reduce((total, [talentId, rank]) => (
      total + TALENTS_BY_ID[talentId].ranks
        .slice(0, rank)
        .reduce((rankTotal, talentRank) => rankTotal + talentRank.cost, 0)
    ), 0)
    const soulsSpent = (63 * 4) + 15

    expect(xpSpent).toBe(POST_DUNGEON_ONE_DEV_PRESET.xpSpent)
    expect(soulsSpent).toBe(POST_DUNGEON_ONE_DEV_PRESET.soulsSpent)
  })
})
