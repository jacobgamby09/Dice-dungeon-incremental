import { memo } from 'react'
import type { CSSProperties, Ref } from 'react'
import { motion } from 'framer-motion'
import type { DieInstance, RollResult } from '../../game/types/dice'
import { FaceIcon } from './FaceIcon'
import { FACE_META } from './faceVisuals'
import { SignatureIcon } from './SignatureIcon'
import { getSignatureVisualStyle } from './signatureVisuals'
import { PhysicalDieCube } from './PhysicalDieCube'
import { ImprintIcon } from './ImprintIcon'

interface RollDieTileProps {
  die: DieInstance
  result: RollResult
  stage: 'rolling' | 'landed' | 'settled'
  rollDuration: number
  activeElementRef?: Ref<HTMLDivElement>
  onInspectImprint?: () => void
}

export const RollDieTile = memo(function RollDieTile({
  activeElementRef,
  die,
  onInspectImprint,
  result,
  rollDuration,
  stage,
}: RollDieTileProps) {
  const meta = FACE_META[result.type]
  const isRolling = stage === 'rolling'
  const isActive = stage !== 'settled'
  const landedSignature = !isRolling ? result.signature : undefined
  const echoTrigger = result.charmTriggers?.find((trigger) => trigger.kind === 'echo')
  const signatureClassName = landedSignature
    ? ` roll-die--signature roll-die--signature-${landedSignature.id}`
    : ''
  const imprintClassName = result.imprint
    ? ` roll-die--imprint roll-die--imprint-${result.imprint.definitionId}`
    : ''

  return (
    <article
      className={`roll-die roll-die--${result.type} roll-die--${stage}${signatureClassName}${imprintClassName}${echoTrigger ? ' roll-die--echo' : ''}${onInspectImprint ? ' roll-die--inspectable' : ''}`}
      data-stage={stage}
      onClick={onInspectImprint}
      onKeyDown={onInspectImprint ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onInspectImprint()
        }
      } : undefined}
      role={onInspectImprint ? 'button' : undefined}
      tabIndex={onInspectImprint ? 0 : undefined}
      style={landedSignature ? getSignatureVisualStyle(landedSignature.id) : undefined}
      aria-label={isRolling
        ? `${die.name} rolling`
        : `${die.name} rolled ${result.value} ${meta.label}${result.signature ? `, ${result.signature.name} signature` : ''}${result.imprint ? `, ${result.imprint.name} Imprint. Open details` : ''}`}
    >
      {isActive ? (
        <PhysicalDieCube
          activeElementRef={activeElementRef}
          faceIndex={result.faceIndex}
          faces={die.faces.map((face) => {
            const faceMeta = FACE_META[face.type]
            const signatureStyle = face.signature ? getSignatureVisualStyle(face.signature.id) : {}
            const imprintStyle = face.imprint ? {
              '--side-color': face.imprint.rarity === 'legendary' ? '#f97316' : face.imprint.rarity === 'epic' ? '#c026d3' : '#22d3ee',
              '--side-surface': face.imprint.rarity === 'legendary' ? '#7c2d12' : face.imprint.rarity === 'epic' ? '#581c87' : '#164e63',
            } : {}
            return {
              className: `${face.signature ? ` signature-face-surface signature-face-surface--${face.signature.id}` : ''}${face.imprint ? ` imprint-face-surface imprint-face-surface--${face.imprint.rarity}` : ''}`,
              content: (
                <>
                  <strong>{face.value}</strong>
                  {face.imprint
                    ? <ImprintIcon id={face.imprint.definitionId} rarity={face.imprint.rarity} size={24} />
                    : face.signature
                      ? <SignatureIcon signatureId={face.signature.id} size={24} />
                    : <FaceIcon type={face.type} size={20} />}
                </>
              ),
              id: face.id,
              style: {
                  '--side-color': faceMeta.color,
                  '--side-surface': faceMeta.shadow,
                  ...signatureStyle,
                  ...imprintStyle,
                } as CSSProperties,
            }
          })}
          rollDuration={rollDuration}
          stage={isRolling ? 'rolling' : 'landed'}
        />
      ) : (
        <div className={`roll-die__body${result.signature ? ` signature-face-surface signature-face-surface--${result.signature.id}` : ''}${result.imprint ? ` imprint-face-surface imprint-face-surface--${result.imprint.rarity}` : ''}`}>
          <span className="roll-die__result">
            {result.value}
            {result.imprint
              ? <ImprintIcon id={result.imprint.definitionId} rarity={result.imprint.rarity} size={22} />
              : result.signature
                ? <SignatureIcon signatureId={result.signature.id} size={22} />
              : <FaceIcon type={result.type} size={22} />}
          </span>
          {result.signature ? (
            <small className="roll-die__special-name">{result.signature.name}</small>
          ) : null}
          {result.imprint ? <small className="roll-die__special-name">{result.imprint.name}</small> : null}
        </div>
      )}
      {stage === 'landed' ? (
        <span
          aria-hidden="true"
          className={`roll-die__landing-ring${result.signature ? ' roll-die__landing-ring--signature' : ''}`}
        />
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
      {stage === 'landed' && result.imprint ? (
        <motion.div
          animate={{ opacity: [0, 1, 1, 0], scale: [0.7, 1.12, 1, 1.16], y: [8, -7, -8, -12] }}
          aria-hidden="true"
          className={`imprint-impact imprint-impact--${result.imprint.rarity} imprint-impact--${result.imprint.definitionId}`}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', times: [0, 0.2, 0.76, 1] }}
        >
          <ImprintIcon id={result.imprint.definitionId} rarity={result.imprint.rarity} size={18} />
          <strong>{result.imprint.name}</strong>
          {result.imprintBonus ? <span>+{result.imprintBonus}</span> : null}
        </motion.div>
      ) : null}
      {stage === 'landed' && echoTrigger ? (
        <div className="charm-echo-impact" role="status">
          <strong>Echo</strong>
          <span>+{echoTrigger.amount}</span>
        </div>
      ) : null}
    </article>
  )
})
