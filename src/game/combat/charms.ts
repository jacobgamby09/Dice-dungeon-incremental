import { CHARM_DEFINITIONS, getCharmRankDefinition } from '../content/charms'
import type {
  CharmRunState,
  CharmSnapshot,
  CharmTrigger,
} from '../types/charms'
import type { RollResult } from '../types/dice'
import { normalizeRoundTotals } from '../types/combat'
import type { RoundTotals, RoundTotalsInput } from '../types/combat'

export interface RollCharmOptions {
  attackOnlyLoadout?: boolean
  isLastRoll?: boolean
  loadoutSize?: number
  random?: () => number
}

export function createCharmRunState(): CharmRunState {
  return {
    attackRolls: 0,
    totalRolls: 0,
    roundsStarted: 0,
    encountersStarted: 0,
    enemiesDefeated: 0,
    statusGuardsUsed: 0,
  }
}

export function normalizeCharmRunState(candidate?: Partial<CharmRunState> | null): CharmRunState {
  const fresh = createCharmRunState()
  return Object.fromEntries(Object.entries(fresh).map(([key, fallback]) => {
    const value = candidate?.[key as keyof CharmRunState]
    return [key, Number.isFinite(value) ? Math.max(0, Math.floor(Number(value))) : fallback]
  })) as unknown as CharmRunState
}

function getEffect(snapshot: CharmSnapshot) {
  return getCharmRankDefinition(snapshot.id, snapshot.rank).effect
}

function createTrigger(
  snapshot: CharmSnapshot,
  kind: CharmTrigger['kind'],
  amount: number,
  targetType?: CharmTrigger['targetType'],
): CharmTrigger {
  return {
    charmId: snapshot.id,
    charmName: CHARM_DEFINITIONS[snapshot.id].name,
    kind,
    amount,
    targetType,
  }
}

export function applyRollCharms(
  result: RollResult,
  snapshots: readonly CharmSnapshot[],
  state: Readonly<CharmRunState>,
  options: RollCharmOptions = {},
): {
  result: RollResult
  state: CharmRunState
  triggers: CharmTrigger[]
} {
  const nextState = normalizeCharmRunState(state)
  const triggers: CharmTrigger[] = []
  const random = options.random ?? Math.random
  let bonus = 0

  nextState.totalRolls += 1
  for (const snapshot of snapshots) {
    const effect = getEffect(snapshot)
    if (effect.type === 'attack_rhythm' && result.type === 'attack') {
      nextState.attackRolls += 1
      if (nextState.attackRolls % effect.threshold === 0) {
        bonus += effect.bonus
        triggers.push(createTrigger(snapshot, 'roll_bonus', effect.bonus, 'attack'))
      }
    }
    if (effect.type === 'echo_chance' && random() < effect.chance) {
      bonus += result.value
      triggers.push(createTrigger(snapshot, 'echo', result.value, result.type))
    }
    if (effect.type === 'roll_echo' && nextState.totalRolls % effect.threshold === 0) {
      bonus += result.value
      triggers.push(createTrigger(snapshot, 'echo', result.value, result.type))
    }
    if (
      effect.type === 'attack_oath'
      && options.attackOnlyLoadout
      && result.type === 'attack'
    ) {
      bonus += effect.bonus
      triggers.push(createTrigger(snapshot, 'roll_bonus', effect.bonus, 'attack'))
    }
    const isPrimary = result.type === 'attack' || result.type === 'shield' || result.type === 'heal'
    if (
      effect.type === 'total_rhythm'
      && isPrimary
      && nextState.totalRolls % effect.threshold === 0
    ) {
      bonus += effect.bonus
      triggers.push(createTrigger(snapshot, 'roll_bonus', effect.bonus, result.type))
    }
    if (effect.type === 'last_echo' && options.isLastRoll && isPrimary) {
      const echoed = Math.ceil(result.value * effect.multiplier)
      bonus += echoed
      triggers.push(createTrigger(snapshot, 'echo', echoed, result.type))
    }
    if (effect.type === 'fivefold_output' && options.loadoutSize === 5 && isPrimary) {
      bonus += effect.bonus
      triggers.push(createTrigger(snapshot, 'roll_bonus', effect.bonus, result.type))
    }
  }

  return {
    result: {
      ...result,
      charmBonus: bonus,
      charmTriggers: triggers,
    },
    state: nextState,
    triggers,
  }
}

export function beginCharmRound(
  snapshots: readonly CharmSnapshot[],
  state: Readonly<CharmRunState>,
  encounterStart = false,
): {
  shield: number
  state: CharmRunState
  triggers: CharmTrigger[]
} {
  const nextState = normalizeCharmRunState(state)
  nextState.roundsStarted += 1
  if (encounterStart) nextState.encountersStarted += 1
  if (encounterStart) nextState.statusGuardsUsed = 0
  const triggers: CharmTrigger[] = []
  let shield = 0

  if (encounterStart) {
    for (const snapshot of snapshots) {
      const effect = getEffect(snapshot)
      if (effect.type === 'encounter_shield') {
        shield += effect.amount
        triggers.push(createTrigger(snapshot, 'shield', effect.amount, 'shield'))
      }
    }
  }
  return { shield, state: nextState, triggers }
}

export function applyEnemyStatusGuard(
  intent: RoundTotalsInput,
  snapshots: readonly CharmSnapshot[],
  state: Readonly<CharmRunState>,
): { intent: RoundTotals; state: CharmRunState; triggers: CharmTrigger[] } {
  const nextState = normalizeCharmRunState(state)
  const nextIntent = normalizeRoundTotals(intent)
  const triggers: CharmTrigger[] = []

  for (const snapshot of snapshots) {
    const effect = getEffect(snapshot)
    if (effect.type !== 'status_guard') continue
    let remainingGuards = Math.max(0, effect.amount - nextState.statusGuardsUsed)
    for (const type of ['poison', 'weaken'] as const) {
      if (remainingGuards <= 0 || nextIntent[type] <= 0) continue
      const blocked = nextIntent[type]
      nextIntent[type] = 0
      nextState.statusGuardsUsed += 1
      remainingGuards -= 1
      triggers.push(createTrigger(snapshot, 'cleanse', blocked, type))
    }
  }

  return { intent: nextIntent, state: nextState, triggers }
}

export function applyKillCharms(
  snapshots: readonly CharmSnapshot[],
  state: Readonly<CharmRunState>,
): {
  heal: number
  soulBonus: number
  state: CharmRunState
  triggers: CharmTrigger[]
} {
  const nextState = normalizeCharmRunState(state)
  nextState.enemiesDefeated += 1
  const triggers: CharmTrigger[] = []
  let heal = 0
  let soulBonus = 0

  for (const snapshot of snapshots) {
    const effect = getEffect(snapshot)
    if (
      effect.type === 'kill_heal'
      && nextState.enemiesDefeated % effect.threshold === 0
    ) {
      heal += effect.amount
      triggers.push(createTrigger(snapshot, 'heal', effect.amount, 'heal'))
    }
    if (effect.type === 'soul_flat') {
      soulBonus += effect.amount
      triggers.push(createTrigger(snapshot, 'souls', effect.amount))
    }
  }
  return { heal, soulBonus, state: nextState, triggers }
}

export function getShieldCarryRate(snapshots: readonly CharmSnapshot[]): number {
  return snapshots.reduce((rate, snapshot) => {
    const effect = getEffect(snapshot)
    return effect.type === 'shield_carry' ? Math.max(rate, effect.rate) : rate
  }, 0)
}
