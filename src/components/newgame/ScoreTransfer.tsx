import { memo } from 'react'
import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import type { FaceSignature, FaceType } from '../../game/types/dice'
import type { ImprintSnapshot } from '../../game/types/imprints'
import { FaceIcon } from './FaceIcon'
import { FACE_META } from './faceVisuals'
import { ImprintIcon } from './ImprintIcon'
import { SignatureIcon } from './SignatureIcon'
import { SIGNATURE_VISUALS } from './signatureVisuals'

export interface ScoreTransferPath {
  drainAttackValue?: number
  executeBonus?: number
  faceId: string
  fortifyArmed?: number
  fortifyBonus?: number
  type: FaceType
  value: number
  signature?: FaceSignature
  imprint?: ImprintSnapshot
  imprintBonus?: number
  fromX: number
  fromY: number
  toX: number
  toY: number
  duration: number
}

interface ScoreTransferProps {
  path: ScoreTransferPath
  onComplete: () => void
}

export const ScoreTransfer = memo(function ScoreTransfer({ path, onComplete }: ScoreTransferProps) {
  const signatureVisual = path.signature ? SIGNATURE_VISUALS[path.signature.id] : null
  const effectLabels = [
    path.executeBonus ? `Execute +${path.executeBonus}` : null,
    path.fortifyBonus ? `Fortify +${path.fortifyBonus}` : null,
    path.fortifyArmed ? `Next Shield +${path.fortifyArmed}` : null,
    path.drainAttackValue ? `Drain +${path.drainAttackValue} Attack` : null,
    path.imprintBonus ? `${path.imprint?.name ?? 'Imprint'} +${path.imprintBonus}` : null,
  ].filter((label): label is string => label !== null)
  const scoreStyle = {
    '--score-color': path.imprint
      ? path.imprint.rarity === 'legendary' ? '#f97316' : path.imprint.rarity === 'epic' ? '#e879f9' : '#22d3ee'
      : signatureVisual?.accent ?? FACE_META[path.type].color,
    '--score-dark': path.imprint
      ? path.imprint.rarity === 'legendary' ? '#431407' : path.imprint.rarity === 'epic' ? '#3b0764' : '#083344'
      : signatureVisual?.surface ?? FACE_META[path.type].shadow,
    '--score-highlight': signatureVisual?.highlight ?? '#ffffff',
    left: path.fromX,
    top: path.fromY,
  } as CSSProperties

  return (
    <div
      aria-hidden="true"
      className={`score-transfer-origin score-transfer-origin--${path.type}${path.signature ? ` score-transfer-origin--signature score-transfer-origin--${path.signature.id}` : ''}${path.imprint ? ` score-transfer-origin--imprint score-transfer-origin--${path.imprint.definitionId}` : ''}`}
      style={scoreStyle}
    >
      <motion.span
        animate={{
          opacity: [0, 0.9, 0.62, 0],
          scale: [0.35, 0.8, 0.55, 0.15],
          x: path.toX - path.fromX,
          y: [0, -20, path.toY - path.fromY],
        }}
        className="score-transfer__trail"
        initial={{ opacity: 0, scale: 0.35, x: 0, y: 0 }}
        transition={{
          duration: path.duration,
          ease: [0.2, 0.8, 0.25, 1],
          times: [0, 0.18, 0.76, 1],
        }}
      />
      <motion.div
        animate={{
          opacity: [0, 1, 1, 1, 0],
          scale: [0.65, 1.12, 1, 0.88, 1.45],
          x: path.toX - path.fromX,
          y: [0, -24, path.toY - path.fromY],
        }}
        className="score-transfer"
        initial={{ opacity: 0, scale: 0.65, x: 0, y: 0 }}
        onAnimationComplete={onComplete}
        transition={{
          opacity: { duration: path.duration, times: [0, 0.12, 0.66, 0.88, 1] },
          scale: { duration: path.duration, ease: 'easeOut', times: [0, 0.14, 0.55, 0.86, 1] },
          x: { duration: path.duration, ease: [0.2, 0.8, 0.25, 1] },
          y: { duration: path.duration, ease: 'easeInOut', times: [0, 0.3, 1] },
        }}
      >
        {path.imprint
          ? <ImprintIcon id={path.imprint.definitionId} rarity={path.imprint.rarity} size={21} />
          : path.signature
            ? <SignatureIcon signatureId={path.signature.id} size={21} />
          : <FaceIcon type={path.type} size={20} />}
        <strong>+{path.value}</strong>
        {path.imprint || path.signature
          ? <small>{path.imprint?.name ?? path.signature?.name}</small>
          : null}
        {effectLabels.length > 0 ? (
          <span className="score-transfer__effects">
            {effectLabels.join(' · ')}
          </span>
        ) : null}
        <span className="score-transfer__spark score-transfer__spark--one" />
        <span className="score-transfer__spark score-transfer__spark--two" />
        <span className="score-transfer__spark score-transfer__spark--three" />
        <span className="score-transfer__arrival" />
      </motion.div>
    </div>
  )
})
