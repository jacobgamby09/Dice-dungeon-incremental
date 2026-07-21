import { memo } from 'react'
import { motion } from 'framer-motion'
import type { DieInstance, RollResult } from '../../game/types/dice'
import { FaceIcon } from './FaceIcon'
import { FACE_META } from './faceVisuals'

interface RollDieTileProps {
  die: DieInstance
  result: RollResult
  isRolling: boolean
}

export const RollDieTile = memo(function RollDieTile({ die, result, isRolling }: RollDieTileProps) {
  const meta = FACE_META[die.family]
  return (
    <article
      className={`roll-die roll-die--${die.family}`}
      aria-label={`${die.name} rolled ${result.value} ${meta.label}`}
    >
      <motion.div
        className="roll-die__body"
        animate={isRolling ? { rotateY: 720, y: [0, -18, 0] } : { rotateY: 0, y: 0 }}
        transition={{ duration: 0.52, ease: 'easeOut' }}
      >
        {isRolling ? (
          <span className="roll-die__question">?</span>
        ) : (
          <span className="roll-die__result">
            {result.value}
            <FaceIcon type={result.type} size={22} />
          </span>
        )}
      </motion.div>
    </article>
  )
})
