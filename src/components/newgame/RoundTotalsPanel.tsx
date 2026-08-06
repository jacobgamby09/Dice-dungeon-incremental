import { memo, useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { Droplets, HeartPulse, ShieldPlus, Sparkles } from 'lucide-react'
import { normalizeRoundTotals } from '../../game/types/combat'
import type { RoundTotalsInput } from '../../game/types/combat'
import type { FaceType, RollResult } from '../../game/types/dice'
import { FaceIcon } from './FaceIcon'
import { FACE_META } from './faceVisuals'

interface RoundTotalsPanelProps {
  carriedHeal?: number
  carriedShield?: number
  pendingFortify?: number
  results: readonly RollResult[]
  totals: RoundTotalsInput
}

export const RoundTotalsPanel = memo(function RoundTotalsPanel({
  carriedHeal = 0,
  carriedShield = 0,
  pendingFortify = 0,
  results,
  totals,
}: RoundTotalsPanelProps) {
  const normalizedTotals = normalizeRoundTotals(totals)
  const railElement = useRef<HTMLElement | null>(null)
  const revealedTypes = results.reduce<FaceType[]>((types, result) => (
    types.includes(result.type) ? types : [...types, result.type]
  ), [])
  const latestRevealedType = revealedTypes.at(-1)

  useEffect(() => {
    if (!latestRevealedType || !railElement.current) return
    const latestTotal = railElement.current.querySelector<HTMLElement>(
      `[data-total-type="${latestRevealedType}"]`,
    )
    if (!latestTotal) return
    railElement.current.scrollLeft = Math.max(
      0,
      latestTotal.offsetLeft - railElement.current.clientWidth + latestTotal.offsetWidth + 2,
    )
  }, [latestRevealedType])

  const hasEffects = carriedHeal > 0
    || carriedShield > 0
    || normalizedTotals.bleed > 0
    || normalizedTotals.ward > 0
    || normalizedTotals.regrowth > 0
    || normalizedTotals.overflow > 0
    || normalizedTotals.poison > 0
    || normalizedTotals.empower > 0
    || normalizedTotals.weaken > 0
    || normalizedTotals.cleanse > 0
    || normalizedTotals.poisonBurst > 0
    || pendingFortify > 0
  if (revealedTypes.length === 0 && !hasEffects) return null

  return (
    <section
      aria-label="Revealed round totals"
      aria-live="polite"
      className="round-totals"
      ref={railElement}
    >
      {revealedTypes.map((type) => (
        <motion.div
          aria-label={`${FACE_META[type].label} total ${normalizedTotals[type]}`}
          className="round-total"
          data-total-type={type}
          initial={{ opacity: 0, scale: 0.65, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          key={type}
          layout
          style={{
            '--total-color': FACE_META[type].color,
            '--total-surface': FACE_META[type].shadow,
          } as CSSProperties}
        >
          <FaceIcon type={type} size={20} />
          <motion.strong
            animate={{ filter: ['brightness(1.8)', 'brightness(1)'], scale: [1.75, 0.88, 1] }}
            initial={{ scale: 0.6 }}
            key={`${type}-${normalizedTotals[type]}`}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            {normalizedTotals[type]}
          </motion.strong>
          <span className="round-total__label">{FACE_META[type].label}</span>
          <span
            aria-hidden="true"
            className="round-total__impact"
            key={`${type}-${normalizedTotals[type]}-impact`}
          />
        </motion.div>
      ))}
      {normalizedTotals.bleed > 0 ? (
        <motion.div
          aria-label={`Bleed applied ${normalizedTotals.bleed}`}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="round-total round-total--bleed"
          initial={{ opacity: 0, scale: 0.65, y: 6 }}
          key={`bleed-${normalizedTotals.bleed}`}
          style={{
            '--total-color': '#fb7185',
            '--total-surface': '#4c0519',
          } as CSSProperties}
        >
          <Droplets aria-hidden="true" size={20} />
          <strong>{normalizedTotals.bleed}</strong>
          <span className="round-total__label">Bleed</span>
        </motion.div>
      ) : null}
      {carriedShield > 0 || normalizedTotals.ward > 0 ? (
        <motion.div
          aria-label={`${carriedShield} Ward active, ${normalizedTotals.ward} Ward prepared`}
          className="round-total round-total--ward"
          initial={{ opacity: 0, scale: 0.65, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
        >
          <ShieldPlus aria-hidden="true" size={20} />
          <strong>{carriedShield > 0 ? carriedShield : normalizedTotals.ward}</strong>
          <span className="round-total__label">
            {carriedShield > 0 ? 'Ward active' : 'Next round'}
          </span>
        </motion.div>
      ) : null}
      {carriedHeal > 0 || normalizedTotals.regrowth > 0 ? (
        <motion.div
          aria-label={`${carriedHeal} Regrowth active, ${normalizedTotals.regrowth} Regrowth prepared`}
          className="round-total round-total--regrowth"
          initial={{ opacity: 0, scale: 0.65, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
        >
          <HeartPulse aria-hidden="true" size={20} />
          <strong>{carriedHeal > 0 ? carriedHeal : normalizedTotals.regrowth}</strong>
          <span className="round-total__label">
            {carriedHeal > 0 ? 'Healing now' : 'Next round'}
          </span>
        </motion.div>
      ) : null}
      {normalizedTotals.overflow > 0 ? (
        <motion.div
          aria-label={`Up to ${normalizedTotals.overflow} excess healing becomes Shield`}
          className="round-total round-total--overflow"
          initial={{ opacity: 0, scale: 0.65, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
        >
          <Sparkles aria-hidden="true" size={20} />
          <strong>{normalizedTotals.overflow}</strong>
          <span className="round-total__label">Overflow</span>
        </motion.div>
      ) : null}
      {pendingFortify > 0 ? (
        <motion.div
          aria-label={`Fortify charged. Next Shield face gains ${pendingFortify}.`}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          className="round-total round-total--fortify"
          initial={{ opacity: 0, scale: 0.72, x: -8 }}
          key={`fortify-${pendingFortify}`}
          role="status"
        >
          <ShieldPlus aria-hidden="true" size={20} />
          <strong>+{pendingFortify}</strong>
          <span className="round-total__label">Next Shield</span>
        </motion.div>
      ) : null}
    </section>
  )
})
