import { KeyRound, LockKeyhole, Skull, Swords } from 'lucide-react'
import { DUNGEONS } from '../game/content/dungeons'
import type { DungeonId } from '../game/types/dungeon'
import { useNewGameStore } from '../store/newGameStore'

export function DungeonSelectScreen() {
  const unlockedDungeonIds = useNewGameStore((state) => state.profile.unlockedDungeonIds)
  const dungeonProgress = useNewGameStore((state) => state.profile.dungeonProgress)
  const startRun = useNewGameStore((state) => state.startRun)
  const goToHub = useNewGameStore((state) => state.goToHub)

  return (
    <main className="game-shell">
      <header className="screen-header">
        <span className="eyebrow">Choose your risk</span>
        <h1>Dungeons</h1>
      </header>

      <section className="dungeon-list">
        {(Object.keys(DUNGEONS) as DungeonId[]).map((dungeonId, dungeonIndex) => {
          const dungeon = DUNGEONS[dungeonId]
          const isUnlocked = unlockedDungeonIds.includes(dungeonId)
          return (
            <article
              aria-label={`${dungeon.name}, ${isUnlocked ? 'unlocked' : 'locked'}`}
              className={`dungeon-card${isUnlocked ? '' : ' dungeon-card--locked'}`}
              key={dungeon.id}
            >
              <div className="dungeon-card__icon">
                {isUnlocked
                  ? <Skull aria-hidden="true" size={30} />
                  : <LockKeyhole aria-hidden="true" size={30} />}
              </div>
              <div>
                <span className="eyebrow">Dungeon {dungeonIndex + 1}</span>
                <h2>{dungeon.name}</h2>
                <p>{dungeon.description}</p>
                <span className="encounter-count"><Swords aria-hidden="true" size={14} /> {dungeon.floors.length} floors</span>
                <span className="encounter-count">Best: {dungeonProgress[dungeon.id].highestFloorCleared}/{dungeon.floors.length}</span>
                {!isUnlocked ? (
                  <span className="dungeon-card__requirement">
                    <KeyRound aria-hidden="true" size={16} />
                    Defeat the Demon and claim the Iron Descent Key
                  </span>
                ) : null}
              </div>
              <button
                className="pixel-button pixel-button--danger"
                disabled={!isUnlocked}
                onClick={() => startRun(dungeon.id)}
                type="button"
              >
                {isUnlocked ? 'Descend' : 'Locked'}
              </button>
            </article>
          )
        })}
      </section>

      <button className="pixel-button pixel-button--ghost" onClick={goToHub} type="button">Back to Hub</button>
    </main>
  )
}
