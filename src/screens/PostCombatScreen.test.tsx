import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { PostCombatScreen } from './PostCombatScreen'

const mockedStore = vi.hoisted(() => ({
  state: {
    profile: {
      bankedSouls: 5,
      settings: {
        autoCombat: false,
      },
      xp: 8,
    },
    run: {
      lastReward: {
        enemyName: 'Slime',
        floor: 1,
        isBoss: false,
        xp: 8,
        souls: 5,
        dungeonComplete: false,
      },
      dungeonId: 'prototype-depths',
      enemy: {
        spriteName: 'Slime',
      },
      playerHp: 10,
      playerMaxHp: 10,
      runStats: {
        enemiesDefeated: 1,
        soulsEarned: 5,
        xpEarned: 8,
      },
    },
    advanceToNextFloor: () => undefined,
    checkpointAutoCombat: () => undefined,
    returnToHubAfterVictory: () => undefined,
    setAutoCombat: () => undefined,
  },
}))

vi.mock('../store/newGameStore', () => ({
  useNewGameStore: <T,>(selector: (state: typeof mockedStore.state) => T): T => (
    selector(mockedStore.state)
  ),
}))

describe('PostCombatScreen incremental reward flow', () => {
  beforeEach(() => {
    mockedStore.state.profile.bankedSouls = 5
    mockedStore.state.profile.settings.autoCombat = false
    mockedStore.state.profile.xp = 8
    Object.assign(mockedStore.state.run.lastReward, {
      enemyName: 'Slime',
      floor: 1,
      isBoss: false,
      xp: 8,
      souls: 5,
      dungeonComplete: false,
    })
    mockedStore.state.run.enemy.spriteName = 'Slime'
    mockedStore.state.run.playerHp = 10
    mockedStore.state.run.playerMaxHp = 10
    Object.assign(mockedStore.state.run.runStats, {
      enemiesDefeated: 1,
      soulsEarned: 5,
      xpEarned: 8,
    })
  })

  it('shows a compact reward pulse and no next-enemy information', () => {
    const markup = renderToStaticMarkup(<PostCombatScreen />)

    expect(markup).toContain('Battle rewards')
    expect(markup).toContain('Souls')
    expect(markup).toContain('Continue to Floor 2')
    expect(markup).not.toContain('Permanent')
    expect(markup).not.toContain('Slime Crawler')
    expect(markup).not.toContain('Attack Die')
    expect(markup).not.toContain('At risk')
  })

  it('turns the boss outcome into a full-descent summary', () => {
    mockedStore.state.profile.bankedSouls = 210
    mockedStore.state.profile.xp = 242
    Object.assign(mockedStore.state.run.lastReward, {
      enemyName: 'Demon',
      floor: 10,
      isBoss: true,
      xp: 60,
      souls: 60,
      dungeonComplete: true,
    })
    mockedStore.state.run.enemy.spriteName = 'Demon'
    mockedStore.state.run.playerHp = 3
    Object.assign(mockedStore.state.run.runStats, {
      enemiesDefeated: 10,
      soulsEarned: 210,
      xpEarned: 242,
    })

    const markup = renderToStaticMarkup(<PostCombatScreen />)

    expect(markup).toContain('Dungeon cleared')
    expect(markup).toContain('This descent')
    expect(markup).toContain('+242')
    expect(markup).toContain('+210')
    expect(markup).toContain('10 enemies defeated')
    expect(markup).toContain('Return to Hub')
    expect(markup).not.toContain('Continue to Floor 11')
  })

  it('offers a pause action while Auto Combat prepares the next floor', () => {
    mockedStore.state.profile.settings.autoCombat = true

    const markup = renderToStaticMarkup(<PostCombatScreen />)

    expect(markup).toContain('Pause Auto Combat')
    expect(markup).toContain('Auto · continuing to Floor 2')
    expect(markup).not.toContain('Continue to Floor 2')
  })
})
