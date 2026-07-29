import { createDieById, createStartingDice } from '../content/dice'
import { TALENT_IDS, TALENTS_BY_ID } from '../content/talents'
import {
  completeWorkshopForge,
  getChaosForgeCost,
  prepareWorkshopForge,
} from '../forge/forge'
import {
  canPurchaseTalent,
  getDiceCapacity,
  getNextTalentRank,
  getPlayerMaxHp,
  getTalentRank,
  getWorkshopDieFaces,
  getWorkshopFaceCap,
  hasAutoCombatUnlocked,
} from '../progression/talents'
import type { DieInstance } from '../types/dice'
import type { DungeonId } from '../types/dungeon'
import type { PlayerProfile } from '../types/progression'
import { createSeededRandom, simulateDungeonRun } from './simulateDungeon'

export interface JourneyTalentStep {
  id: string
  targetRank?: number
}

export interface ProgressionJourneyStrategy {
  loadoutPriority: readonly string[]
  talentPath: readonly JourneyTalentStep[]
}

export interface ProgressionJourneyMilestones {
  autoCombatRun: number | null
  dungeonOneClearRun: number | null
  dungeonTwoUnlockRun: number | null
  firstJackpotForgeRun: number | null
  firstFaceUpgradeRun: number | null
  firstLoadoutChoiceRun: number | null
  secondDieRun: number | null
}

export interface ProgressionJourneyRecord {
  averageFaceValue: number
  dungeonId: DungeonId
  equippedDieIds: string[]
  highestFloorCleared: number
  run: number
  soulsAfterSpending: number
  xpAfterSpending: number
}

export interface ProgressionJourneyResult {
  finalProfile: PlayerProfile
  milestones: ProgressionJourneyMilestones
  records: ProgressionJourneyRecord[]
}

export const DEFAULT_JOURNEY_TALENT_PATH: readonly JourneyTalentStep[] = [
  { id: TALENT_IDS.battleHardenedOne, targetRank: 1 },
  { id: TALENT_IDS.autoCombat },
  { id: TALENT_IDS.quickDraw },
  { id: TALENT_IDS.volatileTemper },
  { id: TALENT_IDS.twinArsenal },
  { id: TALENT_IDS.battleHardenedOne, targetRank: 3 },
  { id: TALENT_IDS.quickDraw, targetRank: 3 },
  { id: TALENT_IDS.volatileTemper, targetRank: 3 },
  { id: TALENT_IDS.shieldcraft },
  { id: TALENT_IDS.thirdGrip },
  { id: TALENT_IDS.healingArts },
  { id: TALENT_IDS.battleHardenedTwo, targetRank: 2 },
  { id: TALENT_IDS.secondDescent },
]

export const DEFAULT_JOURNEY_STRATEGY: ProgressionJourneyStrategy = {
  loadoutPriority: [
    'attack-die-1',
    'attack-die-2',
    'shield-die-1',
    'heal-die-1',
  ],
  talentPath: DEFAULT_JOURNEY_TALENT_PATH,
}

function createJourneyProfile(): PlayerProfile {
  const diceCollection = createStartingDice()
  return {
    saveVersion: 14,
    xp: 0,
    bankedSouls: 0,
    talentRanks: {},
    unlockedDungeonIds: ['prototype-depths'],
    dungeonProgress: {
      'prototype-depths': { clearCount: 0, highestFloorCleared: 0 },
      'iron-depths': { clearCount: 0, highestFloorCleared: 0 },
    },
    diceCollection,
    equippedDieIds: diceCollection.map((die) => die.id),
    recentForgeOperationIds: [],
    pendingWorkshopForge: null,
    settings: {
      autoCombat: false,
      rollSpeed: 1,
    },
  }
}

