import { addRollEffects, rollDie } from '../combat/rollDie'
import { shuffleDieIds } from '../combat/drawBag'
import { totalEnemyRolls } from '../combat/rollEnemyDie'
import { resolveRound } from '../combat/resolveRound'
import { DUNGEONS } from '../content/dungeons'
import { createEnemyState, rollNextEnemyIntent } from '../content/enemies'
import { EMPTY_TOTALS } from '../types/combat'
import type { DieInstance } from '../types/dice'
import type { DungeonId } from '../types/dungeon'
import type { TalentRanks } from '../types/progression'
import { getEnemyRewardBreakdown } from '../progression/rewards'

export interface SimulationBuild {
  dice: readonly DieInstance[]
  playerMaxHp: number
  talentRanks?: Readonly<TalentRanks>
}

export interface DungeonRunSimulation {
  completedDungeon: boolean
  defeatedAtFloor: number | null
  highestFloorCleared: number
  hpRemaining: number
  roundsByFloor: number[]
  roundsPlayed: number
  soulsCollected: number
  xpEarned: number
}

export interface DungeonSimulationSummary {
  attempts: number
  averageHighestFloor: number
  averageRoundsByReachedFloor: number[]
  averageRoundsPlayed: number
  averageSouls: number
  averageXp: number
  bossClearRate: number
  floorReachRate: number[]
}

export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state += 0x6D2B79F5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export function simulateDungeonRun(
  dungeonId: DungeonId,
  build: SimulationBuild,
  random: () => number = Math.random,
): DungeonRunSimulation {
  const dungeon = DUNGEONS[dungeonId]
  let playerHp = build.playerMaxHp
  let highestFloorCleared = 0
  let roundsPlayed = 0
  const roundsByFloor = DUNGEONS[dungeonId].floors.map(() => 0)
  let soulsCollected = 0
  let xpEarned = 0

  for (const floor of dungeon.floors) {
    let enemy = createEnemyState(floor.encounterId, random)
    let floorCleared = false
    let carriedShield = 0
    let carriedHeal = 0

    for (let round = 0; round < 100; round += 1) {
      let totals = { ...EMPTY_TOTALS }
      let pendingMomentum = 0
      let pendingFortify = 0
      const shuffledDice = shuffleDieIds(
        build.dice.map((die) => die.id),
        random,
      ).map((dieId) => build.dice.find((die) => die.id === dieId)!)
      for (const [index, die] of shuffledDice.entries()) {
        const effects = addRollEffects(
          totals,
          pendingMomentum,
          rollDie(die, random),
          index === shuffledDice.length - 1,
          pendingFortify,
          {
            enemyHp: enemy.hp,
            enemyMaxHp: enemy.maxHp,
          },
        )
        totals = effects.totals
        pendingMomentum = effects.pendingMomentum
        pendingFortify = effects.pendingFortify
      }

      roundsPlayed += 1
      roundsByFloor[floor.floor - 1] += 1
      const resolution = resolveRound({
        playerHp,
        playerMaxHp: build.playerMaxHp,
        enemyHp: enemy.hp,
        enemyMaxHp: enemy.maxHp,
        enemyShield: enemy.shield,
        enemyBleed: enemy.bleed,
        enemyIntent: totalEnemyRolls(enemy.intentRolls),
        totals,
        carriedShield,
        carriedHeal,
      })
      carriedShield = resolution.nextRoundShield
      carriedHeal = resolution.nextRoundHeal
      playerHp = resolution.playerHp
      enemy = {
        ...enemy,
        hp: resolution.enemyHp,
        shield: resolution.enemyShield,
        bleed: resolution.enemyBleed,
      }

      if (resolution.outcome === 'victory') {
        floorCleared = true
        highestFloorCleared = floor.floor
        const reward = getEnemyRewardBreakdown(
          enemy.xpReward,
          enemy.soulReward,
          build.talentRanks ?? {},
        )
        soulsCollected += reward.souls
        xpEarned += reward.xp
        break
      }

      if (resolution.outcome === 'defeat') {
        return {
          completedDungeon: false,
          defeatedAtFloor: floor.floor,
          highestFloorCleared,
          hpRemaining: 0,
          roundsByFloor,
          roundsPlayed,
          soulsCollected,
          xpEarned,
        }
      }

      enemy = rollNextEnemyIntent(enemy, random)
    }

    if (!floorCleared) {
      return {
        completedDungeon: false,
        defeatedAtFloor: floor.floor,
        highestFloorCleared,
        hpRemaining: playerHp,
        roundsByFloor,
        roundsPlayed,
        soulsCollected,
        xpEarned,
      }
    }
  }

  const completedDungeon = highestFloorCleared === dungeon.floors.length
  return {
    completedDungeon,
    defeatedAtFloor: null,
    highestFloorCleared,
    hpRemaining: playerHp,
    roundsByFloor,
    roundsPlayed,
    soulsCollected,
    xpEarned,
  }
}

export function summarizeDungeonSimulations(
  dungeonId: DungeonId,
  build: SimulationBuild,
  attempts: number,
  seed = 1,
): DungeonSimulationSummary {
  const dungeon = DUNGEONS[dungeonId]
  const floorReachCounts = dungeon.floors.map(() => 0)
  const floorRoundTotals = dungeon.floors.map(() => 0)
  const floorRoundSampleCounts = dungeon.floors.map(() => 0)
  let totalHighestFloor = 0
  let totalSouls = 0
  let totalXp = 0
  let totalRounds = 0
  let bossClears = 0

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const result = simulateDungeonRun(dungeonId, build, createSeededRandom(seed + attempt))
    totalHighestFloor += result.highestFloorCleared
    totalSouls += result.soulsCollected
    totalXp += result.xpEarned
    totalRounds += result.roundsPlayed
    if (result.completedDungeon) bossClears += 1
    for (let floorIndex = 0; floorIndex < dungeon.floors.length; floorIndex += 1) {
      if (result.highestFloorCleared >= floorIndex + 1) floorReachCounts[floorIndex] += 1
      if (result.roundsByFloor[floorIndex] > 0) {
        floorRoundTotals[floorIndex] += result.roundsByFloor[floorIndex]
        floorRoundSampleCounts[floorIndex] += 1
      }
    }
  }

  return {
    attempts,
    averageHighestFloor: totalHighestFloor / attempts,
    averageRoundsByReachedFloor: floorRoundTotals.map((rounds, index) => (
      floorRoundSampleCounts[index] > 0 ? rounds / floorRoundSampleCounts[index] : 0
    )),
    averageRoundsPlayed: totalRounds / attempts,
    averageSouls: totalSouls / attempts,
    averageXp: totalXp / attempts,
    bossClearRate: bossClears / attempts,
    floorReachRate: floorReachCounts.map((count) => count / attempts),
  }
}
