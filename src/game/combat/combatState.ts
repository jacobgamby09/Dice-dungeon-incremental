import { createLoadoutDrawOrder } from './drawBag'
import { EMPTY_TOTALS } from '../types/combat'
import type { CombatState } from '../types/combat'
import type { DieInstance } from '../types/dice'

export function createCombatState(
  equippedDice: readonly DieInstance[] = [],
  roundNumber = 1,
  resolutionVersion = 0,
  revealEnemyIntent = false,
  carried: { shield?: number; heal?: number } = {},
): CombatState {
  return {
    phase: revealEnemyIntent ? 'revealing_enemy_intent' : 'awaiting_roll',
    roundNumber,
    drawPileDieIds: createLoadoutDrawOrder(
      equippedDice.map((die) => die.id),
    ),
    results: [],
    totals: { ...EMPTY_TOTALS },
    pendingMomentum: 0,
    pendingFortify: 0,
    pendingImprintRelay: 0,
    lastCharmTriggers: [],
    charmTriggerVersion: 0,
    carriedShield: Math.max(0, carried.shield ?? 0),
    carriedHeal: Math.max(0, carried.heal ?? 0),
    lastResolution: null,
    resolutionVersion,
    resolutionStep: null,
  }
}
