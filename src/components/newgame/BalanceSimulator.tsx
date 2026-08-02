import { Activity, Play, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  PROGRESSION_STRATEGY_PRESETS,
  getProgressionStrategyPreset,
  simulateProgressionCohort,
} from '../../game/balance/simulateProgressionCohort'
import type {
  ProgressionCohortResult,
  ProgressionStrategyId,
} from '../../game/balance/simulateProgressionCohort'
import type { ProgressionJourneyMilestones } from '../../game/balance/simulateProgressionJourney'

interface BalanceSimulatorProps {
  onClose: () => void
}

const DISPLAYED_MILESTONES: readonly {
  key: keyof ProgressionJourneyMilestones
  label: string
  target?: string
}[] = [
  { key: 'firstFaceUpgradeRun', label: 'First face upgrade', target: 'Target · Run 1' },
  { key: 'autoCombatRun', label: 'Auto Combat', target: 'Target · Run 2–3' },
  { key: 'secondDieRun', label: 'Second die', target: 'Target · Run 6–15' },
  { key: 'firstLoadoutChoiceRun', label: 'First loadout choice' },
  { key: 'firstJackpotForgeRun', label: 'First +2/+3 Forge' },
  { key: 'dungeonOneClearRun', label: 'Dungeon 1 clear', target: 'Target · Run 12–55' },
  { key: 'dungeonTwoUnlockRun', label: 'Dungeon 2 unlock', target: 'Target · By run 60' },
]

const CURVE_CHECKPOINTS = new Set([1, 2, 3, 5, 8, 10, 15, 20, 30, 40, 60, 80])

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

function formatDecimal(value: number): string {
  return value.toFixed(2)
}

export function BalanceSimulator({ onClose }: BalanceSimulatorProps) {
  const [attempts, setAttempts] = useState(100)
  const [maxRuns, setMaxRuns] = useState(60)
  const [seed, setSeed] = useState(431)
  const [strategyId, setStrategyId] = useState<ProgressionStrategyId>('balanced')
  const [result, setResult] = useState<ProgressionCohortResult>(() => (
    simulateProgressionCohort({ attempts, maxRuns, seed, strategyId })
  ))

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const resultPreset = getProgressionStrategyPreset(result.strategyId)
  const visibleCurve = result.curve.filter((point) => CURVE_CHECKPOINTS.has(point.run))

  const runSimulation = () => {
    setResult(simulateProgressionCohort({ attempts, maxRuns, seed, strategyId }))
  }

  return (
    <div
      className="balance-lab-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        aria-labelledby="balance-lab-title"
        aria-modal="true"
        className="balance-lab"
        role="dialog"
      >
        <header className="balance-lab__header">
          <span className="balance-lab__icon"><Activity aria-hidden="true" size={25} /></span>
          <div>
            <span className="eyebrow">Fresh-save cohort</span>
            <h2 id="balance-lab-title">Balance Lab</h2>
          </div>
          <button aria-label="Close Balance Lab" onClick={onClose} type="button">
            <X aria-hidden="true" size={21} />
          </button>
        </header>

        <p className="balance-lab__intro">
          Uses the live combat, rewards, Talent Tree and Workshop rules. Your save is never changed.
        </p>

        <form
          className="balance-lab__controls"
          onSubmit={(event) => {
            event.preventDefault()
            runSimulation()
          }}
        >
          <label>
            Strategy
            <select
              onChange={(event) => setStrategyId(event.target.value as ProgressionStrategyId)}
              value={strategyId}
            >
              {PROGRESSION_STRATEGY_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>{preset.label}</option>
              ))}
            </select>
          </label>
          <label>
            Journeys
            <select onChange={(event) => setAttempts(Number(event.target.value))} value={attempts}>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
            </select>
          </label>
          <label>
            Max runs
            <select onChange={(event) => setMaxRuns(Number(event.target.value))} value={maxRuns}>
              <option value={40}>40</option>
              <option value={60}>60</option>
              <option value={80}>80</option>
            </select>
          </label>
          <label>
            First seed
            <input
              min={1}
              onChange={(event) => setSeed(Math.max(1, Number(event.target.value) || 1))}
              step={1}
              type="number"
              value={seed}
            />
          </label>
          <button className="balance-lab__run" type="submit">
            <Play aria-hidden="true" size={18} /> Run simulation
          </button>
        </form>

        <p className="balance-lab__strategy-note">
          <strong>{resultPreset.label}</strong> · {resultPreset.description}
        </p>

        <section aria-labelledby="balance-milestones-title" className="balance-lab__section">
          <header>
            <h3 id="balance-milestones-title">Milestone distribution</h3>
            <span>{result.attempts} journeys · seeds {result.seed}–{result.seed + result.attempts - 1}</span>
          </header>
          <div className="balance-lab__milestones">
            {DISPLAYED_MILESTONES.map(({ key, label, target }) => {
              const milestone = result.milestones[key]
              return (
                <article key={key}>
                  <span>{label}</span>
                  <strong>{milestone.medianRun ?? '—'}</strong>
                  <small>Median run</small>
                  <dl>
                    <div><dt>P10–P90</dt><dd>{milestone.p10Run ?? '—'}–{milestone.p90Run ?? '—'}</dd></div>
                    <div><dt>Reached</dt><dd>{formatPercent(milestone.reachRate)}</dd></div>
                  </dl>
                  {target ? <em>{target}</em> : null}
                </article>
              )
            })}
          </div>
        </section>

        <section aria-labelledby="balance-curve-title" className="balance-lab__section">
          <header>
            <h3 id="balance-curve-title">Progression curve</h3>
            <span>After spending · completed journeys hold their final D1 record</span>
          </header>
          <div className="balance-lab__table-scroll" role="region" tabIndex={0} aria-label="Progression curve table">
            <table>
              <thead>
                <tr>
                  <th scope="col">Run</th>
                  <th scope="col">Avg floor</th>
                  <th scope="col">Median</th>
                  <th scope="col">Avg face</th>
                  <th scope="col">Auto</th>
                  <th scope="col">2nd die</th>
                  <th scope="col">D1 clear</th>
                  <th scope="col">D2 open</th>
                  <th scope="col">XP</th>
                  <th scope="col">Souls</th>
                </tr>
              </thead>
              <tbody>
                {visibleCurve.map((point) => (
                  <tr key={point.run}>
                    <th scope="row">{point.run}</th>
                    <td>{formatDecimal(point.averageFloor)}</td>
                    <td>{point.medianFloor}</td>
                    <td>{formatDecimal(point.averageFaceValue)}</td>
                    <td>{formatPercent(point.autoCombatRate)}</td>
                    <td>{formatPercent(point.secondDieRate)}</td>
                    <td>{formatPercent(point.dungeonOneClearRate)}</td>
                    <td>{formatPercent(point.dungeonTwoUnlockRate)}</td>
                    <td>{formatDecimal(point.averageXpAfterSpending)}</td>
                    <td>{formatDecimal(point.averageSoulsAfterSpending)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="balance-lab__footer">
          <span>Deterministic model · animation time and player hesitation are not simulated.</span>
          <button onClick={onClose} type="button">Close lab</button>
        </footer>
      </section>
    </div>
  )
}
