import { CHARM_DEFINITIONS, getCharmRankDefinition } from '../../game/content/charms'
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
  if (effect.type === 'matching_roll') {
    return state.previousRollValue === null ? '—' : `Last ${state.previousRollValue}`
  }
  if (effect.type === 'low_omen') {
    return state.pendingLowOmenBonus > 0
      ? `Ready +${state.pendingLowOmenBonus}`
      : `${state.lowRolls}/${effect.threshold}`
  }
  if (effect.type === 'round_shield') {
    return `${state.roundsStarted % effect.threshold}/${effect.threshold}`
  }
  if (effect.type === 'kill_heal' || effect.type === 'soul_echo') {
    return `${state.enemiesDefeated % effect.threshold}/${effect.threshold}`
  }
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
        const trigger = triggers.find((candidate) => candidate.charmId === snapshot.id)
        return (
          <div
            className={`combat-charm${trigger ? ' is-triggered' : ''}`}
            key={`${snapshot.id}-${trigger ? charmTriggerVersion : 0}`}
            style={{ '--charm-accent': charm.accent } as CSSProperties}
          >
            <CharmIcon charmId={snapshot.id} size={27} />
            <div>
              <strong>{charm.name}</strong>
              <span>{trigger ? `${trigger.kind === 'roll_bonus' ? '+' : ''}${trigger.amount}` : getProgress(snapshot, charmState)}</span>
            </div>
          </div>
        )
      })}
    </section>
  )
}
