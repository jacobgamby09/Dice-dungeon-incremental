import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createDieById } from '../../game/content/dice'
import { getEnemyDie } from '../../game/content/enemyDice'
import { rollEnemyDie, totalEnemyRolls } from '../../game/combat/rollEnemyDie'
import { EnemyDamageTransfer } from './EnemyDamageTransfer'
import { EnemyIntentTray } from './EnemyIntentTray'
import { HpBar } from './HpBar'
import { RollDieTile } from './RollDieTile'

describe('arcade combat feedback', () => {
  it('keeps HP semantics while exposing a separate damage impact layer', () => {
    const markup = renderToStaticMarkup(
      <HpBar current={7} impact="damage" impactVersion={3} max={10} />,
    )

    expect(markup).toContain('role="progressbar"')
    expect(markup).toContain('aria-valuenow="7"')
    expect(markup).toContain('hp-bar__impact--damage')
  })

  it('presents a fully blocked enemy hit as Shield feedback', () => {
    const markup = renderToStaticMarkup(
      <EnemyDamageTransfer
        onComplete={() => undefined}
        path={{
          blocked: 5,
          fromX: 100,
          fromY: 100,
          incoming: 5,
          taken: 0,
          toX: 100,
          toY: 300,
        }}
      />,
    )

    expect(markup).toContain('enemy-damage-transfer--blocked')
    expect(markup).toContain('lucide-shield-check')
    expect(markup).toContain('5 blocked')
  })

  it('shows both block and HP damage on a partial block', () => {
    const markup = renderToStaticMarkup(
      <EnemyDamageTransfer
        onComplete={() => undefined}
        path={{
          blocked: 3,
          fromX: 100,
          fromY: 100,
          incoming: 7,
          taken: 4,
          toX: 100,
          toY: 300,
        }}
      />,
    )

    expect(markup).toContain('enemy-damage-transfer--partial')
    expect(markup).toContain('3 block · 4 damage')
    expect(markup).toContain('enemy-damage-transfer__burst')
  })

  it('keeps six settled player dice in one horizontally scrollable result rack', () => {
    const die = createDieById('attack-die-1')
    if (!die) throw new Error('Expected Worn Blade Die in catalog.')

    const markup = renderToStaticMarkup(
      <div className="roll-grid">
        {die.faces.map((face, faceIndex) => (
          <RollDieTile
            die={die}
            key={face.id}
            result={{
              dieId: die.id,
              dieName: die.name,
              faceId: face.id,
              faceIndex,
              type: face.type,
              value: face.value,
            }}
            rollDuration={0.5}
            stage="settled"
          />
        ))}
      </div>,
    )

    expect(markup.match(/class="roll-die roll-die--attack roll-die--settled/g)).toHaveLength(6)
    expect(markup).toContain('class="roll-grid"')
  })

  it('keeps three enemy dice readable in one intent tray', () => {
    const dice = [
      getEnemyDie('spiked-behemoth-attack'),
      getEnemyDie('spiked-behemoth-shield'),
      getEnemyDie('spiked-behemoth-heal'),
    ]
    const results = dice.map((die) => rollEnemyDie(die, () => 0.5))
    const markup = renderToStaticMarkup(
      <EnemyIntentTray
        activeShield={results[1].value}
        dice={dice}
        results={results}
        rollDuration={0.4}
        rollStagger={0.08}
        stage="landed"
        totals={totalEnemyRolls(results)}
      />,
    )

    expect(markup).toContain('aria-label="3 enemy dice"')
    expect(markup.match(/class="enemy-intent-die /g)).toHaveLength(3)
    expect(markup).toContain('enemy-intent-total--heal')
  })
})
