import { createDieById, createStartingDice } from '../content/dice'
import { TALENT_IDS, TALENTS_BY_ID } from '../content/talents'
import {
  chaosForge,
  evolveFaceOnDie,
  EVOLUTIONS_BY_FAMILY,
  getChaosForgeCost,
  getPrecisionForgeCost,
  precisionForge,
} from '../forge/forge'
import {
  canPurchaseTalent,
  getDiceCapacity,
  getNextTalentRank,
  getPlayerMaxHp,
  getTalentRank,
} from '../progression/talents'
import type { AttackEvolutionId, DieInstance, FaceInstance } from '../types/dice'
import type { DungeonId } from '../types/dungeon'
import type { PlayerProfile } from '../types/progression'
import { createSeededRandom, simulateDungeonRun } from './simulateDungeon'

export type JourneyForgeMode = 'chaos' | 'precision-attack'

export interface JourneyTalentStep {
  id: string
  targetRank?: number
}

export interface ProgressionJourneyStrategy {
  evolutionOrder: readonly AttackEvolutionId[]
  forgeMode: JourneyForgeMode
  loadoutPriority: readonly string[]
  talentPath: readonly JourneyTalentStep[]
}

export interface ProgressionJourneyMilestones {
  autoCombatRun: number | null
  dungeonOneClearRun: number | null
  dungeonTwoClearRun: number | null
  dungeonTwoUnlockRun: number | null
  firstEvolutionRun: number | null
  firstFaceUpgradeRun: number | null
  firstLoadoutChoiceRun: number | null
  secondDieRun: number | null
}

export interface ProgressionJourneyRecord {
  dungeonId: DungeonId
  equippedDieIds: string[]
  evolutionCount: number
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
  { id: TALENT_IDS.twinArsenal },
  { id: TALENT_IDS.autoCombat },
  { id: TALENT_IDS.shieldcraft },
  { id: TALENT_IDS.thirdGrip },
  { id: TALENT_IDS.healingArts },
  { id: TALENT_IDS.battleHardenedTwo },
  { id: TALENT_IDS.fourthGrip },
  { id: TALENT_IDS.quickDraw },
  { id: TALENT_IDS.secondDescent },
  { id: TALENT_IDS.executionerDoctrine },
  { id: TALENT_IDS.towerDiscipline },
]

export const DEFAULT_JOURNEY_STRATEGY: ProgressionJourneyStrategy = {
  evolutionOrder: ['power', 'momentum', 'rend'],
  forgeMode: 'chaos',
  loadoutPriority: [
    'attack-die-executioner',
    'attack-die-1',
    'shield-die-1',
    'heal-die-1',
    'attack-die-2',
    'shield-die-tower',
  ],
  talentPath: DEFAULT_JOURNEY_TALENT_PATH,
}

