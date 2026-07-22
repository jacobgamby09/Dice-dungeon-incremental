import { memo, useState } from 'react'
import type { CSSProperties, Ref } from 'react'
import { motion } from 'framer-motion'
import { Ban } from 'lucide-react'
import type { EnemyAttackDieDefinition, EnemyAttackRollResult } from '../../game/types/enemyDice'
import { FaceIcon } from './FaceIcon'
import { FACE_META } from './faceVisuals'

export type EnemyIntentDieStage = 'rolling' | 'landed' | 'attacking' | 'cancelled'

interface EnemyIntentDieProps {
  die: EnemyAttackDieDefinition
  inspectRef?: Ref<HTMLButtonElement>
  result: EnemyAttackRollResult
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

export const EnemyIntentDie = memo(function EnemyIntentDie({
  die,
  inspectRef,
  result,
  rollDuration,
  stage,
}: EnemyIntentDieProps) {
  const [showFaces, setShowFaces] = useState(false)
  const isRolling = stage === 'rolling'
  const isCancelled = stage === 'cancelled'
  const landingRotation = LANDING_ROTATIONS[result.faceIndex]
  const values = die.faces.map((face) => face.value)
  const average = values.reduce((total, value) => total + value, 0) / values.length

  return (
    <div className={`enemy-intent-die enemy-intent-die--${stage}`}>
      <span className="enemy-intent-die__label">
        {isCancelled ? 'Intent cancelled' : isRolling ? 'Enemy rolling' : 'Incoming attack'}
      </span>
      <button
        ref={inspectRef}
        aria-expanded={showFaces}
        aria-label={
          isRolling
            ? `${die.name} rolling`
            : isCancelled
              ? `${die.name} attack cancelled`
              : `${die.name} rolled ${result.value} Attack. Show all faces.`
        }
        className="enemy-intent-die__inspect"
        disabled={isRolling || isCancelled}
        onClick={() => setShowFaces((visible) => !visible)}
        type="button"
      >
        {isRolling ? (
          <motion.span
            animate={{
              rotateX: [0, 205, 430, landingRotation.rotateX],
              rotateY: [0, 255, 505, landingRotation.rotateY],
              scale: [0.9, 1.04, 0.98, 1],
              y: [2, -12, -6, 0],
            }}
            className="enemy-intent-die__cube"
            transition={{
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
                  '--side-color': FACE_META.attack.color,
                  '--side-surface': '#5f1521',
                } as CSSProperties}
              >
                <strong>{face.value}</strong>
                <FaceIcon type="attack" size={14} />
              </span>
            ))}
          </motion.span>
        ) : (
          <motion.span
            animate={stage === 'attacking' ? { scale: [1, 1.12, 0.96, 1] } : { scale: 1 }}
            className="enemy-intent-die__face"
            transition={{ duration: 0.42, ease: 'easeOut' }}
          >
            {isCancelled ? (
              <Ban aria-hidden="true" size={22} />
            ) : (
              <>
                <strong className="enemy-intent-die__face-value">{result.value}</strong>
                <span aria-hidden="true" className="enemy-intent-die__face-icon">
                  <FaceIcon type="attack" size={19} />
                </span>
              </>
            )}
          </motion.span>
        )}
        <span className="enemy-intent-die__value">
          {isCancelled ? 'No attack' : isRolling ? 'Revealing…' : `Attack ${result.value}`}
        </span>
      </button>

      {showFaces && !isRolling && !isCancelled && (
        <div className="enemy-intent-die__details" role="note">
          <strong>{die.name}</strong>
          <div aria-label={`Faces: ${values.join(', ')}`}>
            {die.faces.map((face) => <span key={face.id}>{face.value}</span>)}
          </div>
          <small>Range {Math.min(...values)}–{Math.max(...values)} · Avg {average.toFixed(1)}</small>
        </div>
      )}
    </div>
  )
})
