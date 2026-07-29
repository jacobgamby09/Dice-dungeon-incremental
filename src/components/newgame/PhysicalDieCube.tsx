import type { CSSProperties, ReactNode, Ref } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export type PhysicalDieCubeStage = 'idle' | 'rolling' | 'landed'

export interface PhysicalDieCubeFace {
  className?: string
  content: ReactNode
  id: string
  style?: CSSProperties
}

interface PhysicalDieCubeProps {
  activeElementRef?: Ref<HTMLDivElement>
  className?: string
  faceIndex: number
  faces: readonly PhysicalDieCubeFace[]
  idleRotation?: {
    rotateX: number
    rotateY: number
  }
  rollDuration: number
  stage: PhysicalDieCubeStage
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
const LANDED_SHOWCASE_TILT = {
  rotateX: -8,
  rotateY: -10,
} as const

export function PhysicalDieCube({
  activeElementRef,
  className = '',
  faceIndex,
  faces,
  idleRotation = { rotateX: -18, rotateY: 28 },
  rollDuration,
  stage,
}: PhysicalDieCubeProps) {
  const reduceMotion = useReducedMotion()
  const safeFaceIndex = Math.max(0, Math.min(faceIndex, LANDING_ROTATIONS.length - 1))
  const landingRotation = LANDING_ROTATIONS[safeFaceIndex]
  const showcaseRotation = {
    rotateX: landingRotation.rotateX + LANDED_SHOWCASE_TILT.rotateX,
    rotateY: landingRotation.rotateY + LANDED_SHOWCASE_TILT.rotateY,
  }
  const isRolling = stage === 'rolling'
  const isIdle = stage === 'idle'

  return (
    <motion.div
      animate={isIdle
        ? {
            rotateX: idleRotation.rotateX,
            rotateY: idleRotation.rotateY,
            scale: 1,
            y: 0,
          }
        : reduceMotion
          ? {
              rotateX: showcaseRotation.rotateX,
              rotateY: showcaseRotation.rotateY,
              scale: 1,
              y: 0,
            }
          : isRolling
            ? {
                rotateX: [0, 205, 430, showcaseRotation.rotateX],
                rotateY: [0, 255, 505, showcaseRotation.rotateY],
                scale: [0.96, 1.04, 1.01, 1],
                y: [4, -24, -12, 0],
              }
            : {
                rotateX: showcaseRotation.rotateX,
                rotateY: showcaseRotation.rotateY,
                scale: [1, 1.08, 0.96, 1],
                y: [0, -3, 0],
              }}
      className={`roll-die__cube${className ? ` ${className}` : ''}`}
      ref={activeElementRef}
      transition={{
        duration: reduceMotion ? 0.01 : isRolling ? rollDuration : 0.18,
        ease: isRolling ? [0.42, 0, 0.58, 1] : 'easeOut',
        times: isRolling && !reduceMotion ? [0, 0.38, 0.7, 1] : undefined,
      }}
    >
      {faces.map((face, index) => (
        <span
          aria-hidden="true"
          className={`roll-die__side roll-die__side--${CUBE_SIDES[index]}${face.className ? ` ${face.className}` : ''}`}
          key={face.id}
          style={face.style}
        >
          {face.content}
        </span>
      ))}
    </motion.div>
  )
}
