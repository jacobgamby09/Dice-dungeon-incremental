import { Castle, Dices, DoorOpen, Hammer } from 'lucide-react'
import { DieSummary } from '../components/newgame/DieSummary'
import { PermanentResourceHud } from '../components/newgame/PermanentResourceHud'
import { useNewGameStore } from '../store/newGameStore'

export function HubScreen() {
  const profile = useNewGameStore((state) => state.profile)
  const openDungeonSelect = useNewGameStore((state) => state.openDungeonSelect)
  const openWorkshop = useNewGameStore((state) => state.openWorkshop)

  return (
    <main className="game-shell hub-screen">
      <section className="hub-gate" aria-labelledby="hub-title">
        <div aria-hidden="true" className="hub-gate__glow" />
        <span aria-hidden="true" className="hub-soul hub-soul--one" />
        <span aria-hidden="true" className="hub-soul hub-soul--two" />
        <span aria-hidden="true" className="hub-soul hub-soul--three" />
        <div aria-hidden="true" className="hub-gate__door"><DoorOpen size={58} /></div>
        <header className="hub-sign">
          <span>Extraction runner</span>
          <h1 id="hub-title">Dice Dungeon</h1>
        </header>
        <p>Forge permanent dice. Brave the depths. Extract before the dungeon takes your Souls.</p>
      </section>

      <PermanentResourceHud bankedSouls={profile.bankedSouls} xp={profile.xp} />

      <section className="loadout-vault" aria-labelledby="loadout-title">
        <header className="loadout-vault__heading">
          <div>
            <span className="eyebrow">Adventurer's rack</span>
            <h2 id="loadout-title">Equipped Dice</h2>
          </div>
          <span className="loadout-count"><Dices aria-hidden="true" size={14} /> {profile.equippedDieIds.length}</span>
        </header>
        <div className="dice-rack">
          {profile.equippedDieIds.map((dieId) => {
            const die = profile.diceCollection.find((candidate) => candidate.id === dieId)
            return die ? <DieSummary die={die} key={die.id} /> : null
          })}
        </div>
      </section>

      <footer className="hub-actions">
        <button className="hub-action hub-action--workshop" onClick={openWorkshop} type="button">
          <span className="hub-action__icon"><Hammer aria-hidden="true" size={22} /></span>
          <span><small>Improve permanent faces</small><strong>Enter Workshop</strong></span>
        </button>
        <button className="hub-action hub-action--dungeon" onClick={openDungeonSelect} type="button">
          <span className="hub-action__icon"><Castle aria-hidden="true" size={24} /></span>
          <span><small>Begin an extraction run</small><strong>Enter Dungeon</strong></span>
          <DoorOpen aria-hidden="true" className="hub-action__door" size={20} />
        </button>
      </footer>
    </main>
  )
}
