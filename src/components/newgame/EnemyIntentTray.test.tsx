import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { rollEnemyDie, totalEnemyRolls } from '../../game/combat/rollEnemyDie'
import { getEnemyDie } from '../../game/content/enemyDice'
import { EnemyIntentTray } from './EnemyIntentTray'

describe('EnemyIntentTray', () => {
  it('renders only the intent types supplied by one Dungeon 1 die', () => {
    const dice = [getEnemyDie('slime-l1-attack')]
    const results = dice.map((die) => rollEnemyDie(die, () => 0))
    const markup = renderToStaticMarkup(
      <EnemyIntentTray
        activeShield={0}
        dice={dice}
        results={results}
        rollDuration={0.48}
        rollStagger={0.09}
        stage="landed"
        totals={totalEnemyRolls(results)}
      />,
    )

    expect(markup).toContain('1 enemy die')
    expect(markup).toContain('Attack')
    expect(markup).not.toContain('Shield</small>')
    expect(markup).not.toContain('Heal</small>')
  })

  it('keeps all three boss faces and dynamic totals readable after landing', () => {
    const dice = [
      getEnemyDie('spiked-behemoth-attack'),
      getEnemyDie('spiked-behemoth-shield'),
      getEnemyDie('spiked-behemoth-heal'),
    ]
    const results = dice.map((die) => rollEnemyDie(die, () => 0.999))
    const markup = renderToStaticMarkup(
      <EnemyIntentTray
        activeShield={6}
        dice={dice}
        results={results}
        rollDuration={0.48}
        rollStagger={0.09}
        stage="landed"
        totals={totalEnemyRolls(results)}
      />,
    )

    expect(markup).toContain('3 enemy dice')
    expect(markup).toContain('Spiked Behemoth Attack Die rolled 11 Attack')
    expect(markup).toContain('Spiked Behemoth Shield Die rolled 6 Shield')
    expect(markup).toContain('Spiked Behemoth Heal Die rolled 3 Heal')
    expect(markup).toContain('data-enemy-intent-type="attack"')
    expect(markup).toContain('data-enemy-intent-type="shield"')
    expect(markup).toContain('data-enemy-intent-type="heal"')
  })
})
