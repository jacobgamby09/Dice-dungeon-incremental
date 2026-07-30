import { Flame } from 'lucide-react'
import type { SoulDieValues } from '../../game/types/dice'

interface SoulDieSummaryProps {
  values: SoulDieValues
}

export function SoulDieSummary({ values }: SoulDieSummaryProps) {
  const average = values.reduce((total, value) => total + value, 0) / values.length
  return (
    <section aria-labelledby="soul-die-summary-title" className="soul-die-summary">
      <div className="soul-die-summary__icon">
        <Flame aria-hidden="true" size={22} />
      </div>
      <div>
        <span>Permanent loot die</span>
        <h2 id="soul-die-summary-title">Soul Die</h2>
      </div>
      <div aria-label={`Soul Die faces ${values.join(', ')}`} className="soul-die-summary__faces">
        {values.map((value, index) => (
          <span key={`soul-die-summary-face-${index + 1}`}>×{value}</span>
        ))}
      </div>
      <small>Average ×{average.toFixed(2)}</small>
    </section>
  )
}
