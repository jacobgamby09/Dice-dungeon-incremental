import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { FateRatesOverlay } from './FateRatesOverlay'

describe('FateRatesOverlay', () => {
  it('shows all base rarity rates and the protection rules', () => {
    const markup = renderToStaticMarkup(<FateRatesOverlay onClose={() => undefined} />)

    expect(markup).toContain('Fate Draw rates')
    expect(markup).toContain('Common')
    expect(markup).toContain('50%')
    expect(markup).toContain('Rare')
    expect(markup).toContain('30%')
    expect(markup).toContain('Epic')
    expect(markup).toContain('15%')
    expect(markup).toContain('Legendary')
    expect(markup).toContain('5%')
    expect(markup).toContain('There is no default rarity pity')
    expect(markup).toContain('Favor adds visible Epic+ and Legendary pity timers')
    expect(markup).toContain('Only Legendary resets the Legendary timer')
  })
})
