import type {
  EnemyAttackDieDefinition,
  EnemyAttackDieId,
  EnemyAttackFaces,
} from '../types/enemyDice'

function createAttackDie(
  id: EnemyAttackDieId,
  name: string,
  values: [number, number, number, number, number, number],
): EnemyAttackDieDefinition {
  return {
    id,
    name,
    faces: values.map((value, index) => ({
      id: `${id}-face-${index + 1}`,
      type: 'attack' as const,
      value,
    })) as EnemyAttackFaces,
  }
}

export const ENEMY_ATTACK_DICE: Record<EnemyAttackDieId, EnemyAttackDieDefinition> = {
  'slime-attack-die': createAttackDie(
    'slime-attack-die',
    'Slime Attack Die',
    [1, 2, 2, 2, 2, 3],
  ),
  'slime-crawler-attack-die': createAttackDie(
    'slime-crawler-attack-die',
    'Slime Crawler Attack Die',
    [2, 2, 2, 3, 3, 3],
  ),
  'marrow-bat-attack-die': createAttackDie(
    'marrow-bat-attack-die',
    'Marrow Bat Attack Die',
    [2, 2, 3, 3, 4, 4],
  ),
  'goblin-attack-die': createAttackDie(
    'goblin-attack-die',
    'Goblin Attack Die',
    [3, 3, 3, 4, 4, 4],
  ),
  'shieldbearer-attack-die': createAttackDie(
    'shieldbearer-attack-die',
    'Shieldbearer Attack Die',
    [3, 3, 4, 4, 4, 4],
  ),
  'cultist-attack-die': createAttackDie(
    'cultist-attack-die',
    'Cultist Attack Die',
    [3, 3, 3, 4, 4, 5],
  ),
  'skeleton-attack-die': createAttackDie(
    'skeleton-attack-die',
    'Skeleton Attack Die',
    [4, 4, 4, 5, 5, 5],
  ),
  'orc-attack-die': createAttackDie(
    'orc-attack-die',
    'Orc Attack Die',
    [4, 4, 5, 5, 6, 6],
  ),
  'blood-orc-attack-die': createAttackDie(
    'blood-orc-attack-die',
    'Blood Orc Attack Die',
    [5, 5, 5, 6, 6, 7],
  ),
  'demon-attack-die': createAttackDie(
    'demon-attack-die',
    'Demon Attack Die',
    [6, 6, 6, 7, 8, 9],
  ),
}

export function getEnemyAttackDie(id: EnemyAttackDieId): EnemyAttackDieDefinition {
  return ENEMY_ATTACK_DICE[id]
}
