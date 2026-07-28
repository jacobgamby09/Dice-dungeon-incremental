import { createDieById } from '../content/dice'
import { TALENT_IDS } from '../content/talents'
import { ATTACK_EVOLUTIONS } from '../forge/forge'
import type { DieFaces } from '../types/dice'
import type { PlayerProfile, TalentRanks } from '../types/progression'

export const POST_DUNGEON_ONE_DEV_PRESET = {
  collectionCount: 6,
  diceSlots: 4,
  equippedCount: 4,
  evolutionCount: 3,
  faceMinimum: 3,
  maxHp: 15,
  soulsSpent: 545,
  xpSpent: 427,
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
  [TALENT_IDS.executionerDoctrine]: 1,
  [TALENT_IDS.towerDiscipline]: 1,
}

const POST_DUNGEON_ONE_DIE_IDS = [
  'attack-die-1',
  'attack-die-2',
  'shield-die-1',
  'heal-die-1',
  'attack-die-executioner',
  'shield-die-tower',
] as const

const POST_DUNGEON_ONE_EQUIPPED_DIE_IDS = [
  'attack-die-executioner',
  'attack-die-1',
  'shield-die-1',
  'heal-die-1',
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
  const executioner = diceCollection.find((die) => die.id === 'attack-die-executioner')
  if (executioner) {
    const evolutionIds = ['power', 'momentum', 'rend'] as const
    executioner.faces = executioner.faces.map((face, index) => {
      const evolutionId = evolutionIds[index]
      if (!evolutionId) return face
      const evolution = ATTACK_EVOLUTIONS[evolutionId]
      return {
        ...face,
        evolution: { id: evolution.id, name: evolution.name },
        value: evolution.resultValue,
      }
    }) as DieFaces
  }

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
