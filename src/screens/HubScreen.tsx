import { Flame, Sparkles } from 'lucide-react'
import { DieSummary } from '../components/newgame/DieSummary'
import { useNewGameStore } from '../store/newGameStore'

export function HubScreen() {
  const profile = useNewGameStore((state) => state.profile)
  const openDungeonSelect = useNewGameStore((state) => state.openDungeonSelect)
  const openWorkshop = useNewGameStore((state) => state.openWorkshop)

  return (
    <main className="game-shell hub-screen">
      <header className="hero-header">
        <span className="eyebrow">Permanent progression extraction game</span>
        <h1>Dice Dungeon</h1>
        <p>Build your dice. Risk your Souls. Extract before the dungeon takes them.</p>
      </header>

      <section className="currency-grid" aria-label="Permanent currencies">
        <div className="currency-card currency-card--xp">
          <Sparkles aria-hidden="true" size={18} />
          <strong>{profile.xp}</strong>
          <span>Permanent XP</span>
        </div>
        <div className="currency-card currency-card--souls">
          <Flame aria-hidden="true" size={18} />
          <strong>{profile.bankedSouls}</strong>
          <span>Banked Souls</span>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Current loadout</span>
            <h2>Your permanent dice</h2>
          </div>
          <span className="slot-count">{profile.equippedDieIds.length} equipped</span>
        </div>
        <div className="dice-list">
          {profile.equippedDieIds.map((dieId) => {
            const die = profile.diceCollection.find((candidate) => candidate.id === dieId)
            return die ? <DieSummary die={die} key={die.id} /> : null
          })}
        </div>
      </section>

      <div className="footer-actions">
        <button className="pixel-button pixel-button--secondary" onClick={openWorkshop} type="button">
          Upgrade Dice
        </button>
        <button className="pixel-button pixel-button--primary" onClick={openDungeonSelect} type="button">
          Enter Dungeon
        </button>
      </div>
    </main>
  )
}
