import { motion } from 'framer-motion'
import { Flame, Heart, Sparkles, Swords } from 'lucide-react'
import { EnemySprite } from '../components/EnemySprite'
import { DUNGEONS } from '../game/content/dungeons'
import { useNewGameStore } from '../store/newGameStore'

export function PostCombatScreen() {
  const run = useNewGameStore((state) => state.run)
  const profile = useNewGameStore((state) => state.profile)
  const continueRun = useNewGameStore((state) => state.continueRun)
  const extractRun = useNewGameStore((state) => state.extractRun)

  if (!run.lastReward || !run.dungeonId || !run.enemy) return null
  const dungeon = DUNGEONS[run.dungeonId]
  const nextEnemyId = dungeon.encounters[run.encounterIndex + 1]
  const canContinue = !run.lastReward.dungeonComplete && Boolean(nextEnemyId)

  return (
    <main className="game-shell outcome-screen victory-screen">
      <section className="victory-stage" aria-labelledby="victory-title">
        <div aria-hidden="true" className="victory-stage__rays" />
        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="victory-banner"
          initial={{ opacity: 0, scale: 0.82, y: -18 }}
          transition={{ duration: 0.38, ease: 'backOut' }}
        >
          <span>Encounter cleared</span>
          <h1 id="victory-title">Victory</h1>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="victory-stage__enemy"
          initial={{ opacity: 0, y: 8 }}
          transition={{ delay: 0.18, duration: 0.3 }}
        >
          <EnemySprite enemyName={run.enemy.spriteName} hp={0} size={5} />
          <strong>{run.lastReward.enemyName} vanquished</strong>
        </motion.div>
        <div aria-hidden="true" className="victory-stage__platform" />
        <p>The path deeper into {dungeon.name} is open.</p>
      </section>

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="loot-spoils"
        initial={{ opacity: 0, y: 14 }}
        transition={{ delay: 0.28 }}
      >
        <div className="loot-spoils__heading">
          <span className="eyebrow">Battle spoils</span>
          <strong>Claimed</strong>
        </div>
        <div className="loot-drops">
          <div className="loot-drop loot-drop--xp">
            <span className="loot-drop__icon"><Sparkles aria-hidden="true" size={24} /></span>
            <div><strong>+{run.lastReward.xp}</strong><span>Permanent XP</span></div>
          </div>
          <div className="loot-drop loot-drop--souls">
            <span className="loot-drop__icon"><Flame aria-hidden="true" size={24} /></span>
            <div><strong>+{run.lastReward.runSouls}</strong><span>Run Souls</span></div>
          </div>
        </div>
      </motion.section>

      <section className="expedition-status" aria-label="Expedition status">
        <span className="eyebrow">Expedition status</span>
        <div className="expedition-status__stats">
          <div><Heart aria-hidden="true" size={16} /><strong>{run.playerHp}/{run.playerMaxHp}</strong><span>HP</span></div>
          <div><Flame aria-hidden="true" size={16} /><strong>{run.runSouls}</strong><span>At risk</span></div>
          <div><Sparkles aria-hidden="true" size={16} /><strong>{profile.xp}</strong><span>Total XP</span></div>
        </div>
      </section>

      <section className={`decision-paths${canContinue ? '' : ' decision-paths--single'}`}>
        <article className="path-choice path-choice--extract">
          <div className="path-choice__marker"><Heart aria-hidden="true" size={20} /></div>
          <div className="path-choice__copy">
            <span>Safe passage</span>
            <h2>Return to the Hub</h2>
            <p>Bank all {run.runSouls} Run Souls.</p>
          </div>
          <button className="pixel-button pixel-button--extract" onClick={extractRun} type="button">
            Extract · Bank {run.runSouls}
          </button>
        </article>

        {canContinue && (
          <>
            <div aria-hidden="true" className="path-divider"><span>or</span></div>
            <article className="path-choice path-choice--deeper">
              <div className="path-choice__marker"><Swords aria-hidden="true" size={20} /></div>
              <div className="path-choice__copy">
                <span>Depths await</span>
                <h2>Continue the Run</h2>
                <p>Keep your current HP. Risk every soul.</p>
              </div>
              <button className="pixel-button pixel-button--danger" onClick={continueRun} type="button">
                <Swords aria-hidden="true" size={16} /> Descend Deeper
              </button>
            </article>
          </>
        )}
      </section>
    </main>
  )
}
