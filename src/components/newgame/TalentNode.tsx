import { motion } from 'framer-motion'
import { LockKeyhole } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { TalentDefinition } from '../../game/types/progression'
import { TalentIcon } from './TalentIcon'

export type TalentNodeState =
  | 'silhouette'
  | 'locked'
  | 'unaffordable'
  | 'ready'
  | 'active'
  | 'maxed'

interface TalentNodeProps {
  disabled?: boolean
  isActivating?: boolean
  isAffordable?: boolean
  isNew?: boolean
  isSelected?: boolean
  nextCost: number | null
  onSelect: (talent: TalentDefinition) => void
  rank: number
  revealOrder?: number
  state: TalentNodeState
  talent: TalentDefinition
}

const STATE_LABELS: Record<Exclude<TalentNodeState, 'silhouette'>, string> = {
  active: 'Active',
  locked: 'Path required',
  maxed: 'Maximum rank',
  ready: 'Ready to purchase',
  unaffordable: 'Not enough XP',
}

export function TalentNode({
  disabled = false,
  isActivating = false,
  isAffordable = false,
  isNew = false,
  isSelected = false,
  nextCost,
  onSelect,
  rank,
  revealOrder = 0,
  state,
  talent,
}: TalentNodeProps) {
  const maxRank = talent.ranks.length
  const revealStyle = { '--talent-reveal-order': revealOrder } as CSSProperties

  if (state === 'silhouette') {
    return (
      <motion.div
        aria-hidden="true"
        className={`talent-canvas-node talent-canvas-node--silhouette${isNew ? ' talent-canvas-node--new' : ''}`}
        data-talent-silhouette="true"
        initial={isNew ? { opacity: 0, scale: 0.32 } : false}
        animate={{ opacity: 1, scale: 1 }}
        style={revealStyle}
        transition={{
          delay: revealOrder * 0.09,
          duration: 0.46,
          ease: [0.2, 0.82, 0.24, 1],
        }}
      >
        <span className="talent-canvas-node__fog talent-canvas-node__fog--one" />
        <span className="talent-canvas-node__fog talent-canvas-node__fog--two" />
        <span className="talent-canvas-node__face">
          <span className="talent-canvas-node__unknown" />
        </span>
      </motion.div>
    )
  }

  const rankLabel = maxRank > 1 ? ` Rank ${rank} of ${maxRank}.` : ''
  const costLabel = nextCost === null ? '' : ` Next rank costs ${nextCost} XP.`
  const affordableLabel = isAffordable ? ' Affordable.' : ''

  return (
    <motion.button
      aria-label={`${talent.name}. ${talent.description} ${STATE_LABELS[state]}.${rankLabel}${costLabel}${affordableLabel}`}
      aria-pressed={isSelected}
      className={[
        'talent-canvas-node',
        `talent-canvas-node--${state}`,
        isAffordable ? 'talent-canvas-node--affordable' : '',
        isActivating ? 'talent-canvas-node--activating' : '',
        isNew ? 'talent-canvas-node--new' : '',
      ].filter(Boolean).join(' ')}
      data-talent-node="true"
      disabled={disabled}
      initial={isNew ? { opacity: 0, scale: 0.32 } : false}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => onSelect(talent)}
      style={revealStyle}
      transition={{
        delay: revealOrder * 0.09,
        duration: 0.46,
        ease: [0.2, 0.82, 0.24, 1],
      }}
      type="button"
    >
      <motion.span
        className="talent-canvas-node__face"
        initial={false}
        animate={isActivating
          ? {
              rotateX: [0, -34, 205, 360],
              rotateY: [0, 155, 330, 360],
              scale: [1, 1.18, 0.92, 1],
              y: [0, -19, -6, 0],
            }
          : { rotateX: 0, rotateY: 0, scale: 1, y: 0 }}
        transition={isActivating
          ? { duration: 0.72, ease: [0.22, 0.76, 0.24, 1] }
          : { duration: 0.16 }}
      >
        {state === 'locked'
          ? <LockKeyhole aria-hidden="true" size={25} />
          : <TalentIcon iconKey={talent.iconKey} size={27} />}

        {maxRank > 1 && (
          <span aria-hidden="true" className="talent-canvas-node__ranks">
            {talent.ranks.map((_, index) => (
              <span
                className={index < rank ? 'talent-canvas-node__rank talent-canvas-node__rank--filled' : 'talent-canvas-node__rank'}
                key={`${talent.id}-rank-${index + 1}`}
              />
            ))}
          </span>
        )}

        {isActivating && (
          <span aria-hidden="true" className="talent-canvas-node__particles">
            {Array.from({ length: 12 }, (_, index) => (
              <span
                key={`${talent.id}-particle-${index}`}
                style={{ '--particle-index': index } as CSSProperties}
              />
            ))}
          </span>
        )}
      </motion.span>
    </motion.button>
  )
}
