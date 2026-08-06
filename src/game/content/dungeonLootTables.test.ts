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

  it('publishes the Dungeon 2 key and all three Dungeon 3 Imprints', () => {
    expect(getDungeonLootTable('iron-depths').map((entry) => entry.id))
      .toEqual(['blighted-descent-key'])
    expect(getDungeonLootTable('blighted-depths').map((entry) => entry.id))
      .toEqual(['venom-edge', 'purging-aegis', 'plague-bloom'])
  })
})
