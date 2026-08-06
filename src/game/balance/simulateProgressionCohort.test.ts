import { describe, expect, it } from 'vitest'
import {
  PROGRESSION_STRATEGY_PRESETS,
  simulateProgressionCohort,
} from './simulateProgressionCohort'

describe('progression cohort simulation', () => {
  it('aggregates deterministic percentile and curve results', () => {
    const first = simulateProgressionCohort({ attempts: 12, maxRuns: 20, seed: 77 })
    const second = simulateProgressionCohort({ attempts: 12, maxRuns: 20, seed: 77 })

    expect(first).toEqual(second)
    expect(first.curve).toHaveLength(20)
    expect(first.milestones.firstFaceUpgradeRun.reachRate).toBe(1)
    expect(first.milestones.firstFaceUpgradeRun.medianRun).toBe(1)
    expect(first.curve[0].averageFaceValue).toBeGreaterThan(1)
  })

  it('keeps every strategy inside valid percentage and run ranges', () => {
    for (const preset of PROGRESSION_STRATEGY_PRESETS) {
      const result = simulateProgressionCohort({
        attempts: 3,
        maxRuns: 20,
        seed: 100,
        strategyId: preset.id,
      })

      for (const milestone of Object.values(result.milestones)) {
        expect(milestone.reachRate).toBeGreaterThanOrEqual(0)
        expect(milestone.reachRate).toBeLessThanOrEqual(1)
      }
      for (const point of result.curve) {
        expect(point.autoCombatRate).toBeGreaterThanOrEqual(0)
        expect(point.autoCombatRate).toBeLessThanOrEqual(1)
        expect(point.dungeonOneClearRate).toBeGreaterThanOrEqual(0)
        expect(point.dungeonOneClearRate).toBeLessThanOrEqual(1)
        expect(point.bloodwellRate).toBeGreaterThanOrEqual(0)
        expect(point.bloodwellRate).toBeLessThanOrEqual(1)
        expect(point.fourthSlotRate).toBeGreaterThanOrEqual(0)
        expect(point.fourthSlotRate).toBeLessThanOrEqual(1)
        expect(point.secondDieRate).toBeGreaterThanOrEqual(0)
        expect(point.secondDieRate).toBeLessThanOrEqual(1)
      }
    }
  })

  it('rejects invalid cohort sizes', () => {
    expect(() => simulateProgressionCohort({ attempts: 0 })).toThrow(
      'Progression cohort attempts must be a positive integer.',
    )
    expect(() => simulateProgressionCohort({ maxRuns: 0 })).toThrow(
      'Progression cohort maxRuns must be a positive integer.',
    )
  })

  it('keeps the large soft-gated Arsenal unlocks at the D1 to D2 transition', () => {
    const result = simulateProgressionCohort({
      attempts: 24,
      maxRuns: 70,
      seed: 431,
      strategyId: 'balanced',
    })

    expect(result.milestones.dungeonOneClearRun.medianRun).toBeGreaterThanOrEqual(25)
    expect(result.milestones.dungeonOneClearRun.medianRun).toBeLessThanOrEqual(34)
    expect(result.milestones.fourthSlotRun.medianRun)
      .toBeGreaterThan(result.milestones.dungeonTwoFirstRun.medianRun ?? 0)
    expect(result.milestones.fourthSlotRun.medianRun)
      .toBeLessThanOrEqual((result.milestones.dungeonTwoFirstRun.medianRun ?? 0) + 4)
    expect(result.milestones.bloodwellDieRun.medianRun)
      .toBeGreaterThan(result.milestones.fourthSlotRun.medianRun ?? 0)
    expect(result.milestones.bloodwellDieRun.medianRun)
      .toBeLessThanOrEqual((result.milestones.dungeonTwoFirstRun.medianRun ?? 0) + 10)
    expect(result.milestones.dungeonTwoClearRun.medianRun)
      .toBeGreaterThanOrEqual((result.milestones.dungeonTwoFirstRun.medianRun ?? 0) + 18)
    expect(result.milestones.dungeonTwoClearRun.medianRun)
      .toBeLessThanOrEqual((result.milestones.dungeonTwoFirstRun.medianRun ?? 0) + 24)
  }, 10_000)

  it('stages Dungeon 3 around Focus, the fifth slot and Purifier progression', () => {
    const result = simulateProgressionCohort({
      attempts: 16,
      maxRuns: 120,
      seed: 431,
      strategyId: 'balanced',
    })

    const firstD3 = result.milestones.dungeonThreeFirstRun.medianRun ?? 0
    expect(firstD3).toBeGreaterThan(result.milestones.dungeonTwoFirstRun.medianRun ?? 0)
    expect(result.milestones.fifthSlotRun.medianRun).toBeGreaterThanOrEqual(firstD3)
    expect(result.milestones.fifthSlotRun.medianRun).toBeLessThanOrEqual(firstD3 + 10)
    expect(result.milestones.purifierDieRun.medianRun)
      .toBeGreaterThan(result.milestones.fifthSlotRun.medianRun ?? 0)
    expect(result.milestones.dungeonThreeClearRun.medianRun).toBeGreaterThanOrEqual(firstD3 + 25)
    expect(result.milestones.dungeonThreeClearRun.medianRun).toBeLessThanOrEqual(firstD3 + 45)
  }, 10_000)
})
