import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { DefeatScreen } from './DefeatScreen'

describe('DefeatScreen permanent rewards', () => {
  it('makes clear that XP and Souls survive defeat', () => {
    const markup = renderToStaticMarkup(<DefeatScreen />)

    expect(markup).toContain('Every reward was kept')
    expect(markup).toContain('Souls kept')
    expect(markup).toContain('XP kept')
    expect(markup).not.toContain('Souls lost')
  })
})
