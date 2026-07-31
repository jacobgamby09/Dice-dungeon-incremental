import { CHARM_DEFINITIONS, getCharmRankDefinition } from '../content/charms'
import type {
  CharmRunState,
  CharmSnapshot,
  CharmTrigger,
} from '../types/charms'
import type { RollResult } from '../types/dice'

export function createCharmRunState(): CharmRunState {
  return {
    attackRolls: 0,
    lowRolls: 0,
    pendingLowOmenBonus: 0,
    previousRollValue: null,
    roundsStarted: 0,
    enemiesDefeated: 0,
  }
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
  dieAverage: number,
): {
  result: RollResult
  state: CharmRunState
  triggers: CharmTrigger[]
} {
  const nextState: CharmRunState = { ...state }
  const triggers: CharmTrigger[] = []
  let bonus = 0

  const lowOmen = snapshots.find((snapshot) => getEffect(snapshot).type === 'low_omen')
  if (nextState.pendingLowOmenBonus > 0 && lowOmen) {
    const amount = nextState.pendingLowOmenBonus
    bonus += amount
    triggers.push(createTrigger(lowOmen, 'roll_bonus', amount, result.type))
    nextState.pendingLowOmenBonus = 0
  }

  for (const snapshot of snapshots) {
    const effect = getEffect(snapshot)
    if (effect.type === 'attack_rhythm' && result.type === 'attack') {
      nextState.attackRolls += 1
      if (nextState.attackRolls % effect.threshold === 0) {
        bonus += effect.bonus
        triggers.push(createTrigger(snapshot, 'roll_bonus', effect.bonus, 'attack'))
      }
    }
    if (
      effect.type === 'matching_roll'
      && nextState.previousRollValue !== null
      && nextState.previousRollValue === result.value
    ) {
      bonus += effect.bonus
      triggers.push(createTrigger(snapshot, 'roll_bonus', effect.bonus, result.type))
    }
    if (
      effect.type === 'low_omen'
      && Number.isFinite(dieAverage)
      && result.value < dieAverage
    ) {
      nextState.lowRolls += 1
      if (nextState.lowRolls >= effect.threshold) {
        nextState.lowRolls = 0
        nextState.pendingLowOmenBonus = effect.bonus
      }
    }
  }

  nextState.previousRollValue = result.value
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
): {
  shield: number
  state: CharmRunState
  triggers: CharmTrigger[]
} {
  const nextState = {
    ...state,
    roundsStarted: state.roundsStarted + 1,
  }
  const triggers: CharmTrigger[] = []
  let shield = 0

  for (const snapshot of snapshots) {
    const effect = getEffect(snapshot)
    if (
      effect.type === 'round_shield'
      && nextState.roundsStarted % effect.threshold === 0
    ) {
      shield += effect.amount
      triggers.push(createTrigger(snapshot, 'shield', effect.amount, 'shield'))
    }
  }
  return { shield, state: nextState, triggers }
}

export function applyKillCharms(
  snapshots: readonly CharmSnapshot[],
  state: Readonly<CharmRunState>,
  baseSouls: number,
): {
  heal: number
  soulBonus: number
  state: CharmRunState
  triggers: CharmTrigger[]
} {
  const nextState = {
    ...state,
    enemiesDefeated: state.enemiesDefeated + 1,
  }
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
    if (
      effect.type === 'soul_echo'
      && nextState.enemiesDefeated % effect.threshold === 0
    ) {
      soulBonus += Math.max(0, baseSouls)
      triggers.push(createTrigger(snapshot, 'souls', Math.max(0, baseSouls)))
    }
  }
  return { heal, soulBonus, state: nextState, triggers }
}
