import { motion } from 'framer-motion'
import type { CSSProperties } from 'react'
import {
  Backpack,
  Bot,
  Dice6,
  Heart,
  HelpCircle,
  LockKeyhole,
  Sparkles,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TalentDefinition, TalentEffect } from '../../game/types/progression'

export type TalentNodeState = 'hidden' | 'locked' | 'too-expensive' | 'ready' | 'purchased'

interface TalentNodeProps {
  isNew?: boolean
  isSelected?: boolean
  onSelect: (talent: TalentDefinition) => void
  state: TalentNodeState
  talent: TalentDefinition
  xp: number
}

const EFFECT_ICONS: Record<TalentEffect['type'], LucideIcon> = {
  max_hp: Heart,
  dice_slots: Backpack,
  grant_die: Dice6,
  roll_speed: Zap,
  unlock_auto_roll: Bot,
}

const STATE_LABELS: Record<Exclude<TalentNodeState, 'hidden'>, string> = {
  locked: 'Requires path',
  'too-expensive': 'Gather XP',
  ready: 'Ready',
  purchased: 'Active',
}

export function TalentNode({ isNew = false, isSelected = false, onSelect, state, talent, xp }: TalentNodeProps) {
  if (state === 'hidden') {
    return (
      <div aria-hidden="true" className="talent-node talent-node--hidden">
        <span className="talent-node__core"><HelpCircle size={19} /></span>
        <span className="talent-node__name">Unrevealed</span>
        <span className="talent-node__status">Deeper path</span>
      </div>
    )
  }

  const progress = state === 'purchased' ? 100 : Math.min(100, Math.round((xp / talent.cost) * 100))

  return (
    <motion.button
      aria-label={`${talent.name}. ${talent.description} ${talent.cost} XP. ${STATE_LABELS[state]}.`}
      aria-pressed={isSelected}
      className={`talent-node talent-node--${state}${isNew ? ' talent-node--new' : ''}`}
      initial={isNew ? { opacity: 0, scale: 0.72 } : false}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => onSelect(talent)}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      type="button"
    >
      <span className="talent-node__core" aria-hidden="true">
        {state === 'locked' ? (
          <LockKeyhole size={19} />
        ) : (
          <span className="talent-node__rewards">
            {talent.effects.map((effect, index) => {
              const EffectIcon = EFFECT_ICONS[effect.type]
              return <EffectIcon key={`${effect.type}-${index}`} size={talent.effects.length > 1 ? 14 : 20} />
            })}
          </span>
        )}
      </span>
      <span className="talent-node__name">{talent.name}</span>
      <span className="talent-node__price">
        <Sparkles aria-hidden="true" size={11} />
        {state === 'purchased' ? '—' : talent.cost}
      </span>
      <span className="talent-node__status">{isNew ? 'New path' : STATE_LABELS[state]}</span>
      <span
        aria-hidden="true"
        className="talent-node__progress"
        style={{ '--talent-progress': `${progress}%` } as CSSProperties}
      />
    </motion.button>
  )
}
