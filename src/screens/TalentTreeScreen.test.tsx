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

  it('starts on a radial blank canvas with Inner Spark and nameless silhouettes', () => {
    const markup = renderTree()

    expect(markup).toContain('data-testid="talent-tree-canvas"')
    expect(markup).toContain('Zoom out Talent Tree')
    expect(markup).toContain('100% zoom')
    expect(markup).toContain('Zoom in Talent Tree')
    expect(markup).toContain('Inner Spark')
    expect(markup).toContain('data-talent-silhouette="true"')
    expect(markup).not.toContain('Twin Arsenal')
    expect(markup).not.toContain('Shieldcraft')
    expect(markup).not.toContain('talent-canvas-sector')
    expect(markup).not.toContain('Permanent progression')
    expect(markup).not.toContain('Permanent capability summary')
  })

})
