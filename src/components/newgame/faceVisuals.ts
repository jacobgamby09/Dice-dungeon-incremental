import type { FaceType } from '../../game/types/dice'

export const FACE_META: Record<FaceType, { label: string; color: string; shadow: string }> = {
  attack: { label: 'Attack', color: '#f87171', shadow: '#7f1d1d' },
  shield: { label: 'Shield', color: '#60a5fa', shadow: '#1e3a8a' },
  heal: { label: 'Heal', color: '#4ade80', shadow: '#166534' },
}
