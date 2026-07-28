import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { RunMenu } from './RunMenu'

describe('RunMenu', () => {
  it('opens as a paused, non-destructive run menu', () => {
    const markup = renderToStaticMarkup(
      <RunMenu onClose={() => undefined} onLeave={() => undefined} />,
    )

    expect(markup).toContain('Run paused')
    expect(markup).toContain('Resume Run')
    expect(markup).toContain('Leave Dungeon')
    expect(markup).not.toContain('Confirm Leave')
  })
})
