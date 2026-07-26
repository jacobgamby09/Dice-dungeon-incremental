import { Flame, Sparkles } from 'lucide-react'
import { useNewGameStore } from '../store/newGameStore'

export function DefeatScreen() {
  const xp = useNewGameStore((state) => state.profile.xp)
  const souls = useNewGameStore((state) => state.profile.bankedSouls)
  const returnToHub = useNewGameStore((state) => state.returnToHubAfterDefeat)

  return (
    <main className="game-shell outcome-screen outcome-screen--defeat">
      <header className="defeat-header">
        <span className="eyebrow">The dungeon claims this run</span>
        <h1>Defeat</h1>
        <p>Your depth was lost. Every reward was kept.</p>
      </header>

      <section aria-label="Permanent rewards kept" className="kept-rewards">
        <div className="kept-rewards__souls"><Flame aria-hidden="true" size={18} /><span>Souls kept</span><strong>{souls}</strong></div>
        <div className="kept-rewards__xp"><Sparkles aria-hidden="true" size={18} /><span>XP kept</span><strong>{xp}</strong></div>
      </section>

      <button className="pixel-button pixel-button--primary" onClick={returnToHub} type="button">
        Return to Hub
      </button>
    </main>
  )
}
