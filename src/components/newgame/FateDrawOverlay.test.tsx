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
          cost: 5,
        }}
        onClaim={() => undefined}
      />,
    )

    expect(markup).toContain('Charm Found')
    expect(markup).toContain('Low Omen')
    expect(markup).toContain('New Charm')
    expect(markup).toContain('Claim Charm')
    expect(markup).toContain('below their die average')
    expect(markup).not.toContain('fate-reel__scanline')
  })
})