function createJourneyProfile(): PlayerProfile {
  const diceCollection = createStartingDice()
  return {
    saveVersion: 12,
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

function getEvolutionCount(dice: readonly DieInstance[]): number {
  return dice.reduce(
    (total, die) => total + die.faces.filter((face) => face.evolution).length,
    0,
  )
}

function evolveReadyFaces(
  profile: PlayerProfile,
  evolutionOrder: readonly AttackEvolutionId[],
): PlayerProfile {
  let evolutionIndex = getEvolutionCount(profile.diceCollection)
  const diceCollection = profile.diceCollection.map((die) => {
    let nextDie = die
    for (const face of die.faces) {
      if (!face.evolutionReady || face.evolution) continue
      const familyEvolutions = face.type === 'attack'
        ? evolutionOrder
        : EVOLUTIONS_BY_FAMILY[face.type].map((evolution) => evolution.id)
      const evolutionId = familyEvolutions[evolutionIndex % familyEvolutions.length]
      nextDie = evolutionId
        ? evolveFaceOnDie(nextDie, face.id, evolutionId) ?? nextDie
        : nextDie
      evolutionIndex += 1
    }
    return nextDie
  })

  return { ...profile, diceCollection }
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

function findPrecisionTarget(
  dice: readonly DieInstance[],
): { die: DieInstance; face: FaceInstance; cost: number } | null {
  const candidates = dice.flatMap((die) => die.faces
    .filter((face) => face.type === 'attack')
    .map((face) => ({
      cost: getPrecisionForgeCost(face),
      die,
      face,
    })))
    .filter((candidate): candidate is {
      cost: number
      die: DieInstance
      face: FaceInstance
    } => candidate.cost !== null)

  candidates.sort((first, second) => (
    second.face.value - first.face.value
    || first.cost - second.cost
  ))
  return candidates[0] ?? null
}

function spendSouls(
  profile: PlayerProfile,
  strategy: ProgressionJourneyStrategy,
  random: () => number,
): { profile: PlayerProfile; upgrades: number } {
  let nextProfile = evolveReadyFaces(profile, strategy.evolutionOrder)
  let upgrades = 0

  for (let operation = 0; operation < 200; operation += 1) {
    const priorityDice = getPriorityDice(nextProfile, strategy.loadoutPriority)
    if (strategy.forgeMode === 'precision-attack') {
      const target = findPrecisionTarget(priorityDice)
      if (!target || nextProfile.bankedSouls < target.cost) break
      const forged = precisionForge(target.die, target.face.id)
      if (!forged) break
      nextProfile = {
        ...nextProfile,
        bankedSouls: nextProfile.bankedSouls - forged.result.cost,
        diceCollection: nextProfile.diceCollection.map((die) => (
          die.id === forged.die.id ? forged.die : die
        )),
      }
    } else {
      const target = priorityDice.find((die) => {
        const cost = getChaosForgeCost(die)
        return cost !== null && cost <= nextProfile.bankedSouls
      })
      if (!target) break
      const forged = chaosForge(target, random)
      if (!forged) break
      nextProfile = {
        ...nextProfile,
        bankedSouls: nextProfile.bankedSouls - forged.result.cost,
        diceCollection: nextProfile.diceCollection.map((die) => (
          die.id === forged.die.id ? forged.die : die
        )),
      }
    }

    upgrades += 1
    nextProfile = evolveReadyFaces(nextProfile, strategy.evolutionOrder)
  }

  return { profile: nextProfile, upgrades }
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
    dungeonTwoClearRun: null,
    dungeonTwoUnlockRun: null,
    firstEvolutionRun: null,
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

export function simulateProgressionJourney(
  strategy: ProgressionJourneyStrategy = DEFAULT_JOURNEY_STRATEGY,
  maxRuns = 30,
  seed = 1,
): ProgressionJourneyResult {
  const random = createSeededRandom(seed)
  const milestones = createMilestones()
  const records: ProgressionJourneyRecord[] = []
  let profile = createJourneyProfile()

  for (let run = 1; run <= maxRuns; run += 1) {
    const evolutionCountBefore = getEvolutionCount(profile.diceCollection)
    profile = spendTalentPath(profile, strategy.talentPath)
    const forgeResult = spendSouls(profile, strategy, random)
    profile = selectLoadout(forgeResult.profile, strategy.loadoutPriority)

    setMilestone(milestones, 'firstFaceUpgradeRun', run, forgeResult.upgrades > 0)
    setMilestone(
      milestones,
      'firstEvolutionRun',
      run,
      getEvolutionCount(profile.diceCollection) > evolutionCountBefore,
    )
    setMilestone(
      milestones,
      'secondDieRun',
      run,
      profile.diceCollection.length >= 2,
    )
    setMilestone(
      milestones,
      'autoCombatRun',
      run,
      getTalentRank(profile.talentRanks, TALENT_IDS.autoCombat) > 0,
    )
    setMilestone(
      milestones,
      'dungeonTwoUnlockRun',
      run,
      profile.unlockedDungeonIds.includes('iron-depths'),
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
    setMilestone(
      milestones,
      'dungeonTwoClearRun',
      run,
      dungeonId === 'iron-depths' && result.completedDungeon,
    )

    const postRunEvolutionCount = getEvolutionCount(profile.diceCollection)
    profile = spendTalentPath(profile, strategy.talentPath)
    const postRunForge = spendSouls(profile, strategy, random)
    profile = selectLoadout(postRunForge.profile, strategy.loadoutPriority)

    setMilestone(
      milestones,
      'firstFaceUpgradeRun',
      run,
      postRunForge.upgrades > 0,
    )
    setMilestone(
      milestones,
      'firstEvolutionRun',
      run,
      getEvolutionCount(profile.diceCollection) > postRunEvolutionCount,
    )
    setMilestone(
      milestones,
      'dungeonTwoUnlockRun',
      run,
      profile.unlockedDungeonIds.includes('iron-depths'),
    )
    setMilestone(
      milestones,
      'firstLoadoutChoiceRun',
      run,
      profile.diceCollection.length > getDiceCapacity(profile.talentRanks),
    )

    records.push({
      dungeonId,
      equippedDieIds: [...profile.equippedDieIds],
      evolutionCount: getEvolutionCount(profile.diceCollection),
      highestFloorCleared: result.highestFloorCleared,
      run,
      soulsAfterSpending: profile.bankedSouls,
      xpAfterSpending: profile.xp,
    })

    if (milestones.dungeonTwoClearRun !== null) break
  }

  return { finalProfile: profile, milestones, records }
}
