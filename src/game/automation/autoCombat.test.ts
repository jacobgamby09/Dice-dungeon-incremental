import { describe, expect, it } from 'vitest'
import { createCombatState } from '../combat/combatState'
import { createStartingDice } from '../content/dice'
import { createEnemyState } from '../content/enemies'
import { TALENT_IDS } from '../content/talents'
import type { DieFaces } from '../types/dice'
import type { RunState } from '../types/dungeon'
import type { PlayerProfile } from '../types/progression'
import {
  fastForwardAutoCombat,
  type AutoCombatGameState,
} from './autoCombat'

function createProfile(): PlayerProfile {
  return {
    saveVersion: 10,
    xp: 0,
    bankedSouls: 0,
    talentRanks: {
      [TALENT_IDS.autoCombat]: 1,
    },
    unlockedDungeonIds: ['prototype-depths'],
    dungeonProgress: {
      'prototype-depths': { highestFloorCleared: 0, clearCount: 0 },
      'iron-depths': { highestFloorCleared: 0, clearCount: 0 },
    },
    diceCollection: createStartingDice(),
    equippedDieIds: ['attack-die-1'],
    settings: {
      rollSpeed: 1,
      autoCombat: true,
    },
  }
}

function createRun(damage = 2, playerHp = 10): RunState {
  const dice = createStartingDice().map((die) => ({
    ...die,
    faces: die.faces.map((face) => ({
      ...face,
      value: damage,
    })) as DieFaces,
  }))
  return {
    status: 'active',
    dungeonId: 'prototype-depths',
    encounterIndex: 0,
    playerHp,
    playerMaxHp: playerHp,
    runStats: {
      enemiesDefeated: 0,
      soulsEarned: 0,
      xpEarned: 0,
    },
    automation: {
      bankedMilliseconds: 0,
      lastCheckpointAt: 1_000,
      randomSeed: 12345,
    },
    equippedDiceSnapshot: dice,
    enemy: createEnemyState('descent-1-slime-l1', () => 0),
    lastReward: null,
  }
}

function createState(damage = 2, playerHp = 10): AutoCombatGameState {
  const run = createRun(damage, playerHp)
  return {
    screen: 'combat',
    profile: createProfile(),
    run,
    combat: createCombatState(run.equippedDiceSnapshot, 1, 0, true, () => 0),
  }
}

describe('Auto Combat background fast-forward', () => {
  it('stops at the boss victory and awards every encounter exactly once', () => {
    const result = fastForwardAutoCombat(createState(99, 10), 300_000)

    expect(result.screen).toBe('post_combat')
    expect(result.run.lastReward?.dungeonComplete).toBe(true)
    expect(result.run.encounterIndex).toBe(9)
    expect(result.run.runStats).toEqual({
      enemiesDefeated: 10,
      soulsEarned: 210,
      xpEarned: 242,
    })
    expect(result.profile.bankedSouls).toBe(210)
    expect(result.profile.xp).toBe(242)
    expect(result.profile.dungeonProgress['prototype-depths']).toEqual({
      highestFloorCleared: 10,
      clearCount: 1,
    })
    expect(result.recap).toMatchObject({
      enemiesDefeated: 10,
      outcome: 'boss_victory',
      soulsEarned: 210,
      toFloor: 10,
      xpEarned: 242,
    })

    const repeated = fastForwardAutoCombat({
      screen: result.screen,
      profile: result.profile,
      run: result.run,
      combat: result.combat,
    }, 300_000)
    expect(repeated.recap).toBeNull()
    expect(repeated.profile.xp).toBe(242)
    expect(repeated.profile.bankedSouls).toBe(210)
    expect(repeated.profile.dungeonProgress['prototype-depths'].clearCount).toBe(1)
  })

  it('is deterministic for the same saved run and random seed', () => {
    const state = createState(3, 12)
    const first = fastForwardAutoCombat(structuredClone(state), 75_000)
    const second = fastForwardAutoCombat(structuredClone(state), 75_000)

    expect(second).toEqual(first)
  })

  it('stops at Defeat instead of retrying the dungeon', () => {
    const result = fastForwardAutoCombat(createState(1, 1), 300_000)

    expect(result.screen).toBe('defeat')
    expect(result.run.status).toBe('defeat')
    expect(result.run.encounterIndex).toBe(0)
    expect(result.run.runStats.enemiesDefeated).toBe(0)
    expect(result.profile.xp).toBe(0)
    expect(result.profile.bankedSouls).toBe(0)
    expect(result.recap?.outcome).toBe('defeat')
  })

  it('does not complete a round before enough background time has elapsed', () => {
    const result = fastForwardAutoCombat(createState(99, 10), 100)

    expect(result.recap).toBeNull()
    expect(result.run.runStats.enemiesDefeated).toBe(0)
    expect(result.combat.roundNumber).toBe(1)
    expect(result.bankedMilliseconds).toBe(100)
  })
})
