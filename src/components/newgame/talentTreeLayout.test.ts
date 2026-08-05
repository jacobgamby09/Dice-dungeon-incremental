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

    expect(offset.x).toBeCloseTo(-77.84)
    expect(offset.y).toBe(-770)
  })

  it('keeps the complete tree compact and aligned to its layout grid', () => {
    const points = TALENTS.map((talent) => getTalentTreePoint(talent.id))
    const horizontalSpan = Math.max(...points.map((point) => point.x))
      - Math.min(...points.map((point) => point.x))
    const verticalSpan = Math.max(...points.map((point) => point.y))
      - Math.min(...points.map((point) => point.y))

    expect(horizontalSpan).toBeLessThanOrEqual(900)
    expect(verticalSpan).toBeLessThanOrEqual(600)
    for (const point of points) {
      expect(point.x % 20).toBe(0)
      expect(point.y % 20).toBe(0)
    }
  })

  it('keeps connected nodes in a compact radial cluster', () => {
    for (const talent of TALENTS) {
      const target = getTalentTreePoint(talent.id)
      for (const prerequisiteId of talent.prerequisiteIds) {
        const source = getTalentTreePoint(prerequisiteId)
        expect(Math.hypot(target.x - source.x, target.y - source.y)).toBeLessThanOrEqual(260)
      }
    }
  })

  it('keeps independent progression paths from crossing', () => {
    const connections = TALENTS.flatMap((talent) => talent.prerequisiteIds.map(
      (prerequisiteId) => ({
        sourceId: prerequisiteId,
        source: getTalentTreePoint(prerequisiteId),
        targetId: talent.id,
        target: getTalentTreePoint(talent.id),
      }),
    ))
    const cross = (
      first: (typeof connections)[number],
      second: (typeof connections)[number],
    ) => {
      const orientation = (
        a: { x: number; y: number },
        b: { x: number; y: number },
        c: { x: number; y: number },
      ) => Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x))
      return (
        orientation(first.source, first.target, second.source)
        !== orientation(first.source, first.target, second.target)
        && orientation(second.source, second.target, first.source)
        !== orientation(second.source, second.target, first.target)
      )
    }

    for (const [index, first] of connections.entries()) {
      for (const second of connections.slice(index + 1)) {
        const sharesNode = [
          first.sourceId,
          first.targetId,
        ].some((id) => id === second.sourceId || id === second.targetId)
        if (!sharesNode) {
          expect(
            cross(first, second),
            `${first.sourceId} → ${first.targetId} crosses ${second.sourceId} → ${second.targetId}`,
          ).toBe(false)
        }
      }
    }
  })

  it('keeps connector lines clear of unrelated nodes', () => {
    const distanceToSegment = (
      point: { x: number; y: number },
      start: { x: number; y: number },
      end: { x: number; y: number },
    ) => {
      const deltaX = end.x - start.x
      const deltaY = end.y - start.y
      const lengthSquared = deltaX * deltaX + deltaY * deltaY
      const progress = lengthSquared === 0
        ? 0
        : Math.max(0, Math.min(1, (
            (point.x - start.x) * deltaX + (point.y - start.y) * deltaY
          ) / lengthSquared))
      const nearest = {
        x: start.x + progress * deltaX,
        y: start.y + progress * deltaY,
      }
      return Math.hypot(point.x - nearest.x, point.y - nearest.y)
    }

    for (const talent of TALENTS) {
      const target = getTalentTreePoint(talent.id)
      for (const prerequisiteId of talent.prerequisiteIds) {
        const source = getTalentTreePoint(prerequisiteId)
        for (const unrelatedTalent of TALENTS) {
          if (unrelatedTalent.id === talent.id || unrelatedTalent.id === prerequisiteId) continue
          expect(
            distanceToSegment(getTalentTreePoint(unrelatedTalent.id), source, target),
            `${prerequisiteId} → ${talent.id} passes through ${unrelatedTalent.id}`,
          ).toBeGreaterThanOrEqual(54)
        }
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

  it('returns to the center when rank one reveals the connected first ring', () => {
    expect(getTalentTreeFrontierPoint({ 'battle-hardened-1': 1 })).toEqual({
      x: 900,
      y: 900,
    })
  })
})
