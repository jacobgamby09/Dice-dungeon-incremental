import { createDieById } from '../content/dice'
import type { DieInstance } from '../types/dice'
import type { DieForgeRecord } from '../types/progression'

export const BASE_REFORGE_REFUND_RATE = 0.6
export const MAX_REFORGE_REFUND_RATE = 0.9

export function createEmptyDieForgeRecord(dieId: string): DieForgeRecord {
  return { dieId, soulsSpent: 0, forgePowerAdded: 0 }
}

export function getDieForgeRecord(
  records: Record<string, DieForgeRecord> | null | undefined,
  dieId: string,
): DieForgeRecord {
  return records?.[dieId] ?? createEmptyDieForgeRecord(dieId)
}

export function recordCompletedForge(
  record: DieForgeRecord,
  soulsSpent: number,
  forgePowerAdded: number,
): DieForgeRecord {
  return {
    ...record,
    soulsSpent: record.soulsSpent + Math.max(0, Math.floor(soulsSpent)),
    forgePowerAdded:
      record.forgePowerAdded + Math.max(0, Math.floor(forgePowerAdded)),
  }
}

export function getReforgeRefund(
  record: DieForgeRecord,
  refundRate: number,
): number {
  const rate = Math.min(MAX_REFORGE_REFUND_RATE, Math.max(0, refundRate))
  return Math.floor(record.soulsSpent * rate)
}

export function resetDieToCanonical(die: DieInstance): DieInstance | null {
  return createDieById(die.id)
}
