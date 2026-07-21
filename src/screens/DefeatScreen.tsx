import { Flame, Sparkles } from 'lucide-react'
import { useNewGameStore } from '../store/newGameStore'

export function DefeatScreen() {
  const xp = useNewGameStore((state) => state.profile.xp)
  const lastLostRunSouls = useNewGameStore((state) => state.lastLostRunSouls)
  const returnToHub = useNewGameStore((state) => state.returnToHubAfterDefeat)

  return (
    <main className="game-shell outcome-screen outcome-screen--defeat">
      <header className="defeat-header">
        <span className="eyebrow">The dungeon claims this run</span>
        <h1>Defeat</h1>
        <p>Your permanent progression survived.</p>
      </header>

      <section className="risk-panel">
        <div className="loss-row"><Flame aria-hidden="true" size={18} /><span>Run Souls lost</span><strong>-{lastLostRunSouls}</strong></div>
        <div className="safe-row"><Sparkles aria-hidden="true" size={18} /><span>Permanent XP kept</span><strong>{xp}</strong></div>
      </section>

      <button className="pixel-button pixel-button--primary" onClick={returnToHub} type="button">
        Return to Hub
      </button>
    </main>
  )
}

