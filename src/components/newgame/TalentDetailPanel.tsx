import { AnimatePresence, motion } from 'framer-motion'
import {
  Bot,
  Dices,
  Heart,
  X,
  Zap,
  Flame,
  Gem,
  BookOpen,
  Coins,
  Hammer,
  Link2,
  Clover,
  Search,
  Badge,
  Pickaxe,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { createDieById } from '../../game/content/dice'
import { CurrencyIcon } from './CurrencyIcon'
import { DUNGEONS } from '../../game/content/dungeons'
import { TALENTS_BY_ID } from '../../game/content/talents'
import { getTalentRank } from '../../game/progression/talents'
import type { DungeonId, DungeonProgress } from '../../game/types/dungeon'
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
  talentRanks: Readonly<Record<string, number>>
  dungeonProgress: Readonly<Record<DungeonId, DungeonProgress>>
  xp: number
}

const EFFECT_ICONS: Record<TalentEffect['type'], LucideIcon> = {
  max_hp: Heart,
  dice_slots: Dices,
  grant_die: Dices,
  roll_speed: Zap,
  workshop_die_faces: Flame,
  workshop_target_rerolls: Dices,
  unlock_auto_combat: Bot,
  unlock_charms: Gem,
  xp_per_kill: BookOpen,
  soul_die_faces: Coins,
  workshop_cost_multiplier: Hammer,
  charm_slots: Link2,
  charm_rarity_protection: Clover,
  fate_drop_multiplier: Search,
  imprint_drop_multiplier: Search,
  imprint_forge_bonus_chance: Badge,
  workshop_forge_bonus_chance: Zap,
  dungeon_loot_multiplier: Pickaxe,
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
    case 'workshop_target_rerolls':
      return `+${effect.amount} Target Reroll per Forge`
    case 'unlock_auto_combat':
      return 'Auto Combat Toggle'
    case 'unlock_charms':
      return 'Unlock Charm System'
    case 'xp_per_kill':
      return `+${effect.amount} XP per Enemy`
    case 'soul_die_faces':
      return `Soul Die · ${effect.values.map((value) => `×${value}`).join(' · ')}`
    case 'workshop_cost_multiplier':
      return `${Math.round((1 - effect.multiplier) * 100)}% Cheaper Workshop`
    case 'charm_slots':
      return `+${effect.amount} Charm Slot`
    case 'charm_rarity_protection':
      return effect.legendaryThreshold
        ? `Epic+ within ${effect.epicThreshold} · Legendary within ${effect.legendaryThreshold}`
        : `Epic+ within ${effect.epicThreshold} Fate Draws`
    case 'fate_drop_multiplier':
      return `+${Math.round((effect.multiplier - 1) * 100)}% Fate Token Chance`
    case 'imprint_drop_multiplier':
      return `+${Math.round((effect.multiplier - 1) * 100)}% Imprint Chance`
    case 'imprint_forge_bonus_chance':
      return `${Math.round(effect.chance * 100)}% chance for +1 extra Imprint Power`
    case 'workshop_forge_bonus_chance':
      return `${Math.round(effect.chance * 100)}% chance for +1 extra Forge Power`
    case 'dungeon_loot_multiplier':
      return `+${Math.round((effect.multiplier - 1) * 100)}% Deep Dungeon Loot`
  }
}

