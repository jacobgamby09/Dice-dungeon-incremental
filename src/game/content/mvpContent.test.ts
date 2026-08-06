import { describe, expect, it } from 'vitest'
import { createDiceCatalog } from './dice'
import { DUNGEONS } from './dungeons'
import { ENEMY_DICE } from './enemyDice'
import { ENCOUNTERS } from './enemies'
import { TALENT_IDS, TALENTS_BY_ID } from './talents'
import { getFaceUpgradeCost } from './upgradeCosts'

describe('MVP content integrity', () => {
  it('defines unique permanent dice and six stable faces per die', () => {
    const dice = createDiceCatalog()
    const dieIds = dice.map((die) => die.id)
    const faceIds = dice.flatMap((die) => die.faces.map((face) => face.id))

    expect(new Set(dieIds).size).toBe(dieIds.length)
    expect(new Set(faceIds).size).toBe(faceIds.length)
    for (const die of dice) {
      expect(die.name.length).toBeGreaterThan(0)
      expect(die.faces).toHaveLength(6)
      expect(die.faces.every((face) => face.id.startsWith(`${die.id}-face-`))).toBe(true)
    }
  })

  it('adds two post-Dungeon-1 sidegrades without replacing the starting dice', () => {
    const dice = createDiceCatalog()
    const executioner = dice.find((die) => die.id === 'attack-die-executioner')
    const tower = dice.find((die) => die.id === 'shield-die-tower')

    expect(executioner?.name).toBe('Executioner Die')
    expect(executioner?.faces.map((face) => face.value)).toEqual([2, 2, 3, 3, 3, 3])
    expect(executioner?.faces.map((face) => face.signature?.id ?? null)).toEqual([
      null, null, null, null, 'execute', 'execute',
    ])
    expect(tower?.name).toBe('Tower Die')
    expect(tower?.faces.map((face) => face.value)).toEqual([2, 2, 3, 3, 3, 3])
    expect(tower?.faces.map((face) => face.signature?.id ?? null)).toEqual([
      null, null, null, null, 'fortify', 'fortify',
    ])
  })

  it('defines Bloodwell as a six-face Heal die with two fixed Drain signatures', () => {
    const bloodwell = createDiceCatalog().find((die) => die.id === 'heal-die-bloodwell')

    expect(bloodwell?.name).toBe('Bloodwell Die')
    expect(bloodwell?.faces.map((face) => face.value)).toEqual([2, 2, 2, 2, 1, 1])
    expect(bloodwell?.faces.map((face) => face.signature?.id ?? null)).toEqual([
      null, null, null, null, 'drain', 'drain',
    ])
  })

  it('defines the Dungeon 3 status dice with forgeable Dormant faces', () => {
    const focus = createDiceCatalog().find((die) => die.id === 'empower-die-focus')
    const purifier = createDiceCatalog().find((die) => die.id === 'cleanse-die-purifier')

    expect(focus?.faces.map((face) => face.value)).toEqual([0, 0, 0, 1, 1, 2])
    expect(focus?.faces.every((face) => face.type === 'empower')).toBe(true)
    expect(purifier?.faces.map((face) => face.value)).toEqual([0, 0, 1, 1, 1, 2])
    expect(purifier?.faces.every((face) => face.type === 'cleanse')).toBe(true)
  })

  it('defines six stable same-type faces for every enemy die', () => {
    const enemyDice = Object.values(ENEMY_DICE)
    const faceIds = enemyDice.flatMap((die) => die.faces.map((face) => face.id))

    expect(new Set(faceIds).size).toBe(faceIds.length)
    for (const die of enemyDice) {
      expect(die.faces).toHaveLength(6)
      expect(die.faces.every((face) => face.type === die.type)).toBe(true)
      expect(die.faces.every((face) => face.id.startsWith(`${die.id}-face-`))).toBe(true)
    }
  })

  it('keeps regular Dungeon 1 enemies attack-only and previews layered dice on its boss', () => {
    const firstDescent = DUNGEONS['prototype-depths'].floors
      .map((floor) => ENCOUNTERS[floor.encounterId])
    const ironDescent = DUNGEONS['iron-depths'].floors
      .map((floor) => ENCOUNTERS[floor.encounterId])

    expect(firstDescent.slice(0, -1).every((encounter) => (
      encounter.dieIds.length === 1
      && ENEMY_DICE[encounter.dieIds[0]].type === 'attack'
    ))).toBe(true)
    expect(firstDescent.at(-1)?.dieIds.map((id) => ENEMY_DICE[id].type))
      .toEqual(['attack', 'shield'])
    expect(ENEMY_DICE['demon-attack'].faces.map((face) => face.value))
      .toEqual([7, 7, 7, 8, 8, 8])
    expect(ENEMY_DICE['demon-shield'].faces.map((face) => face.value))
      .toEqual([2, 2, 2, 3, 3, 3])
    expect(ironDescent.slice(0, -1).every((encounter) => encounter.dieIds.length === 2))
      .toBe(true)
    expect(ironDescent.slice(0, 4).map((encounter) => (
      encounter.dieIds.map((id) => ENEMY_DICE[id].type).join('+')
    ))).toEqual(['attack+shield', 'attack+heal', 'attack+attack', 'attack+attack'])
    expect(ironDescent.at(-1)?.dieIds.map((id) => ENEMY_DICE[id].type)).toEqual([
      'attack',
      'shield',
      'heal',
    ])
    expect(ironDescent.slice(0, 4).map((encounter) => encounter.maxHp))
      .toEqual([22, 26, 30, 34])
    expect(ironDescent.slice(4).map((encounter) => encounter.maxHp))
      .toEqual([68, 74, 66, 78, 92, 125])
    expect(ENEMY_DICE['spiked-behemoth-attack'].faces.map((face) => face.value))
      .toEqual([10, 11, 11, 12, 12, 13])
  })

  it('makes the first kill buy Inner Spark while keeping die two a longer goal', () => {
    const firstEnemyXp = ENCOUNTERS['descent-1-slime-l1'].xpReward
    const firstTalent = TALENTS_BY_ID[TALENT_IDS.battleHardenedOne]
    const secondSlot = TALENTS_BY_ID[TALENT_IDS.twinArsenal]
    const secondDie = TALENTS_BY_ID[TALENT_IDS.strikerPattern]

    expect(firstEnemyXp).toBe(firstTalent.ranks[0].cost)
    expect(secondSlot.ranks[0].cost + secondDie.ranks[0].cost).toBe(firstEnemyXp * 8)
  })

  it('makes an early Dungeon 2 push worth more XP than a complete Dungeon 1 clear', () => {
    const dungeonOneXp = DUNGEONS['prototype-depths'].floors.reduce(
      (total, floor) => total + ENCOUNTERS[floor.encounterId].xpReward,
      0,
    )
    const firstFourDungeonTwoXp = DUNGEONS['iron-depths'].floors.slice(0, 4).reduce(
      (total, floor) => total + ENCOUNTERS[floor.encounterId].xpReward,
      0,
    )

    expect(dungeonOneXp).toBe(190)
    expect(firstFourDungeonTwoXp).toBe(333)
    expect(firstFourDungeonTwoXp).toBeGreaterThan(dungeonOneXp)
  })

  it('makes Dungeon 3 the three-die status dungeon with a four-die boss', () => {
    const descent = DUNGEONS['blighted-depths'].floors
      .map((floor) => ENCOUNTERS[floor.encounterId])

    expect(descent.slice(0, -1).every((encounter) => encounter.dieIds.length === 3)).toBe(true)
    expect(descent.at(-1)?.dieIds).toHaveLength(4)
    expect(descent.slice(0, 4).map((encounter) => (
      encounter.dieIds.map((id) => ENEMY_DICE[id].type).join('+')
    ))).toEqual([
      'attack+attack+poison',
      'weaken+attack+attack',
      'empower+attack+heal',
      'shield+attack+poison',
    ])
    expect(descent.at(-1)?.maxHp).toBe(260)
    expect(descent.at(-1)?.dieIds.map((id) => ENEMY_DICE[id].type))
      .toEqual(['empower', 'attack', 'poison', 'attack'])
  })

  it('gives permanent Soul loot from every encounter and funds the first face upgrade immediately', () => {
    expect(Object.values(ENCOUNTERS).every((encounter) => encounter.soulValue > 0)).toBe(true)
    expect(ENCOUNTERS['descent-1-slime-l1'].soulValue).toBe(getFaceUpgradeCost(1))
  })

  it('orders every dungeon as ten floors with exactly one final boss', () => {
    for (const dungeon of Object.values(DUNGEONS)) {
      expect(dungeon.floors.map((floor) => floor.floor)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      expect(dungeon.floors.filter((floor) => floor.isBoss)).toEqual([dungeon.floors[9]])
    }
  })
})
