import { memo } from 'react'

interface HpBarProps {
  current: number
  max: number
  tone?: 'player' | 'enemy'
}

export const HpBar = memo(function HpBar({ current, max, tone = 'player' }: HpBarProps) {
  const percentage = max <= 0 ? 0 : Math.max(0, Math.min(100, (current / max) * 100))
  return (
    <div
      aria-label={`${current} of ${max} health`}
      aria-valuemax={max}
      aria-valuemin={0}
      aria-valuenow={current}
      className="hp-bar"
      role="progressbar"
    >
      <div className={`hp-bar__fill hp-bar__fill--${tone}`} style={{ width: `${percentage}%` }} />
    </div>
  )
})

