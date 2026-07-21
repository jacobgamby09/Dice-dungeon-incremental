import { memo } from 'react'
import type { Ref } from 'react'
import { motion } from 'framer-motion'
import type { DieInstance, RollResult } from '../../game/types/dice'
import { FaceIcon } from './FaceIcon'
import { FACE_META } from './faceVisuals'

interface RollDieTileProps {
  die: DieInstance
  result: RollResult
  stage: 'rolling' | 'landed' | 'settled'
  rollDuration: number
  activeElementRef?: Ref<HTMLDivElement>
}

export const RollDieTile = memo(function RollDieTile({
  activeElementRef,
  die,
  result,
  rollDuration,
  stage,
}: RollDieTileProps) {
  const meta = FACE_META[die.family]
  const isRolling = stage === 'rolling'
  return (
    <article
      className={`roll-die roll-die--${die.family}`}
      aria-label={isRolling ? `${die.name} rolling` : `${die.name} rolled ${result.value} ${meta.label}`}
    >
      <motion.div
        ref={activeElementRef}
        className="roll-die__body"
        animate={
          isRolling
            ? { rotateY: 720, scale: [1, 0.82, 1], y: [0, -18, 0] }
            : stage === 'landed'
              ? { rotateY: 0, scale: [1, 1.13, 1], y: 0 }
              : { rotateY: 0, scale: 1, y: 0 }
        }
        transition={{ duration: isRolling ? rollDuration : 0.14, ease: 'easeOut' }}
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
