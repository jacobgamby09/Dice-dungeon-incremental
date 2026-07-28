import { describe, expect, it } from 'vitest'
import { TALENT_IDS } from '../content/talents'
import { getDiceCapacity } from '../progression/talents'
import {
  DEFAULT_JOURNEY_STRATEGY,
  simulateProgressionJourney,
} from './simulateProgressionJourney'

describe('progression journey simulator', () => {
  it('is deterministic and records permanent between-run milestones', () => {
    const first = simulateProgressionJourney(DEFAULT_JOURNEY_STRATEGY, 30, 31)
    const second = simulateProgressionJourney(DEFAULT_JOURNEY_STRATEGY, 30, 31)

    expect(first).toEqual(second)
    expect(first.milestones.firstFaceUpgradeRun).toBeLessThanOrEqual(2)
    expect(first.milestones.secondDieRun).toBeGreaterThanOrEqual(2)
    expect(first.milestones.secondDieRun).toBeLessThanOrEqual(5)
    expect(first.milestones.autoCombatRun).toBeGreaterThanOrEqual(2)
    expect(first.milestones.autoCombatRun).toBeLessThanOrEqual(5)
    expect(first.milestones.firstEvolutionRun).toBeGreaterThanOrEqual(2)
    expect(first.milestones.firstEvolutionRun).toBeLessThanOrEqual(5)
    expect(first.milestones.dungeonOneClearRun).toBeGreaterThanOrEqual(7)
    expect(first.milestones.dungeonOneClearRun).toBeLessThanOrEqual(12)
    expect(first.milestones.dungeonTwoClearRun).toBeGreaterThan(
      first.milestones.dungeonOneClearRun!,
    )
    expect(first.milestones.dungeonTwoClearRun).toBeLessThanOrEqual(18)
    expect(first.finalProfile.bankedSouls).toBeGreaterThanOrEqual(0)
    expect(first.finalProfile.xp).toBeGreaterThanOrEqual(0)
  })

  it('creates a real loadout choice after Dungeon 1 without auto-equipping every die', () => {
    const result = simulateProgressionJourney(DEFAULT_JOURNEY_STRATEGY, 30, 47)

    expect(result.milestones.dungeonTwoUnlockRun).not.toBeNull()
    expect(result.milestones.firstLoadoutChoiceRun).not.toBeNull()
    expect(result.finalProfile.talentRanks[TALENT_IDS.executionerDoctrine]).toBe(1)
    expect(result.finalProfile.diceCollection.map((die) => die.id)).toContain(
      'attack-die-executioner',
    )
    expect(result.finalProfile.equippedDieIds).toHaveLength(
      getDiceCapacity(result.finalProfile.talentRanks),
    )
    expect(result.finalProfile.diceCollection.length).toBeGreaterThan(
      result.finalProfile.equippedDieIds.length,
    )
  })

  it('can compare a targeted Power path against controlled Chaos', () => {
    const chaos = simulateProgressionJourney(DEFAULT_JOURNEY_STRATEGY, 24, 73)
    const targetedPower = simulateProgressionJourney({
      ...DEFAULT_JOURNEY_STRATEGY,
      evolutionOrder: ['power'],
      forgeMode: 'precision-attack',
    }, 24, 73)

    expect(chaos.records).not.toEqual(targetedPower.records)
    expect(chaos.milestones.firstEvolutionRun).not.toBeNull()
    expect(targetedPower.milestones.firstEvolutionRun).not.toBeNull()
  })

  it.each(['power', 'momentum', 'rend'] as const)(
    'keeps a pure %s journey viable without making it the required build',
    (evolutionId) => {
      const result = simulateProgressionJourney({
        ...DEFAULT_JOURNEY_STRATEGY,
        evolutionOrder: [evolutionId],
      }, 18, 31)
      const evolutionIds = result.finalProfile.diceCollection
        .flatMap((die) => die.faces)
        .flatMap((face) => face.evolution?.id ?? [])

      expect(evolutionIds.length).toBeGreaterThan(0)
      expect(new Set(evolutionIds)).toEqual(new Set([evolutionId]))
      expect(result.milestones.dungeonTwoClearRun).not.toBeNull()
      expect(result.milestones.dungeonTwoClearRun).toBeLessThanOrEqual(18)
    },
  )
})
