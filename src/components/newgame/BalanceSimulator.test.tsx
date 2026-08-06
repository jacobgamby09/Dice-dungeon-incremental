import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BalanceSimulator } from './BalanceSimulator'

describe('BalanceSimulator', () => {
  it('renders a non-destructive cohort report with accessible controls', () => {
    const markup = renderToStaticMarkup(<BalanceSimulator onClose={() => undefined} />)

    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('Balance Lab')
    expect(markup).toContain('Your save is never changed.')
    expect(markup).toContain('Milestone distribution')
    expect(markup).toContain('Progression curve')
    expect(markup).toContain('3 journeys')
    expect(markup).toContain('Run simulation')
    expect(markup).toContain('Progression curve table')
  })
})
