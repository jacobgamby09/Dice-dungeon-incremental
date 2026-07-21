import { Flame, Heart, Sparkles, Swords } from 'lucide-react'
import { motion } from 'framer-motion'
import { DUNGEONS } from '../game/content/dungeons'
import { useNewGameStore } from '../store/newGameStore'

export function PostCombatScreen() {
  const run = useNewGameStore((state) => state.run)
  const profile = useNewGameStore((state) => state.profile)
  const continueRun = useNewGameStore((state) => state.continueRun)
  const extractRun = useNewGameStore((state) => state.extractRun)

  if (!run.lastReward || !run.dungeonId) return null
  const dungeon = DUNGEONS[run.dungeonId]
  const nextEnemyId = dungeon.encounters[run.encounterIndex + 1]

  return (
    <main className="game-shell outcome-screen">
      <motion.header
        className="victory-header"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="eyebrow">Enemy defeated</span>
        <h1>Victory</h1>
        <p>{run.lastReward.enemyName} fell before it could stop you.</p>
      </motion.header>

      <section className="reward-grid">
        <div className="reward-card reward-card--xp">
          <Sparkles aria-hidden="true" size={22} />
          <strong>+{run.lastReward.xp}</strong>
          <span>Permanent XP</span>
        </div>
        <div className="reward-card reward-card--souls">
          <Flame aria-hidden="true" size={22} />
          <strong>+{run.lastReward.runSouls}</strong>
          <span>Run Souls</span>
        </div>
      </section>

      <section className="risk-panel">
        <div><Heart aria-hidden="true" size={17} /><span>Current HP</span><strong>{run.playerHp}/{run.playerMaxHp}</strong></div>
        <div><Flame aria-hidden="true" size={17} /><span>Souls at risk</span><strong>{run.runSouls}</strong></div>
        <div><Sparkles aria-hidden="true" size={17} /><span>Total XP</span><strong>{profile.xp}</strong></div>
      </section>

      <section className="decision-panel">
        <article>
          <span className="eyebrow">Safe choice</span>
          <h2>Extract</h2>
          <p>Bank all {run.runSouls} Run Souls and return to the Hub.</p>
          <button className="pixel-button pixel-button--extract" onClick={extractRun} type="button">
            Extract · Bank {run.runSouls}
          </button>
        </article>

        {!run.lastReward.dungeonComplete && nextEnemyId && (
          <article>
            <span className="eyebrow">Risk everything</span>
            <h2>Continue</h2>
            <p>Your current HP carries forward. The next enemy offers a larger reward.</p>
            <button className="pixel-button pixel-button--danger" onClick={continueRun} type="button">
              <Swords aria-hidden="true" size={16} /> Continue Deeper
            </button>
          </article>
        )}
      </section>
    </main>
  )
}

