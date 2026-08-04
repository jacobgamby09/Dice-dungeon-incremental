import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createDieById } from '../../game/content/dice'
import { DieDetailsPanel } from './DieDetailsPanel'

describe('die details panel', () => {
  it.each([
    ['attack-die-executioner', 'Executioner Die', 'Execute', '50% HP or less'],
    ['shield-die-tower', 'Tower Die', 'Fortify', 'next Shield face'],
    ['heal-die-bloodwell', 'Bloodwell Die', 'Drain', 'add 2 Attack'],
  ])('explains the signature identity of %s without retired evolutions', (id, name, signature, effect) => {
    const markup = renderToStaticMarkup(
      <DieDetailsPanel die={createDieById(id)!} onClose={() => undefined} />,
    )
    expect(markup).toContain(name)
    expect(markup).toContain(signature)
    expect(markup).toContain(effect)
    expect(markup).not.toContain('Family Evolutions')
    expect(markup).not.toContain('Momentum')
    expect(markup).not.toContain('Rend')
  })
})
