import { describe, expect, it } from 'vitest'
import { createStartingDice } from '../content/dice'
import { TALENT_IDS } from '../content/talents'
import { getCharmCapacity } from '../progression/talents'
import { createSoulDieState } from '../progression/soulDie'
import type { PlayerProfile } from '../types/progression'
import { createFatecraftStartProfile } from './fatecraftStartPreset'

function createBaseProfile(): PlayerProfile {
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
    diceCollection: createStartingDice(),
    equippedDieIds: ['attack-die-1'],
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

describe('Fatecraft start developer preset', () => {
  it('starts immediately after Dungeon 1 with Fatecraft and one test draw', () => {
    const profile = createFatecraftStartProfile(createBaseProfile())

    expect(profile.unlockedDungeonIds).toContain('iron-depths')
    expect(profile.dungeonProgress['prototype-depths']).toEqual({
      highestFloorCleared: 10,
      clearCount: 1,
    })
    expect(profile.talentRanks).toMatchObject({
      [TALENT_IDS.fieldStudies]: 1,
      [TALENT_IDS.fatecraft]: 1,
      [TALENT_IDS.secondDescent]: 1,
    })
    expect(profile.talentRanks[TALENT_IDS.wovenPair]).toBeUndefined()
    expect(getCharmCapacity(profile.talentRanks)).toBe(1)
    expect(profile.fateTokens).toBe(5)
    expect(profile.fatePity).toBe(0)
    expect(profile.charmRanks).toEqual({})
    expect(profile.equippedCharmIds).toEqual([])
    expect(profile.pendingFateDraw).toBeNull()
  })
})
