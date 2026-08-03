import { describe, expect, it } from 'vitest'
import { createDieById } from '../content/dice'
import { applyImprintRoll } from '../combat/imprints'
import { selectWorkshopTargetFace } from '../forge/forge'
import { applyImprintsToDice, canAttachImprint, rollImprintDrop } from './imprints'
import type { ImprintInstance } from '../types/imprints'

const leadEdge: ImprintInstance = {
  id: 'lead-edge-instance',
  definitionId: 'lead-edge',
  refinement: 2,
  attachment: { dieId: 'attack-die-1', faceId: 'attack-die-1-face-1' },
}

describe('Imprints', () => {
  it('overlays a face without mutating the permanent die', () => {
    const die = createDieById('attack-die-1')!
    const original = die.faces[0].value
    const effective = applyImprintsToDice([die], [leadEdge])[0]

    expect(effective.faces[0]).toMatchObject({ value: 5, imprint: { definitionId: 'lead-edge' } })
    expect(die.faces[0].value).toBe(original)
    expect(die.faces[0].imprint).toBeUndefined()
  })

  it('preserves a stronger host face and adds refinement on top', () => {
    const die = createDieById('attack-die-1')!
    die.faces[0] = { ...die.faces[0], value: 8 }

    const effective = applyImprintsToDice([die], [leadEdge])[0]

    expect(effective.faces[0].value).toBe(10)
    expect(die.faces[0].value).toBe(8)
  })

  it('only binds an Imprint to a matching face family', () => {
    const attackDie = createDieById('attack-die-1')!
    const shieldDie = createDieById('shield-die-1')!

    expect(canAttachImprint(
      [attackDie, shieldDie],
      [leadEdge],
      leadEdge.id,
      attackDie.id,
      attackDie.faces[0].id,
    )).toBe(true)
    expect(canAttachImprint(
      [attackDie, shieldDie],
      [leadEdge],
      leadEdge.id,
      shieldDie.id,
      shieldDie.faces[0].id,
    )).toBe(false)
  })

  it('reserves exactly the first sixth of workshop target space for one Imprint', () => {
    const die = applyImprintsToDice([createDieById('attack-die-1')!], [leadEdge])[0]
    expect(selectWorkshopTargetFace(die, 0)?.imprint?.definitionId).toBe('lead-edge')
    expect(selectWorkshopTargetFace(die, (1 / 6) - 0.000001)?.imprint?.definitionId).toBe('lead-edge')
    expect(selectWorkshopTargetFace(die, 1 / 6)?.imprint).toBeUndefined()
  })

  it('applies opener, relay and crescendo in loadout order', () => {
    const opener = applyImprintRoll({
      dieId: 'a', dieName: 'A', faceId: 'a1', faceIndex: 0, type: 'attack', value: 3,
      imprint: { ...leadEdgeSnapshot, effectKind: 'opener' },
    }, 0, 0)
    expect(opener.result.value).toBe(5)

    const relay = applyImprintRoll({
      dieId: 'b', dieName: 'B', faceId: 'b1', faceIndex: 0, type: 'attack', value: 2,
      imprint: { ...leadEdgeSnapshot, effectKind: 'relay' },
    }, 1, 0)
    expect(relay.nextRelayBonus).toBe(0.5)

    const finisher = applyImprintRoll({
      dieId: 'c', dieName: 'C', faceId: 'c1', faceIndex: 0, type: 'attack', value: 3,
      imprint: { ...leadEdgeSnapshot, effectKind: 'crescendo' },
    }, 3, relay.nextRelayBonus)
    expect(finisher.result.value).toBe(8)
    expect(finisher.result.imprintBonus).toBe(5)
  })

  it('scales Imprint bonuses with the rolled face value', () => {
    const opener = applyImprintRoll({
      dieId: 'a', dieName: 'A', faceId: 'a1', faceIndex: 0, type: 'attack', value: 9,
      imprint: { ...leadEdgeSnapshot, effectKind: 'opener' },
    }, 0, 0)
    const relay = applyImprintRoll({
      dieId: 'b', dieName: 'B', faceId: 'b1', faceIndex: 0, type: 'attack', value: 9,
      imprint: { ...leadEdgeSnapshot, effectKind: 'relay' },
    }, 1, 0)
    const crescendo = applyImprintRoll({
      dieId: 'c', dieName: 'C', faceId: 'c1', faceIndex: 0, type: 'attack', value: 9,
      imprint: { ...leadEdgeSnapshot, effectKind: 'crescendo' },
    }, 4, relay.nextRelayBonus)

    expect(opener.result.value).toBe(14)
    expect(crescendo.result.value).toBe(23)
  })

  it('guarantees Lead Edge on the first Dungeon 1 boss clear only', () => {
    expect(rollImprintDrop({
      dungeonId: 'prototype-depths', floor: 10, isBoss: true, clearCount: 0, owned: [], random: () => 0.99,
    })).toBe('lead-edge')
    expect(rollImprintDrop({
      dungeonId: 'prototype-depths', floor: 10, isBoss: true, clearCount: 1, owned: [leadEdge], random: () => 0.99,
    })).toBeNull()
  })
})

const leadEdgeSnapshot = {
  instanceId: 'test',
  definitionId: 'lead-edge' as const,
  name: 'Test',
  description: 'Test',
  rarity: 'rare' as const,
  refinement: 0,
}
