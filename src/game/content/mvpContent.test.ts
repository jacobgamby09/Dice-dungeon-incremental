import { describe, expect, it } from 'vitest'
import { createDiceCatalog } from './dice'
import { DUNGEONS } from './dungeons'
import { ENEMY_ATTACK_DICE } from './enemyDice'
import { ENEMIES } from './enemies'
import { TALENT_IDS, TALENTS_BY_ID } from './talents'

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

  it('defines one six-face Attack Die with stable IDs for every enemy', () => {
    const enemyDice = Object.values(ENEMY_ATTACK_DICE)
    const faceIds = enemyDice.flatMap((die) => die.faces.map((face) => face.id))

    expect(enemyDice).toHaveLength(Object.keys(ENEMIES).length)
    expect(new Set(faceIds).size).toBe(faceIds.length)
    for (const enemy of Object.values(ENEMIES)) {
      const die = ENEMY_ATTACK_DICE[enemy.attackDieId]
      expect(die.faces).toHaveLength(6)
      expect(die.faces.every((face) => face.type === 'attack')).toBe(true)
      expect(die.faces.every((face) => face.id.startsWith(`${die.id}-face-`))).toBe(true)
    }
  })

  it('makes the first kill buy the first upgrade and three floor-one kills buy die two', () => {
    const firstEnemyXp = ENEMIES.slime.xpReward
    const firstTalent = TALENTS_BY_ID[TALENT_IDS.battleHardenedOne]
    const secondTalent = TALENTS_BY_ID[TALENT_IDS.twinArsenal]

    expect(firstEnemyXp).toBe(firstTalent.ranks[0].cost)
    expect(firstEnemyXp * 3).toBe(firstTalent.ranks[0].cost + secondTalent.ranks[0].cost)
  })

  it('orders ten floors with exactly one final boss', () => {
    const floors = DUNGEONS['prototype-depths'].floors

    expect(floors.map((floor) => floor.floor)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(floors.filter((floor) => floor.isBoss)).toEqual([floors[9]])
  })
})
