import { Bot, Flame, Swords, X, Zap } from 'lucide-react'
import type { AwayRecap } from '../../game/types/dungeon'

interface AwayRecapPanelProps {
  onDismiss: () => void
  recap: AwayRecap
}

function formatElapsed(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1_000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function getOutcomeLabel(recap: AwayRecap): string {
  if (recap.outcome === 'defeat') return 'The descent ended in Defeat.'
  if (recap.outcome === 'boss_victory') return 'The dungeon boss was defeated.'
  return `Auto Combat is still fighting on Floor ${recap.toFloor}.`
}

export function AwayRecapPanel({ onDismiss, recap }: AwayRecapPanelProps) {
  return (
    <section
      aria-labelledby="away-recap-title"
      aria-modal="true"
      className="away-recap"
      role="dialog"
    >
      <header>
        <Bot aria-hidden="true" size={21} />
        <div>
          <span>While you were away · {formatElapsed(recap.elapsedMilliseconds)}</span>
          <h2 id="away-recap-title">Auto Combat Report</h2>
        </div>
        <button aria-label="Close Auto Combat report" onClick={onDismiss} type="button">
          <X aria-hidden="true" size={17} />
        </button>
      </header>

      <p>{getOutcomeLabel(recap)}</p>

      <dl>
        <div>
          <dt><Swords aria-hidden="true" size={15} /> Enemies</dt>
          <dd>{recap.enemiesDefeated}</dd>
        </div>
        <div>
          <dt><Zap aria-hidden="true" size={15} /> XP</dt>
          <dd>+{recap.xpEarned}</dd>
        </div>
        <div>
          <dt><Flame aria-hidden="true" size={15} /> Souls</dt>
          <dd>+{recap.soulsEarned}</dd>
        </div>
      </dl>

      <button className="pixel-button pixel-button--primary" onClick={onDismiss} type="button">
        Continue
      </button>
    </section>
  )
}
