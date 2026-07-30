import { beforeEach, describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { useNewGameStore } from '../store/newGameStore'
import { HubScreen } from './HubScreen'

describe('HubScreen developer tools', () => {
  beforeEach(() => {
    useNewGameStore.getState().resetProgress()
  })

  it('shows all dev triggers without exposing destructive confirmations', () => {
    const markup = renderToStaticMarkup(<HubScreen />)

    expect(markup).toContain('Developer tools')
    expect(markup).toContain('DEV · Fresh QoL test · 20 XP')
    expect(markup).toContain('DEV · Load Dungeon 2 profile')
    expect(markup).toContain('DEV · Reset game')
    expect(markup).toContain('Permanent Dice Incremental')
    expect(markup).not.toContain('Extraction runner')
    expect(markup).not.toContain('Load test profile')
    expect(markup).not.toContain('Reset everything')
  })
})
