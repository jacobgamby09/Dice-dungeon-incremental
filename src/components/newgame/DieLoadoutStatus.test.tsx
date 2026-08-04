import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  DieLoadoutStatus,
} from './DieLoadoutStatus'
import { getDieLoadoutSlotIndex } from './dieLoadout'

describe('DieLoadoutStatus', () => {
  it('shows the equipped roll position', () => {
    const markup = renderToStaticMarkup(<DieLoadoutStatus slotIndex={1} />)

    expect(markup).toContain('Equipped · Roll 2')
    expect(markup).toContain('Equipped in roll slot 2')
  })

  it('identifies reserve dice consistently', () => {
    expect(getDieLoadoutSlotIndex(['attack-1', 'shield-1'], 'shield-1')).toBe(1)
    expect(getDieLoadoutSlotIndex(['attack-1', 'shield-1'], 'heal-1')).toBeNull()

    const markup = renderToStaticMarkup(<DieLoadoutStatus slotIndex={null} />)
    expect(markup).toContain('Reserve')
    expect(markup).toContain('Not equipped')
  })
})
