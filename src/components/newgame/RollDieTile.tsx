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
  const meta = FACE_META[result.type]
  const isRolling = stage === 'rolling'
  return (
    <article
      className={`roll-die roll-die--${result.type} roll-die--${stage}`}
      data-stage={stage}
      aria-label={isRolling ? `${die.name} rolling` : `${die.name} rolled ${result.value} ${meta.label}`}
    >
      <motion.div
        ref={activeElementRef}
        className="roll-die__body"
        animate={
          isRolling
            ? { rotateX: [0, 180, 360, 540, 720], rotateY: [0, 270, 450, 630, 720], scale: [1, 0.82, 0.92, 0.86, 1], y: [0, -22, -8, -18, 0] }
            : stage === 'landed'
              ? { rotateX: 0, rotateY: 0, scale: [1, 1.14, 0.96, 1], y: 0 }
              : { rotateX: 0, rotateY: 0, scale: 1, y: 0 }
        }
        transition={{ duration: isRolling ? rollDuration : 0.18, ease: isRolling ? 'linear' : 'easeOut' }}
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
