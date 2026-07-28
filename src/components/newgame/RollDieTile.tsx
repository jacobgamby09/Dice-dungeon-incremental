import { memo } from 'react'
import type { CSSProperties, Ref } from 'react'
import { motion } from 'framer-motion'
import type { DieInstance, RollResult } from '../../game/types/dice'
import { FaceIcon } from './FaceIcon'
import { FACE_META } from './faceVisuals'
import { EvolutionIcon } from './EvolutionIcon'
import { getEvolutionVisualStyle } from './evolutionVisuals'
import { SignatureIcon } from './SignatureIcon'
import { getSignatureVisualStyle } from './signatureVisuals'

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
  const landedEvolution = !isRolling ? result.evolution : undefined
  const landedSignature = !isRolling ? result.signature : undefined
  const evolutionClassName = landedEvolution
    ? ` roll-die--evolution roll-die--evolution-${landedEvolution.id}`
    : ''
  const signatureClassName = landedSignature
    ? ` roll-die--signature roll-die--signature-${landedSignature.id}`
    : ''

  return (
    <article
      className={`roll-die roll-die--${result.type} roll-die--${stage}${evolutionClassName}${signatureClassName}`}
      data-stage={stage}
      style={
        landedEvolution
          ? getEvolutionVisualStyle(landedEvolution.id)
          : landedSignature
            ? getSignatureVisualStyle(landedSignature.id)
            : undefined
      }
      aria-label={isRolling
        ? `${die.name} rolling`
        : `${die.name} rolled ${result.value} ${meta.label}${result.evolution ? `, ${result.evolution.name} evolution` : ''}${result.signature ? `, ${result.signature.name} signature` : ''}`}
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
            const evolutionStyle = face.evolution ? getEvolutionVisualStyle(face.evolution.id) : {}
            const signatureStyle = face.signature ? getSignatureVisualStyle(face.signature.id) : {}
            return (
              <span
                aria-hidden="true"
                className={`roll-die__side roll-die__side--${CUBE_SIDES[index]}${face.evolution ? ` evolution-face-surface evolution-face-surface--${face.evolution.id}` : ''}${face.signature ? ` signature-face-surface signature-face-surface--${face.signature.id}` : ''}`}
                key={face.id}
                style={{
                  '--side-color': faceMeta.color,
                  '--side-surface': faceMeta.shadow,
                  ...evolutionStyle,
                  ...signatureStyle,
                } as CSSProperties}
              >
                <strong>{face.value}</strong>
                {face.evolution
                  ? (
                    <>
                      <EvolutionIcon evolutionId={face.evolution.id} size={24} />
                      <span className="evolution-face__attack-mark"><FaceIcon type="attack" size={10} /></span>
                    </>
                  )
                  : face.signature
                    ? <SignatureIcon signatureId={face.signature.id} size={24} />
                  : <FaceIcon type={face.type} size={20} />}
              </span>
            )
          })}
        </motion.div>
      ) : (
        <div className={`roll-die__body${result.evolution ? ` evolution-face-surface evolution-face-surface--${result.evolution.id}` : ''}${result.signature ? ` signature-face-surface signature-face-surface--${result.signature.id}` : ''}`}>
          <span className="roll-die__result">
            {result.value}
            {result.evolution
              ? <EvolutionIcon evolutionId={result.evolution.id} size={22} />
              : result.signature
                ? <SignatureIcon signatureId={result.signature.id} size={22} />
              : <FaceIcon type={result.type} size={22} />}
          </span>
          {result.evolution ? (
            <>
              <span className="evolution-face__attack-mark"><FaceIcon type="attack" size={9} /></span>
              <small className="roll-die__evolution">{result.evolution.name}</small>
            </>
          ) : null}
          {result.signature ? (
            <small className="roll-die__evolution">{result.signature.name}</small>
          ) : null}
        </div>
      )}
      {stage === 'landed' && result.evolution ? (
        <motion.div
          animate={{ opacity: [0, 1, 1, 0], scale: [0.72, 1.08, 1, 1.12], y: [8, -6, -7, -10] }}
          aria-hidden="true"
          className={`evolution-impact evolution-impact--${result.evolution.id}`}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.34, ease: 'easeOut', times: [0, 0.18, 0.76, 1] }}
        >
          <EvolutionIcon evolutionId={result.evolution.id} size={17} />
          <strong>{result.evolution.name}</strong>
        </motion.div>
      ) : null}
      {stage === 'landed' && result.signature ? (
        <motion.div
          animate={{ opacity: [0, 1, 1, 0], scale: [0.72, 1.08, 1, 1.12], y: [8, -6, -7, -10] }}
          aria-hidden="true"
          className={`signature-impact signature-impact--${result.signature.id}`}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.34, ease: 'easeOut', times: [0, 0.18, 0.76, 1] }}
        >
          <SignatureIcon signatureId={result.signature.id} size={17} />
          <strong>{result.signature.name}</strong>
        </motion.div>
      ) : null}
    </article>
  )
})
