import { describe, expect, it } from 'vitest'
import { TALENTS } from '../../game/content/talents'
import {
  clampTalentCanvasOffset,
  getCenteredTalentCanvasOffset,
  getTalentTreeFrontierPoint,
  getTalentTreePoint,
  getZoomedTalentCanvasOffset,
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
      { x: 900, y: 900 },
      { height: 800, width: 384 },
    )).toEqual({ x: -708, y: -500 })
  })

  it('clamps panning before the complete tree can be lost', () => {
    const offset = clampTalentCanvasOffset(
      { x: 10_000, y: -10_000 },
      { height: 800, width: 384 },
    )

    expect(offset.x).toBeCloseTo(-307.84)
    expect(offset.y).toBe(-1180)
  })

  it('keeps connected nodes in a compact radial cluster', () => {
    for (const talent of TALENTS) {
      const target = getTalentTreePoint(talent.id)
      for (const prerequisiteId of talent.prerequisiteIds) {
        const source = getTalentTreePoint(prerequisiteId)
        expect(Math.hypot(target.x - source.x, target.y - source.y)).toBeLessThanOrEqual(185)
      }
    }
  })

  it('keeps the viewport anchor fixed while zooming', () => {
    const viewport = { height: 800, width: 384 }
    const anchor = { x: 192, y: 400 }
    const offset = getCenteredTalentCanvasOffset({ x: 900, y: 1125 }, viewport)
    const zoomed = getZoomedTalentCanvasOffset(offset, anchor, 1, 1.25, viewport)

    expect(zoomed).toEqual({
      x: 192 - 900 * 1.25,
      y: 400 - 1125 * 1.25,
    })
  })

  it('centers requested points at the current zoom level', () => {
    expect(getCenteredTalentCanvasOffset(
      { x: 900, y: 900 },
      { height: 800, width: 384 },
      0.75,
    )).toEqual({ x: -483, y: -275 })
  })

  it('centers a fresh profile on the opening talent', () => {
    expect(getTalentTreeFrontierPoint({})).toEqual({ x: 900, y: 900 })
  })

  it('returns to the radial center when rank one reveals all four directions', () => {
    expect(getTalentTreeFrontierPoint({ 'battle-hardened-1': 1 })).toEqual({
      x: 900,
      y: 900,
    })
  })
})
