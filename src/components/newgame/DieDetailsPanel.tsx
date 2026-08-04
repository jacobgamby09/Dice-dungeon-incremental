import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { SIGNATURE_DEFINITIONS } from '../../game/content/faceEffects'
import { getDieProfile } from '../../game/content/diceProfiles'
import type { DieInstance } from '../../game/types/dice'
import { DieSummary } from './DieSummary'
import { SignatureIcon } from './SignatureIcon'

interface DieDetailsPanelProps {
  die: DieInstance | null
  onClose: () => void
}

export function DieDetailsPanel({ die, onClose }: DieDetailsPanelProps) {
  const dialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!die) return
    dialogRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [die, onClose])

  const profile = die ? getDieProfile(die) : null
  const signatures = die
    ? [...new Set(die.faces.flatMap((face) => face.signature?.id ?? []))]
    : []

  return (
    <AnimatePresence>
      {die && profile ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="die-details-backdrop"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose()
          }}
        >
          <motion.aside
            animate={{ opacity: 1, scale: 1, y: 0 }}
            aria-labelledby="die-details-title"
            aria-modal="true"
            className="die-details-panel"
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            initial={{ opacity: 0, scale: 0.9, y: 18 }}
            ref={dialogRef}
            role="dialog"
            tabIndex={-1}
          >
            <button
              aria-label="Close die details"
              className="die-details-panel__close"
              onClick={onClose}
              type="button"
            >
              <X aria-hidden="true" size={20} />
            </button>
            <header>
              <span>{die.family} family</span>
              <h2 id="die-details-title">{die.name}</h2>
            </header>
            <DieSummary die={die} />
            <div className="die-details-panel__tags">
              {profile.tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
            <p>{profile.description}</p>

            {signatures.length > 0 ? (
              <section aria-labelledby="die-signature-title">
                <h3 id="die-signature-title">Signature faces · {signatures.length === 1 ? '2/6 chance' : ''}</h3>
                {signatures.map((signatureId) => {
                  const signature = SIGNATURE_DEFINITIONS[signatureId]
                  const faceCount = die.faces.filter((face) => face.signature?.id === signatureId).length
                  return (
                    <article key={signature.id}>
                      <SignatureIcon signatureId={signature.id} size={24} />
                      <div>
                        <strong>{signature.name} · {faceCount}/6</strong>
                        <span>{signature.description}</span>
                      </div>
                    </article>
                  )
                })}
              </section>
            ) : null}
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
