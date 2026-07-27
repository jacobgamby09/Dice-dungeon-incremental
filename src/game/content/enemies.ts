import { rollEnemyDie, totalEnemyRolls } from '../combat/rollEnemyDie'
import type {
  EncounterDefinition,
  EncounterId,
  EnemyDefinition,
  EnemyId,
  EnemyState,
} from '../types/dungeon'
import { getEnemyDie } from './enemyDice'

export const ENEMIES: Record<EnemyId, EnemyDefinition> = {
  slime: { id: 'slime', name: 'Slime', spriteName: 'Slime' },
  'slime-crawler': {
    id: 'slime-crawler',
    name: 'Slime Crawler',
    spriteName: 'SlimeCrawler',
  },
  'marrow-bat': {
    id: 'marrow-bat',
    name: 'Marrow Bat',
    spriteName: 'MarrowBat',
  },
  goblin: { id: 'goblin', name: 'Goblin', spriteName: 'Goblin' },
  shieldbearer: {
    id: 'shieldbearer',
    name: 'Shieldbearer',
    spriteName: 'Shieldbearer',
  },
  cultist: { id: 'cultist', name: 'Cultist', spriteName: 'Cultist' },
  skeleton: { id: 'skeleton', name: 'Skeleton', spriteName: 'Skeleton' },
  orc: { id: 'orc', name: 'Orc', spriteName: 'Orc' },
  'blood-orc': {
    id: 'blood-orc',
    name: 'Blood Orc',
    spriteName: 'BloodOrc',
  },
  demon: { id: 'demon', name: 'Demon', spriteName: 'Demon' },
  'spiked-behemoth': {
    id: 'spiked-behemoth',
    name: 'Spiked Behemoth',
    spriteName: 'SpikedBehemoth',
  },
}

