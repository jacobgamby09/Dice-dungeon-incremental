import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { IMPRINT_DEFINITIONS } from '../../game/content/imprints'
import type { ImprintSnapshot } from '../../game/types/imprints'
import { ImprintIcon } from './ImprintIcon'

export function ImprintInspectOverlay({
  imprint,
  onClose,
}: {
  imprint: ImprintSnapshot
  onClose: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const definition = IMPRINT_DEFINITIONS[imprint.definitionId]

  useEffect(() => {
    closeRef.current?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div className="imprint-inspect-backdrop" onClick={onClose} role="presentation">
      <section
        aria-labelledby="imprint-inspect-title"
        aria-modal="true"
        className={`imprint-inspect imprint-inspect--${imprint.rarity}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button aria-label="Close Imprint details" onClick={onClose} ref={closeRef} type="button">
          <X aria-hidden="true" />
        </button>
        <ImprintIcon id={imprint.definitionId} rarity={imprint.rarity} size={64} />
        <span>{imprint.rarity} Imprint</span>
        <h2 id="imprint-inspect-title">{imprint.name}</h2>
        <strong>Minimum {definition.baseValue + imprint.refinement} {definition.type}</strong>
        <p>{imprint.description}</p>
        <dl>
          <div><dt>Refinement</dt><dd>+{imprint.refinement}</dd></div>
          <div><dt>Host face</dt><dd>Higher value is preserved</dd></div>
          <div><dt>Face position</dt><dd>1 of 6</dd></div>
          <div><dt>Upgrade source</dt><dd>Workshop</dd></div>
        </dl>
      </section>
    </div>
  )
}