function purchaseTalent(profile: PlayerProfile, talentId: string): PlayerProfile | null {
  const talent = TALENTS_BY_ID[talentId]
  if (!talent || !canPurchaseTalent(profile, talentId)) return null
  const currentRank = getTalentRank(profile.talentRanks, talentId)
  const nextRank = getNextTalentRank(profile.talentRanks, talent)
  if (!nextRank) return null

  const diceCollection = [...profile.diceCollection]
  const unlockedDungeonIds = [...profile.unlockedDungeonIds]
  for (const effect of nextRank.effects) {
    if (
      effect.type === 'grant_die'
      && !diceCollection.some((die) => die.id === effect.dieId)
    ) {
      const die = createDieById(effect.dieId)
      if (die) diceCollection.push(die)
    }
    if (
      effect.type === 'unlock_dungeon'
      && !unlockedDungeonIds.includes(effect.dungeonId)
    ) {
      unlockedDungeonIds.push(effect.dungeonId)
    }
  }

  return {
    ...profile,
    xp: profile.xp - nextRank.cost,
    talentRanks: {
      ...profile.talentRanks,
      [talentId]: currentRank + 1,
    },
    diceCollection,
    unlockedDungeonIds,
  }
}

function spendTalentPath(
  profile: PlayerProfile,
  talentPath: readonly JourneyTalentStep[],
): PlayerProfile {
  let nextProfile = profile

  for (const step of talentPath) {
    const talent = TALENTS_BY_ID[step.id]
    if (!talent) continue
    const targetRank = Math.min(step.targetRank ?? 1, talent.ranks.length)

    while (getTalentRank(nextProfile.talentRanks, step.id) < targetRank) {
      const purchased = purchaseTalent(nextProfile, step.id)
      if (!purchased) return nextProfile
      nextProfile = purchased
    }
  }

  return nextProfile
}

function getPriorityDice(
  profile: PlayerProfile,
  priority: readonly string[],
): DieInstance[] {
  const priorityIndex = new Map(priority.map((dieId, index) => [dieId, index]))
  return [...profile.diceCollection].sort((first, second) => (
    (priorityIndex.get(first.id) ?? Number.MAX_SAFE_INTEGER)
    - (priorityIndex.get(second.id) ?? Number.MAX_SAFE_INTEGER)
  ))
}

function spendSouls(
  profile: PlayerProfile,
  strategy: ProgressionJourneyStrategy,
  random: () => number,
): { jackpots: number; profile: PlayerProfile; upgrades: number } {
  let nextProfile = profile
  let jackpots = 0
  let upgrades = 0

  for (let operation = 0; operation < 300; operation += 1) {
    const faceCap = getWorkshopFaceCap(nextProfile.talentRanks)
    const target = getPriorityDice(nextProfile, strategy.loadoutPriority).find((die) => {
      const cost = getChaosForgeCost(die, faceCap)
      return cost !== null && cost <= nextProfile.bankedSouls
    })
    if (!target) break

    const pending = prepareWorkshopForge(
      target,
      `journey-forge-${operation}`,
      getWorkshopDieFaces(nextProfile.talentRanks),
      random,
      { faceCap },
    )
    if (!pending) break
    const forged = completeWorkshopForge(target, pending, faceCap)
    if (!forged) break

    nextProfile = {
      ...nextProfile,
      bankedSouls: nextProfile.bankedSouls - forged.result.cost,
      diceCollection: nextProfile.diceCollection.map((die) => (
        die.id === forged.die.id ? forged.die : die
      )),
    }
    upgrades += 1
    jackpots += forged.result.isJackpot ? 1 : 0
  }

  return { jackpots, profile: nextProfile, upgrades }
}

function selectLoadout(
  profile: PlayerProfile,
  priority: readonly string[],
): PlayerProfile {
  const capacity = getDiceCapacity(profile.talentRanks)
  const equippedDieIds = getPriorityDice(profile, priority)
    .slice(0, capacity)
    .map((die) => die.id)
  return { ...profile, equippedDieIds }
}

function createMilestones(): ProgressionJourneyMilestones {
  return {
    autoCombatRun: null,
    dungeonOneClearRun: null,
    dungeonTwoUnlockRun: null,
    firstJackpotForgeRun: null,
    firstFaceUpgradeRun: null,
    firstLoadoutChoiceRun: null,
    secondDieRun: null,
  }
}

function setMilestone(
  milestones: ProgressionJourneyMilestones,
  key: keyof ProgressionJourneyMilestones,
  run: number,
  condition: boolean,
) {
  if (condition && milestones[key] === null) milestones[key] = run
}

