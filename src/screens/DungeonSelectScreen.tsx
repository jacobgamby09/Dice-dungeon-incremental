import { Skull, Swords } from 'lucide-react'
import { DUNGEONS } from '../game/content/dungeons'
import type { DungeonId } from '../game/types/dungeon'
import { useNewGameStore } from '../store/newGameStore'

export function DungeonSelectScreen() {
  const unlockedDungeonIds = useNewGameStore((state) => state.profile.unlockedDungeonIds)
  const startRun = useNewGameStore((state) => state.startRun)
  const goToHub = useNewGameStore((state) => state.goToHub)

  return (
    <main className="game-shell">
      <header className="screen-header">
        <span className="eyebrow">Choose your risk</span>
        <h1>Dungeons</h1>
      </header>

      <section className="dungeon-list">
        {unlockedDungeonIds.map((dungeonId: DungeonId) => {
          const dungeon = DUNGEONS[dungeonId]
          return (
            <article className="dungeon-card" key={dungeon.id}>
              <div className="dungeon-card__icon"><Skull aria-hidden="true" size={30} /></div>
              <div>
                <span className="eyebrow">Prototype dungeon</span>
                <h2>{dungeon.name}</h2>
                <p>{dungeon.description}</p>
                <span className="encounter-count"><Swords aria-hidden="true" size={14} /> {dungeon.encounters.length} encounters</span>
              </div>
              <button className="pixel-button pixel-button--danger" onClick={() => startRun(dungeon.id)} type="button">
                Descend
              </button>
            </article>
          )
        })}
      </section>

      <button className="pixel-button pixel-button--ghost" onClick={goToHub} type="button">Back to Hub</button>
    </main>
  )
}

