import type { TalentDefinition } from '../types/progression'

export const TALENT_IDS = {
  battleHardenedOne: 'battle-hardened-1',
  twinArsenal: 'twin-arsenal',
  shieldcraft: 'shieldcraft',
  battleHardenedTwo: 'battle-hardened-2',
  thirdGrip: 'third-grip',
  quickDraw: 'quick-draw',
  healingArts: 'healing-arts',
  autoRoll: 'auto-roll',
  fourthGrip: 'fourth-grip',
} as const

export const TALENTS: TalentDefinition[] = [
  {
    id: TALENT_IDS.battleHardenedOne,
    name: 'Battle-Hardened I',
    description: 'Increase Max HP by 2.',
    cost: 8,
    prerequisiteIds: [],
    track: 'core',
    effects: [{ type: 'max_hp', amount: 2 }],
  },
  {
    id: TALENT_IDS.twinArsenal,
    name: 'Twin Arsenal',
    description: 'Gain a second dice slot and the permanent Striker Die.',
    cost: 16,
    prerequisiteIds: [TALENT_IDS.battleHardenedOne],
    track: 'core',
    effects: [
      { type: 'dice_slots', amount: 1 },
      { type: 'grant_die', dieId: 'attack-die-2' },
    ],
  },
  {
    id: TALENT_IDS.shieldcraft,
    name: 'Shieldcraft',
    description: 'Unlock Shield dice and receive the permanent Iron Guard Die.',
    cost: 32,
    prerequisiteIds: [TALENT_IDS.twinArsenal],
    track: 'core',
    effects: [{ type: 'grant_die', dieId: 'shield-die-1' }],
  },
  {
    id: TALENT_IDS.battleHardenedTwo,
    name: 'Battle-Hardened II',
    description: 'Increase Max HP by 3.',
    cost: 24,
    prerequisiteIds: [TALENT_IDS.shieldcraft],
    track: 'survival',
    effects: [{ type: 'max_hp', amount: 3 }],
  },
  {
    id: TALENT_IDS.thirdGrip,
    name: 'Third Grip',
    description: 'Gain a third dice slot.',
    cost: 40,
    prerequisiteIds: [TALENT_IDS.shieldcraft],
    track: 'arsenal',
    effects: [{ type: 'dice_slots', amount: 1 }],
  },
  {
    id: TALENT_IDS.quickDraw,
    name: 'Quick Draw',
    description: 'Dice roll and score animations play 25% faster.',
    cost: 20,
    prerequisiteIds: [TALENT_IDS.shieldcraft],
    track: 'control',
    effects: [{ type: 'roll_speed', multiplier: 1.25 }],
  },
  {
    id: TALENT_IDS.healingArts,
    name: 'Healing Arts',
    description: 'Unlock Heal dice and receive the permanent Vitality Die.',
    cost: 55,
    prerequisiteIds: [TALENT_IDS.thirdGrip],
    track: 'arsenal',
    effects: [{ type: 'grant_die', dieId: 'heal-die-1' }],
  },
  {
    id: TALENT_IDS.autoRoll,
    name: 'Auto Roll',
    description: 'Unlock a player-controlled Auto Roll toggle in combat.',
    cost: 40,
    prerequisiteIds: [TALENT_IDS.quickDraw],
    track: 'control',
    effects: [{ type: 'unlock_auto_roll' }],
  },
  {
    id: TALENT_IDS.fourthGrip,
    name: 'Fourth Grip',
    description: 'Gain a fourth dice slot.',
    cost: 90,
    prerequisiteIds: [TALENT_IDS.healingArts],
    track: 'arsenal',
    effects: [{ type: 'dice_slots', amount: 1 }],
  },
]

export const TALENTS_BY_ID = Object.fromEntries(
  TALENTS.map((talent) => [talent.id, talent]),
) as Record<string, TalentDefinition>
