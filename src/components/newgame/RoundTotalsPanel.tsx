import { memo } from 'react'
import { motion } from 'framer-motion'
import type { RoundTotals } from '../../game/types/combat'
import type { FaceType, RollResult } from '../../game/types/dice'
import { FaceIcon } from './FaceIcon'
import { FACE_META } from './faceVisuals'

interface RoundTotalsPanelProps {
  results: readonly RollResult[]
  totals: RoundTotals
}

const TOTAL_TYPES = ['attack', 'shield', 'heal'] as const satisfies readonly FaceType[]

export const RoundTotalsPanel = memo(function RoundTotalsPanel({ results, totals }: RoundTotalsPanelProps) {
  const revealedTypes = TOTAL_TYPES.filter((type) => (
    results.some((result) => result.type === type)
  ))
  if (revealedTypes.length === 0) return null

  return (
    <section aria-label="Revealed round totals" aria-live="polite" className="round-totals">
      {revealedTypes.map((type) => (
        <motion.div
          aria-label={`${FACE_META[type].label} total ${totals[type]}`}
          className="round-total"
          data-total-type={type}
          initial={{ opacity: 0, scale: 0.65, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          key={type}
          layout
          style={{ color: FACE_META[type].color }}
        >
          <FaceIcon type={type} size={22} />
          <motion.strong
            animate={{ filter: ['brightness(1.8)', 'brightness(1)'], scale: [1.75, 0.88, 1] }}
            initial={{ scale: 0.6 }}
            key={`${type}-${totals[type]}`}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            {totals[type]}
          </motion.strong>
        </motion.div>
      ))}
    </section>
  )
})
