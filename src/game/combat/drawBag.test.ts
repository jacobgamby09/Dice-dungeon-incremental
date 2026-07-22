import { describe, expect, it } from 'vitest'
import { shuffleDieIds } from './drawBag'

describe('shuffleDieIds', () => {
  it('creates a shuffled copy without losing or duplicating dice', () => {
    const source = ['attack-1', 'shield-1', 'heal-1']
    const shuffled = shuffleDieIds(source, () => 0)

    expect(shuffled).toEqual(['shield-1', 'heal-1', 'attack-1'])
    expect([...shuffled].sort()).toEqual([...source].sort())
    expect(source).toEqual(['attack-1', 'shield-1', 'heal-1'])
  })

  it('keeps a one-die bag intact', () => {
    expect(shuffleDieIds(['attack-1'], () => 0.5)).toEqual(['attack-1'])
  })
})
