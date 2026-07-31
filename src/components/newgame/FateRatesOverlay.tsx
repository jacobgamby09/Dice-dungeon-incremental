import { X } from 'lucide-react'
import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { CHARM_RARITY_DEFINITIONS } from '../../game/content/charms'
import { FATE_DRAW_COST } from '../../game/progression/fate'
import { CHARM_RARITIES } from '../../game/types/charms'

interface FateRatesOverlayProps {
  onClose: () => void
}

export function FateRatesOverlay({ onClose }: FateRatesOverlayProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const overlay = (
    <div aria-label="Fate Draw rates" aria-modal="true" className="fate-rates-overlay" role="dialog">
      <section className="fate-rates-panel">
        <button aria-label="Close Fate Draw rates" className="icon-button fate-rates-panel__close" onClick={onClose} type="button">
          <X aria-hidden="true" size={22} />
        </button>
        <span className="eyebrow">Fate Draw information</span>
        <h2>Drop Rates</h2>
        <p>Each Draw costs {FATE_DRAW_COST} Fate Tokens and rolls one rarity first.</p>
        <div className="fate-rates-list">
          {CHARM_RARITIES.map((rarity) => {
            const definition = CHARM_RARITY_DEFINITIONS[rarity]
            return (
              <div
                data-rarity={rarity}
                key={rarity}
                style={{
                  '--rarity-accent': definition.accent,
                  '--rarity-dark': definition.dark,
                } as CSSProperties}
              >
                <span>{definition.name}</span>
                <strong>{definition.weight}%</strong>
              </div>
            )
          })}
        </div>
        <div className="fate-rates-panel__notes">
          <p>These are the base rates while every rarity has an eligible Charm.</p>
          <p>When every Charm in a rarity reaches max rank, that rarity leaves the pool and the remaining rates normalize.</p>
          <p>There is no default rarity protection. The Fate&apos;s Favor talent can add visible Epic+ and Legendary guarantees.</p>
        </div>
      </section>
    </div>
  )

  return typeof document === 'undefined' ? overlay : createPortal(overlay, document.body)
}
