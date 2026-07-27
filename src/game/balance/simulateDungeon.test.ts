import { describe, expect, it } from 'vitest'
import { createDieById } from '../content/dice'
import { DUNGEONS } from '../content/dungeons'
import { ENCOUNTERS } from '../content/enemies'
import { createSeededRandom, simulateDungeonRun, summarizeDungeonSimulations } from './simulateDungeon'

function getDice(...dieIds: string[]) {
  return dieIds.map((dieId) => createDieById(dieId)!)
}

function raiseFacesTo(dieId: string, minimumValue: number) {
  const die = createDieById(dieId)!
  return {
    ...die,
    faces: die.faces.map((face) => ({
      ...face,
      value: Math.max(face.value, minimumValue),
    })) as typeof die.faces,
  }
}

function setFaceValues(dieId: string, values: number[]) {
  const die = createDieById(dieId)!
  return {
    ...die,
    faces: die.faces.map((face, index) => ({
      ...face,
      value: values[index],
    })) as typeof die.faces,
  }
}

describe('MVP dungeon balance simulator', () => {
  it('is deterministic for a fixed random seed', () => {
    const build = { dice: getDice('attack-die-1'), playerMaxHp: 10 }
    const first = simulateDungeonRun('prototype-depths', build, createSeededRandom(42))
    const second = simulateDungeonRun('prototype-depths', build, createSeededRandom(42))

    expect(first).toEqual(second)
  })

  it('keeps the starting build in the early incremental loop', () => {
    const summary = summarizeDungeonSimulations(
      'prototype-depths',
      { dice: getDice('attack-die-1'), playerMaxHp: 10 },
      2_000,
      100,
    )

    expect(summary.floorReachRate[0]).toBeGreaterThan(0.95)
    expect(summary.averageHighestFloor).toBeGreaterThan(0.9)
    expect(summary.averageHighestFloor).toBeLessThan(2.5)
    expect(summary.bossClearRate).toBe(0)
  })

  it('lets additional capability move the expected wall deeper', () => {
    const starting = summarizeDungeonSimulations(
      'prototype-depths',
      { dice: getDice('attack-die-1'), playerMaxHp: 10 },
      1_000,
      200,
    )
    const twinArsenal = summarizeDungeonSimulations(
      'prototype-depths',
      { dice: getDice('attack-die-1', 'attack-die-2'), playerMaxHp: 12 },
      1_000,
      200,
    )

    expect(twinArsenal.averageHighestFloor).toBeGreaterThan(starting.averageHighestFloor + 1)
    expect(twinArsenal.averageSouls).toBeGreaterThan(starting.averageSouls)
    expect(twinArsenal.averageXp).toBeGreaterThan(starting.averageXp)
  })

  it('keeps every Soul earned before defeat', () => {
    const run = simulateDungeonRun(
      'prototype-depths',
      { dice: getDice('attack-die-1'), playerMaxHp: 10 },
      createSeededRandom(42),
    )

    const clearedSoulRewards = DUNGEONS['prototype-depths'].floors
      .slice(0, run.highestFloorCleared)
      .map((floor) => ENCOUNTERS[floor.encounterId].soulReward)

    expect(run.soulsCollected).toBe(clearedSoulRewards.reduce((total, reward) => total + reward, 0))
  })

  it('makes the boss a reachable late-MVP milestone after both XP and Soul growth', () => {
    const summary = summarizeDungeonSimulations(
      'prototype-depths',
      {
        dice: ['attack-die-1', 'attack-die-2', 'shield-die-1', 'heal-die-1']
          .map((dieId) => raiseFacesTo(dieId, 3)),
        playerMaxHp: 15,
      },
      1_000,
      300,
    )

    expect(summary.bossClearRate).toBeGreaterThan(0.9)
  })

  it('turns Dungeon 2 into a new incremental climb rather than an immediate clear', () => {
    const earlyBuild = summarizeDungeonSimulations(
      'iron-depths',
      {
        dice: ['attack-die-1', 'attack-die-2', 'shield-die-1', 'heal-die-1']
          .map((dieId) => raiseFacesTo(dieId, 3)),
        playerMaxHp: 15,
      },
      1_000,
      400,
    )
    const midBuild = summarizeDungeonSimulations(
      'iron-depths',
      {
        dice: [
          raiseFacesTo('attack-die-1', 4),
          raiseFacesTo('attack-die-2', 4),
          raiseFacesTo('shield-die-1', 3),
          raiseFacesTo('heal-die-1', 3),
        ],
        playerMaxHp: 18,
      },
      1_000,
      500,
    )
    const lateBuild = summarizeDungeonSimulations(
      'iron-depths',
      {
        dice: [
          raiseFacesTo('attack-die-1', 5),
          raiseFacesTo('attack-die-2', 5),
          setFaceValues('shield-die-1', [4, 4, 4, 5, 5, 5]),
          raiseFacesTo('heal-die-1', 4),
        ],
        playerMaxHp: 21,
      },
      1_000,
      600,
    )

    expect(earlyBuild.averageHighestFloor).toBeGreaterThan(2)
    expect(earlyBuild.averageHighestFloor).toBeLessThan(4)
    expect(earlyBuild.averageRoundsByReachedFloor[0]).toBeGreaterThan(1)
    expect(earlyBuild.averageRoundsByReachedFloor[0]).toBeLessThan(10)
    expect(earlyBuild.averageRoundsPlayed).toBeGreaterThan(earlyBuild.averageHighestFloor)
    expect(midBuild.averageHighestFloor).toBeGreaterThan(earlyBuild.averageHighestFloor + 0.8)
    expect(midBuild.bossClearRate).toBe(0)
    expect(lateBuild.bossClearRate).toBeGreaterThan(0.65)
    expect(lateBuild.bossClearRate).toBeLessThan(0.8)
  })

})
