import { memo } from 'react'
import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { Ban } from 'lucide-react'
import type { EnemyDieDefinition, EnemyRollResult } from '../../game/types/enemyDice'
import { FaceIcon } from './FaceIcon'
import { FACE_META } from './faceVisuals'

export type EnemyIntentDieStage = 'rolling' | 'landed' | 'active' | 'cancelled'

interface EnemyIntentDieProps {
  die: EnemyDieDefinition
  isInspecting: boolean
  onInspect: () => void
  result: EnemyRollResult
  rollDelay: number
  rollDuration: number
  stage: EnemyIntentDieStage
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

const FACE_SURFACES = {
  attack: '#5f1521',
  shield: '#173b78',
  heal: '#14532d',
} as const

function EnemyFaceContent({
  iconSize,
  result,
}: {
  iconSize: number
  result: Pick<EnemyRollResult, 'type' | 'value'>
}) {
  return (
    <>
      <strong className="enemy-intent-die__face-value">{result.value}</strong>
      <span aria-hidden="true" className="enemy-intent-die__face-icon">
        <FaceIcon type={result.type} size={iconSize} />
      </span>
    </>
  )
}

export const EnemyIntentDie = memo(function EnemyIntentDie({
  die,
  isInspecting,
  onInspect,
  result,
  rollDelay,
  rollDuration,
  stage,
}: EnemyIntentDieProps) {
  const isRolling = stage === 'rolling'
  const isCancelled = stage === 'cancelled'
  const landingRotation = LANDING_ROTATIONS[result.faceIndex]
  const meta = FACE_META[result.type]

  return (
    <button
      aria-expanded={isInspecting}
      aria-label={
        isRolling
          ? `${die.name} rolling`
          : isCancelled
            ? `${die.name} cancelled`
            : `${die.name} rolled ${result.value} ${meta.label}. Show all faces.`
      }
      className={`enemy-intent-die enemy-intent-die--${result.type} enemy-intent-die--${stage}`}
      disabled={isRolling || isCancelled}
      onClick={onInspect}
      style={{ '--enemy-die-color': meta.color } as CSSProperties}
      type="button"
    >
      {isRolling ? (
        <motion.span
          animate={{
            rotateX: [0, 205, 430, landingRotation.rotateX],
            rotateY: [0, 255, 505, landingRotation.rotateY],
            scale: [0.9, 1.04, 0.98, 1],
            y: [2, -10, -5, 0],
          }}
          className="enemy-intent-die__cube"
          transition={{
            delay: rollDelay,
            duration: rollDuration,
            ease: [0.42, 0, 0.58, 1],
            times: [0, 0.38, 0.7, 1],
          }}
        >
          {die.faces.map((face, index) => (
            <span
              aria-hidden="true"
              className={`roll-die__side roll-die__side--${CUBE_SIDES[index]}`}
              key={face.id}
              style={{
                '--side-color': FACE_META[face.type].color,
                '--side-surface': FACE_SURFACES[face.type],
              } as CSSProperties}
            >
              <EnemyFaceContent iconSize={12} result={face} />
            </span>
          ))}
        </motion.span>
      ) : (
        <motion.span
          animate={stage === 'active'
            ? { scale: [1, 1.14, 0.96, 1] }
            : { scale: 1 }}
          className="enemy-intent-die__face"
          transition={{ duration: 0.42, ease: 'easeOut' }}
        >
          {isCancelled
            ? <Ban aria-hidden="true" size={20} />
            : <EnemyFaceContent iconSize={17} result={result} />}
        </motion.span>
      )}
    </button>
  )
})
