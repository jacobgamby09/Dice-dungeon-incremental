export type EnemyAttackDieId =
  | 'slime-attack-die'
  | 'slime-crawler-attack-die'
  | 'marrow-bat-attack-die'
  | 'goblin-attack-die'
  | 'shieldbearer-attack-die'
  | 'cultist-attack-die'
  | 'skeleton-attack-die'
  | 'orc-attack-die'
  | 'blood-orc-attack-die'
  | 'demon-attack-die'

export interface EnemyAttackFace {
  id: string
  type: 'attack'
  value: number
}

export type EnemyAttackFaces = [
  EnemyAttackFace,
  EnemyAttackFace,
  EnemyAttackFace,
  EnemyAttackFace,
  EnemyAttackFace,
  EnemyAttackFace,
]

export interface EnemyAttackDieDefinition {
  id: EnemyAttackDieId
  name: string
  faces: EnemyAttackFaces
}

export interface EnemyAttackRollResult {
  dieId: EnemyAttackDieId
  dieName: string
  faceId: string
  faceIndex: number
  type: 'attack'
  value: number
}
