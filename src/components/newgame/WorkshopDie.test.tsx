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
    expect(markup.match(/workshop-power-die__side/g)).toHaveLength(6)
    expect(markup).toContain('roll-die__cube workshop-power-die__cube')
  })

  it('keeps the shared combat cube visible after announcing a landed jackpot', () => {
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
    expect(markup).toContain('workshop-power-die__jackpot-glow')
    expect(markup).toContain('roll-die__cube workshop-power-die__cube')
    expect(markup).not.toContain('workshop-power-die__impact')
  })

  it('does not add the separate jackpot glow to a normal landed roll', () => {
    const faces = createWorkshopDieFaces()
    const markup = renderToStaticMarkup(
      <WorkshopDie
        appliedAmount={1}
        faces={faces}
        rolledFaceId={faces[0].id}
        stage="landed"
      />,
    )

    expect(markup).toContain('Workshop Die rolled plus 1')
    expect(markup).not.toContain('workshop-power-die__jackpot-glow')
    expect(markup).toContain('roll-die__cube workshop-power-die__cube')
  })
})
