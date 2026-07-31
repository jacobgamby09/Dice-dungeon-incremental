import { createDieById } from '../content/dice'
import { TALENT_IDS } from '../content/talents'
import type { DieFaces } from '../types/dice'
import type { PlayerProfile, TalentRanks } from '../types/progression'

export const POST_DUNGEON_ONE_DEV_PRESET = {
  collectionCount: 4,
  diceSlots: 3,
  equippedCount: 3,
  evolutionCount: 0,
  faceMinimum: 4,
  maxHp: 17,
  soulsSpent: 252,
  xpSpent: 453,
} as const

const POST_DUNGEON_ONE_TALENT_RANKS: TalentRanks = {
  [TALENT_IDS.battleHardenedOne]: 3,
  [TALENT_IDS.twinArsenal]: 1,
  [TALENT_IDS.strikerPattern]: 1,
  [TALENT_IDS.autoCombat]: 1,
  [TALENT_IDS.shieldcraft]: 1,
  [TALENT_IDS.secondDescent]: 1,
  [TALENT_IDS.battleHardenedTwo]: 2,
  [TALENT_IDS.thirdGrip]: 1,
  [TALENT_IDS.quickDraw]: 3,
  [TALENT_IDS.healingArts]: 1,
  [TALENT_IDS.volatileTemper]: 2,
  [TALENT_IDS.faceMastery]: 1,
}

const POST_DUNGEON_ONE_DIE_IDS = [
  'attack-die-1',
  'attack-die-2',
  'shield-die-1',
  'heal-die-1',
] as const

const POST_DUNGEON_ONE_EQUIPPED_DIE_IDS = [
  'attack-die-1',
  'attack-die-2',
  'shield-die-1',
] as const

export function createPostDungeonOneDevProfile(
  baseProfile: PlayerProfile,
): PlayerProfile {
  const diceCollection = POST_DUNGEON_ONE_DIE_IDS.map((dieId) => createDieById(dieId)!).map((die) => ({
    ...die,
    faces: die.faces.map((face) => ({
      ...face,
      value: Math.max(face.value, POST_DUNGEON_ONE_DEV_PRESET.faceMinimum),
    })) as DieFaces,
  }))
  return {
    ...baseProfile,
    xp: 0,
    bankedSouls: 0,
    talentRanks: { ...POST_DUNGEON_ONE_TALENT_RANKS },
    unlockedDungeonIds: ['prototype-depths', 'iron-depths'],
    dungeonProgress: {
      'prototype-depths': {
        highestFloorCleared: 10,
        clearCount: 1,
      },
      'iron-depths': {
        highestFloorCleared: 0,
        clearCount: 0,
      },
    },
    diceCollection,
    equippedDieIds: [...POST_DUNGEON_ONE_EQUIPPED_DIE_IDS],
    settings: {
      rollSpeed: 1,
      autoCombat: false,
    },
  }
}
