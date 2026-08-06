import { Crosshair, Gem, KeyRound, LockKeyhole, Skull, Swords } from 'lucide-react'
import { DUNGEONS } from '../game/content/dungeons'
import { getDungeonLootTable } from '../game/content/dungeonLootTables'
import { DUNGEON_KEYS } from '../game/content/dungeonKeys'
import type { DungeonId } from '../game/types/dungeon'
import { useNewGameStore } from '../store/newGameStore'

export function DungeonSelectScreen() {
  const unlockedDungeonIds = useNewGameStore((state) => state.profile.unlockedDungeonIds)
  const dungeonProgress = useNewGameStore((state) => state.profile.dungeonProgress)
  const imprints = useNewGameStore((state) => state.profile.imprints)
  const imprintHuntDungeonId = useNewGameStore((state) => state.profile.imprintHuntDungeonId)
  const setImprintHuntDungeon = useNewGameStore((state) => state.setImprintHuntDungeon)
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
          const lootTable = getDungeonLootTable(dungeonId)
          const showLootTable = imprints.length > 0 && lootTable.length > 0
          const unlockRequirement = dungeonId === 'iron-depths'
            ? 'Defeat the Demon and claim the Iron Descent Key'
            : dungeonId === 'blighted-depths'
              ? 'Defeat the Spiked Behemoth and claim the Blighted Descent Key'
              : ''
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
                    {unlockRequirement}
                  </span>
                ) : null}
                {showLootTable ? (
                  <section className="dungeon-loot-table" aria-label={`${dungeon.name} loot table`}>
                    <header>
                      <Gem aria-hidden="true" size={15} />
                      <h3>Known Loot</h3>
                    </header>
                    <ul>
                      {lootTable.map((entry) => {
                        const discovered = entry.kind === 'dungeon-key'
                          ? unlockedDungeonIds.includes(DUNGEON_KEYS[entry.id].unlocksDungeonId)
                          : imprints.some((imprint) => imprint.definitionId === entry.id)
                        return (
                          <li
                            className={entry.kind === 'imprint' ? `dungeon-loot-table__entry--${entry.rarity}` : ''}
                            key={`${entry.kind}-${entry.id}`}
                          >
                            <span>{entry.kind === 'dungeon-key' ? 'Key' : entry.rarity}</span>
                            <strong>{discovered ? entry.name : `Undiscovered ${entry.kind === 'dungeon-key' ? 'Key' : 'Imprint'}`}</strong>
                            <small>{entry.source}</small>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                ) : null}
                {isUnlocked && imprints.length > 0 && lootTable.some((entry) => entry.kind === 'imprint') ? (
                  <button
                    aria-pressed={imprintHuntDungeonId === dungeonId}
                    className="dungeon-imprint-hunt"
                    onClick={() => setImprintHuntDungeon(
                      imprintHuntDungeonId === dungeonId ? null : dungeonId,
                    )}
                    type="button"
                  >
                    <Crosshair aria-hidden="true" size={15} />
                    {imprintHuntDungeonId === dungeonId ? 'Imprint Hunt Active' : 'Track Imprints'}
                  </button>
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
