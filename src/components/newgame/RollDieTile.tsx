import { memo } from 'react'
import { motion } from 'framer-motion'
import type { DieInstance, RollResult } from '../../game/types/dice'
import { FaceIcon } from './FaceIcon'
import { FACE_META } from './faceVisuals'

interface RollDieTileProps {
  die: DieInstance
  result?: RollResult
  isRolling: boolean
  isNext: boolean
}

export const RollDieTile = memo(function RollDieTile({ die, result, isRolling, isNext }: RollDieTileProps) {
  const meta = FACE_META[die.family]
  return (
    <article
      className={`roll-die roll-die--${die.family}${isNext ? ' roll-die--next' : ''}`}
      aria-label={`${die.name}${result ? ` rolled ${result.value} ${meta.label}` : ' not rolled yet'}`}
    >
      <span className="roll-die__name">{die.name}</span>
      <motion.div
        className="roll-die__body"
        animate={isRolling ? { rotateY: 720, y: [0, -18, 0] } : { rotateY: 0, y: 0 }}
        transition={{ duration: 0.52, ease: 'easeOut' }}
      >
        {isRolling || !result ? (
          <span className="roll-die__question">?</span>
        ) : (
          <span className="roll-die__result" style={{ color: meta.color }}>
            {result.value}
            <FaceIcon type={result.type} size={17} />
          </span>
        )}
      </motion.div>
    </article>
  )
})
