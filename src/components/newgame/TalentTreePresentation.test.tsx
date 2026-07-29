import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TALENT_IDS, TALENTS_BY_ID } from '../../game/content/talents'
import { TalentDetailPanel } from './TalentDetailPanel'
import { TalentNode } from './TalentNode'

const battleHardened = TALENTS_BY_ID[TALENT_IDS.battleHardenedOne]

describe('Talent Tree presentation', () => {
  it('uses shape, checkmarks and rank pips instead of canvas status labels', () => {
    const readyMarkup = renderToStaticMarkup(
      <TalentNode
        isAffordable
        nextCost={4}
        onSelect={() => undefined}
        rank={0}
        state="ready"
        talent={battleHardened}
      />,
    )
    const unaffordableMarkup = renderToStaticMarkup(
      <TalentNode
        nextCost={4}
        onSelect={() => undefined}
        rank={0}
        state="unaffordable"
        talent={battleHardened}
      />,
    )
    const purchasedMarkup = renderToStaticMarkup(
      <TalentNode
        nextCost={7}
        onSelect={() => undefined}
        rank={1}
        state="active"
        talent={battleHardened}
      />,
    )
    const maxedMarkup = renderToStaticMarkup(
      <TalentNode
        nextCost={null}
        onSelect={() => undefined}
        rank={5}
        state="maxed"
        talent={battleHardened}
      />,
    )

    expect(readyMarkup).toContain('talent-canvas-node--ready')
    expect(readyMarkup).not.toContain('talent-canvas-node__state-tag')
    expect(readyMarkup).not.toContain('talent-canvas-node__owned')
    expect(unaffordableMarkup).toContain('talent-canvas-node--unaffordable')
    expect(unaffordableMarkup).not.toContain('talent-canvas-node__state-tag')
    expect(purchasedMarkup).toContain('talent-canvas-node--active')
    expect(purchasedMarkup).toContain('talent-canvas-node__owned')
    expect(purchasedMarkup).toContain('talent-canvas-node__rank--filled')
    expect(purchasedMarkup).not.toContain('talent-canvas-node__state-tag')
    expect(maxedMarkup).toContain('talent-canvas-node--maxed')
    expect(maxedMarkup).toContain('talent-canvas-node__owned')
    expect(maxedMarkup.match(/talent-canvas-node__rank--filled/g)).toHaveLength(5)
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
    expect(markup).toContain('Unlocked')
    expect(markup).toContain('Rank 0/5')
    expect(markup).toContain('Buy · 4 XP')
    expect(markup).not.toContain('Current rank')
    expect(markup).not.toContain('Next rank grants')
  })
})
