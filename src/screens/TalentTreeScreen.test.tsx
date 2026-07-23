import { beforeEach, describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { useNewGameStore } from '../store/newGameStore'
import { TalentTreeScreen } from './TalentTreeScreen'

function renderTree(): string {
  return renderToStaticMarkup(<TalentTreeScreen />)
}

describe('TalentTreeScreen progressive presentation', () => {
  beforeEach(() => {
    useNewGameStore.getState().resetProgress()
  })

  it('starts with Battle-Hardened and a nameless silhouette', () => {
    const markup = renderTree()

    expect(markup).toContain('Battle-Hardened')
    expect(markup).toContain('Unknown')
    expect(markup).not.toContain('Twin Arsenal')
    expect(markup).not.toContain('Shieldcraft')
  })
})
