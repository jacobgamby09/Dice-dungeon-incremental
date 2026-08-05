import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TALENT_IDS, TALENTS_BY_ID } from '../../game/content/talents'
import { TalentDetailPanel } from './TalentDetailPanel'
import { TalentNode } from './TalentNode'
import { getTalentConnectionState } from './talentConnectionState'

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
        talentRanks={{}}
        dungeonProgress={{
          'prototype-depths': { highestFloorCleared: 0, clearCount: 0 },
          'iron-depths': { highestFloorCleared: 0, clearCount: 0 },
        }}
        xp={88}
      />,
    )

    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('aria-modal="true"')
    expect(markup).toContain('talent-canvas-inspector--track-core')
    expect(markup).toContain('Unlocked')
    expect(markup).toContain('Rank 0/5')
    expect(markup).toContain('Buy · 4 XP')
    expect(markup).not.toContain('Current rank')
    expect(markup).not.toContain('Next rank grants')
  })

  it('inherits the selected talent branch color in the detail panel', () => {
    const arsenalTalent = TALENTS_BY_ID[TALENT_IDS.twinArsenal]
    const markup = renderToStaticMarkup(
      <TalentDetailPanel
        isAffordable={false}
        isAnimating={false}
        nextRank={arsenalTalent.ranks[0]}
        nodeState="unaffordable"
        onClose={() => undefined}
        onPurchase={() => undefined}
        rank={0}
        talent={arsenalTalent}
        talentRanks={{ [TALENT_IDS.battleHardenedOne]: 1 }}
        dungeonProgress={{
          'prototype-depths': { highestFloorCleared: 0, clearCount: 0 },
          'iron-depths': { highestFloorCleared: 0, clearCount: 0 },
        }}
        xp={0}
      />,
    )

    expect(markup).toContain('talent-canvas-inspector--track-arsenal')
  })

  it('explains Reforge refunds in Souls and shows the resulting total', () => {
    const talent = TALENTS_BY_ID[TALENT_IDS.carefulSalvage]
    const markup = renderToStaticMarkup(
      <TalentDetailPanel
        isAffordable
        isAnimating={false}
        nextRank={talent.ranks[0]}
        nodeState="ready"
        onClose={() => undefined}
        onPurchase={() => undefined}
        rank={0}
        talent={talent}
        talentRanks={{ [TALENT_IDS.reforging]: 1 }}
        dungeonProgress={{
          'prototype-depths': { highestFloorCleared: 0, clearCount: 0 },
          'iron-depths': { highestFloorCleared: 0, clearCount: 0 },
        }}
        xp={999}
      />,
    )

    expect(markup).toContain('invested Souls per rank')
    expect(markup).toContain('Soul refund when Reforging: 60% → 70%')
    expect(markup).not.toContain('Reforge Recovery')
  })

  it('separates normal-face Overcharge from Imprint-only Etching', () => {
    const overcharge = TALENTS_BY_ID[TALENT_IDS.forgeOvercharge]
    const etching = TALENTS_BY_ID[TALENT_IDS.resonantEtching]
    const sharedProps = {
      isAffordable: true,
      isAnimating: false,
      nodeState: 'ready' as const,
      onClose: () => undefined,
      onPurchase: () => undefined,
      rank: 0,
      talentRanks: { [TALENT_IDS.faceMastery]: 1 },
      dungeonProgress: {
        'prototype-depths': { highestFloorCleared: 0, clearCount: 0 },
        'iron-depths': { highestFloorCleared: 0, clearCount: 0 },
      },
      xp: 999,
    }
    const overchargeMarkup = renderToStaticMarkup(
      <TalentDetailPanel {...sharedProps} nextRank={overcharge.ranks[0]} talent={overcharge} />,
    )
    const etchingMarkup = renderToStaticMarkup(
      <TalentDetailPanel {...sharedProps} nextRank={etching.ranks[0]} talent={etching} />,
    )

    expect(overchargeMarkup).toContain('never Imprints')
    expect(overchargeMarkup).toContain('Non-Imprint bonus chance: 8%')
    expect(etchingMarkup).toContain('does not affect normal or Signature Faces')
    expect(etchingMarkup).toContain('Imprint-only bonus chance: 12%')
  })

  it('shows the exact Signature mechanic before purchasing a new die', () => {
    const talent = TALENTS_BY_ID[TALENT_IDS.executionerDoctrine]
    const markup = renderToStaticMarkup(
      <TalentDetailPanel
        isAffordable
        isAnimating={false}
        nextRank={talent.ranks[0]}
        nodeState="ready"
        onClose={() => undefined}
        onPurchase={() => undefined}
        rank={0}
        talent={talent}
        talentRanks={{ [TALENT_IDS.thirdGrip]: 1 }}
        dungeonProgress={{
          'prototype-depths': { highestFloorCleared: 0, clearCount: 0 },
          'iron-depths': { highestFloorCleared: 0, clearCount: 0 },
        }}
        xp={999}
      />,
    )

    expect(markup).toContain('Execute · 2/6 faces')
    expect(markup).toContain('If the enemy began the roll sequence at 50% HP or less')
    expect(markup).toContain('Workshop can permanently increase this face&#x27;s base value')
  })

  it('only lights connections to talent nodes that can currently be purchased', () => {
    expect(getTalentConnectionState(1, 0, 'ready')).toBe('open')
    expect(getTalentConnectionState(1, 0, 'unaffordable')).toBe('open')
    expect(getTalentConnectionState(1, 0, 'locked')).toBe('dormant')
    expect(getTalentConnectionState(1, 0, 'silhouette')).toBe('veiled')
    expect(getTalentConnectionState(1, 1, 'active')).toBe('active')
    expect(getTalentConnectionState(0, 0, 'ready')).toBe('dormant')
  })
})
