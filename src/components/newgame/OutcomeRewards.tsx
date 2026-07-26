import { motion, useReducedMotion } from 'framer-motion'
import { Flame, Sparkles } from 'lucide-react'

interface OutcomeRewardsProps {
  heading: string
  soulsEarned: number
  totalSouls: number
  totalXp: number
  xpEarned: number
}

const REWARD_INITIAL = { opacity: 0, y: 14 }
const REWARD_ANIMATE = { opacity: 1, y: 0 }
const REWARD_TRANSITION = { delay: 0.28, duration: 0.3, ease: 'easeOut' as const }
const REDUCED_MOTION_TRANSITION = { duration: 0 }

export function OutcomeRewards({
  heading,
  soulsEarned,
  totalSouls,
  totalXp,
  xpEarned,
}: OutcomeRewardsProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.section
      animate={REWARD_ANIMATE}
      aria-label={heading}
      className="outcome-rewards"
      initial={prefersReducedMotion ? false : REWARD_INITIAL}
      transition={prefersReducedMotion ? REDUCED_MOTION_TRANSITION : REWARD_TRANSITION}
    >
      <header className="outcome-rewards__heading">
        <span className="eyebrow">{heading}</span>
      </header>

      <div className="outcome-rewards__grid">
        <div className="outcome-reward outcome-reward--xp">
          <span aria-hidden="true" className="outcome-reward__icon">
            <Sparkles size={23} />
          </span>
          <span>XP</span>
          <strong>+{xpEarned}</strong>
          <small>{totalXp} total</small>
        </div>

        <div className="outcome-reward outcome-reward--souls">
          <span aria-hidden="true" className="outcome-reward__icon">
            <Flame size={23} />
          </span>
          <span>Souls</span>
          <strong>+{soulsEarned}</strong>
          <small>{totalSouls} total</small>
        </div>
      </div>
    </motion.section>
  )
}
