import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import {
  CHARMS,
  CHARM_DEFINITIONS,
  CHARM_RARITY_DEFINITIONS,
} from '../../game/content/charms'
import type { CharmId, PendingFateDraw } from '../../game/types/charms'
import { CharmIcon } from './CharmIcon'

interface FateDrawOverlayProps {
  animate: boolean
  availableCharmIds?: readonly CharmId[]
  currentRank: number
  draw: PendingFateDraw
  onClaim: () => void
}

const SPIN_STEPS = 18
const ALL_CHARM_IDS = CHARMS.map((charm) => charm.id)

export function FateDrawOverlay({
  animate,
  availableCharmIds,
  currentRank,
  draw,
  onClaim,
}: FateDrawOverlayProps) {
  const charmIds = availableCharmIds?.length ? availableCharmIds : ALL_CHARM_IDS
  const reduceMotion = useReducedMotion()
  const shouldAnimate = animate && !reduceMotion
  const [landed, setLanded] = useState(!shouldAnimate)
  const [displayedCharmId, setDisplayedCharmId] = useState(() => {
    if (!shouldAnimate) return draw.selectedCharmId
    const selectedIndex = charmIds.indexOf(draw.selectedCharmId)
    return charmIds[(selectedIndex + 1) % charmIds.length]
  })

  useEffect(() => {
    if (!shouldAnimate) return
    const selectedIndex = charmIds.indexOf(draw.selectedCharmId)
    const sequence = Array.from({ length: SPIN_STEPS }, (_, index) => (
      charmIds[(selectedIndex + index + 1) % charmIds.length]
    ))
    const timers: number[] = []
    let elapsed = 70

    sequence.forEach((charmId, index) => {
      const progress = index / (sequence.length - 1)
      const delay = progress < 0.65
        ? 70
        : Math.round(85 + ((progress - 0.65) / 0.35) ** 2 * 210)
      elapsed += delay
      timers.push(window.setTimeout(() => setDisplayedCharmId(charmId), elapsed))
    })
    timers.push(window.setTimeout(() => {
      setDisplayedCharmId(draw.selectedCharmId)
      setLanded(true)
    }, elapsed + 330))

    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [charmIds, draw.selectedCharmId, shouldAnimate])

  const displayedCharm = CHARM_DEFINITIONS[displayedCharmId]
  const selectedCharm = CHARM_DEFINITIONS[draw.selectedCharmId]
  const displayedRarity = CHARM_RARITY_DEFINITIONS[displayedCharm.rarity]
  const selectedRarity = CHARM_RARITY_DEFINITIONS[selectedCharm.rarity]
  const selectedDefinition = selectedCharm.ranks[Math.min(currentRank, 2)]
  const displayedIndex = charmIds.indexOf(displayedCharmId)
  const previousCharmId = charmIds[(displayedIndex - 1 + charmIds.length) % charmIds.length]
  const nextCharmId = charmIds[(displayedIndex + 1) % charmIds.length]
  const previousRarity = CHARM_RARITY_DEFINITIONS[CHARM_DEFINITIONS[previousCharmId].rarity]
  const nextRarity = CHARM_RARITY_DEFINITIONS[CHARM_DEFINITIONS[nextCharmId].rarity]

  return (
    <div
      aria-label="Fate Draw"
      aria-modal="true"
      className={`fate-machine-overlay fate-machine-overlay--${landed ? selectedCharm.rarity : displayedCharm.rarity}${landed ? ' is-landed' : ' is-spinning'}`}
      data-rarity={landed ? selectedCharm.rarity : displayedCharm.rarity}
      role="dialog"
      style={{
        '--charm-accent': landed ? selectedRarity.accent : displayedRarity.accent,
        '--rarity-accent': landed ? selectedRarity.accent : displayedRarity.accent,
        '--rarity-dark': landed ? selectedRarity.dark : displayedRarity.dark,
      } as CSSProperties}
    >
      <div className="fate-machine">
        <header>
          <span className="eyebrow">{landed ? 'Fate has chosen' : 'The reliquary turns'}</span>
          <h2>{landed ? 'Charm Found' : 'Fate Draw'}</h2>
        </header>

        <div aria-live="polite" className="fate-reel">
          <div aria-hidden="true" className="fate-reel__ghost" style={{ '--rarity-accent': previousRarity.accent } as CSSProperties}>
            <CharmIcon charmId={previousCharmId} size={42} />
          </div>
          <div className="fate-reel__window">
            <div className="fate-reel__symbol" key={displayedCharmId}>
              <CharmIcon charmId={displayedCharmId} size={96} />
            </div>
            <span className="fate-reel__marker fate-reel__marker--left" />
            <span className="fate-reel__marker fate-reel__marker--right" />
          </div>
          <div aria-hidden="true" className="fate-reel__ghost" style={{ '--rarity-accent': nextRarity.accent } as CSSProperties}>
            <CharmIcon charmId={nextCharmId} size={42} />
          </div>
        </div>

        {landed ? (
          <div className="fate-machine__result">
            <div aria-hidden="true" className="fate-machine__particles">
              {Array.from({ length: 12 }, (_, index) => <span key={index} />)}
            </div>
            <strong>{selectedCharm.name}</strong>
            <span className="fate-machine__rarity">{selectedRarity.name}</span>
            <span>{currentRank > 0 ? `Rank ${currentRank} → ${currentRank + 1}` : 'New Charm'}</span>
            <p>{selectedDefinition.description}</p>
            <button className="pixel-button pixel-button--primary" onClick={onClaim} type="button">
              <Sparkles aria-hidden="true" size={18} />
              Claim Charm
            </button>
          </div>
        ) : (
          <p className="fate-machine__spinning">Cycling through the reliquary…</p>
        )}
      </div>
    </div>
  )
}
