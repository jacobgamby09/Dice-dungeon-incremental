import { memo } from 'react'
import type { CSSProperties } from 'react'
import type { DieInstance } from '../../game/types/dice'
import { FaceIcon } from './FaceIcon'
import { FACE_META } from './faceVisuals'

interface DieSummaryProps {
  die: DieInstance
  compact?: boolean
}

export const DieSummary = memo(function DieSummary({ die, compact = false }: DieSummaryProps) {
  const meta = FACE_META[die.family]
  return (
    <article className={`die-summary die-summary--${die.family}${compact ? ' die-summary--compact' : ''}`}>
      <div aria-hidden="true" className="die-summary__pedestal" />
      <header className="die-summary__header">
        <FaceIcon type={die.family} size={compact ? 15 : 18} />
        <strong>{die.name}</strong>
        <span>Permanent</span>
      </header>
      <div className="die-summary__faces" aria-label={`${die.name} faces`}>
        {die.faces.map((face) => (
          <span
            className="face-cell"
            key={face.id}
            style={{ '--face-color': FACE_META[face.type].color, color: meta.color } as CSSProperties}
          >
            <strong>{face.value}</strong>
            <FaceIcon type={face.type} size={compact ? 10 : 12} />
          </span>
        ))}
      </div>
    </article>
  )
})
