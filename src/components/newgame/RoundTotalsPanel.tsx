import { memo, useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import type { RoundTotals } from '../../game/types/combat'
import type { FaceType, RollResult } from '../../game/types/dice'
import { FaceIcon } from './FaceIcon'
import { FACE_META } from './faceVisuals'

interface RoundTotalsPanelProps {
  results: readonly RollResult[]
  totals: RoundTotals
}

export const RoundTotalsPanel = memo(function RoundTotalsPanel({ results, totals }: RoundTotalsPanelProps) {
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

  if (revealedTypes.length === 0) return null

  return (
    <section
      aria-label="Revealed round totals"
      aria-live="polite"
      className="round-totals"
      ref={railElement}
    >
      {revealedTypes.map((type) => (
        <motion.div
          aria-label={`${FACE_META[type].label} total ${totals[type]}`}
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
            key={`${type}-${totals[type]}`}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            {totals[type]}
          </motion.strong>
          <span className="round-total__label">{FACE_META[type].label}</span>
        </motion.div>
      ))}
    </section>
  )
})
