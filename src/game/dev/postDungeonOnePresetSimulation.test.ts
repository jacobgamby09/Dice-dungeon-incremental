import { describe, expect, it } from 'vitest'
import {
  DEFAULT_JOURNEY_STRATEGY,
  simulateProgressionJourney,
} from '../balance/simulateProgressionJourney'
import { getDiceCapacity, getPlayerMaxHp } from '../progression/talents'
import { POST_DUNGEON_ONE_DEV_PRESET } from './postDungeonOnePreset'

describe('post-Dungeon-1 simulated profile provenance', () => {
  it('keeps the selected 250-run median representative reproducible', () => {
    const result = simulateProgressionJourney(
      DEFAULT_JOURNEY_STRATEGY,
      60,
      POST_DUNGEON_ONE_DEV_PRESET.sourceSeed,
    )
    const profile = result.dungeonOneClearProfile!

    expect(result.milestones.dungeonOneClearRun).toBe(POST_DUNGEON_ONE_DEV_PRESET.clearRun)
    expect(profile.diceCollection.map((die) => ({
      id: die.id,
      values: die.faces.map((face) => face.value),
    }))).toEqual([
      { id: 'attack-die-1', values: [6, 5, 9, 7, 8, 9] },
      { id: 'attack-die-2', values: [3, 3, 6, 4, 7, 3] },
      { id: 'shield-die-1', values: [4, 1, 5, 2, 5, 5] },
      { id: 'heal-die-1', values: [4, 1, 1, 2, 6, 3] },
      { id: 'attack-die-executioner', values: [5, 2, 3, 3, 3, 3] },
    ])
    expect(getDiceCapacity(profile.talentRanks)).toBe(POST_DUNGEON_ONE_DEV_PRESET.diceSlots)
    expect(getPlayerMaxHp(profile.talentRanks)).toBe(POST_DUNGEON_ONE_DEV_PRESET.maxHp)
    expect(Object.keys(profile.charmRanks)).toHaveLength(POST_DUNGEON_ONE_DEV_PRESET.charmCount)
    expect(profile.imprints).toHaveLength(POST_DUNGEON_ONE_DEV_PRESET.imprintCount)
  })
})
