import { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Bot, DoorOpen, Heart, Pause, Swords, Trophy } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { EnemySprite } from '../components/EnemySprite'
import { OutcomeRewards } from '../components/newgame/OutcomeRewards'
import { AUTO_COMBAT_VICTORY_PAUSE_MS } from '../game/automation/autoCombat'
import { DUNGEONS } from '../game/content/dungeons'
import { useNewGameStore } from '../store/newGameStore'

const HERO_INITIAL = { opacity: 0, scale: 0.84, y: -18 }
const HERO_ANIMATE = { opacity: 1, scale: 1, y: 0 }
const HERO_TRANSITION = { duration: 0.38, ease: 'backOut' as const }
const ENEMY_INITIAL = { opacity: 0, y: 8 }
const ENEMY_ANIMATE = { opacity: 1, y: 0 }
const ENEMY_TRANSITION = { delay: 0.16, duration: 0.28 }
const CTA_INITIAL = { opacity: 0, y: 10 }
const CTA_ANIMATE = { opacity: 1, y: 0 }
const CTA_TRANSITION = { delay: 0.52, duration: 0.24 }
const REDUCED_MOTION_TRANSITION = { duration: 0 }

export function PostCombatScreen() {
  const run = useNewGameStore(useShallow((state) => ({
    dungeonId: state.run.dungeonId,
    enemy: state.run.enemy,
    lastReward: state.run.lastReward,
    playerHp: state.run.playerHp,
    playerMaxHp: state.run.playerMaxHp,
    runStats: state.run.runStats,
  })))
  const profile = useNewGameStore(useShallow((state) => ({
    automationPaused: state.awayRecap !== null,
    bankedSouls: state.profile.bankedSouls,
    autoCombat: state.profile.settings.autoCombat,
    xp: state.profile.xp,
  })))
  const advanceToNextFloor = useNewGameStore((state) => state.advanceToNextFloor)
  const returnToHubAfterVictory = useNewGameStore((state) => state.returnToHubAfterVictory)
  const setAutoCombat = useNewGameStore((state) => state.setAutoCombat)
  const checkpointAutoCombat = useNewGameStore((state) => state.checkpointAutoCombat)
  const prefersReducedMotion = useReducedMotion()
  const dungeonComplete = Boolean(run.lastReward?.dungeonComplete)
  const rewardFloor = run.lastReward?.floor ?? 0

  useEffect(() => {
    if (
      !profile.autoCombat
      || profile.automationPaused
      || dungeonComplete
      || rewardFloor <= 0
    ) return
    const timer = window.setTimeout(() => {
      advanceToNextFloor()
      checkpointAutoCombat()
    }, AUTO_COMBAT_VICTORY_PAUSE_MS)
    return () => window.clearTimeout(timer)
  }, [
    advanceToNextFloor,
    checkpointAutoCombat,
    dungeonComplete,
    profile.autoCombat,
    profile.automationPaused,
    rewardFloor,
  ])

  if (!run.lastReward || !run.dungeonId || !run.enemy) return null

  const dungeon = DUNGEONS[run.dungeonId]
  const rewardXp = dungeonComplete ? run.runStats.xpEarned : run.lastReward.xp
  const rewardSouls = dungeonComplete ? run.runStats.soulsEarned : run.lastReward.souls
  const nextFloorNumber = run.lastReward.floor + 1
  const buttonTransition = prefersReducedMotion
    ? REDUCED_MOTION_TRANSITION
    : CTA_TRANSITION

  return (
    <main
      className={`game-shell outcome-screen victory-screen${dungeonComplete ? ' victory-screen--boss' : ''}`}
    >
      <section className="outcome-stage outcome-stage--victory" aria-labelledby="victory-title">
        <div aria-hidden="true" className="outcome-stage__rays" />

        <motion.header
          animate={HERO_ANIMATE}
          className="outcome-banner"
          initial={prefersReducedMotion ? false : HERO_INITIAL}
          transition={prefersReducedMotion ? REDUCED_MOTION_TRANSITION : HERO_TRANSITION}
        >
          <span>{dungeonComplete ? 'Dungeon cleared' : `Floor ${run.lastReward.floor} cleared`}</span>
          <h1 id="victory-title">{dungeonComplete ? 'Boss Defeated' : 'Victory'}</h1>
        </motion.header>

        <motion.div
          animate={ENEMY_ANIMATE}
          className="outcome-stage__enemy"
          initial={prefersReducedMotion ? false : ENEMY_INITIAL}
          transition={prefersReducedMotion ? REDUCED_MOTION_TRANSITION : ENEMY_TRANSITION}
        >
          <EnemySprite enemyName={run.enemy.spriteName} hp={0} size={5} />
          <strong>{run.lastReward.enemyName} vanquished</strong>
        </motion.div>

        <div aria-hidden="true" className="outcome-stage__platform" />

        <div className="outcome-depth">
          <div>
            <span>Dungeon progress</span>
            <strong>{run.lastReward.floor}/{dungeon.floors.length}</strong>
          </div>
          <progress
            aria-label={`Dungeon progress: floor ${run.lastReward.floor} of ${dungeon.floors.length}`}
            max={dungeon.floors.length}
            value={run.lastReward.floor}
          />
        </div>
      </section>

      <OutcomeRewards
        heading={dungeonComplete ? 'This descent' : 'Battle rewards'}
        soulsEarned={rewardSouls}
        totalSouls={profile.bankedSouls}
        totalXp={profile.xp}
        xpEarned={rewardXp}
      />

      <section aria-label="Current run status" className="outcome-run-status">
        <div className="outcome-health">
          <div>
            <span><Heart aria-hidden="true" size={15} /> Current HP</span>
            <strong>{run.playerHp}/{run.playerMaxHp}</strong>
          </div>
          <progress
            aria-label={`Current health: ${run.playerHp} of ${run.playerMaxHp}`}
            max={run.playerMaxHp}
            value={run.playerHp}
          />
        </div>

        {dungeonComplete && (
          <div className="outcome-clear-summary">
            <Trophy aria-hidden="true" size={22} />
            <div>
              <strong>{run.runStats.enemiesDefeated} enemies defeated</strong>
              <span>{dungeon.name} conquered</span>
            </div>
          </div>
        )}
      </section>

      <motion.button
        animate={CTA_ANIMATE}
        className="pixel-button pixel-button--primary outcome-cta"
        initial={prefersReducedMotion ? false : CTA_INITIAL}
        onClick={
          dungeonComplete
            ? returnToHubAfterVictory
            : profile.autoCombat
              ? () => setAutoCombat(false)
              : advanceToNextFloor
        }
        transition={buttonTransition}
        type="button"
      >
        {dungeonComplete ? (
          <><DoorOpen aria-hidden="true" size={18} /> Return to Hub</>
        ) : profile.autoCombat ? (
          <><Pause aria-hidden="true" size={18} /> Pause Auto Combat</>
        ) : (
          <><Swords aria-hidden="true" size={18} /> Continue to Floor {nextFloorNumber}</>
        )}
      </motion.button>
      {profile.autoCombat && !dungeonComplete && (
        <p aria-live="polite" className="auto-combat-continuing">
          <Bot aria-hidden="true" size={15} />
          Auto · continuing to Floor {nextFloorNumber}
        </p>
      )}
    </main>
  )
}
