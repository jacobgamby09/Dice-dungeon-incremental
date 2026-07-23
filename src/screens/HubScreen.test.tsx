import { beforeEach, describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { useNewGameStore } from '../store/newGameStore'
import { HubScreen } from './HubScreen'

describe('HubScreen developer reset', () => {
  beforeEach(() => {
    useNewGameStore.getState().resetProgress()
  })

  it('shows the dev reset trigger without exposing the destructive confirmation', () => {
    const markup = renderToStaticMarkup(<HubScreen />)

    expect(markup).toContain('Developer tools')
    expect(markup).toContain('DEV · Reset game')
    expect(markup).not.toContain('Reset everything')
  })
})
