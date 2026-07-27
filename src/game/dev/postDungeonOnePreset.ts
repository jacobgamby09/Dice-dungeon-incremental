import { createDiceCatalog } from '../content/dice'
import { TALENT_IDS } from '../content/talents'
import type { DieFaces } from '../types/dice'
import type { PlayerProfile, TalentRanks } from '../types/progression'

export const POST_DUNGEON_ONE_DEV_PRESET = {
  diceCount: 4,
  diceSlots: 4,
  faceMinimum: 3,
  maxHp: 15,
  soulsSpent: 255,
  xpSpent: 337,
} as const

const POST_DUNGEON_ONE_TALENT_RANKS: TalentRanks = {
  [TALENT_IDS.battleHardenedOne]: 1,
  [TALENT_IDS.twinArsenal]: 1,
  [TALENT_IDS.autoCombat]: 1,
  [TALENT_IDS.shieldcraft]: 1,
  [TALENT_IDS.secondDescent]: 1,
  [TALENT_IDS.battleHardenedTwo]: 1,
  [TALENT_IDS.thirdGrip]: 1,
  [TALENT_IDS.healingArts]: 1,
  [TALENT_IDS.fourthGrip]: 1,
}

export function createPostDungeonOneDevProfile(
  baseProfile: PlayerProfile,
): PlayerProfile {
  const diceCollection = createDiceCatalog().map((die) => ({
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
    equippedDieIds: diceCollection.map((die) => die.id),
    settings: {
      rollSpeed: 1,
      autoCombat: false,
    },
  }
}
