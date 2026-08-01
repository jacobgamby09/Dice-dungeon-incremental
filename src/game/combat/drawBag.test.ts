import { describe, expect, it } from 'vitest'
import { createLoadoutDrawOrder } from './drawBag'

describe('createLoadoutDrawOrder', () => {
  it('preserves the exact equipped loadout order without sharing the source array', () => {
    const source = ['attack-1', 'shield-1', 'heal-1']
    const drawOrder = createLoadoutDrawOrder(source)

    expect(drawOrder).toEqual(source)
    expect(drawOrder).not.toBe(source)
    expect(source).toEqual(['attack-1', 'shield-1', 'heal-1'])
  })

  it('keeps a one-die loadout intact', () => {
    expect(createLoadoutDrawOrder(['attack-1'])).toEqual(['attack-1'])
  })
})
