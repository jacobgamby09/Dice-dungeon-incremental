import { memo } from 'react'
import type { RoundTotals } from '../../game/types/combat'
import type { FaceType } from '../../game/types/dice'
import { FaceIcon } from './FaceIcon'
import { FACE_META } from './faceVisuals'

interface RoundTotalsPanelProps {
  totals: RoundTotals
}

const TOTAL_TYPES: FaceType[] = ['attack', 'shield', 'heal']

export const RoundTotalsPanel = memo(function RoundTotalsPanel({ totals }: RoundTotalsPanelProps) {
  return (
    <section className="round-totals" aria-label="Round totals">
      {TOTAL_TYPES.map((type) => (
        <div className="round-total" key={type} style={{ color: FACE_META[type].color }}>
          <FaceIcon type={type} size={18} />
          <strong>{totals[type]}</strong>
          <span>{FACE_META[type].label}</span>
        </div>
      ))}
    </section>
  )
})
