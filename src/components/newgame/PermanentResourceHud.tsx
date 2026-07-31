import { memo } from 'react'
import { CurrencyIcon } from './CurrencyIcon'
import { FateTokenIcon } from './FateTokenIcon'

interface PermanentResourceHudProps {
  bankedSouls: number
  compact?: boolean
  fateTokens?: number
  xp?: number
}

export const PermanentResourceHud = memo(function PermanentResourceHud({
  bankedSouls,
  compact = false,
  fateTokens,
  xp,
}: PermanentResourceHudProps) {
  return (
    <section
      aria-label="Permanent resources"
      className={`resource-hud${compact ? ' resource-hud--compact' : ''}`}
    >
      {xp !== undefined && (
        <div className="resource-hud__item resource-hud__item--xp">
          <CurrencyIcon currency="xp" size={compact ? 17 : 20} />
          <span>XP</span>
          <strong>{xp}</strong>
        </div>
      )}
      <div className="resource-hud__item resource-hud__item--souls">
        <CurrencyIcon currency="souls" size={compact ? 17 : 20} />
        <span>Souls</span>
        <strong>{bankedSouls}</strong>
      </div>
      {fateTokens !== undefined && (
        <div className="resource-hud__item resource-hud__item--fate">
          <FateTokenIcon size={compact ? 17 : 20} />
          <span>Fate</span>
          <strong>{fateTokens}</strong>
        </div>
      )}
    </section>
  )
})