export const ENCOUNTERS: Record<EncounterId, EncounterDefinition> = {
  'descent-1-slime-l1': {
    id: 'descent-1-slime-l1',
    enemyId: 'slime',
    level: 1,
    maxHp: 5,
    dieIds: ['slime-l1-attack'],
    xpReward: 8,
    soulReward: 5,
  },
  'descent-1-slime-crawler-l1': {
    id: 'descent-1-slime-crawler-l1',
    enemyId: 'slime-crawler',
    level: 1,
    maxHp: 7,
    dieIds: ['slime-crawler-l1-attack'],
    xpReward: 10,
    soulReward: 7,
  },
  'descent-1-goblin-l1': {
    id: 'descent-1-goblin-l1',
    enemyId: 'goblin',
    level: 1,
    maxHp: 9,
    dieIds: ['goblin-l1-attack'],
    xpReward: 12,
    soulReward: 9,
  },
  'descent-1-skeleton-l1': {
    id: 'descent-1-skeleton-l1',
    enemyId: 'skeleton',
    level: 1,
    maxHp: 12,
    dieIds: ['skeleton-l1-attack'],
    xpReward: 14,
    soulReward: 10,
  },
  'descent-1-slime-l2': {
    id: 'descent-1-slime-l2',
    enemyId: 'slime',
    level: 2,
    maxHp: 14,
    dieIds: ['slime-l2-attack'],
    xpReward: 18,
    soulReward: 15,
  },
  'descent-1-slime-crawler-l2': {
    id: 'descent-1-slime-crawler-l2',
    enemyId: 'slime-crawler',
    level: 2,
    maxHp: 17,
    dieIds: ['slime-crawler-l2-attack'],
    xpReward: 22,
    soulReward: 18,
  },
  'descent-1-goblin-l2': {
    id: 'descent-1-goblin-l2',
    enemyId: 'goblin',
    level: 2,
    maxHp: 20,
    dieIds: ['goblin-l2-attack'],
    xpReward: 26,
    soulReward: 22,
  },
  'descent-1-skeleton-l2': {
    id: 'descent-1-skeleton-l2',
    enemyId: 'skeleton',
    level: 2,
    maxHp: 24,
    dieIds: ['skeleton-l2-attack'],
    xpReward: 32,
    soulReward: 28,
  },
  'descent-1-skeleton-elite': {
    id: 'descent-1-skeleton-elite',
    enemyId: 'skeleton',
    level: 3,
    maxHp: 29,
    dieIds: ['skeleton-elite-attack'],
    xpReward: 40,
    soulReward: 36,
  },
  'descent-1-demon': {
    id: 'descent-1-demon',
    enemyId: 'demon',
    level: 1,
    maxHp: 38,
    dieIds: ['demon-attack'],
    xpReward: 60,
    soulReward: 60,
  },

  'descent-2-shieldbearer-l1': {
    id: 'descent-2-shieldbearer-l1',
    enemyId: 'shieldbearer',
    level: 1,
    maxHp: 22,
    dieIds: ['shieldbearer-l1-attack', 'shieldbearer-l1-shield'],
    xpReward: 48,
    soulReward: 44,
  },
  'descent-2-cultist-l1': {
    id: 'descent-2-cultist-l1',
    enemyId: 'cultist',
    level: 1,
    maxHp: 26,
    dieIds: ['cultist-l1-attack', 'cultist-l1-shield'],
    xpReward: 52,
    soulReward: 48,
  },
  'descent-2-orc-l1': {
    id: 'descent-2-orc-l1',
    enemyId: 'orc',
    level: 1,
    maxHp: 30,
    dieIds: ['orc-l1-attack', 'orc-l1-shield'],
    xpReward: 58,
    soulReward: 54,
  },
  'descent-2-blood-orc-l1': {
    id: 'descent-2-blood-orc-l1',
    enemyId: 'blood-orc',
    level: 1,
    maxHp: 34,
    dieIds: ['blood-orc-l1-attack', 'blood-orc-l1-shield'],
    xpReward: 64,
    soulReward: 60,
  },
  'descent-2-shieldbearer-l2': {
    id: 'descent-2-shieldbearer-l2',
    enemyId: 'shieldbearer',
    level: 2,
    maxHp: 39,
    dieIds: ['shieldbearer-l2-attack', 'shieldbearer-l2-shield'],
    xpReward: 72,
    soulReward: 68,
  },
  'descent-2-cultist-l2': {
    id: 'descent-2-cultist-l2',
    enemyId: 'cultist',
    level: 2,
    maxHp: 44,
    dieIds: ['cultist-l2-attack', 'cultist-l2-shield'],
    xpReward: 80,
    soulReward: 76,
  },
  'descent-2-orc-l2': {
    id: 'descent-2-orc-l2',
    enemyId: 'orc',
    level: 2,
    maxHp: 50,
    dieIds: ['orc-l2-attack', 'orc-l2-shield'],
    xpReward: 90,
    soulReward: 86,
  },
  'descent-2-blood-orc-l2': {
    id: 'descent-2-blood-orc-l2',
    enemyId: 'blood-orc',
    level: 2,
    maxHp: 57,
    dieIds: ['blood-orc-l2-attack', 'blood-orc-l2-shield'],
    xpReward: 102,
    soulReward: 98,
  },
  'descent-2-blood-orc-elite': {
    id: 'descent-2-blood-orc-elite',
    enemyId: 'blood-orc',
    level: 3,
    maxHp: 65,
    dieIds: ['blood-orc-elite-attack', 'blood-orc-elite-shield'],
    xpReward: 118,
    soulReward: 112,
  },
  'descent-2-spiked-behemoth': {
    id: 'descent-2-spiked-behemoth',
    enemyId: 'spiked-behemoth',
    level: 1,
    maxHp: 80,
    dieIds: [
      'spiked-behemoth-attack',
      'spiked-behemoth-shield',
      'spiked-behemoth-heal',
    ],
    xpReward: 160,
    soulReward: 160,
  },
}

function rollIntent(
  encounter: EncounterDefinition,
  rng: () => number,
) {
  return encounter.dieIds.map((dieId) => rollEnemyDie(getEnemyDie(dieId), rng))
}

export function createEnemyState(
  encounterId: EncounterId,
  rng: () => number = Math.random,
): EnemyState {
  const encounter = ENCOUNTERS[encounterId]
  const enemy = ENEMIES[encounter.enemyId]
  const intentRolls = rollIntent(encounter, rng)

  return {
    encounterId: encounter.id,
    definitionId: enemy.id,
    name: enemy.name,
    spriteName: enemy.spriteName,
    level: encounter.level,
    hp: encounter.maxHp,
    maxHp: encounter.maxHp,
    shield: totalEnemyRolls(intentRolls).shield,
    dieIds: [...encounter.dieIds],
    intentRolls,
    xpReward: encounter.xpReward,
    soulReward: encounter.soulReward,
    rewardClaimed: false,
  }
}

export function rollNextEnemyIntent(
  enemy: EnemyState,
  rng: () => number = Math.random,
): EnemyState {
  const encounter = ENCOUNTERS[enemy.encounterId]
  const intentRolls = rollIntent(encounter, rng)
  return {
    ...enemy,
    shield: totalEnemyRolls(intentRolls).shield,
    intentRolls,
  }
}
