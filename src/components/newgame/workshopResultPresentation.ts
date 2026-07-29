export type WorkshopPresentationPhase =
  | 'idle'
  | 'selecting_target'
  | 'target_locked'
  | 'rolling_power'
  | 'result'

interface WorkshopResultInput {
  amount: number
  rolledAmount: number
  workshopFaceId: string | null
}

interface WorkshopResultPresentation {
  amount: number | null
  rolledAmount: number | null
  workshopFaceId: string | null
}

const HIDDEN_WORKSHOP_RESULT: WorkshopResultPresentation = {
  amount: null,
  rolledAmount: null,
  workshopFaceId: null,
}

export function getWorkshopResultPresentation(
  phase: WorkshopPresentationPhase,
  result: WorkshopResultInput | null,
): WorkshopResultPresentation {
  if (phase !== 'result' || !result) return HIDDEN_WORKSHOP_RESULT

  return {
    amount: result.amount,
    rolledAmount: result.rolledAmount,
    workshopFaceId: result.workshopFaceId,
  }
}
