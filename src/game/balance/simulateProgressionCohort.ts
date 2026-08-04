import { TALENT_IDS } from '../content/talents'
import {
  DEFAULT_JOURNEY_STRATEGY,
  simulateProgressionJourney,
} from './simulateProgressionJourney'
import type {
  ProgressionJourneyMilestones,
  ProgressionJourneyResult,
  ProgressionJourneyStrategy,
} from './simulateProgressionJourney'

export type ProgressionStrategyId =
  | 'balanced'
  | 'fate-first'
  | 'd1-grind-fourth'
  | 'd1-grind-bloodwell'
  | 'arsenal-first'
  | 'workshop-first'
  | 'economy-first'

export interface ProgressionStrategyPreset {
  description: string
  id: ProgressionStrategyId
  label: string
  strategy: ProgressionJourneyStrategy
}

export interface MilestoneDistribution {
  averageRun: number | null
  key: keyof ProgressionJourneyMilestones
  medianRun: number | null
  p10Run: number | null
  p90Run: number | null
  reachRate: number
}

export interface ProgressionCurvePoint {
  autoCombatRate: number
  bloodwellRate: number
  charmRate: number
  fatecraftRate: number
  averageFaceValue: number
  averageFloor: number
  averageSoulsAfterSpending: number
  averageXpAfterSpending: number
  dungeonOneClearRate: number
  dungeonTwoUnlockRate: number
  dungeonTwoAverageFloor: number
  fourthSlotRate: number
  averageImprintCount: number
  averageCharmCount: number
  averageFateTokensAfterSpending: number
  averageForgeUpgrades: number
  averageCharmTriggers: number
  medianFloor: number
  run: number
  secondDieRate: number
}

export interface ProgressionCohortResult {
  attempts: number
  curve: ProgressionCurvePoint[]
  maxRuns: number
  milestones: Record<keyof ProgressionJourneyMilestones, MilestoneDistribution>
  seed: number
  strategyId: ProgressionStrategyId
}

