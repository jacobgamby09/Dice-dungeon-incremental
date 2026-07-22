import type { EnemyDefinition, EnemyId, EnemyState } from '../types/dungeon'

export const ENEMIES: Record<EnemyId, EnemyDefinition> = {
  slime: {
    id: 'slime',
    name: 'Slime',
    spriteName: 'Slime',
    maxHp: 5,
    startingShield: 0,
    intentPattern: [2],
    xpReward: 8,
    soulReward: 5,
  },
  'slime-crawler': {
    id: 'slime-crawler',
    name: 'Slime Crawler',
    spriteName: 'SlimeCrawler',
    maxHp: 7,
    startingShield: 0,
    intentPattern: [2, 3],
    xpReward: 10,
    soulReward: 7,
  },
  'marrow-bat': {
    id: 'marrow-bat',
    name: 'Marrow Bat',
    spriteName: 'MarrowBat',
    maxHp: 9,
    startingShield: 0,
    intentPattern: [3, 2, 4],
    xpReward: 12,
    soulReward: 9,
  },
  goblin: {
    id: 'goblin',
    name: 'Goblin',
    spriteName: 'Goblin',
    maxHp: 12,
    startingShield: 0,
    intentPattern: [3, 4],
    xpReward: 14,
    soulReward: 10,
  },
  shieldbearer: {
    id: 'shieldbearer',
    name: 'Shieldbearer',
    spriteName: 'Shieldbearer',
    maxHp: 14,
    startingShield: 3,
    intentPattern: [4, 3, 4],
    xpReward: 18,
    soulReward: 15,
  },
  cultist: {
    id: 'cultist',
    name: 'Cultist',
    spriteName: 'Cultist',
    maxHp: 17,
    startingShield: 0,
    intentPattern: [3, 5, 3],
    xpReward: 22,
    soulReward: 18,
  },
  skeleton: {
    id: 'skeleton',
    name: 'Skeleton',
    spriteName: 'Skeleton',
    maxHp: 20,
    startingShield: 0,
    intentPattern: [4, 5],
    xpReward: 26,
    soulReward: 22,
  },
  orc: {
    id: 'orc',
    name: 'Orc',
    spriteName: 'Orc',
    maxHp: 24,
    startingShield: 0,
    intentPattern: [5, 4, 6],
    xpReward: 32,
    soulReward: 28,
  },
  'blood-orc': {
    id: 'blood-orc',
    name: 'Blood Orc',
    spriteName: 'BloodOrc',
    maxHp: 29,
    startingShield: 0,
    intentPattern: [5, 7, 5],
    xpReward: 40,
    soulReward: 36,
  },
  demon: {
    id: 'demon',
    name: 'Demon',
    spriteName: 'Demon',
    maxHp: 38,
    startingShield: 6,
    intentPattern: [6, 6, 9],
    xpReward: 60,
    soulReward: 60,
  },
}

export function createEnemyState(enemyId: EnemyId): EnemyState {
  const definition = ENEMIES[enemyId]
  return {
    definitionId: definition.id,
    name: definition.name,
    spriteName: definition.spriteName,
    hp: definition.maxHp,
    maxHp: definition.maxHp,
    shield: definition.startingShield,
    intentIndex: 0,
    intent: { type: 'attack', value: definition.intentPattern[0] },
    xpReward: definition.xpReward,
    soulReward: definition.soulReward,
    rewardClaimed: false,
  }
}

export function advanceEnemyIntent(enemy: EnemyState): EnemyState {
  const definition = ENEMIES[enemy.definitionId]
  const intentIndex = (enemy.intentIndex + 1) % definition.intentPattern.length
  return {
    ...enemy,
    intentIndex,
    intent: { type: 'attack', value: definition.intentPattern[intentIndex] },
  }
}
