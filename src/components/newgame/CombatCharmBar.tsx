import {
  CHARM_DEFINITIONS,
  CHARM_RARITY_DEFINITIONS,
  getCharmRankDefinition,
} from '../../game/content/charms'
import type { CSSProperties } from 'react'
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

export function CombatCharmBar({
  charmState,
  charmTriggerVersion,
  charms,
  triggers,
}: CombatCharmBarProps) {
  if (charms.length === 0) return null
  return (
    <section aria-label="Equipped Charm counters" className="combat-charms">
      {charms.map((snapshot) => {
        const charm = CHARM_DEFINITIONS[snapshot.id]
        const rarity = CHARM_RARITY_DEFINITIONS[charm.rarity]
        const trigger = triggers.find((candidate) => candidate.charmId === snapshot.id)
        return (
          <div
            className={`combat-charm${trigger ? ' is-triggered' : ''}`}
            key={`${snapshot.id}-${trigger ? charmTriggerVersion : 0}`}
            data-rarity={charm.rarity}
            style={{ '--charm-accent': rarity.accent } as CSSProperties}
          >
            <CharmIcon charmId={snapshot.id} size={27} />
            <div>
              <strong>{charm.name}</strong>
              <span>{trigger ? `${trigger.kind === 'echo' ? 'Echo +' : trigger.kind === 'roll_bonus' ? '+' : ''}${trigger.amount}` : getProgress(snapshot, charmState)}</span>
            </div>
          </div>
        )
      })}
    </section>
  )
}
