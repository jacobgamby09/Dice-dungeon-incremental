export type WorkshopDieValues = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
]

export interface WorkshopDieFace {
  id: string
  value: number
}

export interface PendingWorkshopForge {
  operationId: string
  dieId: string
  targetFaceId: string
  workshopFaceId: string
  rolledAmount: number
  appliedAmount: number
  previousValue: number
  cost: number
}
