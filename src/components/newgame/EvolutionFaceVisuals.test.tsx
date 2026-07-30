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

  it.each(EVOLUTIONS)(
    'announces and celebrates the $name identity without borrowing another evolution',
    ({ id, name, value }) => {
      const die = createEvolutionDie()
      const faceIndex = EVOLUTIONS.findIndex((candidate) => candidate.id === id)
      const result: RollResult = {
        dieId: die.id,
        dieName: die.name,
        evolution: { id, name },
        faceId: die.faces[faceIndex].id,
        faceIndex,
        type: 'attack',
        value,
      }
      const markup = renderToStaticMarkup(
        <RollDieTile die={die} result={result} rollDuration={0.5} stage="landed" />,
      )

      expect(markup).toContain(`Worn Blade Die rolled ${value} Attack, ${name} evolution`)
      expect(markup).toContain(`roll-die--evolution-${id}`)
      expect(markup).toContain(`evolution-impact--${id}`)
      expect(markup).toContain('roll-die__landing-ring--evolution')
      expect(markup).toContain(`data-evolution-icon="${id}"`)

      EVOLUTIONS.filter((candidate) => candidate.id !== id).forEach((candidate) => {
        expect(markup).not.toContain(`roll-die--evolution-${candidate.id}`)
        expect(markup).not.toContain(`evolution-impact--${candidate.id}`)
      })
    },
  )

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
    expect(markup).toContain('score-transfer__trail')
    expect(markup).toContain('score-transfer__arrival')
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
