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
    expect(executioner?.faces.map((face) => face.value)).toEqual([1, 2, 3, 3, 3, 3])
    expect(executioner?.faces.map((face) => face.signature?.id ?? null)).toEqual([
      null, null, null, null, 'execute', 'execute',
    ])
    expect(tower?.name).toBe('Tower Die')
    expect(tower?.faces.map((face) => face.value)).toEqual([1, 2, 3, 3, 3, 3])
    expect(tower?.faces.map((face) => face.signature?.id ?? null)).toEqual([
      null, null, null, null, 'fortify', 'fortify',
    ])
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

  it('keeps Dungeon 1 attack-only and gives Dungeon 2 layered dice', () => {
    const firstDescent = DUNGEONS['prototype-depths'].floors
      .map((floor) => ENCOUNTERS[floor.encounterId])
    const ironDescent = DUNGEONS['iron-depths'].floors
      .map((floor) => ENCOUNTERS[floor.encounterId])

    expect(firstDescent.every((encounter) => (
      encounter.dieIds.length === 1
      && ENEMY_DICE[encounter.dieIds[0]].type === 'attack'
    ))).toBe(true)
    expect(ironDescent.slice(0, -1).every((encounter) => (
      encounter.dieIds.length === 2
      && encounter.dieIds.map((id) => ENEMY_DICE[id].type).join(',') === 'attack,shield'
    ))).toBe(true)
    expect(ironDescent.at(-1)?.dieIds.map((id) => ENEMY_DICE[id].type)).toEqual([
      'attack',
      'shield',
      'heal',
    ])
  })

  it('makes the first kill buy Inner Spark while keeping die two a longer goal', () => {
    const firstEnemyXp = ENCOUNTERS['descent-1-slime-l1'].xpReward
    const firstTalent = TALENTS_BY_ID[TALENT_IDS.battleHardenedOne]
    const secondSlot = TALENTS_BY_ID[TALENT_IDS.twinArsenal]
    const secondDie = TALENTS_BY_ID[TALENT_IDS.strikerPattern]

    expect(firstEnemyXp).toBe(firstTalent.ranks[0].cost)
    expect(secondSlot.ranks[0].cost + secondDie.ranks[0].cost).toBe(firstEnemyXp * 8)
  })

  it('gives permanent Soul loot from every encounter and funds the first face upgrade immediately', () => {
    expect(Object.values(ENCOUNTERS).every((encounter) => encounter.soulValue > 0)).toBe(true)
    expect(ENCOUNTERS['descent-1-slime-l1'].soulValue).toBe(getFaceUpgradeCost(1))
  })

  it('orders both dungeons as ten floors with exactly one final boss', () => {
    for (const dungeon of Object.values(DUNGEONS)) {
      expect(dungeon.floors.map((floor) => floor.floor)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      expect(dungeon.floors.filter((floor) => floor.isBoss)).toEqual([dungeon.floors[9]])
    }
  })
})
