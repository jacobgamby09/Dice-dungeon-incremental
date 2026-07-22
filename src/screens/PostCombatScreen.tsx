import { motion } from 'framer-motion'
import { Flame, Heart, Shield, Sparkles, Swords } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { EnemySprite } from '../components/EnemySprite'
import { DUNGEONS } from '../game/content/dungeons'
import { getEnemyAttackDie } from '../game/content/enemyDice'
import { ENEMIES } from '../game/content/enemies'
import { useNewGameStore } from '../store/newGameStore'

export function PostCombatScreen() {
  const run = useNewGameStore(useShallow((state) => ({
    lastReward: state.run.lastReward,
    dungeonId: state.run.dungeonId,
    enemy: state.run.enemy,
    encounterIndex: state.run.encounterIndex,
    playerHp: state.run.playerHp,
    playerMaxHp: state.run.playerMaxHp,
    runSouls: state.run.runSouls,
  })))
  const xp = useNewGameStore((state) => state.profile.xp)
  const continueRun = useNewGameStore((state) => state.continueRun)
  const extractRun = useNewGameStore((state) => state.extractRun)

  if (!run.lastReward || !run.dungeonId || !run.enemy) return null
  const dungeon = DUNGEONS[run.dungeonId]
  const nextFloor = dungeon.floors[run.encounterIndex + 1]
  const nextEnemy = nextFloor ? ENEMIES[nextFloor.enemyId] : null
  const nextEnemyAttackDie = nextEnemy ? getEnemyAttackDie(nextEnemy.attackDieId) : null
  const dungeonComplete = run.lastReward.dungeonComplete
  const canContinue = !dungeonComplete && Boolean(nextFloor)

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
          <span>{dungeonComplete ? 'Dungeon conquered' : `Floor ${run.lastReward.floor} cleared`}</span>
          <h1 id="victory-title">{dungeonComplete ? 'Boss Defeated' : 'Victory'}</h1>
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
        <p>{dungeonComplete ? `${dungeon.name} has been conquered.` : `The path to Floor ${run.lastReward.floor + 1} is open.`}</p>
      </section>

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="loot-spoils"
        initial={{ opacity: 0, y: 14 }}
        transition={{ delay: 0.28 }}
      >
        <div className="loot-spoils__heading">
          <span className="eyebrow">Battle spoils</span>
          <strong>{dungeonComplete ? 'Secured' : 'Claimed'}</strong>
        </div>
        <div className="loot-drops">
          <div className="loot-drop loot-drop--xp">
            <span className="loot-drop__icon"><Sparkles aria-hidden="true" size={24} /></span>
            <div><strong>+{run.lastReward.xp}</strong><span>Permanent XP</span></div>
          </div>
          <div className="loot-drop loot-drop--souls">
            <span className="loot-drop__icon"><Flame aria-hidden="true" size={24} /></span>
            <div>
              <strong>+{dungeonComplete ? run.lastReward.bankedSouls : run.lastReward.runSouls}</strong>
              <span>{dungeonComplete ? 'Total Souls banked' : 'Run Souls'}</span>
            </div>
          </div>
        </div>
      </motion.section>

      <section className="expedition-status" aria-label="Expedition status">
        <span className="eyebrow">Expedition status</span>
        <div className="expedition-status__stats">
          <div><Heart aria-hidden="true" size={16} /><strong>{run.playerHp}/{run.playerMaxHp}</strong><span>HP</span></div>
          <div><Flame aria-hidden="true" size={16} /><strong>{dungeonComplete ? run.lastReward.bankedSouls : run.runSouls}</strong><span>{dungeonComplete ? 'Banked' : 'At risk'}</span></div>
          <div><Sparkles aria-hidden="true" size={16} /><strong>{xp}</strong><span>Total XP</span></div>
        </div>
      </section>

      <section className={`decision-paths${canContinue ? '' : ' decision-paths--single'}`}>
        <article className="path-choice path-choice--extract">
          <div className="path-choice__marker"><Heart aria-hidden="true" size={20} /></div>
          <div className="path-choice__copy">
            <span>{dungeonComplete ? 'Spoils secured' : 'Safe passage'}</span>
            <h2>Return to the Hub</h2>
            <p>{dungeonComplete ? `${run.lastReward.bankedSouls} Souls were banked automatically.` : `Bank all ${run.runSouls} Run Souls.`}</p>
          </div>
          <button className="pixel-button pixel-button--extract" onClick={extractRun} type="button">
            {dungeonComplete ? 'Return to Hub' : `Extract · Bank ${run.runSouls}`}
          </button>
        </article>

        {canContinue && nextFloor && nextEnemy && nextEnemyAttackDie && (
          <>
            <div aria-hidden="true" className="path-divider"><span>or</span></div>
            <article className="path-choice path-choice--deeper">
              <div className="path-choice__marker"><Swords aria-hidden="true" size={20} /></div>
              <div className="path-choice__copy">
                <span>{nextFloor.isBoss ? 'Boss floor' : `Floor ${nextFloor.floor} awaits`}</span>
                <h2>{nextEnemy.name}</h2>
                <p>HP {nextEnemy.maxHp} · Attack Die {nextEnemyAttackDie.faces.map((face) => face.value).join('·')}.</p>
                <p>Its exact attack is rolled and revealed before your next round.</p>
                {nextEnemy.startingShield > 0 && <p><Shield aria-hidden="true" size={14} /> Starts with {nextEnemy.startingShield} Shield.</p>}
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
