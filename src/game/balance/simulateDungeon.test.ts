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

describe('Classic V2 dungeon balance simulator', () => {
  it('is deterministic for a fixed random seed', () => {
    const build = { dice: getDice('attack-die-1'), playerMaxHp: 10 }
    const first = simulateDungeonRun('prototype-depths', build, createSeededRandom(42))
    const second = simulateDungeonRun('prototype-depths', build, createSeededRandom(42))

    expect(first).toEqual(second)
  })

  it('makes the untouched starting build clear exactly one enemy before defeat', () => {
    const summary = summarizeDungeonSimulations(
      'prototype-depths',
      { dice: getDice('attack-die-1'), playerMaxHp: 10 },
      1_000,
      100,
    )

    expect(summary.floorReachRate[0]).toBe(1)
    expect(summary.averageHighestFloor).toBe(1)
    expect(summary.averageSouls).toBeGreaterThan(1.45)
    expect(summary.averageSouls).toBeLessThan(1.55)
    expect(summary.averageXp).toBe(4)
    expect(summary.bossClearRate).toBe(0)
  })

  it('lets the second one-value Attack die move the wall deeper', () => {
    const starting = summarizeDungeonSimulations(
      'prototype-depths',
      { dice: getDice('attack-die-1'), playerMaxHp: 11 },
      1_000,
      200,
    )
    const twinArsenal = summarizeDungeonSimulations(
      'prototype-depths',
      { dice: getDice('attack-die-1', 'attack-die-2'), playerMaxHp: 11 },
      1_000,
      200,
    )

    expect(twinArsenal.averageHighestFloor).toBeGreaterThan(starting.averageHighestFloor)
    expect(twinArsenal.averageSouls).toBeGreaterThan(starting.averageSouls)
    expect(twinArsenal.averageXp).toBeGreaterThan(starting.averageXp)
  })

  it('keeps every Soul earned before defeat', () => {
    const run = simulateDungeonRun(
      'prototype-depths',
      { dice: getDice('attack-die-1'), playerMaxHp: 10 },
      createSeededRandom(42),
    )
    const clearedSoulValues = DUNGEONS['prototype-depths'].floors
      .slice(0, run.highestFloorCleared)
      .map((floor) => ENCOUNTERS[floor.encounterId].soulValue)
    const minimumSouls = clearedSoulValues.reduce((total, value) => total + value, 0)

    expect(run.soulsCollected).toBeGreaterThanOrEqual(minimumSouls)
    expect(run.soulsCollected).toBeLessThanOrEqual(minimumSouls * 2)
  })

  it('makes the boss a reliable milestone after substantial Soul and XP growth', () => {
    const summary = summarizeDungeonSimulations(
      'prototype-depths',
      {
        dice: ['attack-die-1', 'attack-die-2', 'shield-die-1', 'heal-die-1']
          .map((dieId) => raiseFacesTo(dieId, 4)),
        playerMaxHp: 17,
      },
      1_000,
      300,
    )

    expect(summary.bossClearRate).toBeGreaterThan(0.95)
  })

  it('turns Dungeon 2 into another climb for the post-Dungeon-1 test build', () => {
    const earlyBuild = summarizeDungeonSimulations(
      'iron-depths',
      {
        dice: [
          raiseFacesTo('attack-die-1', 4),
          raiseFacesTo('attack-die-2', 4),
          raiseFacesTo('shield-die-1', 4),
        ],
        playerMaxHp: 17,
      },
      1_000,
      400,
    )
    const lateBuild = summarizeDungeonSimulations(
      'iron-depths',
      {
        dice: [
          raiseFacesTo('attack-die-1', 6),
          raiseFacesTo('attack-die-2', 6),
          raiseFacesTo('shield-die-1', 6),
          raiseFacesTo('heal-die-1', 6),
        ],
        playerMaxHp: 23,
      },
      1_000,
      500,
    )

    expect(earlyBuild.averageHighestFloor).toBeGreaterThan(0)
    expect(earlyBuild.bossClearRate).toBe(0)
    expect(lateBuild.averageHighestFloor).toBeGreaterThan(earlyBuild.averageHighestFloor)
  })
})
