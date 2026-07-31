import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { CHARMS, CHARM_DEFINITIONS } from '../../game/content/charms'
import type { PendingFateDraw } from '../../game/types/charms'
import { CharmIcon } from './CharmIcon'

interface FateDrawOverlayProps {
  animate: boolean
  currentRank: number
  draw: PendingFateDraw
  onClaim: () => void
}

const SPIN_STEPS = 18
const CHARM_IDS = CHARMS.map((charm) => charm.id)

export function FateDrawOverlay({
  animate,
  currentRank,
  draw,
  onClaim,
}: FateDrawOverlayProps) {
  const reduceMotion = useReducedMotion()
  const shouldAnimate = animate && !reduceMotion
  const [landed, setLanded] = useState(!shouldAnimate)
  const [displayedCharmId, setDisplayedCharmId] = useState(draw.selectedCharmId)

  useEffect(() => {
    if (!shouldAnimate) return
    const selectedIndex = CHARM_IDS.indexOf(draw.selectedCharmId)
    const sequence = Array.from({ length: SPIN_STEPS }, (_, index) => (
      CHARM_IDS[(selectedIndex + index + 1) % CHARM_IDS.length]
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
  }, [draw.selectedCharmId, shouldAnimate])

  const displayedCharm = CHARM_DEFINITIONS[displayedCharmId]
  const selectedCharm = CHARM_DEFINITIONS[draw.selectedCharmId]
  const selectedDefinition = selectedCharm.ranks[Math.min(currentRank, 2)]
  const displayedIndex = CHARM_IDS.indexOf(displayedCharmId)
  const previousCharmId = CHARM_IDS[(displayedIndex - 1 + CHARM_IDS.length) % CHARM_IDS.length]
  const nextCharmId = CHARM_IDS[(displayedIndex + 1) % CHARM_IDS.length]

  return (
    <div
      aria-label="Fate Draw"
      aria-modal="true"
      className={`fate-machine-overlay${landed ? ' is-landed' : ' is-spinning'}`}
      role="dialog"
      style={{
        '--charm-accent': landed ? selectedCharm.accent : displayedCharm.accent,
      } as CSSProperties}
    >
      <div className="fate-machine">
        <header>
          <span className="eyebrow">{landed ? 'Fate has chosen' : 'The reliquary turns'}</span>
          <h2>{landed ? 'Charm Found' : 'Fate Draw'}</h2>
        </header>

        <div aria-live="polite" className="fate-reel">
          <div aria-hidden="true" className="fate-reel__ghost">
            <CharmIcon charmId={previousCharmId} size={42} />
          </div>
          <div className="fate-reel__window">
            <div className="fate-reel__symbol" key={displayedCharmId}>
              <CharmIcon charmId={displayedCharmId} size={96} />
            </div>
            <span className="fate-reel__marker fate-reel__marker--left" />
            <span className="fate-reel__marker fate-reel__marker--right" />
          </div>
          <div aria-hidden="true" className="fate-reel__ghost">
            <CharmIcon charmId={nextCharmId} size={42} />
          </div>
        </div>

        {landed ? (
          <div className="fate-machine__result">
            <div aria-hidden="true" className="fate-machine__particles">
              {Array.from({ length: 12 }, (_, index) => <span key={index} />)}
            </div>
            <strong>{selectedCharm.name}</strong>
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
