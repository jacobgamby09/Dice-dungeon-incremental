import {
  CHARM_DEFINITIONS,
  CHARM_RARITY_DEFINITIONS,
  getCharmRankDefinition,
} from '../../game/content/charms'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import type {
  CharmRunState,
  CharmSnapshot,
  CharmTrigger,
} from '../../game/types/charms'
import { CharmIcon } from './CharmIcon'

interface CombatCharmBarProps {
  charmState: CharmRunState
  charmTriggerVersion: number
  charms: readonly CharmSnapshot[]
  triggers: readonly CharmTrigger[]
}

function getProgress(snapshot: CharmSnapshot, state: CharmRunState): string {
  const effect = getCharmRankDefinition(snapshot.id, snapshot.rank).effect
  if (effect.type === 'attack_rhythm') {
    return `${state.attackRolls % effect.threshold}/${effect.threshold}`
  }
  if (effect.type === 'echo_chance') {
    return `${Math.round(effect.chance * 100)}% Echo`
  }
  if (effect.type === 'roll_echo') {
    return `${state.totalRolls % effect.threshold}/${effect.threshold}`
  }
  if (effect.type === 'encounter_shield') {
    return `+${effect.amount} Encounter`
  }
  if (effect.type === 'kill_heal') {
    return `${state.enemiesDefeated % effect.threshold}/${effect.threshold}`
  }
  if (effect.type === 'soul_flat') return `+${effect.amount} Soul/kill`
  if (effect.type === 'attack_oath') return `Attack-only +${effect.bonus}`
  if (effect.type === 'shield_carry') return `${Math.round(effect.rate * 100)}% Carry`
  return ''
}

interface CharmDetailOverlayProps {
  onClose: () => void
  snapshot: CharmSnapshot
}

export function CharmDetailOverlay({ onClose, snapshot }: CharmDetailOverlayProps) {
  const charm = CHARM_DEFINITIONS[snapshot.id]
  const rarity = CHARM_RARITY_DEFINITIONS[charm.rarity]
  const currentRank = charm.ranks[snapshot.rank - 1]
  const nextRank = charm.ranks[snapshot.rank]

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const overlay = (
    <div
      aria-label={`${charm.name} details`}
      aria-modal="true"
      className="combat-charm-detail-overlay"
      role="dialog"
      style={{
        '--rarity-accent': rarity.accent,
        '--rarity-dark': rarity.dark,
      } as CSSProperties}
    >
      <div className="combat-charm-detail">
        <button aria-label="Close Charm details" className="icon-button combat-charm-detail__close" onClick={onClose} type="button">
          <X aria-hidden="true" size={22} />
        </button>
        <CharmIcon charmId={snapshot.id} size={76} />
        <span className="combat-charm-detail__rarity">{rarity.name} Charm</span>
        <h2>{charm.name}</h2>
        <strong>Rank {snapshot.rank}/3</strong>
        <p className="combat-charm-detail__effect">{currentRank.description}</p>
        <p className="combat-charm-detail__flavor">{charm.flavor}</p>
        {nextRank ? (
          <div className="combat-charm-detail__next">
            <span>Next Rank</span>
            <p>{nextRank.description}</p>
          </div>
        ) : (
          <span className="combat-charm-detail__max">Max Rank</span>
        )}
      </div>
    </div>
  )
  return typeof document === 'undefined' ? overlay : createPortal(overlay, document.body)
}

export function CombatCharmBar({
  charmState,
  charmTriggerVersion,
  charms,
  triggers,
}: CombatCharmBarProps) {
  const [selectedCharm, setSelectedCharm] = useState<CharmSnapshot | null>(null)
  if (charms.length === 0) return null
  return (
    <>
      <section aria-label="Equipped Charm counters" className="combat-charms">
        {charms.map((snapshot) => {
          const charm = CHARM_DEFINITIONS[snapshot.id]
          const rarity = CHARM_RARITY_DEFINITIONS[charm.rarity]
          const trigger = triggers.find((candidate) => candidate.charmId === snapshot.id)
          return (
            <button
              aria-label={`Inspect ${charm.name}`}
              className={`combat-charm${trigger ? ' is-triggered' : ''}`}
              data-rarity={charm.rarity}
              key={`${snapshot.id}-${trigger ? charmTriggerVersion : 0}`}
              onClick={() => setSelectedCharm(snapshot)}
              style={{ '--charm-accent': rarity.accent } as CSSProperties}
              type="button"
            >
              <CharmIcon charmId={snapshot.id} size={27} />
              <div>
                <strong>{charm.name}</strong>
                <span>{trigger ? `${trigger.kind === 'echo' ? 'Echo +' : trigger.kind === 'roll_bonus' ? '+' : ''}${trigger.amount}` : getProgress(snapshot, charmState)}</span>
              </div>
            </button>
          )
        })}
      </section>
      {selectedCharm ? <CharmDetailOverlay onClose={() => setSelectedCharm(null)} snapshot={selectedCharm} /> : null}
    </>
  )
}
