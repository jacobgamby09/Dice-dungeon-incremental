import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createWorkshopDieFaces } from '../../game/content/workshopDie'
import { WorkshopDie } from './WorkshopDie'

describe('Workshop Die presentation', () => {
  it('renders the complete permanent distribution', () => {
    const markup = renderToStaticMarkup(
      <WorkshopDie
        appliedAmount={null}
        faces={createWorkshopDieFaces()}
        rolledFaceId={null}
        stage="idle"
      />,
    )

    expect(markup).toContain('Workshop Die faces 1, 1, 1, 1, 1, 2')
    expect(markup.match(/workshop-power-die__side /g)).toHaveLength(6)
  })

  it('announces a landed jackpot without relying on color', () => {
    const faces = createWorkshopDieFaces()
    const markup = renderToStaticMarkup(
      <WorkshopDie
        appliedAmount={2}
        faces={faces}
        rolledFaceId={faces[5].id}
        stage="landed"
      />,
    )

    expect(markup).toContain('Workshop Die rolled plus 2')
    expect(markup).toContain('workshop-power-die--jackpot')
    expect(markup).toContain('+2')
  })
})
