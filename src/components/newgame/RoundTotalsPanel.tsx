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
          initial={{ opacity: 0, scale: 0.65, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          key={type}
          style={{ color: FACE_META[type].color }}
        >
          <FaceIcon type={type} size={22} />
          <strong>{totals[type]}</strong>
        </motion.div>
      ))}
    </section>
  )
})
