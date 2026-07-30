import { describe, expect, it } from 'vitest'
import {
  AUTO_COMBAT_DRAW_PAUSE_MS,
  AUTO_COMBAT_RESOLVE_PAUSE_MS,
  AUTO_COMBAT_VICTORY_PAUSE_MS,
} from './autoCombat'

describe('live Auto Combat timing', () => {
  it('keeps each live pause positive and orders the victory pause last', () => {
    expect(AUTO_COMBAT_DRAW_PAUSE_MS).toBeGreaterThan(0)
    expect(AUTO_COMBAT_RESOLVE_PAUSE_MS).toBeGreaterThan(AUTO_COMBAT_DRAW_PAUSE_MS)
    expect(AUTO_COMBAT_VICTORY_PAUSE_MS).toBeGreaterThan(AUTO_COMBAT_RESOLVE_PAUSE_MS)
  })
})
