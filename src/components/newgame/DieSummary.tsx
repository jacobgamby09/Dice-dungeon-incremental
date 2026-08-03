import { memo } from 'react'
import type { CSSProperties } from 'react'
import type { DieInstance } from '../../game/types/dice'
import { FaceIcon } from './FaceIcon'
import { FACE_META } from './faceVisuals'
import { EvolutionIcon } from './EvolutionIcon'
import { getEvolutionVisualStyle } from './evolutionVisuals'
import { SignatureIcon } from './SignatureIcon'
import { getSignatureVisualStyle } from './signatureVisuals'
import { ImprintIcon } from './ImprintIcon'

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
            aria-label={`${face.value} ${FACE_META[face.type].label}${face.evolution ? `, ${face.evolution.name} evolution` : ''}${face.signature ? `, ${face.signature.name} signature` : ''}`}
            className={`face-cell${face.evolution ? ` evolution-face-surface evolution-face-surface--${face.evolution.id}` : ''}${face.signature ? ` signature-face-surface signature-face-surface--${face.signature.id}` : ''}${face.imprint ? ` imprint-face-surface imprint-face-surface--${face.imprint.rarity}` : ''}`}
            key={face.id}
            style={{
              '--face-color': FACE_META[face.type].color,
              color: face.evolution || face.signature ? undefined : meta.color,
              ...(face.evolution ? getEvolutionVisualStyle(face.evolution.id) : {}),
              ...(face.signature ? getSignatureVisualStyle(face.signature.id) : {}),
            } as CSSProperties}
          >
            <strong>{face.value}</strong>
            {face.imprint
              ? <ImprintIcon id={face.imprint.definitionId} rarity={face.imprint.rarity} size={compact ? 11 : 14} />
              : face.evolution
              ? <EvolutionIcon evolutionId={face.evolution.id} size={compact ? 10 : 12} />
              : face.signature
                ? <SignatureIcon signatureId={face.signature.id} size={compact ? 10 : 12} />
              : <FaceIcon type={face.type} size={compact ? 10 : 12} />}
          </span>
        ))}
      </div>
    </article>
  )
})
