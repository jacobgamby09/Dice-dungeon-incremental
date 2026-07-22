import { memo } from 'react'
import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import type { FaceType } from '../../game/types/dice'
import { FaceIcon } from './FaceIcon'
import { FACE_META } from './faceVisuals'

export interface ScoreTransferPath {
  faceId: string
  type: FaceType
  value: number
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
  const scoreStyle = {
    '--score-color': FACE_META[path.type].color,
    '--score-dark': FACE_META[path.type].shadow,
    left: path.fromX,
    top: path.fromY,
  } as CSSProperties

  return (
    <div
      aria-hidden="true"
      className={`score-transfer-origin score-transfer-origin--${path.type}`}
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
        <FaceIcon type={path.type} size={20} />
        <strong>+{path.value}</strong>
        <span className="score-transfer__spark score-transfer__spark--one" />
        <span className="score-transfer__spark score-transfer__spark--two" />
        <span className="score-transfer__spark score-transfer__spark--three" />
      </motion.div>
    </div>
  )
})
