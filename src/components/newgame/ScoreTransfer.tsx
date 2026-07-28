import { memo } from 'react'
import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import type { FaceEvolution, FaceSignature, FaceType } from '../../game/types/dice'
import { EvolutionIcon } from './EvolutionIcon'
import { FaceIcon } from './FaceIcon'
import { FACE_META } from './faceVisuals'
import { EVOLUTION_VISUALS } from './evolutionVisuals'
import { SignatureIcon } from './SignatureIcon'
import { SIGNATURE_VISUALS } from './signatureVisuals'

export interface ScoreTransferPath {
  bleedValue?: number
  executeBonus?: number
  faceId: string
  fortifyArmed?: number
  fortifyBonus?: number
  momentumArmed?: number
  momentumBonus?: number
  overflowValue?: number
  regrowthValue?: number
  secondaryAttackValue?: number
  type: FaceType
  value: number
  evolution?: FaceEvolution
  signature?: FaceSignature
  wardValue?: number
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
  const evolutionVisual = path.evolution ? EVOLUTION_VISUALS[path.evolution.id] : null
  const signatureVisual = path.signature ? SIGNATURE_VISUALS[path.signature.id] : null
  const effectLabels = [
    path.momentumBonus ? `Momentum +${path.momentumBonus}` : null,
    path.bleedValue ? `+${path.bleedValue} Bleed` : null,
    path.momentumArmed ? `Next +${path.momentumArmed}` : null,
    path.executeBonus ? `Execute +${path.executeBonus}` : null,
    path.fortifyBonus ? `Fortify +${path.fortifyBonus}` : null,
    path.fortifyArmed ? `Next Shield +${path.fortifyArmed}` : null,
    path.wardValue ? `+${path.wardValue} Ward` : null,
    path.regrowthValue ? `+${path.regrowthValue} Regrowth` : null,
    path.overflowValue ? `Up to ${path.overflowValue} Overflow` : null,
    path.secondaryAttackValue ? `+${path.secondaryAttackValue} Attack` : null,
  ].filter((label): label is string => label !== null)
  const scoreStyle = {
    '--score-color': evolutionVisual?.accent ?? signatureVisual?.accent ?? FACE_META[path.type].color,
    '--score-dark': evolutionVisual?.surface ?? signatureVisual?.surface ?? FACE_META[path.type].shadow,
    '--score-highlight': evolutionVisual?.highlight ?? signatureVisual?.highlight ?? '#ffffff',
    left: path.fromX,
    top: path.fromY,
  } as CSSProperties

  return (
    <div
      aria-hidden="true"
      className={`score-transfer-origin score-transfer-origin--${path.type}${path.evolution ? ` score-transfer-origin--evolution score-transfer-origin--${path.evolution.id}` : ''}${path.signature ? ` score-transfer-origin--signature score-transfer-origin--${path.signature.id}` : ''}`}
      style={scoreStyle}
    >
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
        {path.evolution
          ? <EvolutionIcon evolutionId={path.evolution.id} size={21} />
          : path.signature
            ? <SignatureIcon signatureId={path.signature.id} size={21} />
          : <FaceIcon type={path.type} size={20} />}
        <strong>+{path.value}</strong>
        {path.evolution || path.signature
          ? <small>{path.evolution?.name ?? path.signature?.name}</small>
          : null}
        {effectLabels.length > 0 ? (
          <span className="score-transfer__effects">
            {effectLabels.join(' · ')}
          </span>
        ) : null}
        <span className="score-transfer__spark score-transfer__spark--one" />
        <span className="score-transfer__spark score-transfer__spark--two" />
        <span className="score-transfer__spark score-transfer__spark--three" />
      </motion.div>
    </div>
  )
})
