import { describe, expect, it } from 'vitest'
import { createDieById } from '../content/dice'
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
    expect(twinArsenal.averageXp).toBeGreaterThan(starting.averageXp)
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

})
