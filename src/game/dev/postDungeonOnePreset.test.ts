import { describe, expect, it } from 'vitest'
import { createStartingDice } from '../content/dice'
import { TALENT_IDS } from '../content/talents'
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
      'blighted-depths': { highestFloorCleared: 0, clearCount: 0 },
    },
    diceCollection,
    equippedDieIds: diceCollection.map((die) => die.id),
    recentForgeOperationIds: [],
    recentReforgeOperationIds: [],
    dieForgeRecords: {},
    charmRanks: {},
    equippedCharmIds: [],
    pendingFateDraw: null,
    recentFateOperationIds: [],
    pendingWorkshopForge: null,
    imprints: [],
    imprintHuntDungeonId: null,
    settings: {
      rollSpeed: 1,
      autoCombat: false,
    },
  }
}

describe('post-Dungeon-1 developer preset', () => {
  it('creates the canonical Classic V2 boss-clear profile', () => {
    const profile = createPostDungeonOneDevProfile(createBaseProfile())

    expect(profile.xp).toBe(POST_DUNGEON_ONE_DEV_PRESET.xp)
    expect(profile.bankedSouls).toBe(POST_DUNGEON_ONE_DEV_PRESET.souls)
    expect(profile.fateTokens).toBe(POST_DUNGEON_ONE_DEV_PRESET.fateTokens)
    expect(profile.imprints.map((imprint) => imprint.definitionId)).toEqual([
      'relay-strike',
      'lead-edge',
    ])
    expect(profile.unlockedDungeonIds).toEqual(['prototype-depths', 'iron-depths'])
    expect(profile.dungeonProgress).toEqual({
      'prototype-depths': { highestFloorCleared: 10, clearCount: 1 },
      'iron-depths': { highestFloorCleared: 0, clearCount: 0 },
      'blighted-depths': { highestFloorCleared: 0, clearCount: 0 },
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

  it('owns and equips the exact irregular dice rolled by the representative journey', () => {
    const profile = createPostDungeonOneDevProfile(createBaseProfile())

    expect(profile.diceCollection).toHaveLength(POST_DUNGEON_ONE_DEV_PRESET.collectionCount)
    expect(profile.equippedDieIds).toHaveLength(POST_DUNGEON_ONE_DEV_PRESET.equippedCount)
    expect(profile.diceCollection.length).toBeGreaterThan(profile.equippedDieIds.length)
    expect(profile.equippedDieIds).toEqual([
      'attack-die-1',
      'attack-die-2',
      'shield-die-1',
    ])
    expect(new Set(profile.diceCollection.map((die) => die.family))).toEqual(
      new Set(['attack', 'shield', 'heal']),
    )

    expect(profile.diceCollection.map((die) => die.faces.map((face) => face.value))).toEqual([
      [7, 3, 8, 3, 7, 7],
      [7, 2, 4, 4, 4, 6],
      [1, 5, 4, 2, 4, 3],
      [1, 1, 1, 4, 4, 6],
      [2, 2, 4, 3, 3, 3],
    ])
  })

  it('preserves simulated Charms, Imprints, attachments and Forge ledgers', () => {
    const profile = createPostDungeonOneDevProfile(createBaseProfile())

    expect(profile.charmRanks).toEqual({
      'soul-prism': 1,
      'ward-clock': 2,
      'echo-knot': 1,
    })
    expect(profile.equippedCharmIds).toEqual(['echo-knot'])
    expect(profile.imprints).toEqual(expect.arrayContaining([
      expect.objectContaining({
        definitionId: 'relay-strike',
        refinement: 10,
        attachment: { dieId: 'attack-die-1', faceId: 'attack-die-1-face-3' },
      }),
      expect.objectContaining({
        definitionId: 'lead-edge',
        refinement: 0,
      }),
    ]))
    expect(profile.dieForgeRecords['attack-die-1']).toEqual({
      dieId: 'attack-die-1',
      soulsSpent: 103,
      forgePowerAdded: 29,
    })
  })
})
