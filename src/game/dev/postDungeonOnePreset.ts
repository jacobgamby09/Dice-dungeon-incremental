import { createDieById } from '../content/dice'
import { createImprintInstance } from '../content/imprints'
import type { CharmRanks } from '../types/charms'
import type { DieFaces } from '../types/dice'
import type { PlayerProfile, TalentRanks } from '../types/progression'

export const POST_DUNGEON_ONE_DEV_PRESET = {
  averageFace: 4.27,
  charmCount: 4,
  clearRun: 27,
  collectionCount: 5,
  diceSlots: 3,
  equippedCount: 3,
  fateTokens: 6,
  imprintCount: 2,
  maxHp: 17,
  sourceAttempts: 250,
  sourceSeed: 122,
  souls: 23,
  xp: 871,
} as const

const SIMULATED_TALENT_RANKS: TalentRanks = {
  'battle-hardened-1': 3,
  'auto-roll': 1,
  'field-studies': 1,
  'quick-draw': 3,
  'volatile-temper': 3,
  'twin-arsenal': 1,
  'striker-pattern': 1,
  'efficient-tools': 1,
  'face-mastery': 1,
  'forge-overcharge': 1,
  'soul-harvest': 1,
  fatecraft: 1,
  'battle-hardened-2': 2,
  shieldcraft: 1,
  'third-grip': 1,
  'healing-arts': 1,
  'executioner-doctrine': 1,
}

const SIMULATED_DICE = [
  { id: 'attack-die-1', values: [6, 5, 9, 7, 8, 9] },
  { id: 'attack-die-2', values: [3, 3, 6, 4, 7, 3] },
  { id: 'shield-die-1', values: [4, 1, 5, 2, 5, 5] },
  { id: 'heal-die-1', values: [4, 1, 1, 2, 6, 3] },
  { id: 'attack-die-executioner', values: [5, 2, 3, 3, 3, 3] },
] as const

const SIMULATED_CHARM_RANKS: CharmRanks = {
  'soul-prism': 1,
  'ward-clock': 2,
  'echo-knot': 1,
  bloodroot: 1,
}

function createSimulatedDice() {
  return SIMULATED_DICE.map(({ id, values }) => {
    const die = createDieById(id)
    if (!die) throw new Error(`Missing simulated DEV die ${id}`)
    return {
      ...die,
      faces: die.faces.map((face, index) => ({
        ...face,
        value: values[index],
      })) as DieFaces,
    }
  })
}

function createSimulatedImprints() {
  return [
    {
      ...createImprintInstance('relay-strike', 'dev-simulated-relay-strike'),
      refinement: 4,
      attachment: {
        dieId: 'attack-die-2',
        faceId: 'attack-die-2-face-5',
      },
    },
    {
      ...createImprintInstance('lead-edge', 'dev-simulated-lead-edge'),
      attachment: {
        dieId: 'attack-die-1',
        faceId: 'attack-die-1-face-3',
      },
    },
  ]
}

export function createPostDungeonOneDevProfile(
  baseProfile: PlayerProfile,
): PlayerProfile {
  const diceCollection = createSimulatedDice()
  return {
    ...baseProfile,
    xp: POST_DUNGEON_ONE_DEV_PRESET.xp,
    bankedSouls: POST_DUNGEON_ONE_DEV_PRESET.souls,
    fateTokens: POST_DUNGEON_ONE_DEV_PRESET.fateTokens,
    fatePity: 0,
    charmRarityProgress: { epicMisses: 0, legendaryMisses: 0 },
    soulDie: { drawPileFaceIds: [] },
    talentRanks: { ...SIMULATED_TALENT_RANKS },
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
    equippedDieIds: ['attack-die-1', 'attack-die-2', 'shield-die-1'],
    dieForgeRecords: {
      'attack-die-1': { dieId: 'attack-die-1', soulsSpent: 150, forgePowerAdded: 38 },
      'attack-die-2': { dieId: 'attack-die-2', soulsSpent: 27, forgePowerAdded: 16 },
      'shield-die-1': { dieId: 'shield-die-1', soulsSpent: 14, forgePowerAdded: 11 },
      'heal-die-1': { dieId: 'heal-die-1', soulsSpent: 3, forgePowerAdded: 7 },
      'attack-die-executioner': {
        dieId: 'attack-die-executioner',
        soulsSpent: 1,
        forgePowerAdded: 3,
      },
    },
    charmRanks: { ...SIMULATED_CHARM_RANKS },
    equippedCharmIds: ['echo-knot'],
    imprints: createSimulatedImprints(),
    settings: {
      rollSpeed: 1,
      autoCombat: false,
    },
  }
}
