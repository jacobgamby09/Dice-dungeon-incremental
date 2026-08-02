import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SoulDieSummary } from './SoulDieSummary'

describe('SoulDieSummary', () => {
  it('presents all six Soul multipliers as permanent system-die faces', () => {
    const markup = renderToStaticMarkup(<SoulDieSummary values={[1, 1, 2, 2, 2, 2]} />)

    expect(markup).toContain('System Dice')
    expect(markup).toContain('Soul Die faces 1, 1, 2, 2, 2, 2')
    expect(markup.match(/class="face-cell"/g)).toHaveLength(6)
    expect(markup.match(/×2/g)).toHaveLength(4)
    expect(markup).toContain('Average ×1.67')
  })
})
