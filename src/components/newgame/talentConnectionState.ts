import type { TalentNodeState } from './TalentNode'

export type TalentConnectionState = 'active' | 'dormant' | 'open' | 'veiled'

export function getTalentConnectionState(
  sourceRank: number,
  targetRank: number,
  targetState: TalentNodeState,
): TalentConnectionState {
  if (targetState === 'silhouette') return 'veiled'
  if (targetRank > 0) return 'active'
  if (sourceRank > 0 && (targetState === 'ready' || targetState === 'unaffordable')) return 'open'
  return 'dormant'
}
