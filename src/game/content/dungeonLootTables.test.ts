import { describe, expect, it } from 'vitest'
import { getDungeonLootTable } from './dungeonLootTables'

describe('Dungeon loot tables', () => {
  it('publishes the Dungeon 1 key and all three Imprint discoveries', () => {
    const table = getDungeonLootTable('prototype-depths')

    expect(table).toHaveLength(4)
    expect(table.map((entry) => entry.id)).toEqual([
      'iron-descent-key',
      'lead-edge',
      'relay-strike',
      'crescendo',
    ])
    expect(table.find((entry) => entry.id === 'lead-edge')?.source)
      .toContain('first boss clear guarantees it')
  })
})
