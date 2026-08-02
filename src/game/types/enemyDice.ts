import type { FaceType } from './dice'

export type EnemyDieId =
  | 'slime-l1-attack'
  | 'slime-crawler-l1-attack'
  | 'goblin-l1-attack'
  | 'skeleton-l1-attack'
  | 'slime-l2-attack'
  | 'slime-crawler-l2-attack'
  | 'goblin-l2-attack'
  | 'skeleton-l2-attack'
  | 'skeleton-elite-attack'
  | 'demon-attack'
  | 'shieldbearer-l1-attack'
  | 'shieldbearer-l1-shield'
  | 'cultist-l1-attack'
  | 'cultist-l1-heal'
  | 'orc-l1-attack'
  | 'orc-l1-attack-heavy'
  | 'blood-orc-l1-attack'
  | 'blood-orc-l1-attack-heavy'
  | 'shieldbearer-l2-attack'
  | 'shieldbearer-l2-shield'
  | 'cultist-l2-attack'
  | 'cultist-l2-heal'
  | 'orc-l2-attack'
  | 'orc-l2-attack-heavy'
  | 'blood-orc-l2-attack'
  | 'blood-orc-l2-attack-heavy'
  | 'blood-orc-elite-attack'
  | 'blood-orc-elite-attack-heavy'
  | 'spiked-behemoth-attack'
  | 'spiked-behemoth-shield'
  | 'spiked-behemoth-heal'

export interface EnemyFace {
  id: string
  type: FaceType
  value: number
}

export type EnemyFaces = [
  EnemyFace,
  EnemyFace,
  EnemyFace,
  EnemyFace,
  EnemyFace,
  EnemyFace,
]

export interface EnemyDieDefinition {
  id: EnemyDieId
  name: string
  type: FaceType
  faces: EnemyFaces
}

export interface EnemyRollResult {
  dieId: EnemyDieId
  dieName: string
  faceId: string
  faceIndex: number
  type: FaceType
  value: number
}
