import { motion, useReducedMotion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { FateTokenIcon } from './FateTokenIcon'
import { SoulDieReward } from './SoulDieReward'
import type { SoulDieRollResult, SoulDieValues } from '../../game/types/dice'

interface OutcomeRewardsProps {
  heading: string
  soulsEarned: number
  totalSouls: number
  totalXp: number
  xpEarned: number
  bonusSouls?: number
  bonusXp?: number
  charmBonusSouls?: number
  fateTokensEarned?: number
  totalFateTokens?: number
  soulDieValues?: SoulDieValues
  soulRoll?: SoulDieRollResult
  fast?: boolean
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
  bonusSouls = 0,
  bonusXp = 0,
  charmBonusSouls = 0,
  fateTokensEarned = 0,
  totalFateTokens,
  soulDieValues,
  soulRoll,
  fast = false,
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
          {bonusXp > 0 && <em>Includes +{bonusXp} from talents</em>}
          <small>{totalXp} total</small>
        </div>

        <div className="outcome-reward outcome-reward--souls outcome-reward--soul-die">
          <span>Souls</span>
          {soulRoll && soulDieValues ? (
            <SoulDieReward fast={fast} result={soulRoll} values={soulDieValues} />
          ) : (
            <strong>+{soulsEarned}</strong>
          )}
          {soulRoll && soulsEarned !== soulRoll.payout ? (
            <em>+{soulsEarned} Souls across this descent</em>
          ) : null}
          {bonusSouls > 0 && !soulRoll ? <em>Includes +{bonusSouls}</em> : null}
          {charmBonusSouls > 0 && <em>Includes +{charmBonusSouls} from Charms</em>}
          <small>{totalSouls} total</small>
        </div>

        {totalFateTokens !== undefined && fateTokensEarned > 0 ? (
          <div className="outcome-reward outcome-reward--fate">
            <span aria-hidden="true" className="outcome-reward__icon">
              <FateTokenIcon size={27} />
            </span>
            <span>Loot found</span>
            <strong>+{fateTokensEarned}</strong>
            <em>Fate Token{fateTokensEarned === 1 ? '' : 's'}</em>
            <small>{totalFateTokens} total</small>
          </div>
        ) : null}
      </div>
    </motion.section>
  )
}
