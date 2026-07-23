import { AnimatePresence, motion } from 'framer-motion'
import {
  Backpack,
  Bot,
  Dices,
  Heart,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { createDieById } from '../../game/content/dice'
import type {
  TalentDefinition,
  TalentEffect,
  TalentRankDefinition,
} from '../../game/types/progression'
import type { TalentNodeState } from './TalentNode'
import { TalentIcon } from './TalentIcon'

interface TalentDetailPanelProps {
  isAnimating: boolean
  isAffordable: boolean
  nextRank: TalentRankDefinition | null
  nodeState: Exclude<TalentNodeState, 'silhouette'>
  onClose: () => void
  onPurchase: () => void
  rank: number
  talent: TalentDefinition | null
  xp: number
}

const EFFECT_ICONS: Record<TalentEffect['type'], LucideIcon> = {
  max_hp: Heart,
  dice_slots: Backpack,
  grant_die: Dices,
  roll_speed: Zap,
  unlock_auto_roll: Bot,
}

function getEffectLabel(effect: TalentEffect): string {
  switch (effect.type) {
    case 'max_hp':
      return `+${effect.amount} Max HP`
    case 'dice_slots':
      return `+${effect.amount} Dice Slot`
    case 'grant_die':
      return createDieById(effect.dieId)?.name ?? 'Permanent Die'
    case 'roll_speed':
      return `${Math.round((effect.multiplier - 1) * 100)}% Faster Rolls`
    case 'unlock_auto_roll':
      return 'Auto Roll Toggle'
  }
}

function getPurchaseLabel(
  state: Exclude<TalentNodeState, 'silhouette'>,
  isAffordable: boolean,
  nextRank: TalentRankDefinition | null,
  xp: number,
): string {
  if (!nextRank || state === 'maxed') return 'Maximum rank reached'
  if (state === 'locked') return 'Complete the previous path'
  if (!isAffordable) return `Need ${nextRank.cost - xp} more XP`
  return `Purchase for ${nextRank.cost} XP`
}

export function TalentDetailPanel({
  isAnimating,
  isAffordable,
  nextRank,
  nodeState,
  onClose,
  onPurchase,
  rank,
  talent,
  xp,
}: TalentDetailPanelProps) {
  return (
    <AnimatePresence>
      {talent && (
        <motion.aside
          aria-labelledby="talent-detail-title"
          className="talent-detail-panel"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <button
            aria-label="Close talent details"
            className="talent-detail-panel__close"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={17} />
          </button>

          <div className="talent-detail-panel__icon">
            <TalentIcon iconKey={talent.iconKey} size={23} />
          </div>

          <header>
            <span>{talent.track} talent</span>
            <h2 id="talent-detail-title">{talent.name}</h2>
            <p>{talent.description}</p>
          </header>

          <div className="talent-detail-panel__rank">
            <span>Rank</span>
            <strong>{rank}/{talent.ranks.length}</strong>
          </div>

          <div className="talent-detail-panel__effects" aria-label="Next rank effects">
            {(nextRank?.effects ?? talent.ranks.at(-1)?.effects ?? []).map((effect, index) => {
              const EffectIcon = EFFECT_ICONS[effect.type]
              return (
                <span key={`${effect.type}-${index}`}>
                  <EffectIcon aria-hidden="true" size={14} />
                  {getEffectLabel(effect)}
                </span>
              )
            })}
          </div>

          <button
            className="talent-detail-panel__purchase"
            disabled={!nextRank || !isAffordable || isAnimating}
            onClick={onPurchase}
            type="button"
          >
            <Sparkles aria-hidden="true" size={15} />
            {getPurchaseLabel(nodeState, isAffordable, nextRank, xp)}
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
