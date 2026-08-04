import { Backpack, Check } from 'lucide-react'

export function DieLoadoutStatus({ slotIndex }: { slotIndex: number | null }) {
  const equipped = slotIndex !== null

  return (
    <span
      aria-label={equipped ? `Equipped in roll slot ${slotIndex + 1}` : 'Not equipped'}
      className={`die-loadout-status${equipped ? ' die-loadout-status--equipped' : ''}`}
    >
      {equipped
        ? <Check aria-hidden="true" size={12} />
        : <Backpack aria-hidden="true" size={12} />}
      {equipped ? `Equipped · Roll ${slotIndex + 1}` : 'Reserve'}
    </span>
  )
}
