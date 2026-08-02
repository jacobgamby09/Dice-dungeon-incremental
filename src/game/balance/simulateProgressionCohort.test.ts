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
        attempts: 8,
        maxRuns: 30,
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
})