export const PROGRESSION_STRATEGY_PRESETS: readonly ProgressionStrategyPreset[] = [
  {
    id: 'balanced',
    label: 'Soft-gate baseline',
    description: 'Moves into the highest unlocked Dungeon and buys talents through connected paths and XP only.',
    strategy: DEFAULT_JOURNEY_STRATEGY,
  },
  {
    id: 'd1-grind-fourth',
    label: 'D1 grind · Fourth Grip',
    description: 'Replays Dungeon 1 after its clear until the fourth slot is purchased.',
    strategy: {
      dungeonOneUntilTalentId: TALENT_IDS.fourthGrip,
      loadoutPriority: DEFAULT_JOURNEY_STRATEGY.loadoutPriority,
      talentPath: [
        { id: TALENT_IDS.battleHardenedOne, targetRank: 1 },
        { id: TALENT_IDS.autoCombat },
        { id: TALENT_IDS.twinArsenal },
        { id: TALENT_IDS.strikerPattern },
        { id: TALENT_IDS.shieldcraft },
        { id: TALENT_IDS.thirdGrip },
        { id: TALENT_IDS.healingArts },
        { id: TALENT_IDS.fourthGrip },
      ],
    },
  },
  {
    id: 'fate-first',
    label: 'Fate first',
    description: 'Tests the strongest early Fatecraft detour with the same open, XP-gated tree.',
    strategy: {
      loadoutPriority: DEFAULT_JOURNEY_STRATEGY.loadoutPriority,
      talentPath: [
        { id: TALENT_IDS.battleHardenedOne, targetRank: 1 },
        { id: TALENT_IDS.autoCombat },
        { id: TALENT_IDS.fieldStudies },
        { id: TALENT_IDS.fatecraft },
        { id: TALENT_IDS.quickDraw },
        { id: TALENT_IDS.twinArsenal },
        { id: TALENT_IDS.strikerPattern },
        { id: TALENT_IDS.volatileTemper, targetRank: 3 },
        { id: TALENT_IDS.shieldcraft },
        { id: TALENT_IDS.thirdGrip },
        { id: TALENT_IDS.healingArts },
        { id: TALENT_IDS.fourthGrip },
        { id: TALENT_IDS.bloodwellDoctrine },
      ],
    },
  },
  {
    id: 'd1-grind-bloodwell',
    label: 'D1 grind · Bloodwell',
    description: 'Replays Dungeon 1 after its clear until the Bloodwell Die is purchased.',
    strategy: {
      dungeonOneUntilTalentId: TALENT_IDS.bloodwellDoctrine,
      loadoutPriority: DEFAULT_JOURNEY_STRATEGY.loadoutPriority,
      talentPath: [
        { id: TALENT_IDS.battleHardenedOne, targetRank: 1 },
        { id: TALENT_IDS.autoCombat },
        { id: TALENT_IDS.twinArsenal },
        { id: TALENT_IDS.strikerPattern },
        { id: TALENT_IDS.shieldcraft },
        { id: TALENT_IDS.thirdGrip },
        { id: TALENT_IDS.healingArts },
        { id: TALENT_IDS.bloodwellDoctrine },
      ],
    },
  },
  {
    id: 'arsenal-first',
    label: 'Arsenal first',
    description: 'Prioritizes slot 2 and the Striker Die before deeper economy upgrades.',
    strategy: {
      loadoutPriority: DEFAULT_JOURNEY_STRATEGY.loadoutPriority,
      talentPath: [
        { id: TALENT_IDS.battleHardenedOne, targetRank: 1 },
        { id: TALENT_IDS.autoCombat },
        { id: TALENT_IDS.twinArsenal },
        { id: TALENT_IDS.strikerPattern },
        { id: TALENT_IDS.fieldStudies },
        { id: TALENT_IDS.quickDraw },
        { id: TALENT_IDS.volatileTemper, targetRank: 3 },
        { id: TALENT_IDS.battleHardenedOne, targetRank: 3 },
        { id: TALENT_IDS.shieldcraft },
        { id: TALENT_IDS.thirdGrip },
        { id: TALENT_IDS.healingArts },
        { id: TALENT_IDS.battleHardenedTwo, targetRank: 2 },
        { id: TALENT_IDS.fourthGrip },
        { id: TALENT_IDS.bloodwellDoctrine },
      ],
    },
  },
  {
    id: 'workshop-first',
    label: 'Workshop first',
    description: 'Invests early XP in cheaper and stronger random face upgrades.',
    strategy: {
      loadoutPriority: DEFAULT_JOURNEY_STRATEGY.loadoutPriority,
      talentPath: [
        { id: TALENT_IDS.battleHardenedOne, targetRank: 1 },
        { id: TALENT_IDS.autoCombat },
        { id: TALENT_IDS.efficientTools, targetRank: 3 },
        { id: TALENT_IDS.volatileTemper, targetRank: 3 },
        { id: TALENT_IDS.fieldStudies },
        { id: TALENT_IDS.quickDraw },
        { id: TALENT_IDS.twinArsenal },
        { id: TALENT_IDS.strikerPattern },
        { id: TALENT_IDS.battleHardenedOne, targetRank: 3 },
        { id: TALENT_IDS.shieldcraft },
        { id: TALENT_IDS.thirdGrip },
        { id: TALENT_IDS.healingArts },
        { id: TALENT_IDS.battleHardenedTwo, targetRank: 2 },
        { id: TALENT_IDS.fourthGrip },
        { id: TALENT_IDS.bloodwellDoctrine },
      ],
    },
  },
  {
    id: 'economy-first',
    label: 'Economy first',
    description: 'Maxes XP and Soul income before buying the second-die package.',
    strategy: {
      loadoutPriority: DEFAULT_JOURNEY_STRATEGY.loadoutPriority,
      talentPath: [
        { id: TALENT_IDS.battleHardenedOne, targetRank: 1 },
        { id: TALENT_IDS.autoCombat },
        { id: TALENT_IDS.fieldStudies, targetRank: 3 },
        { id: TALENT_IDS.soulHarvest, targetRank: 3 },
        { id: TALENT_IDS.quickDraw },
        { id: TALENT_IDS.twinArsenal },
        { id: TALENT_IDS.strikerPattern },
        { id: TALENT_IDS.volatileTemper, targetRank: 3 },
        { id: TALENT_IDS.battleHardenedOne, targetRank: 3 },
        { id: TALENT_IDS.shieldcraft },
        { id: TALENT_IDS.thirdGrip },
        { id: TALENT_IDS.healingArts },
        { id: TALENT_IDS.battleHardenedTwo, targetRank: 2 },
        { id: TALENT_IDS.fourthGrip },
        { id: TALENT_IDS.bloodwellDoctrine },
      ],
    },
  },
] as const

export const PROGRESSION_MILESTONE_KEYS: readonly (keyof ProgressionJourneyMilestones)[] = [
  'firstFaceUpgradeRun',
  'autoCombatRun',
  'secondDieRun',
  'firstLoadoutChoiceRun',
  'firstJackpotForgeRun',
  'firstImprintRun',
  'fatecraftRun',
  'firstCharmRun',
  'dungeonOneClearRun',
  'dungeonTwoUnlockRun',
  'dungeonTwoFirstRun',
  'fourthSlotRun',
  'bloodwellDieRun',
  'relayImprintRun',
  'crescendoImprintRun',
  'dungeonTwoClearRun',
]

function percentile(sortedValues: readonly number[], percentileValue: number): number | null {
  if (sortedValues.length === 0) return null
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil(percentileValue * sortedValues.length) - 1),
  )
  return sortedValues[index]
}

function average(values: readonly number[]): number {
  if (values.length === 0) return 0
  return values.reduce((total, value) => total + value, 0) / values.length
}

