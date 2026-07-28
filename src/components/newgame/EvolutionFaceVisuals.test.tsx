import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createDieById } from '../../game/content/dice'
import type { AttackEvolutionId, RollResult } from '../../game/types/dice'
import { DieSummary } from './DieSummary'
import { RollDieTile } from './RollDieTile'
import { RoundTotalsPanel } from './RoundTotalsPanel'
import { ScoreTransfer } from './ScoreTransfer'

const EVOLUTIONS = [
  { id: 'power', name: 'Power', value: 5 },
  { id: 'momentum', name: 'Momentum', value: 3 },
  { id: 'rend', name: 'Rend', value: 2 },
] as const satisfies ReadonlyArray<{ id: AttackEvolutionId; name: string; value: number }>

function createEvolutionDie() {
  const die = createDieById('attack-die-1')
  if (!die) throw new Error('Expected Worn Blade Die in catalog.')

  EVOLUTIONS.forEach((evolution, index) => {
    die.faces[index] = {
      ...die.faces[index],
      evolution: { id: evolution.id, name: evolution.name },
      value: evolution.value,
    }
  })

  return die
}

describe('evolution face visuals', () => {
  it('keeps all three identities readable in compact dice summaries', () => {
    const markup = renderToStaticMarkup(<DieSummary compact die={createEvolutionDie()} />)

    EVOLUTIONS.forEach(({ id, name, value }) => {
      expect(markup).toContain(`evolution-face-surface--${id}`)
      expect(markup).toContain(`data-evolution-icon="${id}"`)
      expect(markup).toContain(`${value} Attack, ${name} evolution`)
    })
  })

  it('announces and celebrates an evolved face when it lands', () => {
    const die = createEvolutionDie()
    const result: RollResult = {
      dieId: die.id,
      dieName: die.name,
      evolution: { id: 'rend', name: 'Rend' },
      faceId: die.faces[2].id,
      faceIndex: 2,
      type: 'attack',
      value: 2,
    }
    const markup = renderToStaticMarkup(
      <RollDieTile die={die} result={result} rollDuration={0.5} stage="landed" />,
    )

    expect(markup).toContain('Worn Blade Die rolled 2 Attack, Rend evolution')
    expect(markup).toContain('roll-die--evolution-rend')
    expect(markup).toContain('evolution-impact--rend')
    expect(markup).toContain('data-evolution-icon="rend"')
  })

  it('carries the evolution identity into the score transfer', () => {
    const markup = renderToStaticMarkup(
      <ScoreTransfer
        onComplete={() => undefined}
        path={{
          duration: 0.4,
          evolution: { id: 'momentum', name: 'Momentum' },
          bleedValue: 2,
          faceId: 'attack-die-1-face-2',
          fromX: 100,
          fromY: 300,
          momentumArmed: 2,
          momentumBonus: 2,
          toX: 60,
          toY: 150,
          type: 'attack',
          value: 3,
        }}
      />,
    )

    expect(markup).toContain('score-transfer-origin--evolution')
    expect(markup).toContain('score-transfer-origin--momentum')
    expect(markup).toContain('data-evolution-icon="momentum"')
    expect(markup).toContain('Momentum')
    expect(markup).toContain('Momentum +2')
    expect(markup).toContain('+2 Bleed')
    expect(markup).toContain('Next +2')
  })

  it('keeps an armed Momentum bonus visible between rolls', () => {
    const result: RollResult = {
      dieId: 'attack-die-1',
      dieName: 'Worn Blade Die',
      evolution: { id: 'momentum', name: 'Momentum' },
      faceId: 'attack-die-1-face-2',
      faceIndex: 1,
      type: 'attack',
      value: 3,
    }
    const markup = renderToStaticMarkup(
      <RoundTotalsPanel
        pendingMomentum={2}
        results={[result]}
        totals={{ attack: 3, bleed: 0, heal: 0, shield: 0 }}
      />,
    )

    expect(markup).toContain('Momentum charged. Next die gains 2.')
    expect(markup).toContain('round-total--momentum')
    expect(markup).toContain('Next die')
  })
})
