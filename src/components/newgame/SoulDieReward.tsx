import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { createSoulDie } from '../../game/content/dice'
import { SOUL_DIE_REWARD_ROLL_MS } from '../../game/automation/autoCombat'
import type { SoulDieRollResult, SoulDieValues } from '../../game/types/dice'
import { PhysicalDieCube } from './PhysicalDieCube'
import { CurrencyIcon } from './CurrencyIcon'

interface SoulDieRewardProps {
  result: SoulDieRollResult
  values: SoulDieValues
}

export function SoulDieReward({
  result,
  values,
}: SoulDieRewardProps) {
  return (
    <SoulDieAnimation
      key={`${result.faceId}-${result.soulValue}-${result.payout}`}
      result={result}
      values={values}
    />
  )
}

function SoulDieAnimation({
  result,
  values,
}: SoulDieRewardProps) {
  const reduceMotion = useReducedMotion()
  const [landed, setLanded] = useState(Boolean(reduceMotion))
  const die = useMemo(() => createSoulDie(values), [values])
  const stage = reduceMotion || landed ? 'landed' : 'rolling'

  useEffect(() => {
    if (reduceMotion) return
    const timer = window.setTimeout(
      () => setLanded(true),
      SOUL_DIE_REWARD_ROLL_MS,
    )
    return () => window.clearTimeout(timer)
  }, [reduceMotion])

  return (
    <div
      aria-label={`Soul Value ${result.soulValue}, Soul Die times ${result.multiplier}, ${result.payout} Souls`}
      className={`soul-die-reward soul-die-reward--${stage}`}
    >
      <div className="soul-die-reward__formula">
        <span>Soul Value</span>
        <strong>{result.soulValue}</strong>
      </div>
      <div className="soul-die-reward__die">
        <PhysicalDieCube
          className="soul-die-reward__cube"
          faceIndex={result.faceIndex}
          faces={die.faces.map((face) => ({
            className: 'soul-die-reward__side',
            content: (
              <>
                <strong>×{face.multiplier}</strong>
                <CurrencyIcon currency="souls" size={18} />
              </>
            ),
            id: face.id,
            style: {
              '--side-color': '#c084fc',
              '--side-surface': '#4c1d75',
            } as CSSProperties,
          }))}
          rollDuration={SOUL_DIE_REWARD_ROLL_MS / 1_000}
          stage={stage}
        />
      </div>
      <div aria-live="polite" className="soul-die-reward__result">
        <span>{stage === 'landed' ? `${result.soulValue} × ${result.multiplier}` : 'Rolling'}</span>
        <strong>{stage === 'landed' ? `+${result.payout}` : '—'}</strong>
        <small>Souls</small>
      </div>
    </div>
  )
}
