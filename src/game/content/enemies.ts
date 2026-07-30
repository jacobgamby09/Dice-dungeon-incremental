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
    maxHp: 3,
    dieIds: ['slime-l1-attack'],
    xpReward: 4,
    soulValue: 1,
  },
  'descent-1-slime-crawler-l1': {
    id: 'descent-1-slime-crawler-l1',
    enemyId: 'slime-crawler',
    level: 1,
    maxHp: 5,
    dieIds: ['slime-crawler-l1-attack'],
    xpReward: 5,
    soulValue: 1,
  },
  'descent-1-goblin-l1': {
    id: 'descent-1-goblin-l1',
    enemyId: 'goblin',
    level: 1,
    maxHp: 8,
    dieIds: ['goblin-l1-attack'],
    xpReward: 6,
    soulValue: 1,
  },
  'descent-1-skeleton-l1': {
    id: 'descent-1-skeleton-l1',
    enemyId: 'skeleton',
    level: 1,
    maxHp: 12,
    dieIds: ['skeleton-l1-attack'],
    xpReward: 8,
    soulValue: 1,
  },
  'descent-1-slime-l2': {
    id: 'descent-1-slime-l2',
    enemyId: 'slime',
    level: 2,
    maxHp: 17,
    dieIds: ['slime-l2-attack'],
    xpReward: 11,
    soulValue: 1,
  },
  'descent-1-slime-crawler-l2': {
    id: 'descent-1-slime-crawler-l2',
    enemyId: 'slime-crawler',
    level: 2,
    maxHp: 23,
    dieIds: ['slime-crawler-l2-attack'],
    xpReward: 15,
    soulValue: 1,
  },
  'descent-1-goblin-l2': {
    id: 'descent-1-goblin-l2',
    enemyId: 'goblin',
    level: 2,
    maxHp: 30,
    dieIds: ['goblin-l2-attack'],
    xpReward: 20,
    soulValue: 1,
  },
  'descent-1-skeleton-l2': {
    id: 'descent-1-skeleton-l2',
    enemyId: 'skeleton',
    level: 2,
    maxHp: 38,
    dieIds: ['skeleton-l2-attack'],
    xpReward: 28,
    soulValue: 1,
  },
  'descent-1-skeleton-elite': {
    id: 'descent-1-skeleton-elite',
    enemyId: 'skeleton',
    level: 3,
    maxHp: 48,
    dieIds: ['skeleton-elite-attack'],
    xpReward: 38,
    soulValue: 2,
    rewardTier: 'elite',
  },
  'descent-1-demon': {
    id: 'descent-1-demon',
    enemyId: 'demon',
    level: 1,
    maxHp: 62,
    dieIds: ['demon-attack'],
    xpReward: 55,
    soulValue: 3,
    rewardTier: 'boss',
  },

  'descent-2-shieldbearer-l1': {
    id: 'descent-2-shieldbearer-l1',
    enemyId: 'shieldbearer',
    level: 1,
    maxHp: 22,
    dieIds: ['shieldbearer-l1-attack', 'shieldbearer-l1-shield'],
    xpReward: 48,
    soulValue: 5,
  },
  'descent-2-cultist-l1': {
    id: 'descent-2-cultist-l1',
    enemyId: 'cultist',
    level: 1,
    maxHp: 26,
    dieIds: ['cultist-l1-attack', 'cultist-l1-shield'],
    xpReward: 52,
    soulValue: 5,
  },
  'descent-2-orc-l1': {
    id: 'descent-2-orc-l1',
    enemyId: 'orc',
    level: 1,
    maxHp: 30,
    dieIds: ['orc-l1-attack', 'orc-l1-shield'],
    xpReward: 58,
    soulValue: 5,
  },
  'descent-2-blood-orc-l1': {
    id: 'descent-2-blood-orc-l1',
    enemyId: 'blood-orc',
    level: 1,
    maxHp: 34,
    dieIds: ['blood-orc-l1-attack', 'blood-orc-l1-shield'],
    xpReward: 64,
    soulValue: 5,
  },
  'descent-2-shieldbearer-l2': {
    id: 'descent-2-shieldbearer-l2',
    enemyId: 'shieldbearer',
    level: 2,
    maxHp: 39,
    dieIds: ['shieldbearer-l2-attack', 'shieldbearer-l2-shield'],
    xpReward: 72,
    soulValue: 6,
  },
  'descent-2-cultist-l2': {
    id: 'descent-2-cultist-l2',
    enemyId: 'cultist',
    level: 2,
    maxHp: 44,
    dieIds: ['cultist-l2-attack', 'cultist-l2-shield'],
    xpReward: 80,
    soulValue: 6,
  },
  'descent-2-orc-l2': {
    id: 'descent-2-orc-l2',
    enemyId: 'orc',
    level: 2,
    maxHp: 50,
    dieIds: ['orc-l2-attack', 'orc-l2-shield'],
    xpReward: 90,
    soulValue: 6,
  },
  'descent-2-blood-orc-l2': {
    id: 'descent-2-blood-orc-l2',
    enemyId: 'blood-orc',
    level: 2,
    maxHp: 57,
    dieIds: ['blood-orc-l2-attack', 'blood-orc-l2-shield'],
    xpReward: 102,
    soulValue: 6,
  },
  'descent-2-blood-orc-elite': {
    id: 'descent-2-blood-orc-elite',
    enemyId: 'blood-orc',
    level: 3,
    maxHp: 65,
    dieIds: ['blood-orc-elite-attack', 'blood-orc-elite-shield'],
    xpReward: 118,
    soulValue: 8,
    rewardTier: 'elite',
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
    soulValue: 12,
    rewardTier: 'boss',
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
    bleed: 0,
    dieIds: [...encounter.dieIds],
    intentRolls,
    xpReward: encounter.xpReward,
    soulValue: encounter.soulValue,
    rewardTier: encounter.rewardTier ?? 'normal',
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
