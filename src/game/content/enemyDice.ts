import type { FaceType } from '../types/dice'
import type {
  EnemyDieDefinition,
  EnemyDieId,
  EnemyFaces,
} from '../types/enemyDice'

function createEnemyDie(
  id: EnemyDieId,
  name: string,
  type: FaceType,
  values: [number, number, number, number, number, number],
): EnemyDieDefinition {
  return {
    id,
    name,
    type,
    faces: values.map((value, index) => ({
      id: `${id}-face-${index + 1}`,
      type,
      value,
    })) as EnemyFaces,
  }
}

export const ENEMY_DICE: Record<EnemyDieId, EnemyDieDefinition> = {
  'slime-l1-attack': createEnemyDie(
    'slime-l1-attack', 'Slime Attack Die', 'attack', [2, 2, 2, 2, 2, 2],
  ),
  'slime-crawler-l1-attack': createEnemyDie(
    'slime-crawler-l1-attack', 'Slime Crawler Attack Die', 'attack', [2, 2, 2, 3, 3, 3],
  ),
  'goblin-l1-attack': createEnemyDie(
    'goblin-l1-attack', 'Goblin Attack Die', 'attack', [2, 2, 3, 3, 3, 4],
  ),
  'skeleton-l1-attack': createEnemyDie(
    'skeleton-l1-attack', 'Skeleton Attack Die', 'attack', [3, 3, 3, 4, 4, 4],
  ),
  'slime-l2-attack': createEnemyDie(
    'slime-l2-attack', 'Slime II Attack Die', 'attack', [3, 3, 3, 4, 4, 4],
  ),
  'slime-crawler-l2-attack': createEnemyDie(
    'slime-crawler-l2-attack', 'Slime Crawler II Attack Die', 'attack', [3, 3, 3, 4, 4, 5],
  ),
  'goblin-l2-attack': createEnemyDie(
    'goblin-l2-attack', 'Goblin II Attack Die', 'attack', [4, 4, 4, 4, 5, 5],
  ),
  'skeleton-l2-attack': createEnemyDie(
    'skeleton-l2-attack', 'Skeleton II Attack Die', 'attack', [4, 4, 4, 5, 5, 6],
  ),
  'skeleton-elite-attack': createEnemyDie(
    'skeleton-elite-attack', 'Skeleton Elite Attack Die', 'attack', [5, 5, 5, 6, 6, 7],
  ),
  'demon-attack': createEnemyDie(
    'demon-attack', 'Demon Attack Die', 'attack', [7, 7, 7, 8, 8, 8],
  ),
  'demon-shield': createEnemyDie(
    'demon-shield', 'Demon Shield Die', 'shield', [2, 2, 2, 3, 3, 3],
  ),

  'shieldbearer-l1-attack': createEnemyDie(
    'shieldbearer-l1-attack', 'Shieldbearer Attack Die', 'attack', [5, 5, 6, 6, 7, 7],
  ),
  'shieldbearer-l1-shield': createEnemyDie(
    'shieldbearer-l1-shield', 'Shieldbearer Shield Die', 'shield', [0, 1, 1, 1, 2, 2],
  ),
  'cultist-l1-attack': createEnemyDie(
    'cultist-l1-attack', 'Cultist Attack Die', 'attack', [4, 4, 5, 5, 5, 6],
  ),
  'cultist-l1-heal': createEnemyDie(
    'cultist-l1-heal', 'Cultist Heal Die', 'heal', [0, 1, 1, 2, 2, 3],
  ),
  'orc-l1-attack': createEnemyDie(
    'orc-l1-attack', 'Orc Attack Die', 'attack', [2, 2, 2, 3, 3, 4],
  ),
  'orc-l1-attack-heavy': createEnemyDie(
    'orc-l1-attack-heavy', 'Orc Heavy Attack Die', 'attack', [3, 3, 4, 4, 4, 5],
  ),
  'blood-orc-l1-attack': createEnemyDie(
    'blood-orc-l1-attack', 'Blood Orc Attack Die', 'attack', [2, 2, 3, 3, 4, 6],
  ),
  'blood-orc-l1-attack-heavy': createEnemyDie(
    'blood-orc-l1-attack-heavy', 'Blood Orc Frenzy Die', 'attack', [2, 3, 3, 4, 5, 7],
  ),
  'shieldbearer-l2-attack': createEnemyDie(
    'shieldbearer-l2-attack', 'Shieldbearer II Attack Die', 'attack', [6, 7, 7, 7, 8, 9],
  ),
  'shieldbearer-l2-shield': createEnemyDie(
    'shieldbearer-l2-shield', 'Shieldbearer II Shield Die', 'shield', [1, 2, 2, 2, 3, 3],
  ),
  'cultist-l2-attack': createEnemyDie(
    'cultist-l2-attack', 'Cultist II Attack Die', 'attack', [5, 5, 6, 6, 6, 7],
  ),
  'cultist-l2-heal': createEnemyDie(
    'cultist-l2-heal', 'Cultist II Heal Die', 'heal', [1, 1, 2, 2, 3, 4],
  ),
  'orc-l2-attack': createEnemyDie(
    'orc-l2-attack', 'Orc II Attack Die', 'attack', [3, 3, 4, 4, 5, 5],
  ),
  'orc-l2-attack-heavy': createEnemyDie(
    'orc-l2-attack-heavy', 'Orc II Heavy Attack Die', 'attack', [4, 4, 5, 5, 6, 6],
  ),
  'blood-orc-l2-attack': createEnemyDie(
    'blood-orc-l2-attack', 'Blood Orc II Attack Die', 'attack', [3, 3, 4, 4, 6, 8],
  ),
  'blood-orc-l2-attack-heavy': createEnemyDie(
    'blood-orc-l2-attack-heavy', 'Blood Orc II Frenzy Die', 'attack', [3, 4, 4, 5, 7, 9],
  ),
  'blood-orc-elite-attack': createEnemyDie(
    'blood-orc-elite-attack', 'Blood Orc Elite Attack Die', 'attack', [4, 4, 5, 5, 7, 9],
  ),
  'blood-orc-elite-attack-heavy': createEnemyDie(
    'blood-orc-elite-attack-heavy', 'Blood Orc Elite Frenzy Die', 'attack', [4, 5, 5, 6, 8, 10],
  ),
  'spiked-behemoth-attack': createEnemyDie(
    'spiked-behemoth-attack', 'Spiked Behemoth Attack Die', 'attack', [8, 9, 9, 9, 10, 11],
  ),
  'spiked-behemoth-shield': createEnemyDie(
    'spiked-behemoth-shield', 'Spiked Behemoth Shield Die', 'shield', [3, 3, 4, 4, 5, 6],
  ),
  'spiked-behemoth-heal': createEnemyDie(
    'spiked-behemoth-heal', 'Spiked Behemoth Heal Die', 'heal', [0, 0, 1, 1, 2, 3],
  ),
}

export function getEnemyDie(id: EnemyDieId): EnemyDieDefinition {
  return ENEMY_DICE[id]
}
