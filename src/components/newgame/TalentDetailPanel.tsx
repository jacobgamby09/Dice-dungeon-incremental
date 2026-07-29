import { AnimatePresence, motion } from 'framer-motion'
import {
  Backpack,
  Bot,
  Dices,
  Heart,
  Sparkles,
  X,
  Zap,
  Map,
  Flame,
  Gauge,
  Gem,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { createDieById } from '../../game/content/dice'
import type {
  TalentDefinition,
  TalentEffect,
  TalentRankDefinition,
} from '../../game/types/progression'
import type { TalentNodeState } from './TalentNode'
import { TalentIcon } from './TalentIcon'
import { DieSummary } from './DieSummary'

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
  workshop_die_faces: Flame,
  face_cap: Gauge,
  unlock_auto_combat: Bot,
  unlock_charms: Gem,
  unlock_dungeon: Map,
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
    case 'workshop_die_faces':
      return `Workshop Die · ${effect.values.join(' · ')}`
    case 'face_cap':
      return `+${effect.amount} Workshop Face Cap`
    case 'unlock_auto_combat':
      return 'Auto Combat Toggle'
    case 'unlock_charms':
      return 'Unlock Charm System'
    case 'unlock_dungeon':
      return 'Unlock The Iron Descent'
  }
}

function getPurchaseLabel(
  state: Exclude<TalentNodeState, 'silhouette'>,
  isAffordable: boolean,
  nextRank: TalentRankDefinition | null,
  xp: number,
): string {
  if (!nextRank || state === 'maxed') return 'Maximum rank'
  if (state === 'locked') return 'Locked'
  if (!isAffordable) return `Need ${nextRank.cost - xp} XP`
  return `Buy · ${nextRank.cost} XP`
}

const DETAIL_STATE_LABELS: Record<Exclude<TalentNodeState, 'silhouette'>, string> = {
  active: 'Owned · Upgrade available',
  locked: 'Locked',
  maxed: 'Owned · Maximum rank',
  ready: 'Unlocked',
  unaffordable: 'Unlocked',
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
  const dialogRef = useRef<HTMLElement>(null)
  const displayedEffects = nextRank?.effects ?? talent?.ranks.at(-1)?.effects ?? []
  const grantedDieEffect = displayedEffects.find((effect) => effect.type === 'grant_die')
  const grantedDie = grantedDieEffect?.type === 'grant_die'
    ? createDieById(grantedDieEffect.dieId)
    : null

  useEffect(() => {
    if (!talent) return

    dialogRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isAnimating) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAnimating, onClose, talent])

  return (
    <AnimatePresence>
      {talent && (
        <motion.div
          className="talent-canvas-dialog-backdrop"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isAnimating) onClose()
          }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <motion.aside
            aria-labelledby="talent-detail-title"
            aria-modal="true"
            className="talent-canvas-inspector"
            data-testid="talent-detail-panel"
            initial={{ opacity: 0, scale: 0.88, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            ref={dialogRef}
            role="dialog"
            tabIndex={-1}
            transition={{ duration: 0.22, ease: [0.2, 0.82, 0.24, 1] }}
          >
            <button
              aria-label="Close talent details"
              className="talent-canvas-inspector__close"
              disabled={isAnimating}
              onClick={onClose}
              type="button"
            >
              <X aria-hidden="true" size={21} />
            </button>

            <div className="talent-canvas-inspector__icon">
              <TalentIcon iconKey={talent.iconKey} size={36} />
            </div>

            <header>
              <h2 id="talent-detail-title">{talent.name}</h2>
              <div className="talent-canvas-inspector__meta">
                <span
                  className={`talent-canvas-inspector__state talent-canvas-inspector__state--${nodeState}`}
                >
                  {DETAIL_STATE_LABELS[nodeState]}
                </span>
                <span>Rank {rank}/{talent.ranks.length}</span>
              </div>
            </header>

            <div className="talent-canvas-inspector__effects" aria-label="Next rank effects">
              {displayedEffects.map((effect, index) => {
                const EffectIcon = EFFECT_ICONS[effect.type]
                return (
                  <span key={`${effect.type}-${index}`}>
                    <EffectIcon aria-hidden="true" size={20} />
                    {getEffectLabel(effect)}
                  </span>
                )
              })}
            </div>

            {grantedDie ? (
              <section className="talent-canvas-inspector__die-preview">
                <DieSummary die={grantedDie} compact />
              </section>
            ) : null}

            <button
              className="talent-canvas-inspector__purchase"
              disabled={!nextRank || !isAffordable || isAnimating}
              onClick={onPurchase}
              type="button"
            >
              <Sparkles aria-hidden="true" size={19} />
              {getPurchaseLabel(nodeState, isAffordable, nextRank, xp)}
            </button>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
