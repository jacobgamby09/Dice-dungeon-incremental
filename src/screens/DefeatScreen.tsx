import { motion, useReducedMotion } from 'framer-motion'
import { DoorOpen, Skull, Swords } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { OutcomeRewards } from '../components/newgame/OutcomeRewards'
import { DUNGEONS } from '../game/content/dungeons'
import { getVerifiedImprintDropIds } from '../game/progression/imprints'
import { useNewGameStore } from '../store/newGameStore'

const DEFEAT_INITIAL = { opacity: 0, scale: 0.9, y: -12 }
const DEFEAT_ANIMATE = { opacity: 1, scale: 1, y: 0 }
const DEFEAT_TRANSITION = { duration: 0.34, ease: 'backOut' as const }
const CTA_INITIAL = { opacity: 0, y: 10 }
const CTA_ANIMATE = { opacity: 1, y: 0 }
const CTA_TRANSITION = { delay: 0.48, duration: 0.24 }
const REDUCED_MOTION_TRANSITION = { duration: 0 }

export function DefeatScreen() {
  const profile = useNewGameStore(useShallow((state) => ({
    souls: state.profile.bankedSouls,
    fateTokens: state.profile.fateTokens,
    xp: state.profile.xp,
    imprints: state.profile.imprints,
  })))
  const run = useNewGameStore(useShallow((state) => ({
    dungeonId: state.run.dungeonId,
    encounterIndex: state.run.encounterIndex,
    runStats: state.run.runStats,
  })))
  const returnToHub = useNewGameStore((state) => state.returnToHubAfterDefeat)
  const prefersReducedMotion = useReducedMotion()

  const totalFloors = run.dungeonId ? DUNGEONS[run.dungeonId].floors.length : 0
  const reachedFloor = totalFloors > 0
    ? Math.min(run.encounterIndex + 1, totalFloors)
    : 0
  const verifiedImprintDrops = getVerifiedImprintDropIds(
    run.runStats.imprintsFound ?? [],
    profile.imprints,
  )

  return (
    <main className="game-shell outcome-screen defeat-screen">
      <section className="outcome-stage outcome-stage--defeat" aria-labelledby="defeat-title">
        <div aria-hidden="true" className="outcome-stage__danger-glow" />

        <motion.header
          animate={DEFEAT_ANIMATE}
          className="outcome-banner outcome-banner--defeat"
          initial={prefersReducedMotion ? false : DEFEAT_INITIAL}
          transition={prefersReducedMotion ? REDUCED_MOTION_TRANSITION : DEFEAT_TRANSITION}
        >
          <span>Descent ended</span>
          <h1 id="defeat-title">Defeat</h1>
          <p>The dungeon drove you back.</p>
        </motion.header>

        <div aria-hidden="true" className="defeat-emblem">
          <Skull size={48} strokeWidth={2.4} />
        </div>

        <div className="outcome-depth outcome-depth--defeat">
          <div>
            <span>Floor reached</span>
            <strong>{reachedFloor}/{totalFloors}</strong>
          </div>
          <progress
            aria-label={`Floor reached: ${reachedFloor} of ${totalFloors}`}
            max={Math.max(totalFloors, 1)}
            value={reachedFloor}
          />
        </div>
      </section>

      <OutcomeRewards
        bonusXp={run.runStats.bonusXpEarned ?? 0}
        charmBonusSouls={run.runStats.charmBonusSoulsEarned ?? 0}
        fateTokensEarned={run.runStats.fateTokensEarned ?? 0}
        heading="This descent"
        imprintDrops={verifiedImprintDrops}
        showLootSection
        soulsEarned={run.runStats.soulsEarned}
        totalSouls={profile.souls}
        totalFateTokens={
          (run.runStats.fateTokensEarned ?? 0) > 0
            ? profile.fateTokens
            : undefined
        }
        totalXp={profile.xp}
        xpEarned={run.runStats.xpEarned}
      />

      <section aria-label="Descent summary" className="descent-summary">
        <Swords aria-hidden="true" size={24} />
        <div>
          <strong>{run.runStats.enemiesDefeated} enemies defeated</strong>
          <span>The next descent begins stronger.</span>
        </div>
      </section>

      <motion.button
        animate={CTA_ANIMATE}
        className="pixel-button pixel-button--primary outcome-cta"
        initial={prefersReducedMotion ? false : CTA_INITIAL}
        onClick={returnToHub}
        transition={prefersReducedMotion ? REDUCED_MOTION_TRANSITION : CTA_TRANSITION}
        type="button"
      >
        <DoorOpen aria-hidden="true" size={18} /> Return to Hub
      </motion.button>
    </main>
  )
}
