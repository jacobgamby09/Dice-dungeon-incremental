import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { SoulDieReward } from './SoulDieReward'

describe('SoulDieReward', () => {
  it('renders the persisted result on the shared physical cube', () => {
    const markup = renderToStaticMarkup(
      <SoulDieReward
        result={{
          dieId: 'soul-die',
          dieName: 'Soul Die',
          faceId: 'soul-die-face-5',
          faceIndex: 4,
          multiplier: 2,
          soulValue: 5,
          payout: 10,
        }}
        values={[1, 1, 1, 2, 2, 2]}
      />,
    )

    expect(markup).toContain('Soul Value 5')
    expect(markup).toContain('roll-die__cube soul-die-reward__cube')
    expect(markup.match(/×2/g)?.length).toBe(3)
  })
})
