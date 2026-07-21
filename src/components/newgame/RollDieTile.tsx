import { memo } from 'react'
import type { CSSProperties, Ref } from 'react'
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

const CUBE_SIDES = ['front', 'back', 'right', 'left', 'top', 'bottom'] as const
const LANDING_ROTATIONS = [
  { rotateX: 720, rotateY: 720 },
  { rotateX: 720, rotateY: 900 },
  { rotateX: 720, rotateY: 630 },
  { rotateX: 720, rotateY: 810 },
  { rotateX: 630, rotateY: 720 },
  { rotateX: 810, rotateY: 720 },
] as const

export const RollDieTile = memo(function RollDieTile({
  activeElementRef,
  die,
  result,
  rollDuration,
  stage,
}: RollDieTileProps) {
  const meta = FACE_META[result.type]
  const isRolling = stage === 'rolling'
  const isActive = stage !== 'settled'
  const landingRotation = LANDING_ROTATIONS[result.faceIndex]

  return (
    <article
      className={`roll-die roll-die--${result.type} roll-die--${stage}`}
      data-stage={stage}
      aria-label={isRolling ? `${die.name} rolling` : `${die.name} rolled ${result.value} ${meta.label}`}
    >
      {isActive ? (
        <motion.div
          ref={activeElementRef}
          className="roll-die__cube"
          animate={
            isRolling
              ? {
                  rotateX: [0, 205, 430, landingRotation.rotateX],
                  rotateY: [0, 255, 505, landingRotation.rotateY],
                  scale: [0.96, 1.04, 1.01, 1],
                  y: [4, -24, -12, 0],
                }
              : {
                  rotateX: landingRotation.rotateX,
                  rotateY: landingRotation.rotateY,
                  scale: [1, 1.08, 0.96, 1],
                  y: [0, -3, 0],
                }
          }
          transition={{
            duration: isRolling ? rollDuration : 0.18,
            ease: isRolling ? [0.42, 0, 0.58, 1] : 'easeOut',
            times: isRolling ? [0, 0.38, 0.7, 1] : undefined,
          }}
        >
          {die.faces.map((face, index) => {
            const faceMeta = FACE_META[face.type]
            return (
              <span
                aria-hidden="true"
                className={`roll-die__side roll-die__side--${CUBE_SIDES[index]}`}
                key={face.id}
                style={{
                  '--side-color': faceMeta.color,
                  '--side-surface': faceMeta.shadow,
                } as CSSProperties}
              >
                <strong>{face.value}</strong>
                <FaceIcon type={face.type} size={20} />
              </span>
            )
          })}
        </motion.div>
      ) : (
        <div className="roll-die__body">
          <span className="roll-die__result">
            {result.value}
            <FaceIcon type={result.type} size={22} />
          </span>
        </div>
      )}
    </article>
  )
})
