import type { EnemyDefinition, EnemyId, EnemyState } from '../types/dungeon'

export const ENEMIES: Record<EnemyId, EnemyDefinition> = {
  slime: {
    id: 'slime',
    name: 'Slime',
    spriteName: 'Slime',
    maxHp: 12,
    intentPattern: [4],
    xpReward: 8,
    soulReward: 5,
  },
  goblin: {
    id: 'goblin',
    name: 'Goblin',
    spriteName: 'Goblin',
    maxHp: 16,
    intentPattern: [5, 4],
    xpReward: 14,
    soulReward: 10,
  },
  skeleton: {
    id: 'skeleton',
    name: 'Skeleton',
    spriteName: 'Skeleton',
    maxHp: 22,
    intentPattern: [6, 5, 7],
    xpReward: 24,
    soulReward: 20,
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
    shield: 0,
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

