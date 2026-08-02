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
    expect(markup).toContain('DEV · Balance Lab')
    expect(markup).toContain('DEV · Dungeon 2 + Fatecraft')
    expect(markup).toContain('DEV · Fresh QoL test · 20 XP')
    expect(markup).toContain('DEV · Load Dungeon 2 profile')
    expect(markup).toContain('DEV · Reset game')
    expect(markup).toContain('Permanent Dice Incremental')
    expect(markup).toContain('role="region"')
    expect(markup).toContain('tabindex="0"')
    expect(markup).toContain('dice-rack dice-rack--single')
    expect(markup).toContain('System Dice')
    expect(markup).toContain('Reward Die')
    expect(markup).toContain('Rolls after every defeated enemy')
    expect(markup).toContain('Swipe, drag, scroll, or use arrow keys to browse.')
    expect(markup).not.toContain('Extraction runner')
    expect(markup).not.toContain('Load test profile')
    expect(markup).not.toContain('Reset everything')
  })
})
