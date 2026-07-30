import { describe, expect, it } from 'vitest'
import { BASE_SOUL_DIE_VALUES, createSoulDie } from '../content/dice'
import { createSoulDieState, drawSoulDie, normalizeSoulDieState } from './soulDie'

describe('Soul Die shuffle-cycle', () => {
  it('draws every stable face exactly once before reshuffling', () => {
    let state = createSoulDieState()
    const results = Array.from({ length: 6 }, () => {
      const draw = drawSoulDie(state, BASE_SOUL_DIE_VALUES, 2, () => 0.42)
      state = draw.nextState
      return draw.result
    })

    expect(new Set(results.map((result) => result.faceId)).size).toBe(6)
    expect(results.reduce((total, result) => total + result.payout, 0)).toBe(18)
    expect(state.drawPileFaceIds).toEqual([])
  })

  it('continues a persisted cycle without drawing a replacement', () => {
    const faceIds = createSoulDie().faces.map((face) => face.id)
    const draw = drawSoulDie(
      { drawPileFaceIds: [faceIds[4], faceIds[1]] },
      BASE_SOUL_DIE_VALUES,
      5,
      () => 0,
    )

    expect(draw.result.faceId).toBe(faceIds[4])
    expect(draw.result.multiplier).toBe(2)
    expect(draw.result.payout).toBe(10)
    expect(draw.nextState.drawPileFaceIds).toEqual([faceIds[1]])
  })

  it('drops duplicate and unknown persisted face IDs safely', () => {
    const faceId = createSoulDie().faces[0].id
    expect(normalizeSoulDieState({
      drawPileFaceIds: [faceId, faceId, 'unknown'],
    })).toEqual(createSoulDieState())
  })
})
