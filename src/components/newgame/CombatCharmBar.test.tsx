import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { CharmDetailOverlay, CombatCharmBar } from './CombatCharmBar'
import { createCharmRunState } from '../../game/combat/charms'

describe('CombatCharmBar', () => {
  it('renders equipped Charms as inspectable buttons', () => {
    const markup = renderToStaticMarkup(
      <CombatCharmBar
        charmState={createCharmRunState()}
        charmTriggerVersion={0}
        charms={[{ id: 'blade-rhythm', rank: 1 }]}
        triggers={[]}
      />,
    )

    expect(markup).toContain('aria-label="Inspect Blade Rhythm"')
    expect(markup).toContain('Blade Rhythm')
    expect(markup).toContain('0/3')
  })

  it('shows current and next-rank descriptions in the inspector', () => {
    const markup = renderToStaticMarkup(
      <CharmDetailOverlay
        onClose={() => undefined}
        snapshot={{ id: 'blade-rhythm', rank: 1 }}
      />,
    )

    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('Rare Charm')
    expect(markup).toContain('Rank 1/3')
    expect(markup).toContain('Every 3rd Attack roll gains +3 Attack.')
    expect(markup).toContain('Every 3rd Attack roll gains +5 Attack.')
    expect(markup).toContain('Close Charm details')
  })
})
