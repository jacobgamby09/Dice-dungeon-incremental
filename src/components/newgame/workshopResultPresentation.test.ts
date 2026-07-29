import { describe, expect, it } from 'vitest'
import { getWorkshopResultPresentation } from './workshopResultPresentation'

const lockedResult = {
  amount: 2,
  rolledAmount: 2,
  workshopFaceId: 'workshop-face-6',
}

describe('Workshop result presentation', () => {
  it('does not reveal the persisted Workshop roll before the die lands', () => {
    expect(getWorkshopResultPresentation('target_locked', lockedResult)).toEqual({
      amount: null,
      rolledAmount: null,
      workshopFaceId: null,
    })
    expect(getWorkshopResultPresentation('rolling_power', lockedResult)).toEqual({
      amount: null,
      rolledAmount: null,
      workshopFaceId: null,
    })
  })

  it('reveals the Workshop roll only in the result phase', () => {
    expect(getWorkshopResultPresentation('result', lockedResult)).toEqual(lockedResult)
  })
})
