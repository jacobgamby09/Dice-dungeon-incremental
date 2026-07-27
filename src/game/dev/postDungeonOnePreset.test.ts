import { describe, expect, it } from 'vitest'
import { createDiceCatalog, createStartingDice } from '../content/dice'
import { TALENT_IDS, TALENTS_BY_ID } from '../content/talents'
import { getFaceUpgradeCost } from '../content/upgradeCosts'
import { getDiceCapacity, getPlayerMaxHp } from '../progression/talents'
import type { PlayerProfile } from '../types/progression'
import {
  createPostDungeonOneDevProfile,
  POST_DUNGEON_ONE_DEV_PRESET,
} from './postDungeonOnePreset'

function createBaseProfile(): PlayerProfile {
  const diceCollection = createStartingDice()
  return {
    saveVersion: 10,
    xp: 0,
    bankedSouls: 0,
    talentRanks: {},
    unlockedDungeonIds: ['prototype-depths'],
    dungeonProgress: {
      'prototype-depths': { highestFloorCleared: 0, clearCount: 0 },
      'iron-depths': { highestFloorCleared: 0, clearCount: 0 },
    },
    diceCollection,
    equippedDieIds: diceCollection.map((die) => die.id),
    settings: {
      rollSpeed: 1,
      autoCombat: false,
    },
  }
}

describe('post-Dungeon-1 developer preset', () => {
  it('creates the canonical boss-clear profile without maxing later QoL', () => {
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
    expect(profile.talentRanks[TALENT_IDS.quickDraw]).toBeUndefined()
    expect(profile.talentRanks[TALENT_IDS.autoCombat]).toBe(1)
    expect(profile.settings).toEqual({
      rollSpeed: 1,
      autoCombat: false,
    })
  })

  it('equips every permanent family with stable faces upgraded to minimum three', () => {
    const profile = createPostDungeonOneDevProfile(createBaseProfile())
    const catalog = createDiceCatalog()

    expect(profile.diceCollection).toHaveLength(POST_DUNGEON_ONE_DEV_PRESET.diceCount)
    expect(profile.equippedDieIds).toEqual(profile.diceCollection.map((die) => die.id))
    expect(new Set(profile.diceCollection.map((die) => die.family))).toEqual(
      new Set(['attack', 'shield', 'heal']),
    )

    for (const die of profile.diceCollection) {
      const original = catalog.find((candidate) => candidate.id === die.id)!
      expect(die.faces.map((face) => face.id)).toEqual(
        original.faces.map((face) => face.id),
      )
      expect(die.faces.every(
        (face) => face.value >= POST_DUNGEON_ONE_DEV_PRESET.faceMinimum,
      )).toBe(true)
    }
  })

  it('keeps the displayed XP and Soul spend derived from actual content costs', () => {
    const profile = createPostDungeonOneDevProfile(createBaseProfile())
    const xpSpent = Object.entries(profile.talentRanks).reduce((total, [talentId, rank]) => (
      total + TALENTS_BY_ID[talentId].ranks
        .slice(0, rank)
        .reduce((rankTotal, talentRank) => rankTotal + talentRank.cost, 0)
    ), 0)
    const originalDice = createDiceCatalog()
    const soulsSpent = profile.diceCollection.reduce((total, die) => {
      const original = originalDice.find((candidate) => candidate.id === die.id)!
      return total + die.faces.reduce((dieTotal, face, faceIndex) => {
        let faceTotal = 0
        for (
          let value = original.faces[faceIndex].value;
          value < face.value;
          value += 1
        ) {
          faceTotal += getFaceUpgradeCost(value) ?? 0
        }
        return dieTotal + faceTotal
      }, 0)
    }, 0)

    expect(xpSpent).toBe(POST_DUNGEON_ONE_DEV_PRESET.xpSpent)
    expect(soulsSpent).toBe(POST_DUNGEON_ONE_DEV_PRESET.soulsSpent)
  })
})
