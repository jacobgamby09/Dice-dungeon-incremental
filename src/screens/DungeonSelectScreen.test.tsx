import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it } from 'vitest'
import { useNewGameStore } from '../store/newGameStore'
import { DungeonSelectScreen } from './DungeonSelectScreen'

describe('DungeonSelectScreen', () => {
  beforeEach(() => {
    useNewGameStore.getState().resetProgress()
  })

  it('shows Dungeon 2 from a fresh save as a locked Iron Key goal', () => {
    const markup = renderToStaticMarkup(<DungeonSelectScreen />)

    expect(markup).toContain('The First Descent')
    expect(markup).toContain('The Iron Descent')
    expect(markup).toContain('Defeat the Demon and claim the Iron Descent Key')
    expect(markup).toContain('The Iron Descent, locked')
    expect(markup).toContain('disabled=""')
    expect(markup).not.toContain('Known Loot')
  })

})
