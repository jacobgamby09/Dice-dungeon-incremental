import { motion, useReducedMotion } from 'framer-motion'
import { Hammer } from 'lucide-react'
import type { WorkshopDieFace } from '../../game/types/workshop'

interface WorkshopDieProps {
  appliedAmount: number | null
  faces: readonly WorkshopDieFace[]
  rolledFaceId: string | null
  stage: 'idle' | 'rolling' | 'landed'
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

export function WorkshopDie({
  appliedAmount,
  faces,
  rolledFaceId,
  stage,
}: WorkshopDieProps) {
  const reduceMotion = useReducedMotion()
  const rolledFaceIndex = Math.max(
    0,
    faces.findIndex((face) => face.id === rolledFaceId),
  )
  const landingRotation = LANDING_ROTATIONS[rolledFaceIndex]
  const isRolling = stage === 'rolling'
  const isLanded = stage === 'landed'

  return (
    <article
      aria-label={isRolling
        ? 'Workshop Die rolling'
        : isLanded
          ? `Workshop Die rolled plus ${appliedAmount ?? 1}`
          : `Workshop Die faces ${faces.map((face) => face.value).join(', ')}`}
      className={`workshop-power-die workshop-power-die--${stage}${(appliedAmount ?? 0) > 1 ? ' workshop-power-die--jackpot' : ''}`}
    >
      <motion.div
        animate={reduceMotion
          ? { rotateX: landingRotation.rotateX, rotateY: landingRotation.rotateY }
          : isRolling
            ? {
                rotateX: [0, 215, 445, landingRotation.rotateX],
                rotateY: [0, 265, 515, landingRotation.rotateY],
                scale: [0.96, 1.06, 1.01, 1],
                y: [4, -25, -12, 0],
              }
            : isLanded
              ? {
                  rotateX: landingRotation.rotateX,
                  rotateY: landingRotation.rotateY,
                  scale: [1, 1.12, 0.96, 1],
                  y: [0, -4, 0],
                }
              : {
                  rotateX: -18,
                  rotateY: 28,
                  scale: 1,
                  y: 0,
                }}
        className="workshop-power-die__cube"
        transition={{
          duration: reduceMotion ? 0.01 : isRolling ? 0.9 : 0.24,
          ease: isRolling ? [0.42, 0, 0.58, 1] : 'easeOut',
          times: isRolling ? [0, 0.38, 0.7, 1] : undefined,
        }}
      >
        {faces.map((face, index) => (
          <span
            aria-hidden="true"
            className={`workshop-power-die__side workshop-power-die__side--${CUBE_SIDES[index]}`}
            key={face.id}
          >
            <strong>{face.value}</strong>
            <Hammer size={18} />
          </span>
        ))}
      </motion.div>

      {isLanded ? (
        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="workshop-power-die__impact"
          initial={{ opacity: 0, scale: 0.64, y: 10 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.24 }}
        >
          +{appliedAmount ?? 1}
        </motion.div>
      ) : null}
    </article>
  )
}
