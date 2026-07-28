import type { TalentDefinition } from '../types/progression'

export const TALENT_IDS = {
  battleHardenedOne: 'battle-hardened-1',
  twinArsenal: 'twin-arsenal',
  shieldcraft: 'shieldcraft',
  secondDescent: 'second-descent',
  battleHardenedTwo: 'battle-hardened-2',
  thirdGrip: 'third-grip',
  quickDraw: 'quick-draw',
  healingArts: 'healing-arts',
  autoCombat: 'auto-roll',
  fourthGrip: 'fourth-grip',
  executionerDoctrine: 'executioner-doctrine',
  towerDiscipline: 'tower-discipline',
} as const

export const TALENTS: TalentDefinition[] = [
  {
    id: TALENT_IDS.battleHardenedOne,
    name: 'Battle-Hardened',
    description: 'Increase Max HP by 2 per rank.',
    iconKey: 'battle-heart',
    prerequisiteIds: [],
    ranks: [
      { cost: 8, effects: [{ type: 'max_hp', amount: 2 }] },
      { cost: 16, effects: [{ type: 'max_hp', amount: 2 }] },
      { cost: 32, effects: [{ type: 'max_hp', amount: 2 }] },
    ],
    track: 'core',
  },
  {
    id: TALENT_IDS.twinArsenal,
    name: 'Twin Arsenal',
    description: 'Gain a second dice slot and the permanent Striker Die.',
    iconKey: 'twin-dice',
    prerequisiteIds: [TALENT_IDS.battleHardenedOne],
    ranks: [{
      cost: 16,
      effects: [
        { type: 'dice_slots', amount: 1 },
        { type: 'grant_die', dieId: 'attack-die-2' },
      ],
    }],
    track: 'core',
  },
  {
    id: TALENT_IDS.shieldcraft,
    name: 'Shieldcraft',
    description: 'Unlock Shield dice and receive the permanent Iron Guard Die.',
    iconKey: 'shieldcraft',
    prerequisiteIds: [TALENT_IDS.twinArsenal],
    ranks: [{
      cost: 32,
      effects: [{ type: 'grant_die', dieId: 'shield-die-1' }],
    }],
    track: 'core',
  },
  {
    id: TALENT_IDS.secondDescent,
    name: 'Second Descent',
    description: 'Open the path to The Iron Descent.',
    iconKey: 'second-descent',
    prerequisiteIds: [TALENT_IDS.shieldcraft],
    requirements: [{
      type: 'dungeon_clear',
      dungeonId: 'prototype-depths',
      count: 1,
    }],
    ranks: [{
      cost: 60,
      effects: [{ type: 'unlock_dungeon', dungeonId: 'iron-depths' }],
    }],
    track: 'core',
  },
  {
    id: TALENT_IDS.battleHardenedTwo,
    name: 'Battle-Hardened II',
    description: 'Increase Max HP by 3.',
    iconKey: 'battle-heart-advanced',
    prerequisiteIds: [TALENT_IDS.shieldcraft],
    ranks: [{
      cost: 24,
      effects: [{ type: 'max_hp', amount: 3 }],
    }],
    track: 'survival',
  },
  {
    id: TALENT_IDS.thirdGrip,
    name: 'Third Grip',
    description: 'Gain a third dice slot.',
    iconKey: 'third-grip',
    prerequisiteIds: [TALENT_IDS.shieldcraft],
    ranks: [{
      cost: 40,
      effects: [{ type: 'dice_slots', amount: 1 }],
    }],
    track: 'arsenal',
  },
  {
    id: TALENT_IDS.quickDraw,
    name: 'Quick Draw',
    description: 'Dice roll and score animations play 25% faster.',
    iconKey: 'quick-draw',
    prerequisiteIds: [TALENT_IDS.shieldcraft],
    ranks: [{
      cost: 20,
      effects: [{ type: 'roll_speed', multiplier: 1.25 }],
    }],
    track: 'control',
  },
  {
    id: TALENT_IDS.healingArts,
    name: 'Healing Arts',
    description: 'Unlock Heal dice and receive the permanent Vitality Die.',
    iconKey: 'healing-arts',
    prerequisiteIds: [TALENT_IDS.thirdGrip],
    ranks: [{
      cost: 55,
      effects: [{ type: 'grant_die', dieId: 'heal-die-1' }],
    }],
    track: 'arsenal',
  },
  {
    id: TALENT_IDS.autoCombat,
    name: 'Auto Combat',
    description: 'Automatically roll, resolve and continue through normal encounters.',
    iconKey: 'auto-roll',
    prerequisiteIds: [TALENT_IDS.twinArsenal],
    ranks: [{
      cost: 12,
      effects: [{ type: 'unlock_auto_combat' }],
    }],
    track: 'control',
  },
  {
    id: TALENT_IDS.fourthGrip,
    name: 'Fourth Grip',
    description: 'Gain a fourth dice slot.',
    iconKey: 'fourth-grip',
    prerequisiteIds: [TALENT_IDS.healingArts],
    ranks: [{
      cost: 90,
      effects: [{ type: 'dice_slots', amount: 1 }],
    }],
    track: 'arsenal',
  },
  {
    id: TALENT_IDS.executionerDoctrine,
    name: 'Executioner Doctrine',
    description: 'Receive the permanent high-variance Executioner Die.',
    iconKey: 'executioner-die',
    prerequisiteIds: [TALENT_IDS.secondDescent],
    ranks: [{
      cost: 45,
      effects: [{ type: 'grant_die', dieId: 'attack-die-executioner' }],
    }],
    track: 'arsenal',
  },
  {
    id: TALENT_IDS.towerDiscipline,
    name: 'Tower Discipline',
    description: 'Receive the permanent high-variance Tower Die.',
    iconKey: 'tower-die',
    prerequisiteIds: [TALENT_IDS.secondDescent],
    ranks: [{
      cost: 45,
      effects: [{ type: 'grant_die', dieId: 'shield-die-tower' }],
    }],
    track: 'survival',
  },
]

export const TALENTS_BY_ID = Object.fromEntries(
  TALENTS.map((talent) => [talent.id, talent]),
) as Record<string, TalentDefinition>
