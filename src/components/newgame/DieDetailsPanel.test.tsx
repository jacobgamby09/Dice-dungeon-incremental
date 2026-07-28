import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createDieById } from '../../game/content/dice'
import { DieDetailsPanel } from './DieDetailsPanel'

describe('die details panel', () => {
  it('explains Executioner signatures and every Attack family evolution', () => {
    const die = createDieById('attack-die-executioner')!
    const markup = renderToStaticMarkup(
      <DieDetailsPanel die={die} onClose={() => undefined} />,
    )

    expect(markup).toContain('Executioner Die')
    expect(markup).toContain('Execute · 2/6')
    expect(markup).toContain('50% HP or less')
    expect(markup).toContain('Power')
    expect(markup).toContain('Momentum')
    expect(markup).toContain('Rend')
  })

  it('explains Tower signatures and every Shield family evolution', () => {
    const die = createDieById('shield-die-tower')!
    const markup = renderToStaticMarkup(
      <DieDetailsPanel die={die} onClose={() => undefined} />,
    )

    expect(markup).toContain('Tower Die')
    expect(markup).toContain('Fortify · 2/6')
    expect(markup).toContain('next Shield face')
    expect(markup).toContain('Bastion')
    expect(markup).toContain('Reserve')
    expect(markup).toContain('Spikes')
  })
})
