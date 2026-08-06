import type { FaceType } from '../../game/types/dice'

export const FACE_META: Record<FaceType, { label: string; color: string; shadow: string }> = {
  attack: { label: 'Attack', color: '#f87171', shadow: '#7f1d1d' },
  shield: { label: 'Shield', color: '#60a5fa', shadow: '#1e3a8a' },
  heal: { label: 'Heal', color: '#4ade80', shadow: '#166534' },
  poison: { label: 'Poison', color: '#a3e635', shadow: '#365314' },
  empower: { label: 'Empower', color: '#facc15', shadow: '#713f12' },
  weaken: { label: 'Weaken', color: '#c084fc', shadow: '#581c87' },
  cleanse: { label: 'Cleanse', color: '#67e8f9', shadow: '#155e75' },
}
