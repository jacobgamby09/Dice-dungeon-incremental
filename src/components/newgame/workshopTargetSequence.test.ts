import { describe, expect, it } from 'vitest'
import { createForwardTargetSequence, getTargetTickDelay } from './workshopTargetSequence'

describe('Workshop target animation sequence', () => {
  const faceIds = ['face-1', 'face-2', 'face-3', 'face-4', 'face-5', 'face-6']

  it('only advances through adjacent faces and lands on the locked target', () => {
    const sequence = createForwardTargetSequence(faceIds, 'face-3')

    expect(sequence.length).toBeGreaterThanOrEqual(10)
    expect(sequence.at(-1)).toBe('face-3')
    sequence.forEach((faceId, index) => {
      if (index === 0) return
      const previousIndex = faceIds.indexOf(sequence[index - 1])
      expect(faceId).toBe(faceIds[(previousIndex + 1) % faceIds.length])
    })
  })

  it('continues forward from the previous target during a reroll', () => {
    const sequence = createForwardTargetSequence(faceIds, 'face-2', 'face-5')

    expect(sequence[0]).toBe('face-6')
    expect(sequence.at(-1)).toBe('face-2')
  })

  it('decelerates without exceeding the final landing delay', () => {
    const delays = Array.from({ length: 12 }, (_, index) => getTargetTickDelay(index, 12))

    expect(delays[0]).toBe(42)
    expect(delays.at(-1)).toBe(154)
    expect(delays).toEqual([...delays].sort((left, right) => left - right))
  })
})
