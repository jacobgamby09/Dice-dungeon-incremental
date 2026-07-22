import { rollEnemyAttackDie } from '../combat/rollEnemyAttackDie'
import type { EnemyDefinition, EnemyId, EnemyState } from '../types/dungeon'
import { getEnemyAttackDie } from './enemyDice'

export const ENEMIES: Record<EnemyId, EnemyDefinition> = {
  slime: {
    id: 'slime',
    name: 'Slime',
    spriteName: 'Slime',
    maxHp: 5,
    startingShield: 0,
    attackDieId: 'slime-attack-die',
    xpReward: 8,
    soulReward: 5,
  },
  'slime-crawler': {
    id: 'slime-crawler',
    name: 'Slime Crawler',
    spriteName: 'SlimeCrawler',
    maxHp: 7,
    startingShield: 0,
    attackDieId: 'slime-crawler-attack-die',
    xpReward: 10,
    soulReward: 7,
  },
  'marrow-bat': {
    id: 'marrow-bat',
    name: 'Marrow Bat',
    spriteName: 'MarrowBat',
    maxHp: 9,
    startingShield: 0,
    attackDieId: 'marrow-bat-attack-die',
    xpReward: 12,
    soulReward: 9,
  },
  goblin: {
    id: 'goblin',
    name: 'Goblin',
    spriteName: 'Goblin',
    maxHp: 12,
    startingShield: 0,
    attackDieId: 'goblin-attack-die',
    xpReward: 14,
    soulReward: 10,
  },
  shieldbearer: {
    id: 'shieldbearer',
    name: 'Shieldbearer',
    spriteName: 'Shieldbearer',
    maxHp: 14,
    startingShield: 3,
    attackDieId: 'shieldbearer-attack-die',
    xpReward: 18,
    soulReward: 15,
  },
  cultist: {
    id: 'cultist',
    name: 'Cultist',
    spriteName: 'Cultist',
    maxHp: 17,
    startingShield: 0,
    attackDieId: 'cultist-attack-die',
    xpReward: 22,
    soulReward: 18,
  },
  skeleton: {
    id: 'skeleton',
    name: 'Skeleton',
    spriteName: 'Skeleton',
    maxHp: 20,
    startingShield: 0,
    attackDieId: 'skeleton-attack-die',
    xpReward: 26,
    soulReward: 22,
  },
  orc: {
    id: 'orc',
    name: 'Orc',
    spriteName: 'Orc',
    maxHp: 24,
    startingShield: 0,
    attackDieId: 'orc-attack-die',
    xpReward: 32,
    soulReward: 28,
  },
  'blood-orc': {
    id: 'blood-orc',
    name: 'Blood Orc',
    spriteName: 'BloodOrc',
    maxHp: 29,
    startingShield: 0,
    attackDieId: 'blood-orc-attack-die',
    xpReward: 40,
    soulReward: 36,
  },
  demon: {
    id: 'demon',
    name: 'Demon',
    spriteName: 'Demon',
    maxHp: 38,
    startingShield: 6,
    attackDieId: 'demon-attack-die',
    xpReward: 60,
    soulReward: 60,
  },
}

export function createEnemyState(
  enemyId: EnemyId,
  rng: () => number = Math.random,
): EnemyState {
  const definition = ENEMIES[enemyId]
  const attackDie = getEnemyAttackDie(definition.attackDieId)
  return {
    definitionId: definition.id,
    name: definition.name,
    spriteName: definition.spriteName,
    hp: definition.maxHp,
    maxHp: definition.maxHp,
    shield: definition.startingShield,
    attackDieId: definition.attackDieId,
    intentRoll: rollEnemyAttackDie(attackDie, rng),
    xpReward: definition.xpReward,
    soulReward: definition.soulReward,
    rewardClaimed: false,
  }
}

export function rollNextEnemyIntent(
  enemy: EnemyState,
  rng: () => number = Math.random,
): EnemyState {
  const attackDie = getEnemyAttackDie(enemy.attackDieId)
  return {
    ...enemy,
    intentRoll: rollEnemyAttackDie(attackDie, rng),
  }
}
