import { createDieById } from '../content/dice'
import { TALENT_IDS } from '../content/talents'
import type { DieFaces } from '../types/dice'
import type { PlayerProfile, TalentRanks } from '../types/progression'
import { createImprintInstance } from '../content/imprints'

export const POST_DUNGEON_ONE_DEV_PRESET = {
  collectionCount: 5,
  diceSlots: 4,
  equippedCount: 4,
  faceMinimum: 4,
  maxHp: 17,
  soulsSpent: 267,
  xpSpent: 5278,
  testSouls: 500,
  imprintCount: 3,
} as const

const POST_DUNGEON_ONE_TALENT_RANKS: TalentRanks = {
  [TALENT_IDS.battleHardenedOne]: 3,
  [TALENT_IDS.twinArsenal]: 1,
  [TALENT_IDS.strikerPattern]: 1,
  [TALENT_IDS.autoCombat]: 1,
  [TALENT_IDS.shieldcraft]: 1,
  [TALENT_IDS.battleHardenedTwo]: 2,
  [TALENT_IDS.thirdGrip]: 1,
  [TALENT_IDS.quickDraw]: 3,
  [TALENT_IDS.healingArts]: 1,
  [TALENT_IDS.fourthGrip]: 1,
  [TALENT_IDS.bloodwellDoctrine]: 1,
  [TALENT_IDS.volatileTemper]: 2,
  [TALENT_IDS.faceMastery]: 1,
}

const POST_DUNGEON_ONE_DIE_IDS = [
  'attack-die-1',
  'attack-die-2',
  'shield-die-1',
  'heal-die-1',
  'heal-die-bloodwell',
] as const

const POST_DUNGEON_ONE_EQUIPPED_DIE_IDS = [
  'attack-die-1',
  'attack-die-2',
  'shield-die-1',
  'heal-die-bloodwell',
] as const

export function createPostDungeonOneDevProfile(
  baseProfile: PlayerProfile,
): PlayerProfile {
  const diceCollection = POST_DUNGEON_ONE_DIE_IDS.map((dieId) => createDieById(dieId)!).map((die) => ({
    ...die,
    faces: die.faces.map((face) => ({
      ...face,
      value: face.signature
        ? face.value
        : Math.max(face.value, POST_DUNGEON_ONE_DEV_PRESET.faceMinimum),
    })) as DieFaces,
  }))
  return {
    ...baseProfile,
    xp: 0,
    bankedSouls: POST_DUNGEON_ONE_DEV_PRESET.testSouls,
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
    imprints: [
      createImprintInstance('lead-edge', 'dev-lead-edge'),
      createImprintInstance('relay-strike', 'dev-relay-strike'),
      createImprintInstance('crescendo', 'dev-crescendo'),
    ],
    settings: {
      rollSpeed: 1,
      autoCombat: false,
    },
  }
}
