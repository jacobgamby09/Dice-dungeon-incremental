import { addRollToTotals, rollDie } from '../combat/rollDie'
import { resolveRound } from '../combat/resolveRound'
import { DUNGEONS } from '../content/dungeons'
import { advanceEnemyIntent, createEnemyState } from '../content/enemies'
import { EMPTY_TOTALS } from '../types/combat'
import type { DieInstance } from '../types/dice'
import type { DungeonId } from '../types/dungeon'

export interface SimulationBuild {
  dice: readonly DieInstance[]
  playerMaxHp: number
}

export interface DungeonRunSimulation {
  completedDungeon: boolean
  defeatedAtFloor: number | null
  highestFloorCleared: number
  hpRemaining: number
  roundsPlayed: number
  soulsCollected: number
  runSoulsAtEnd: number
  xpEarned: number
}

export interface DungeonSimulationSummary {
  attempts: number
  averageHighestFloor: number
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
  let soulsCollected = 0
  let xpEarned = 0

  for (const floor of dungeon.floors) {
    let enemy = createEnemyState(floor.enemyId)
    let floorCleared = false

    for (let round = 0; round < 100; round += 1) {
      let totals = { ...EMPTY_TOTALS }
      for (const die of build.dice) {
        totals = addRollToTotals(totals, rollDie(die, random))
      }

      roundsPlayed += 1
      const resolution = resolveRound({
        playerHp,
        playerMaxHp: build.playerMaxHp,
        enemyHp: enemy.hp,
        enemyShield: enemy.shield,
        enemyIntent: enemy.intent,
        totals,
      })
      playerHp = resolution.playerHp
      enemy = {
        ...enemy,
        hp: resolution.enemyHp,
        shield: resolution.enemyShield,
      }

      if (resolution.outcome === 'victory') {
        floorCleared = true
        highestFloorCleared = floor.floor
        soulsCollected += enemy.soulReward
        xpEarned += enemy.xpReward
        break
      }

      if (resolution.outcome === 'defeat') {
        return {
          completedDungeon: false,
          defeatedAtFloor: floor.floor,
          highestFloorCleared,
          hpRemaining: 0,
          roundsPlayed,
          soulsCollected,
          runSoulsAtEnd: 0,
          xpEarned,
        }
      }

      enemy = advanceEnemyIntent(enemy)
    }

    if (!floorCleared) {
      return {
        completedDungeon: false,
        defeatedAtFloor: floor.floor,
        highestFloorCleared,
        hpRemaining: playerHp,
        roundsPlayed,
        soulsCollected,
        runSoulsAtEnd: 0,
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
    roundsPlayed,
    soulsCollected,
    runSoulsAtEnd: soulsCollected,
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
  let totalHighestFloor = 0
  let totalXp = 0
  let bossClears = 0

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const result = simulateDungeonRun(dungeonId, build, createSeededRandom(seed + attempt))
    totalHighestFloor += result.highestFloorCleared
    totalXp += result.xpEarned
    if (result.completedDungeon) bossClears += 1
    for (let floorIndex = 0; floorIndex < dungeon.floors.length; floorIndex += 1) {
      if (result.highestFloorCleared >= floorIndex + 1) floorReachCounts[floorIndex] += 1
    }
  }

  return {
    attempts,
    averageHighestFloor: totalHighestFloor / attempts,
    averageXp: totalXp / attempts,
    bossClearRate: bossClears / attempts,
    floorReachRate: floorReachCounts.map((count) => count / attempts),
  }
}
