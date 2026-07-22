import { memo } from 'react'
import { Flame, Sparkles } from 'lucide-react'

interface PermanentResourceHudProps {
  bankedSouls: number
  compact?: boolean
  xp?: number
}

export const PermanentResourceHud = memo(function PermanentResourceHud({
  bankedSouls,
  compact = false,
  xp,
}: PermanentResourceHudProps) {
  return (
    <section
      aria-label="Permanent resources"
      className={`resource-hud${compact ? ' resource-hud--compact' : ''}`}
    >
      {xp !== undefined && (
        <div className="resource-hud__item resource-hud__item--xp">
          <Sparkles aria-hidden="true" size={compact ? 15 : 18} />
          <span>XP</span>
          <strong>{xp}</strong>
        </div>
      )}
      <div className="resource-hud__item resource-hud__item--souls">
        <Flame aria-hidden="true" size={compact ? 15 : 18} />
        <span>Banked</span>
        <strong>{bankedSouls}</strong>
      </div>
    </section>
  )
})
