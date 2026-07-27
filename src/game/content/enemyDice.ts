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
    'slime-l1-attack', 'Slime Attack Die', 'attack', [1, 2, 2, 2, 2, 3],
  ),
  'slime-crawler-l1-attack': createEnemyDie(
    'slime-crawler-l1-attack', 'Slime Crawler Attack Die', 'attack', [2, 2, 2, 3, 3, 3],
  ),
  'goblin-l1-attack': createEnemyDie(
    'goblin-l1-attack', 'Goblin Attack Die', 'attack', [2, 2, 3, 3, 4, 4],
  ),
  'skeleton-l1-attack': createEnemyDie(
    'skeleton-l1-attack', 'Skeleton Attack Die', 'attack', [3, 3, 3, 4, 4, 4],
  ),
  'slime-l2-attack': createEnemyDie(
    'slime-l2-attack', 'Slime II Attack Die', 'attack', [3, 3, 4, 4, 4, 4],
  ),
  'slime-crawler-l2-attack': createEnemyDie(
    'slime-crawler-l2-attack', 'Slime Crawler II Attack Die', 'attack', [3, 3, 3, 4, 4, 5],
  ),
  'goblin-l2-attack': createEnemyDie(
    'goblin-l2-attack', 'Goblin II Attack Die', 'attack', [4, 4, 4, 5, 5, 5],
  ),
  'skeleton-l2-attack': createEnemyDie(
    'skeleton-l2-attack', 'Skeleton II Attack Die', 'attack', [4, 4, 5, 5, 6, 6],
  ),
  'skeleton-elite-attack': createEnemyDie(
    'skeleton-elite-attack', 'Skeleton Elite Attack Die', 'attack', [5, 5, 5, 6, 6, 7],
  ),
  'demon-attack': createEnemyDie(
    'demon-attack', 'Demon Attack Die', 'attack', [6, 6, 6, 7, 8, 9],
  ),

  'shieldbearer-l1-attack': createEnemyDie(
    'shieldbearer-l1-attack', 'Shieldbearer Attack Die', 'attack', [5, 5, 6, 6, 7, 7],
  ),
  'shieldbearer-l1-shield': createEnemyDie(
    'shieldbearer-l1-shield', 'Shieldbearer Shield Die', 'shield', [0, 1, 1, 1, 2, 2],
  ),
  'cultist-l1-attack': createEnemyDie(
    'cultist-l1-attack', 'Cultist Attack Die', 'attack', [5, 6, 6, 6, 7, 8],
  ),
  'cultist-l1-shield': createEnemyDie(
    'cultist-l1-shield', 'Cultist Shield Die', 'shield', [0, 1, 1, 2, 2, 2],
  ),
  'orc-l1-attack': createEnemyDie(
    'orc-l1-attack', 'Orc Attack Die', 'attack', [6, 6, 6, 7, 7, 8],
  ),
  'orc-l1-shield': createEnemyDie(
    'orc-l1-shield', 'Orc Shield Die', 'shield', [1, 1, 1, 2, 2, 3],
  ),
  'blood-orc-l1-attack': createEnemyDie(
    'blood-orc-l1-attack', 'Blood Orc Attack Die', 'attack', [6, 6, 7, 7, 8, 8],
  ),
  'blood-orc-l1-shield': createEnemyDie(
    'blood-orc-l1-shield', 'Blood Orc Shield Die', 'shield', [1, 1, 2, 2, 2, 3],
  ),
  'shieldbearer-l2-attack': createEnemyDie(
    'shieldbearer-l2-attack', 'Shieldbearer II Attack Die', 'attack', [6, 7, 7, 7, 8, 9],
  ),
  'shieldbearer-l2-shield': createEnemyDie(
    'shieldbearer-l2-shield', 'Shieldbearer II Shield Die', 'shield', [1, 2, 2, 2, 3, 3],
  ),
  'cultist-l2-attack': createEnemyDie(
    'cultist-l2-attack', 'Cultist II Attack Die', 'attack', [7, 7, 7, 8, 8, 9],
  ),
  'cultist-l2-shield': createEnemyDie(
    'cultist-l2-shield', 'Cultist II Shield Die', 'shield', [1, 2, 2, 3, 3, 3],
  ),
  'orc-l2-attack': createEnemyDie(
    'orc-l2-attack', 'Orc II Attack Die', 'attack', [7, 7, 8, 8, 9, 9],
  ),
  'orc-l2-shield': createEnemyDie(
    'orc-l2-shield', 'Orc II Shield Die', 'shield', [2, 2, 2, 3, 3, 4],
  ),
  'blood-orc-l2-attack': createEnemyDie(
    'blood-orc-l2-attack', 'Blood Orc II Attack Die', 'attack', [7, 8, 8, 8, 9, 10],
  ),
  'blood-orc-l2-shield': createEnemyDie(
    'blood-orc-l2-shield', 'Blood Orc II Shield Die', 'shield', [2, 2, 3, 3, 4, 4],
  ),
  'blood-orc-elite-attack': createEnemyDie(
    'blood-orc-elite-attack', 'Blood Orc Elite Attack Die', 'attack', [8, 8, 8, 9, 9, 10],
  ),
  'blood-orc-elite-shield': createEnemyDie(
    'blood-orc-elite-shield', 'Blood Orc Elite Shield Die', 'shield', [2, 3, 3, 4, 4, 5],
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
