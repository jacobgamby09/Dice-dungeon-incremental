import { createDieById, createStartingDice } from '../content/dice'
import { IMPRINT_DEFINITIONS } from '../content/imprints'
import { TALENT_IDS, TALENTS_BY_ID } from '../content/talents'
import { FATE_DRAW_COST, claimFateDraw, createFateDraw } from '../progression/fate'
import {
  completeWorkshopForge,
  getChaosForgeCost,
  prepareWorkshopForge,
} from '../forge/forge'
import {
  canPurchaseTalent,
  getCharmCapacity,
  getCharmRarityProtection,
  getDiceCapacity,
  getNextTalentRank,
  getTalentPurchaseReason,
  getPlayerMaxHp,
  getTalentRank,
  getWorkshopDieFaces,
  getWorkshopTargetRerolls,
  getWorkshopCostMultiplier,
  getImprintForgeBonusChance,
  getWorkshopForgeBonusChance,
  hasAutoCombatUnlocked,
  hasCharmsUnlocked,
} from '../progression/talents'
import {
  applyForgedFaceToBaseDie,
  applyImprintsToDice,
} from '../progression/imprints'
import type { DieInstance } from '../types/dice'
import type { DungeonId } from '../types/dungeon'
import type { PlayerProfile } from '../types/progression'
import { CHARM_IDS } from '../types/charms'
import type { CharmId, CharmSnapshot } from '../types/charms'
import { createSeededRandom, simulateDungeonRun } from './simulateDungeon'
import { createSoulDieState } from '../progression/soulDie'

export interface JourneyTalentStep {
  id: string
  targetRank?: number
}

export interface ProgressionJourneyStrategy {
  dungeonOneUntilTalentId?: string
  loadoutPriority: readonly string[]
  talentPath: readonly JourneyTalentStep[]
}

export interface ProgressionJourneyMilestones {
  autoCombatRun: number | null
  bloodwellDieRun: number | null
  dungeonOneClearRun: number | null
  dungeonTwoUnlockRun: number | null
  dungeonTwoFirstRun: number | null
  dungeonTwoClearRun: number | null
  firstJackpotForgeRun: number | null
  firstFaceUpgradeRun: number | null
  firstLoadoutChoiceRun: number | null
  firstImprintRun: number | null
  fatecraftRun: number | null
  firstCharmRun: number | null
  fourthSlotRun: number | null
  relayImprintRun: number | null
  crescendoImprintRun: number | null
  secondDieRun: number | null
}

export interface ProgressionJourneyRecord {
  averageFaceValue: number
  averagePlayerAttack: number
  averagePlayerHeal: number
  averagePlayerShield: number
  dungeonId: DungeonId
  equippedDieIds: string[]
  highestFloorCleared: number
  imprintCount: number
  charmCount: number
  fateTokensAfterSpending: number
  forgeUpgrades: number
  charmTriggers: number
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
  { id: TALENT_IDS.fieldStudies },
  { id: TALENT_IDS.quickDraw },
  { id: TALENT_IDS.volatileTemper },
  { id: TALENT_IDS.twinArsenal },
  { id: TALENT_IDS.strikerPattern },
  { id: TALENT_IDS.battleHardenedOne, targetRank: 3 },
  { id: TALENT_IDS.quickDraw, targetRank: 3 },
  { id: TALENT_IDS.volatileTemper, targetRank: 3 },
  { id: TALENT_IDS.efficientTools },
  { id: TALENT_IDS.faceMastery },
  { id: TALENT_IDS.forgeOvercharge },
  { id: TALENT_IDS.soulHarvest },
  { id: TALENT_IDS.fatecraft },
  { id: TALENT_IDS.battleHardenedTwo, targetRank: 2 },
  { id: TALENT_IDS.shieldcraft },
  { id: TALENT_IDS.thirdGrip },
  { id: TALENT_IDS.healingArts },
  { id: TALENT_IDS.executionerDoctrine },
  { id: TALENT_IDS.fourthGrip },
  { id: TALENT_IDS.bloodwellDoctrine },
]