function getAverageFaceValue(dice: readonly DieInstance[]): number {
  const values = dice.flatMap((die) => die.faces.map((face) => face.value))
  return values.reduce((total, value) => total + value, 0) / values.length
}

export function simulateProgressionJourney(
  strategy: ProgressionJourneyStrategy = DEFAULT_JOURNEY_STRATEGY,
  maxRuns = 60,
  seed = 1,
): ProgressionJourneyResult {
  const random = createSeededRandom(seed)
  const milestones = createMilestones()
  const records: ProgressionJourneyRecord[] = []
  let profile = createJourneyProfile()

  for (let run = 1; run <= maxRuns; run += 1) {
    profile = spendTalentPath(profile, strategy.talentPath)
    const preRunForge = spendSouls(profile, strategy, random)
    profile = selectLoadout(preRunForge.profile, strategy.loadoutPriority)

    setMilestone(milestones, 'firstFaceUpgradeRun', run, preRunForge.upgrades > 0)
    setMilestone(milestones, 'firstJackpotForgeRun', run, preRunForge.jackpots > 0)
    setMilestone(milestones, 'secondDieRun', run, profile.diceCollection.length >= 2)
    setMilestone(
      milestones,
      'autoCombatRun',
      run,
      hasAutoCombatUnlocked(profile.talentRanks),
    )
    setMilestone(
      milestones,
      'firstLoadoutChoiceRun',
      run,
      profile.diceCollection.length > getDiceCapacity(profile.talentRanks),
    )

    const dungeonId: DungeonId = profile.unlockedDungeonIds.includes('iron-depths')
      ? 'iron-depths'
      : 'prototype-depths'
    const equippedDice = profile.equippedDieIds.map((dieId) => (
      profile.diceCollection.find((die) => die.id === dieId)!
    ))
    const result = simulateDungeonRun(dungeonId, {
      dice: equippedDice,
      playerMaxHp: getPlayerMaxHp(profile.talentRanks),
    }, random)

    profile = {
      ...profile,
      bankedSouls: profile.bankedSouls + result.soulsCollected,
      xp: profile.xp + result.xpEarned,
      dungeonProgress: {
        ...profile.dungeonProgress,
        [dungeonId]: {
          clearCount: profile.dungeonProgress[dungeonId].clearCount
            + (result.completedDungeon ? 1 : 0),
          highestFloorCleared: Math.max(
            profile.dungeonProgress[dungeonId].highestFloorCleared,
            result.highestFloorCleared,
          ),
        },
      },
    }

    setMilestone(
      milestones,
      'dungeonOneClearRun',
      run,
      dungeonId === 'prototype-depths' && result.completedDungeon,
    )

    profile = spendTalentPath(profile, strategy.talentPath)
    const postRunForge = spendSouls(profile, strategy, random)
    profile = selectLoadout(postRunForge.profile, strategy.loadoutPriority)

    setMilestone(
      milestones,
      'firstFaceUpgradeRun',
      run,
      preRunForge.upgrades + postRunForge.upgrades > 0,
    )
    setMilestone(
      milestones,
      'firstJackpotForgeRun',
      run,
      preRunForge.jackpots + postRunForge.jackpots > 0,
    )
    setMilestone(milestones, 'secondDieRun', run, profile.diceCollection.length >= 2)
    setMilestone(
      milestones,
      'autoCombatRun',
      run,
      hasAutoCombatUnlocked(profile.talentRanks),
    )
    setMilestone(
      milestones,
      'dungeonTwoUnlockRun',
      run,
      profile.unlockedDungeonIds.includes('iron-depths'),
    )

    records.push({
      averageFaceValue: getAverageFaceValue(profile.diceCollection),
      dungeonId,
      equippedDieIds: [...profile.equippedDieIds],
      highestFloorCleared: result.highestFloorCleared,
      run,
      soulsAfterSpending: profile.bankedSouls,
      xpAfterSpending: profile.xp,
    })

    if (profile.unlockedDungeonIds.includes('iron-depths')) break
  }

  return { finalProfile: profile, milestones, records }
}
