import { describe, expect, it } from 'vitest'
import { createStartingDice } from '../content/dice'
import type { PlayerProfile } from '../types/progression'
import { createSoulDieState } from '../progression/soulDie'
import {
  createEarlyQolTestProfile,
  EARLY_QOL_TEST_TALENT_PATH,
  EARLY_QOL_TEST_XP,
} from './earlyQolPreset'

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
    recentReforgeOperationIds: [],
    dieForgeRecords: {},
    charmRanks: {},
    equippedCharmIds: [],
    pendingFateDraw: null,
    recentFateOperationIds: [],
    pendingWorkshopForge: null,
    imprints: [],
    settings: { rollSpeed: 1, autoCombat: false },
  }
}

describe('early QoL developer preset', () => {
  it('grants exactly enough unspent XP for Auto Combat and Quick Draw prerequisites', () => {
    const base = createBaseProfile()
    const profile = createEarlyQolTestProfile(base)

    expect(EARLY_QOL_TEST_TALENT_PATH).toEqual([
      'battle-hardened-1',
      'auto-roll',
      'quick-draw',
    ])
    expect(EARLY_QOL_TEST_XP).toBe(20)
    expect(profile.xp).toBe(20)
    expect(profile.talentRanks).toEqual({})
    expect(profile.diceCollection).toEqual(base.diceCollection)
  })
})
