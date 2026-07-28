import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TALENT_IDS, TALENTS_BY_ID } from '../../game/content/talents'
import { TalentDetailPanel } from './TalentDetailPanel'
import { TalentNode } from './TalentNode'

const battleHardened = TALENTS_BY_ID[TALENT_IDS.battleHardenedOne]

describe('Talent Tree presentation', () => {
  it('marks unlocked and purchased nodes with different visible states', () => {
    const readyMarkup = renderToStaticMarkup(
      <TalentNode
        isAffordable
        nextCost={8}
        onSelect={() => undefined}
        rank={0}
        state="ready"
        talent={battleHardened}
      />,
    )
    const purchasedMarkup = renderToStaticMarkup(
      <TalentNode
        nextCost={16}
        onSelect={() => undefined}
        rank={1}
        state="active"
        talent={battleHardened}
      />,
    )

    expect(readyMarkup).toContain('talent-canvas-node--ready')
    expect(readyMarkup).toContain('>Buy</span>')
    expect(purchasedMarkup).toContain('talent-canvas-node--active')
    expect(purchasedMarkup).toContain('talent-canvas-node__owned')
    expect(purchasedMarkup).toContain('>Owned</span>')
  })

  it('renders selected talent information as an accessible modal dialog', () => {
    const markup = renderToStaticMarkup(
      <TalentDetailPanel
        isAffordable
        isAnimating={false}
        nextRank={battleHardened.ranks[0]}
        nodeState="ready"
        onClose={() => undefined}
        onPurchase={() => undefined}
        rank={0}
        talent={battleHardened}
        xp={88}
      />,
    )

    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('aria-modal="true"')
    expect(markup).toContain('Ready to purchase')
    expect(markup).toContain('Next rank grants')
    expect(markup).toContain('Purchase for 8 XP')
  })
})
