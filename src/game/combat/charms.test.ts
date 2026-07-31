import { describe, expect, it } from 'vitest'
import type { CharmSnapshot } from '../types/charms'
import type { RollResult } from '../types/dice'
import {
  applyKillCharms,
  applyRollCharms,
  beginCharmRound,
  createCharmRunState,
} from './charms'

function attackRoll(value: number): RollResult {
  return {
    dieId: 'attack-die-1',
    dieName: 'Worn Blade Die',
    faceId: `face-${value}`,
    faceIndex: 0,
    type: 'attack',
    value,
  }
}

describe('Charm combat engine', () => {
  it('triggers Blade Rhythm on every fifth Attack roll', () => {
    const charms: CharmSnapshot[] = [{ id: 'blade-rhythm', rank: 1 }]
    let state = createCharmRunState()
    let result = attackRoll(1)
    for (let index = 0; index < 5; index += 1) {
      const applied = applyRollCharms(attackRoll(1), charms, state, 1)
      state = applied.state
      result = applied.result
    }
    expect(result.charmBonus).toBe(2)
    expect(result.charmTriggers?.[0].charmId).toBe('blade-rhythm')
  })

  it('rewards matching consecutive raw values through Echo Knot', () => {
    const charms: CharmSnapshot[] = [{ id: 'echo-knot', rank: 2 }]
    const first = applyRollCharms(attackRoll(2), charms, createCharmRunState(), 2)
    const second = applyRollCharms(attackRoll(2), charms, first.state, 2)
    expect(second.result.charmBonus).toBe(2)
  })

  it('arms Low Omen after three below-average rolls and spends it on the next roll', () => {
    const charms: CharmSnapshot[] = [{ id: 'low-omen', rank: 1 }]
    let state = createCharmRunState()
    for (let index = 0; index < 3; index += 1) {
      state = applyRollCharms(attackRoll(4), charms, state, 4.5).state
    }
    expect(state.pendingLowOmenBonus).toBe(2)
    const next = applyRollCharms(attackRoll(6), charms, state, 4.5)
    expect(next.result.charmBonus).toBe(2)
    expect(next.state.pendingLowOmenBonus).toBe(0)
  })

  it('does not treat a uniform die as a source of Low Omen stacks', () => {
    const charms: CharmSnapshot[] = [{ id: 'low-omen', rank: 1 }]
    let state = createCharmRunState()
    for (let index = 0; index < 6; index += 1) {
      state = applyRollCharms(attackRoll(5), charms, state, 5).state
    }
    expect(state.lowRolls).toBe(0)
    expect(state.pendingLowOmenBonus).toBe(0)
  })

  it('grants Ward Clock Shield on the sixth round', () => {
    const charms: CharmSnapshot[] = [{ id: 'ward-clock', rank: 3 }]
    let state = createCharmRunState()
    let shield = 0
    for (let round = 0; round < 6; round += 1) {
      const started = beginCharmRound(charms, state)
      state = started.state
      shield = started.shield
    }
    expect(shield).toBe(4)
  })

  it('applies Bloodroot and Soul Prism on their kill rhythms', () => {
    const charms: CharmSnapshot[] = [
      { id: 'bloodroot', rank: 2 },
      { id: 'soul-prism', rank: 3 },
    ]
    let state = createCharmRunState()
    let result = applyKillCharms(charms, state, 7)
    state = result.state
    result = applyKillCharms(charms, state, 7)
    state = result.state
    result = applyKillCharms(charms, state, 7)
    expect(result.heal).toBe(2)
    expect(result.soulBonus).toBe(7)
  })
})