export const DEFAULT_JOURNEY_STRATEGY: ProgressionJourneyStrategy = {
  loadoutPriority: [
    'attack-die-1',
    'attack-die-2',
    'shield-die-1',
    'heal-die-bloodwell',
    'heal-die-1',
  ],
  talentPath: DEFAULT_JOURNEY_TALENT_PATH,
}

function createJourneyProfile(): PlayerProfile {
  const diceCollection = createStartingDice()
  return {
    saveVersion: 23,
    xp: 0,
    bankedSouls: 0,
    fateTokens: 0,
    fatePity: 0,
    charmRarityProgress: { epicMisses: 0, legendaryMisses: 0 },
    soulDie: createSoulDieState(),
    talentRanks: {},
    unlockedDungeonIds: ['prototype-depths'],
    dungeonProgress: {
      'prototype-depths': { clearCount: 0, highestFloorCleared: 0 },
      'iron-depths': { clearCount: 0, highestFloorCleared: 0 },
    },
    diceCollection,
    equippedDieIds: diceCollection.map((die) => die.id),
    recentForgeOperationIds: [],
    charmRanks: {},
    equippedCharmIds: [],
    pendingFateDraw: null,
    recentFateOperationIds: [],
    pendingWorkshopForge: null,
    imprints: [],
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
  for (const effect of nextRank.effects) {
    if (
      effect.type === 'grant_die'
      && !diceCollection.some((die) => die.id === effect.dieId)
    ) {
      const die = createDieById(effect.dieId)
      if (die) diceCollection.push(die)
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
  }
}

function spendTalentPath(
  profile: PlayerProfile,
  strategy: ProgressionJourneyStrategy,
): PlayerProfile {
  let nextProfile = profile

  for (const step of strategy.talentPath) {
    const talent = TALENTS_BY_ID[step.id]
    if (!talent) continue
    const targetRank = Math.min(step.targetRank ?? 1, talent.ranks.length)

    while (getTalentRank(nextProfile.talentRanks, step.id) < targetRank) {
      const purchased = purchaseTalent(nextProfile, step.id)
      if (!purchased) {
        if (getTalentPurchaseReason(nextProfile, talent) === 'xp') return nextProfile
        break
      }
      nextProfile = purchased
    }
  }

  return nextProfile
}

function getEquippedCharmSnapshots(profile: PlayerProfile): CharmSnapshot[] {
  return profile.equippedCharmIds.flatMap((charmId) => {
    const rank = profile.charmRanks[charmId] ?? 0
    return rank > 0 ? [{ id: charmId, rank }] : []
  })
}

function spendFateTokens(profile: PlayerProfile, random: () => number): PlayerProfile {
  if (!hasCharmsUnlocked(profile.talentRanks)) return profile
  let nextProfile = profile

  for (let drawIndex = 0; drawIndex < 48; drawIndex += 1) {
    if (nextProfile.fateTokens < FATE_DRAW_COST) break
    const created = createFateDraw(
      nextProfile.charmRanks,
      `journey-fate-${drawIndex}`,
      nextProfile.charmRarityProgress,
      getCharmRarityProtection(nextProfile.talentRanks),
      random,
    )
    if (!created) break
    const charmRanks = claimFateDraw(nextProfile.charmRanks, created.draw)
    if (!charmRanks) break
    nextProfile = {
      ...nextProfile,
      charmRanks,
      charmRarityProgress: created.nextProgress,
      fateTokens: nextProfile.fateTokens - created.draw.cost,
    }
  }

  const capacity = getCharmCapacity(nextProfile.talentRanks)
  const equippedCharmIds = CHARM_IDS
    .filter((charmId) => (nextProfile.charmRanks[charmId] ?? 0) > 0)
    .slice(0, capacity) as CharmId[]
  return { ...nextProfile, equippedCharmIds }
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
    const costMultiplier = getWorkshopCostMultiplier(nextProfile.talentRanks)
    const target = getPriorityDice(nextProfile, strategy.loadoutPriority)
      .map((baseDie) => ({
        baseDie,
        effectiveDie: applyImprintsToDice([baseDie], nextProfile.imprints)[0],
      }))
      .find(({ effectiveDie }) => {
        const cost = getChaosForgeCost(effectiveDie, costMultiplier)
        return cost !== null && cost <= nextProfile.bankedSouls
      })
    if (!target) break

    const prepared = prepareWorkshopForge(
      target.effectiveDie,
      `journey-forge-${operation}`,
      getWorkshopDieFaces(nextProfile.talentRanks),
      random,
      {
        costMultiplier,
        targetRerolls: getWorkshopTargetRerolls(nextProfile.talentRanks),
      },
    )
    if (!prepared) break
    const targetImprint = target.effectiveDie.faces.find(
      (face) => face.id === prepared.targetFaceId,
    )?.imprint
    const bonusChance = targetImprint
      ? getImprintForgeBonusChance(nextProfile.talentRanks)
      : getWorkshopForgeBonusChance(nextProfile.talentRanks)
    const imprintBonus = bonusChance > 0 && random() < bonusChance ? 1 : 0
    const pending = imprintBonus > 0
      ? { ...prepared, appliedAmount: prepared.appliedAmount + imprintBonus }
      : prepared
    const forged = completeWorkshopForge(target.effectiveDie, pending)
    if (!forged) break

    nextProfile = {
      ...nextProfile,
      bankedSouls: nextProfile.bankedSouls - forged.result.cost,
      diceCollection: targetImprint
        ? nextProfile.diceCollection
        : nextProfile.diceCollection.map((die) => (
            die.id === forged.die.id
              ? applyForgedFaceToBaseDie(
                  target.baseDie,
                  forged.die,
                  pending.targetFaceId,
                )
              : die
          )),
      imprints: targetImprint
        ? nextProfile.imprints.map((imprint) => (
            imprint.id === targetImprint.instanceId
              ? { ...imprint, refinement: imprint.refinement + forged.result.amount }
              : imprint
          ))
        : nextProfile.imprints,
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
  return autoAttachImprints({ ...profile, equippedDieIds })
}

function autoAttachImprints(profile: PlayerProfile): PlayerProfile {
  const equippedDice = profile.equippedDieIds
    .map((dieId) => profile.diceCollection.find((die) => die.id === dieId))
    .filter((die): die is DieInstance => Boolean(die))
  const attachments = new Map<string, { dieId: string; faceId: string }>()
  const usedDice = new Set<string>()

  const attachToDie = (definitionId: keyof typeof IMPRINT_DEFINITIONS, die?: DieInstance) => {
    const imprint = profile.imprints.find((candidate) => candidate.definitionId === definitionId)
    if (!imprint || !die || usedDice.has(die.id)) return
    const definition = IMPRINT_DEFINITIONS[definitionId]
    const face = [...die.faces]
      .filter((candidate) => !candidate.signature && candidate.type === definition.type)
      .sort((left, right) => right.value - left.value)[0]
    if (!face) return
    usedDice.add(die.id)
    attachments.set(imprint.id, { dieId: die.id, faceId: face.id })
  }

  attachToDie('lead-edge', equippedDice[0])
  attachToDie('crescendo', [...equippedDice].reverse().find((die) => !usedDice.has(die.id)))
  attachToDie('relay-strike', equippedDice.find((die) => !usedDice.has(die.id)))

  return {
    ...profile,
    imprints: profile.imprints.map((imprint) => ({
      ...imprint,
      attachment: attachments.get(imprint.id),
    })),
  }
}

function createMilestones(): ProgressionJourneyMilestones {
  return {
    autoCombatRun: null,
    bloodwellDieRun: null,
    dungeonOneClearRun: null,
    dungeonTwoUnlockRun: null,
    dungeonTwoFirstRun: null,
    dungeonTwoClearRun: null,
    firstJackpotForgeRun: null,
    firstFaceUpgradeRun: null,
    firstLoadoutChoiceRun: null,
    firstImprintRun: null,
    fatecraftRun: null,
    firstCharmRun: null,
    fourthSlotRun: null,
    relayImprintRun: null,
    crescendoImprintRun: null,
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
    profile = spendTalentPath(profile, strategy)
    profile = spendFateTokens(profile, random)
    const preRunForge = spendSouls(profile, strategy, random)
    profile = selectLoadout(preRunForge.profile, strategy.loadoutPriority)

    setMilestone(milestones, 'firstFaceUpgradeRun', run, preRunForge.upgrades > 0)
    setMilestone(milestones, 'firstJackpotForgeRun', run, preRunForge.jackpots > 0)
    setMilestone(milestones, 'secondDieRun', run, profile.diceCollection.length >= 2)
    setMilestone(
      milestones,
      'bloodwellDieRun',
      run,
      profile.diceCollection.some((die) => die.id === 'heal-die-bloodwell'),
    )
    setMilestone(milestones, 'fourthSlotRun', run, getDiceCapacity(profile.talentRanks) >= 4)
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
    setMilestone(milestones, 'fatecraftRun', run, hasCharmsUnlocked(profile.talentRanks))
    setMilestone(milestones, 'firstCharmRun', run, Object.keys(profile.charmRanks).length > 0)

    const isHoldingInDungeonOne = strategy.dungeonOneUntilTalentId
      ? getTalentRank(profile.talentRanks, strategy.dungeonOneUntilTalentId) === 0
      : false
    const dungeonId: DungeonId = profile.unlockedDungeonIds.includes('iron-depths')
      && !isHoldingInDungeonOne
      ? 'iron-depths'
      : 'prototype-depths'
    setMilestone(milestones, 'dungeonTwoFirstRun', run, dungeonId === 'iron-depths')
    const equippedDice = profile.equippedDieIds.map((dieId) => (
      profile.diceCollection.find((die) => die.id === dieId)!
    ))
    const result = simulateDungeonRun(dungeonId, {
      charms: getEquippedCharmSnapshots(profile),
      dice: equippedDice,
      fatePity: profile.fatePity,
      playerMaxHp: getPlayerMaxHp(profile.talentRanks),
      talentRanks: profile.talentRanks,
      soulDieState: profile.soulDie,
      imprints: profile.imprints,
      dungeonClearCount: profile.dungeonProgress[dungeonId].clearCount,
    }, random)

    profile = {
      ...profile,
      bankedSouls: profile.bankedSouls + result.soulsCollected,
      xp: profile.xp + result.xpEarned,
      soulDie: result.soulDieState,
      imprints: result.imprints,
      fateTokens: profile.fateTokens + result.fateTokensCollected,
      fatePity: result.fatePity,
      unlockedDungeonIds: dungeonId === 'prototype-depths'
        && result.completedDungeon
        && !profile.unlockedDungeonIds.includes('iron-depths')
        ? [...profile.unlockedDungeonIds, 'iron-depths']
        : profile.unlockedDungeonIds,
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
    setMilestone(milestones, 'firstImprintRun', run, profile.imprints.length > 0)
    setMilestone(
      milestones,
      'relayImprintRun',
      run,
      profile.imprints.some((imprint) => imprint.definitionId === 'relay-strike'),
    )
    setMilestone(
      milestones,
      'crescendoImprintRun',
      run,
      profile.imprints.some((imprint) => imprint.definitionId === 'crescendo'),
    )

    profile = spendTalentPath(profile, strategy)
    profile = spendFateTokens(profile, random)
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
      'bloodwellDieRun',
      run,
      profile.diceCollection.some((die) => die.id === 'heal-die-bloodwell'),
    )
    setMilestone(milestones, 'fourthSlotRun', run, getDiceCapacity(profile.talentRanks) >= 4)
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
    setMilestone(milestones, 'fatecraftRun', run, hasCharmsUnlocked(profile.talentRanks))
    setMilestone(milestones, 'firstCharmRun', run, Object.keys(profile.charmRanks).length > 0)

    records.push({
      averageFaceValue: getAverageFaceValue(profile.diceCollection),
      averagePlayerAttack: result.averagePlayerAttack,
      averagePlayerHeal: result.averagePlayerHeal,
      averagePlayerShield: result.averagePlayerShield,
      charmCount: Object.keys(profile.charmRanks).length,
      dungeonId,
      equippedDieIds: [...profile.equippedDieIds],
      highestFloorCleared: result.highestFloorCleared,
      imprintCount: profile.imprints.length,
      fateTokensAfterSpending: profile.fateTokens,
      forgeUpgrades: preRunForge.upgrades + postRunForge.upgrades,
      charmTriggers: result.charmTriggers,
      run,
      soulsAfterSpending: profile.bankedSouls,
      xpAfterSpending: profile.xp,
    })

  }

  return { finalProfile: profile, milestones, records }
}