function getPurchaseLabel(
  state: Exclude<TalentNodeState, 'silhouette'>,
  isAffordable: boolean,
  nextRank: TalentRankDefinition | null,
  xp: number,
  prerequisitesMet: boolean,
  requirementsMet: boolean,
): string {
  if (!nextRank || state === 'maxed') return 'Maximum rank'
  if (!prerequisitesMet) return 'Complete a connected talent'
  if (!requirementsMet) return 'Clear Dungeon 1 to unlock'
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
  talentRanks,
  dungeonProgress,
  xp,
}: TalentDetailPanelProps) {
  const dialogRef = useRef<HTMLElement>(null)
  const displayedEffects = nextRank?.effects ?? talent?.ranks.at(-1)?.effects ?? []
  const grantedDieEffect = displayedEffects.find((effect) => effect.type === 'grant_die')
  const grantedDie = grantedDieEffect?.type === 'grant_die'
    ? createDieById(grantedDieEffect.dieId)
    : null
  const prerequisiteNames = talent?.prerequisiteIds
    .map((id) => TALENTS_BY_ID[id]?.name)
    .filter((name): name is string => Boolean(name)) ?? []
  const prerequisiteCount = talent
    ? Math.min(
        talent.prerequisiteIds.length,
        talent.prerequisiteCount ?? talent.prerequisiteIds.length,
      )
    : 0
  const purchasedPrerequisiteCount = talent?.prerequisiteIds.filter(
    (id) => getTalentRank(talentRanks, id) > 0,
  ).length ?? 0
  const prerequisitesMet = purchasedPrerequisiteCount >= prerequisiteCount
  const hasAlternativePrerequisites = prerequisiteCount < prerequisiteNames.length
  const requirementChecks = talent?.requirements?.map((requirement) => {
    const current = dungeonProgress[requirement.dungeonId]?.clearCount ?? 0
    return {
      label: `Clear ${DUNGEONS[requirement.dungeonId].name}`,
      met: current >= requirement.count,
      progress: `${Math.min(current, requirement.count)}/${requirement.count}`,
    }
  }) ?? []
  const requirementsMet = requirementChecks.every((check) => check.met)

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
            className={`talent-canvas-inspector talent-canvas-inspector--track-${talent.track}`}
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

            {(prerequisiteNames.length > 0 || requirementChecks.length > 0 || nextRank) && (
              <section
                aria-label="Unlock requirements"
                className="talent-canvas-inspector__requirements"
              >
                <strong>Requirements</strong>
                {prerequisiteNames.length > 0 ? (
                  <>
                    <span data-met={prerequisitesMet}>
                      {prerequisitesMet ? '✓' : '○'}{' '}
                      {hasAlternativePrerequisites
                        ? `${purchasedPrerequisiteCount}/${prerequisiteCount} paths complete · choose ${prerequisiteCount} of ${prerequisiteNames.length}`
                        : 'All connected talents'}
                    </span>
                    {talent.prerequisiteIds.map((id) => {
                      const prerequisiteMet = getTalentRank(talentRanks, id) > 0
                      const isOptionalAlternative = hasAlternativePrerequisites && prerequisitesMet && !prerequisiteMet
                      return (
                        <span
                          data-met={prerequisiteMet}
                          data-requirement-state={isOptionalAlternative ? 'alternative' : undefined}
                          key={id}
                        >
                          {prerequisiteMet ? '✓' : isOptionalAlternative ? '↳' : '○'}{' '}
                          {TALENTS_BY_ID[id]?.name ?? id}
                          {isOptionalAlternative ? ' · alternate path' : ''}
                        </span>
                      )
                    })}
                  </>
                ) : null}
                {requirementChecks.map((check) => (
                  <span data-met={check.met} key={check.label}>
                    {check.met ? '✓' : '○'} {check.label} · {check.progress}
                  </span>
                ))}
                {nextRank ? (
                  <span data-met={xp >= nextRank.cost}>
                    {xp >= nextRank.cost ? '✓' : '○'} XP · {xp}/{nextRank.cost}
                  </span>
                ) : null}
              </section>
            )}

            {talent.availability === 'future' && (
              <p className="talent-canvas-inspector__future">
                Future system · visible for orientation, not purchasable yet.
              </p>
            )}

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
              <CurrencyIcon currency="xp" size={21} />
              {getPurchaseLabel(
                nodeState,
                isAffordable,
                nextRank,
                xp,
                prerequisitesMet,
                requirementsMet,
              )}
            </button>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
