import { motion, useReducedMotion } from 'framer-motion'
import { KeyRound } from 'lucide-react'
import { CurrencyIcon } from './CurrencyIcon'
import { FateTokenIcon } from './FateTokenIcon'
import { SoulDieReward } from './SoulDieReward'
import type { SoulDieRollResult, SoulDieValues } from '../../game/types/dice'
import type { DungeonKeyId } from '../../game/types/dungeon'
import { DUNGEON_KEYS } from '../../game/content/dungeonKeys'
import { IMPRINT_DEFINITIONS } from '../../game/content/imprints'
import { ImprintIcon } from './ImprintIcon'
import type { ImprintId } from '../../game/types/imprints'

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
  dungeonKey?: DungeonKeyId
  showLootSection?: boolean
  imprintDrop?: ImprintId
  imprintDrops?: ImprintId[]
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
  dungeonKey,
  showLootSection = false,
  imprintDrop,
  imprintDrops = [],
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
            <CurrencyIcon currency="xp" size={27} />
          </span>
          <span>XP</span>
          <strong>+{xpEarned}</strong>
          {bonusXp > 0 && <em>Includes +{bonusXp} from talents</em>}
          <small>{totalXp} total</small>
        </div>

        <div className={`outcome-reward outcome-reward--souls${soulRoll ? ' outcome-reward--soul-die' : ''}`}>
          {!soulRoll ? (
            <span aria-hidden="true" className="outcome-reward__icon">
              <CurrencyIcon currency="souls" size={27} />
            </span>
          ) : null}
          <span>Souls</span>
          {soulRoll && soulDieValues ? (
            <SoulDieReward result={soulRoll} values={soulDieValues} />
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

      </div>

      {(showLootSection || dungeonKey || imprintDrop || imprintDrops.length > 0 || (totalFateTokens !== undefined && fateTokensEarned > 0)) ? (
        <section aria-label="Loot found" className="outcome-loot">
          <span className="eyebrow">Loot</span>
          {dungeonKey ? (
            <div className="outcome-reward outcome-reward--dungeon-key">
              <span aria-hidden="true" className="outcome-reward__icon">
                <KeyRound size={30} />
              </span>
              <span>Milestone Loot</span>
              <strong>{DUNGEON_KEYS[dungeonKey].name}</strong>
              <em>{DUNGEON_KEYS[dungeonKey].description}</em>
              <small>{DUNGEON_KEYS[dungeonKey].unlocksDungeonId === 'iron-depths' ? 'Dungeon 2' : 'Dungeon 3'} unlocked</small>
            </div>
          ) : null}
          {imprintDrop ? (
            <div className={`outcome-reward outcome-reward--imprint outcome-reward--imprint-${IMPRINT_DEFINITIONS[imprintDrop].rarity}`}>
              <span aria-hidden="true" className="outcome-reward__icon">
                <ImprintIcon id={imprintDrop} rarity={IMPRINT_DEFINITIONS[imprintDrop].rarity} size={34} />
              </span>
              <span>{IMPRINT_DEFINITIONS[imprintDrop].rarity} Imprint</span>
              <strong>{IMPRINT_DEFINITIONS[imprintDrop].name}</strong>
              <em>{IMPRINT_DEFINITIONS[imprintDrop].shortDescription}</em>
              <small>Added to Imprints</small>
            </div>
          ) : null}
          {imprintDrops.map((foundImprint) => (
            <div className={`outcome-reward outcome-reward--imprint outcome-reward--imprint-${IMPRINT_DEFINITIONS[foundImprint].rarity}`} key={foundImprint}>
              <span aria-hidden="true" className="outcome-reward__icon">
                <ImprintIcon id={foundImprint} rarity={IMPRINT_DEFINITIONS[foundImprint].rarity} size={34} />
              </span>
              <span>{IMPRINT_DEFINITIONS[foundImprint].rarity} Imprint</span>
              <strong>{IMPRINT_DEFINITIONS[foundImprint].name}</strong>
              <em>{IMPRINT_DEFINITIONS[foundImprint].shortDescription}</em>
              <small>Added to Imprints</small>
            </div>
          ))}
          {totalFateTokens !== undefined && fateTokensEarned > 0 ? (
            <div className="outcome-reward outcome-reward--fate">
              <span aria-hidden="true" className="outcome-reward__icon">
                <FateTokenIcon size={27} />
              </span>
              <span>Fate Tokens</span>
              <strong>+{fateTokensEarned}</strong>
              <em>Fate Token{fateTokensEarned === 1 ? '' : 's'}</em>
              <small>{totalFateTokens} total</small>
            </div>
          ) : !dungeonKey && !imprintDrop && imprintDrops.length === 0 ? (
            <p>No special loot this descent.</p>
          ) : null}
        </section>
      ) : null}
    </motion.section>
  )
}
