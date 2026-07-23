import { motion } from 'framer-motion'
import type { CSSProperties } from 'react'
import { LockKeyhole, Sparkles } from 'lucide-react'
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
  locked: 'Path required',
  unaffordable: 'Gather XP',
  ready: 'Ready',
  active: 'Active',
  maxed: 'Maxed',
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
  const style = { '--talent-reveal-order': revealOrder } as CSSProperties

  if (state === 'silhouette') {
    return (
      <motion.div
        aria-hidden="true"
        className={`talent-die-node talent-die-node--silhouette${isNew ? ' talent-die-node--new' : ''}`}
        initial={isNew ? { opacity: 0, scale: 0.45, y: 14 } : false}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={style}
        transition={{ delay: revealOrder * 0.08, duration: 0.34, ease: 'easeOut' }}
      >
        <span className="talent-die-node__fog talent-die-node__fog--one" />
        <span className="talent-die-node__fog talent-die-node__fog--two" />
        <span className="talent-die-node__face"><span /></span>
        <span className="talent-die-node__mystery">Unknown</span>
      </motion.div>
    )
  }

  const status = rank > 0 ? `Rank ${rank} of ${maxRank}` : STATE_LABELS[state]
  const purchaseState = isAffordable && rank > 0 ? ' Upgrade ready.' : ''

  return (
    <motion.button
      aria-label={`${talent.name}. ${talent.description} ${status}.${nextCost === null ? '' : ` Next rank costs ${nextCost} XP.`}${purchaseState}`}
      aria-pressed={isSelected}
      className={[
        'talent-die-node',
        `talent-die-node--${state}`,
        isAffordable ? 'talent-die-node--affordable' : '',
        isActivating ? 'talent-die-node--activating' : '',
        isNew ? 'talent-die-node--new' : '',
      ].filter(Boolean).join(' ')}
      disabled={disabled}
      initial={isNew ? { opacity: 0, scale: 0.45, y: 14 } : false}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      onClick={() => onSelect(talent)}
      style={style}
      transition={{ delay: revealOrder * 0.08, duration: 0.34, ease: 'easeOut' }}
      type="button"
    >
      <motion.span
        className="talent-die-node__face"
        initial={false}
        animate={isActivating
          ? {
              rotateX: [0, -28, 210, 360],
              rotateY: [0, 170, 335, 360],
              scale: [1, 1.12, 0.94, 1],
              y: [0, -15, -5, 0],
            }
          : { rotateX: 0, rotateY: 0, scale: 1, y: 0 }}
        transition={isActivating
          ? { duration: 0.7, ease: [0.22, 0.76, 0.24, 1] }
          : { duration: 0.15 }}
      >
        {state === 'locked'
          ? <LockKeyhole aria-hidden="true" size={24} />
          : <TalentIcon iconKey={talent.iconKey} />}
        {maxRank > 1 && (
          <span className="talent-die-node__rank">{rank}/{maxRank}</span>
        )}
        {isActivating && (
          <span aria-hidden="true" className="talent-die-node__particles">
            {Array.from({ length: 10 }, (_, index) => (
              <span key={index} style={{ '--particle-index': index } as CSSProperties} />
            ))}
          </span>
        )}
      </motion.span>
      <span className="talent-die-node__name">{talent.name}</span>
      <span className="talent-die-node__meta">
        {nextCost === null ? (
          'MAX'
        ) : (
          <><Sparkles aria-hidden="true" size={10} />{nextCost}</>
        )}
      </span>
    </motion.button>
  )
}