function summarizeMilestone(
  results: readonly ProgressionJourneyResult[],
  key: keyof ProgressionJourneyMilestones,
): MilestoneDistribution {
  const reachedRuns = results
    .map((result) => result.milestones[key])
    .filter((run): run is number => run !== null)
    .sort((left, right) => left - right)

  return {
    averageRun: reachedRuns.length > 0 ? average(reachedRuns) : null,
    key,
    medianRun: percentile(reachedRuns, 0.5),
    p10Run: percentile(reachedRuns, 0.1),
    p90Run: percentile(reachedRuns, 0.9),
    reachRate: reachedRuns.length / results.length,
  }
}

function hasReached(
  result: ProgressionJourneyResult,
  key: keyof ProgressionJourneyMilestones,
  run: number,
): boolean {
  const milestoneRun = result.milestones[key]
  return milestoneRun !== null && milestoneRun <= run
}

function getRecordAtRun(result: ProgressionJourneyResult, run: number) {
  return result.records[Math.min(run - 1, result.records.length - 1)]
}

function createCurve(
  results: readonly ProgressionJourneyResult[],
  maxRuns: number,
): ProgressionCurvePoint[] {
  return Array.from({ length: maxRuns }, (_, index) => {
    const run = index + 1
    const records = results
      .map((result) => getRecordAtRun(result, run))
      .filter((record) => record !== undefined)
    const floors = records
      .map((record) => record.highestFloorCleared)
      .sort((left, right) => left - right)
    const dungeonTwoRecords = records.filter((record) => record.dungeonId === 'iron-depths')

    return {
      autoCombatRate: results.filter((result) => (
        hasReached(result, 'autoCombatRun', run)
      )).length / results.length,
      bloodwellRate: results.filter((result) => (
        hasReached(result, 'bloodwellDieRun', run)
      )).length / results.length,
      charmRate: results.filter((result) => (
        hasReached(result, 'firstCharmRun', run)
      )).length / results.length,
      fatecraftRate: results.filter((result) => (
        hasReached(result, 'fatecraftRun', run)
      )).length / results.length,
      averageFaceValue: average(records.map((record) => record.averageFaceValue)),
      averageFloor: average(floors),
      averageSoulsAfterSpending: average(records.map((record) => record.soulsAfterSpending)),
      averageXpAfterSpending: average(records.map((record) => record.xpAfterSpending)),
      dungeonOneClearRate: results.filter((result) => (
        hasReached(result, 'dungeonOneClearRun', run)
      )).length / results.length,
      dungeonTwoUnlockRate: results.filter((result) => (
        hasReached(result, 'dungeonTwoUnlockRun', run)
      )).length / results.length,
      dungeonTwoAverageFloor: average(
        dungeonTwoRecords.map((record) => record.highestFloorCleared),
      ),
      fourthSlotRate: results.filter((result) => (
        hasReached(result, 'fourthSlotRun', run)
      )).length / results.length,
      averageImprintCount: average(records.map((record) => record.imprintCount)),
      averageCharmCount: average(records.map((record) => record.charmCount)),
      averageFateTokensAfterSpending: average(records.map((record) => record.fateTokensAfterSpending)),
      averageForgeUpgrades: average(records.map((record) => record.forgeUpgrades)),
      averageCharmTriggers: average(records.map((record) => record.charmTriggers)),
      medianFloor: percentile(floors, 0.5) ?? 0,
      run,
      secondDieRate: results.filter((result) => (
        hasReached(result, 'secondDieRun', run)
      )).length / results.length,
    }
  })
}

export function getProgressionStrategyPreset(
  strategyId: ProgressionStrategyId,
): ProgressionStrategyPreset {
  return PROGRESSION_STRATEGY_PRESETS.find((preset) => preset.id === strategyId)
    ?? PROGRESSION_STRATEGY_PRESETS[0]
}

export function simulateProgressionCohort({
  attempts = 100,
  maxRuns = 60,
  seed = 1,
  strategyId = 'balanced',
}: {
  attempts?: number
  maxRuns?: number
  seed?: number
  strategyId?: ProgressionStrategyId
} = {}): ProgressionCohortResult {
  if (!Number.isInteger(attempts) || attempts < 1) {
    throw new Error('Progression cohort attempts must be a positive integer.')
  }
  if (!Number.isInteger(maxRuns) || maxRuns < 1) {
    throw new Error('Progression cohort maxRuns must be a positive integer.')
  }

  const preset = getProgressionStrategyPreset(strategyId)
  const results = Array.from({ length: attempts }, (_, index) => (
    simulateProgressionJourney(preset.strategy, maxRuns, seed + index)
  ))
  const milestones = Object.fromEntries(
    PROGRESSION_MILESTONE_KEYS.map((key) => [key, summarizeMilestone(results, key)]),
  ) as Record<keyof ProgressionJourneyMilestones, MilestoneDistribution>

  return {
    attempts,
    curve: createCurve(results, maxRuns),
    maxRuns,
    milestones,
    seed,
    strategyId,
  }
}
