import { describe, expect, it } from 'vitest'
import { TALENTS } from '../../game/content/talents'
import {
  clampTalentCanvasOffset,
  getCenteredTalentCanvasOffset,
  getTalentTreeFrontierPoint,
  getTalentTreePoint,
  TALENT_TREE_LAYOUT,
} from './talentTreeLayout'

describe('Talent Tree canvas layout', () => {
  it('places every talent at a unique point', () => {
    expect(Object.keys(TALENT_TREE_LAYOUT)).toHaveLength(TALENTS.length)

    const positions = TALENTS.map((talent) => {
      const point = getTalentTreePoint(talent.id)
      return `${point.x}:${point.y}`
    })

    expect(new Set(positions).size).toBe(TALENTS.length)
  })

  it('centers a requested point inside the viewport', () => {
    expect(getCenteredTalentCanvasOffset(
      { x: 520, y: 260 },
      { height: 800, width: 384 },
    )).toEqual({ x: -328, y: 140 })
  })

  it('clamps panning before the complete tree can be lost', () => {
    const offset = clampTalentCanvasOffset(
      { x: 10_000, y: -10_000 },
      { height: 800, width: 384 },
    )

    expect(offset.x).toBeCloseTo(22.16)
    expect(offset.y).toBe(-1040)
  })

  it('centers a fresh profile on the opening talent', () => {
    expect(getTalentTreeFrontierPoint({})).toEqual({ x: 520, y: 260 })
  })
})
