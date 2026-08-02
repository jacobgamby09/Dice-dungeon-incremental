import type { SoulDieValues } from '../../game/types/dice'
import { CurrencyIcon } from './CurrencyIcon'

interface SoulDieSummaryProps {
  values: SoulDieValues
}

export function SoulDieSummary({ values }: SoulDieSummaryProps) {
  const average = values.reduce((total, value) => total + value, 0) / values.length
  return (
    <section aria-labelledby="system-dice-title" className="system-dice-vault">
      <header className="loadout-vault__heading">
        <div>
          <span className="eyebrow">Permanent systems</span>
          <h2 id="system-dice-title">System Dice</h2>
        </div>
        <span className="system-dice-count">1 owned</span>
      </header>
      <article aria-labelledby="soul-die-summary-title" className="die-summary die-summary--soul soul-die-summary">
        <div aria-hidden="true" className="die-summary__pedestal" />
        <header className="die-summary__header">
          <span aria-hidden="true" className="soul-die-summary__hero-icon">
            <CurrencyIcon currency="souls" size={28} />
          </span>
          <strong id="soul-die-summary-title">Soul Die</strong>
          <span>Reward Die</span>
        </header>
        <div aria-label={`Soul Die faces ${values.join(', ')}`} className="die-summary__faces soul-die-summary__faces">
          {values.map((value, index) => (
            <span className="face-cell" key={`soul-die-summary-face-${index + 1}`}>
              <CurrencyIcon currency="souls" size={18} />
              <strong>×{value}</strong>
            </span>
          ))}
        </div>
        <footer className="soul-die-summary__footer">
          <strong>Average ×{average.toFixed(2)}</strong>
          <span>Rolls after every defeated enemy</span>
        </footer>
      </article>
    </section>
  )
}
