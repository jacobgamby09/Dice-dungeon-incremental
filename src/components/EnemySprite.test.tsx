import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { EnemySprite } from './EnemySprite'

describe('EnemySprite', () => {
  it.each([
    ['SlimeCrawler', '/sprites/enemies/slime-crawler/SlimeCrawler-Idle.png'],
    ['MarrowBat', '/sprites/enemies/marrow-bat/MarrowBat-Idle.png'],
    ['BloodOrc', '/sprites/enemies/blood-orc/BloodOrc-Idle.png'],
  ])('maps the compact content name %s to its own sheet', (enemyName, expectedSheet) => {
    const markup = renderToStaticMarkup(<EnemySprite enemyName={enemyName} hp={1} />)

    expect(markup).toContain(expectedSheet)
  })
})
