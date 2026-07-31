import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { FateDrawOverlay } from './FateDrawOverlay'

describe('FateDrawOverlay', () => {
  it('shows the already persisted winner immediately after a reload', () => {
    const markup = renderToStaticMarkup(
      <FateDrawOverlay
        animate={false}
        currentRank={0}
        draw={{
          operationId: 'draw-1',
          selectedCharmId: 'low-omen',
          rarity: 'epic',
          cost: 5,
        }}
        onClaim={() => undefined}
      />,
    )

    expect(markup).toContain('Charm Found')
    expect(markup).toContain('Loaded Star')
    expect(markup).toContain('Epic')
    expect(markup).toContain('New Charm')
    expect(markup).toContain('Claim Charm')
    expect(markup).toContain('Every 5th die Echoes')
    expect(markup).not.toContain('fate-reel__scanline')
  })
})
