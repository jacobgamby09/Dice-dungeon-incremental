import { describe, expect, it } from 'vitest'
import {
  DEFAULT_JOURNEY_STRATEGY,
  simulateProgressionJourney,
} from './simulateProgressionJourney'

describe('Classic V2 progression journey', () => {
  it('is deterministic and guarantees a permanent upgrade after run one', () => {
    const first = simulateProgressionJourney(DEFAULT_JOURNEY_STRATEGY, 60, 431)
    const second = simulateProgressionJourney(DEFAULT_JOURNEY_STRATEGY, 60, 431)

    expect(first).toEqual(second)
    expect(first.milestones.firstFaceUpgradeRun).toBe(1)
    expect(first.records[0].averageFaceValue).toBeGreaterThan(1)
  })

  it('unlocks full Auto Combat in the first three runs', () => {
    const result = simulateProgressionJourney(DEFAULT_JOURNEY_STRATEGY, 10, 17)

    expect(result.milestones.autoCombatRun).not.toBeNull()
    expect(result.milestones.autoCombatRun).toBeGreaterThanOrEqual(2)
    expect(result.milestones.autoCombatRun).toBeLessThanOrEqual(3)
  })

  it('keeps the second die meaningfully later than Auto Combat', () => {
    const result = simulateProgressionJourney(DEFAULT_JOURNEY_STRATEGY, 30, 73)

    expect(result.milestones.secondDieRun).not.toBeNull()
    expect(result.milestones.secondDieRun!).toBeGreaterThan(result.milestones.autoCombatRun!)
    expect(result.milestones.secondDieRun!).toBeGreaterThanOrEqual(6)
    expect(result.milestones.secondDieRun!).toBeLessThanOrEqual(15)
  })

  it('moves the run wall and average die value upward across the journey', () => {
    const result = simulateProgressionJourney(DEFAULT_JOURNEY_STRATEGY, 60, 901)
    const first = result.records[0]
    const last = result.records.at(-1)!

    expect(last.averageFaceValue).toBeGreaterThan(first.averageFaceValue)
    expect(Math.max(...result.records.map((record) => record.highestFloorCleared)))
      .toBeGreaterThan(first.highestFloorCleared)
  })

  it('reaches and unlocks Dungeon 2 only after a longer first-dungeon arc', () => {
    const result = simulateProgressionJourney(DEFAULT_JOURNEY_STRATEGY, 80, 222)

    expect(result.milestones.dungeonOneClearRun).not.toBeNull()
    expect(result.milestones.dungeonOneClearRun!).toBeGreaterThanOrEqual(12)
    expect(result.milestones.dungeonOneClearRun!).toBeLessThanOrEqual(55)
    expect(result.milestones.dungeonTwoUnlockRun).not.toBeNull()
    expect(result.finalProfile.unlockedDungeonIds).toContain('iron-depths')
    expect(result.milestones.dungeonTwoFirstRun).not.toBeNull()
    expect(result.milestones.dungeonTwoFirstRun).toBe(
      result.milestones.dungeonTwoUnlockRun! + 1,
    )
    expect(result.milestones.fourthSlotRun).not.toBeNull()
    expect(result.milestones.bloodwellDieRun).not.toBeNull()
    expect(result.records.some((record) => record.dungeonId === 'iron-depths')).toBe(true)
  })

  it('produces jackpot Workshop moments after Workshop Die progression', () => {
    const seeds = Array.from({ length: 20 }, (_, index) => (
      simulateProgressionJourney(DEFAULT_JOURNEY_STRATEGY, 40, index + 1)
        .milestones.firstJackpotForgeRun
    ))

    expect(seeds.some((run) => run !== null)).toBe(true)
  })
})
