import { describe, expect, it } from 'vitest'
import type { CharmSnapshot } from '../types/charms'
import type { RollResult } from '../types/dice'
import {
  applyKillCharms,
  applyEnemyStatusGuard,
  applyRollCharms,
  beginCharmRound,
  createCharmRunState,
  getShieldCarryRate,
} from './charms'

function attackRoll(value: number): RollResult {
  return { dieId: 'attack-die-1', dieName: 'Worn Blade Die', faceId: `face-${value}`, faceIndex: 0, type: 'attack', value }
}

describe('Charm combat engine', () => {
  it('triggers Blade Rhythm on every third Attack roll', () => {
    const charms: CharmSnapshot[] = [{ id: 'blade-rhythm', rank: 1 }]
    let state = createCharmRunState()
    let result = attackRoll(1)
    for (let index = 0; index < 3; index += 1) {
      const applied = applyRollCharms(attackRoll(1), charms, state)
      state = applied.state
      result = applied.result
    }
    expect(result.charmBonus).toBe(4)
  })

  it('lets Echo Knot repeat raw output without recursion', () => {
    const applied = applyRollCharms(
      attackRoll(4),
      [{ id: 'echo-knot', rank: 1 }],
      createCharmRunState(),
      { random: () => 0.1 },
    )
    expect(applied.result.charmBonus).toBe(4)
    expect(applied.triggers).toHaveLength(1)
    expect(applied.triggers[0].kind).toBe('echo')
  })

  it('makes Loaded Star deterministic', () => {
    const charms: CharmSnapshot[] = [{ id: 'low-omen', rank: 1 }]
    let state = createCharmRunState()
    let result = attackRoll(2)
    for (let index = 0; index < 4; index += 1) {
      const applied = applyRollCharms(attackRoll(2), charms, state)
      state = applied.state
      result = applied.result
    }
    expect(result.charmBonus).toBe(2)
  })

  it('grants Ward Clock Shield only when an encounter starts', () => {
    const charms: CharmSnapshot[] = [{ id: 'ward-clock', rank: 3 }]
    const encounter = beginCharmRound(charms, createCharmRunState(), true)
    const nextRound = beginCharmRound(charms, encounter.state)
    expect(encounter.shield).toBe(7)
    expect(nextRound.shield).toBe(0)
  })

  it('applies direct Bloodroot and Soul Prism rewards', () => {
    const charms: CharmSnapshot[] = [{ id: 'bloodroot', rank: 2 }, { id: 'soul-prism', rank: 3 }]
    const result = applyKillCharms(charms, createCharmRunState())
    expect(result.heal).toBe(2)
    expect(result.soulBonus).toBe(3)
  })

  it('activates Crimson Oath only for an Attack-only loadout', () => {
    const charms: CharmSnapshot[] = [{ id: 'crimson-oath', rank: 2 }]
    expect(applyRollCharms(attackRoll(2), charms, createCharmRunState(), { attackOnlyLoadout: true }).result.charmBonus).toBe(3)
    expect(applyRollCharms(attackRoll(2), charms, createCharmRunState(), { attackOnlyLoadout: false }).result.charmBonus).toBe(0)
  })

  it('returns the strongest equipped Shield carry rate', () => {
    expect(getShieldCarryRate([{ id: 'unbroken-wall', rank: 2 }])).toBe(0.6)
  })

  it('supports the deterministic D3 rhythm and five-die build charms', () => {
    let state = createCharmRunState()
    for (let index = 0; index < 2; index += 1) {
      state = applyRollCharms(attackRoll(2), [{ id: 'third-spark', rank: 1 }], state).state
    }
    const spark = applyRollCharms(attackRoll(2), [{ id: 'third-spark', rank: 1 }], state)
    const crown = applyRollCharms(
      attackRoll(2),
      [{ id: 'fivefold-crown', rank: 1 }],
      createCharmRunState(),
      { loadoutSize: 5 },
    )

    expect(spark.result.charmBonus).toBe(3)
    expect(crown.result.charmBonus).toBe(2)
  })

  it('echoes only the last die and guards negative status dice per encounter', () => {
    const echo = applyRollCharms(
      attackRoll(8),
      [{ id: 'last-echo', rank: 1 }],
      createCharmRunState(),
      { isLastRoll: true },
    )
    const encounter = beginCharmRound(
      [{ id: 'clean-thread', rank: 1 }],
      createCharmRunState(),
      true,
    )
    const first = applyEnemyStatusGuard(
      { attack: 4, shield: 0, heal: 0, bleed: 0, poison: 2, weaken: 1 },
      [{ id: 'clean-thread', rank: 1 }],
      encounter.state,
    )
    const second = applyEnemyStatusGuard(
      { attack: 4, shield: 0, heal: 0, bleed: 0, poison: 2 },
      [{ id: 'clean-thread', rank: 1 }],
      first.state,
    )

    expect(echo.result.charmBonus).toBe(4)
    expect(first.intent).toMatchObject({ poison: 0, weaken: 1 })
    expect(second.intent.poison).toBe(2)
  })
})
