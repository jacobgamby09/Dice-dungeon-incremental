import { ChevronLeft, Link, Sparkles, Unlink, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ImprintIcon } from '../components/newgame/ImprintIcon'
import { DieLoadoutStatus } from '../components/newgame/DieLoadoutStatus'
import { getDieLoadoutSlotIndex } from '../components/newgame/dieLoadout'
import { DUNGEONS } from '../game/content/dungeons'
import { IMPRINT_DEFINITIONS } from '../game/content/imprints'
import type { ImprintInstance } from '../game/types/imprints'
import { useNewGameStore } from '../store/newGameStore'

export function ImprintsScreen() {
  const imprints = useNewGameStore((state) => state.profile.imprints)
  const dice = useNewGameStore((state) => state.profile.diceCollection)
  const equippedDieIds = useNewGameStore((state) => state.profile.equippedDieIds)
  const goToHub = useNewGameStore((state) => state.goToHub)
  const attach = useNewGameStore((state) => state.attachImprint)
  const detach = useNewGameStore((state) => state.detachImprint)
  const [selectedId, setSelectedId] = useState('')
  const selected = imprints.find((imprint) => imprint.id === selectedId)
  const selectedDefinition = selected ? IMPRINT_DEFINITIONS[selected.definitionId] : null
  const attachedDie = selected?.attachment
    ? dice.find((die) => die.id === selected.attachment?.dieId)
    : undefined
  const attachedFace = selected?.attachment
    ? attachedDie?.faces.find((face) => face.id === selected.attachment?.faceId)
    : undefined
  const effectiveValue = selected && selectedDefinition
    ? Math.max(attachedFace?.value ?? selectedDefinition.baseValue, selectedDefinition.baseValue)
      + selected.refinement
    : 0
  const compatibleDice = selectedDefinition
    ? dice.filter((die) => die.faces.some((face) => (
        !face.signature && face.type === selectedDefinition.type
      )))
    : []
  const grouped = useMemo(() => ({
    rare: imprints.filter((imprint) => IMPRINT_DEFINITIONS[imprint.definitionId].rarity === 'rare'),
    epic: imprints.filter((imprint) => IMPRINT_DEFINITIONS[imprint.definitionId].rarity === 'epic'),
    legendary: imprints.filter((imprint) => IMPRINT_DEFINITIONS[imprint.definitionId].rarity === 'legendary'),
  }), [imprints])

  useEffect(() => {
    if (!selected) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedId('')
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [selected])

  return (
    <main className="game-shell imprints-screen">
      <header className="imprints-header">
        <button aria-label="Back to Hub" onClick={goToHub} type="button"><ChevronLeft /></button>
        <div><span>Permanent face relics</span><h1>Imprints</h1></div>
        <strong>{imprints.length}/3</strong>
      </header>

      <section className="imprints-guide" aria-labelledby="imprints-guide-title">
        <header>
          <Sparkles aria-hidden="true" size={18} />
          <div><span>Find · Bind · Forge</span><h2 id="imprints-guide-title">Build a Signature Face</h2></div>
        </header>
        <p>Bind an Imprint to a matching face. When Workshop selects it, its permanent <strong>Imprint Power</strong> can grow. Moving it never resets that power.</p>
      </section>

      <section className="imprint-collection" aria-labelledby="imprint-collection-title">
        <header><span>Collection</span><h2 id="imprint-collection-title">Discovered Imprints</h2></header>
        {(['rare', 'epic', 'legendary'] as const).map((rarity) => (
          <section className={`imprint-rarity imprint-rarity--${rarity}`} key={rarity}>
            <header><h3>{rarity}</h3><span>{grouped[rarity].length}/1</span></header>
            <div className="imprint-rarity__grid">
              {grouped[rarity].length > 0 ? grouped[rarity].map((imprint) => (
                <ImprintCard
                  imprint={imprint}
                  key={imprint.id}
                  onSelect={() => setSelectedId(imprint.id)}
                />
              )) : (
                <div className="imprint-card imprint-card--unknown">
                  <strong>?</strong>
                  <span>Undiscovered Imprint</span>
                </div>
              )}
            </div>
          </section>
        ))}
      </section>

      {selected && selectedDefinition ? (
        <div
          className="imprint-detail-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedId('')
          }}
        >
          <section
            aria-labelledby="imprint-detail-title"
            aria-modal="true"
            className={`imprint-binding imprint-binding--${selectedDefinition.rarity}`}
            role="dialog"
          >
            <button className="imprint-binding__close" aria-label="Close Imprint details" onClick={() => setSelectedId('')} type="button"><X /></button>
            <header>
              <ImprintIcon id={selected.definitionId} rarity={selectedDefinition.rarity} size={50} />
              <div>
                <span>{selectedDefinition.rarity} imprint</span>
                <h2 id="imprint-detail-title">{selectedDefinition.name}</h2>
              </div>
              <strong>{effectiveValue}</strong>
            </header>
            <p>{selectedDefinition.description}</p>

            <section className="imprint-power" aria-labelledby="imprint-power-title">
              <header><span>Permanent scaling</span><h3 id="imprint-power-title">Imprint Power</h3></header>
              <dl className="imprint-stats">
                <div><dt>Dungeon source</dt><dd>{DUNGEONS[selectedDefinition.dungeonId].name}</dd></div>
                <div><dt>Host face</dt><dd>{attachedFace?.value ?? 'Not bound'}</dd></div>
                <div><dt>Imprint base</dt><dd>{selectedDefinition.baseValue}</dd></div>
                <div><dt>Forged Power</dt><dd>+{selected.refinement}</dd></div>
                <div className="imprint-stats__result"><dt>Current face value</dt><dd>{effectiveValue}</dd></div>
              </dl>
              <p>The face uses the higher of its host value or Imprint base, then adds Forged Power. Workshop treats this as a normal 1-in-6 target.</p>
            </section>

            {selected.attachment ? (
              <div className="imprint-current-binding">
                <span>Currently bound</span>
                <strong>{attachedDie?.name ?? 'Unknown die'} · Face {(attachedDie?.faces.findIndex((face) => face.id === attachedFace?.id) ?? -1) + 1}</strong>
                <button onClick={() => detach(selected.id)} type="button"><Unlink size={17} /> Remove</button>
              </div>
            ) : null}

            <section className="imprint-bind-section" aria-labelledby="imprint-bind-title">
              <header><span>Choose a host</span><h3 id="imprint-bind-title">Bind to a Matching Face</h3></header>
              <div className="imprint-dice-list">
                {compatibleDice.map((die) => {
                  const equippedSlotIndex = getDieLoadoutSlotIndex(equippedDieIds, die.id)
                  return (
                    <section className={equippedSlotIndex !== null ? 'is-equipped' : undefined} key={die.id}>
                      <header><h4>{die.name}</h4><DieLoadoutStatus slotIndex={equippedSlotIndex} /></header>
                      <div>
                        {die.faces.map((face, index) => {
                          const occupied = imprints.some((candidate) => (
                            candidate.id !== selected.id
                            && candidate.attachment?.dieId === die.id
                            && candidate.attachment.faceId === face.id
                          ))
                          const compatible = !face.signature && face.type === selectedDefinition.type
                          return (
                            <button disabled={!compatible || occupied} key={face.id} onClick={() => attach(selected.id, die.id, face.id)} type="button">
                              <span>{index + 1}</span><strong>{face.value}</strong><Link size={13} />
                            </button>
                          )
                        })}
                      </div>
                    </section>
                  )
                })}
              </div>
            </section>
          </section>
        </div>
      ) : null}
    </main>
  )
}

function ImprintCard({ imprint, onSelect }: { imprint: ImprintInstance; onSelect: () => void }) {
  const definition = IMPRINT_DEFINITIONS[imprint.definitionId]
  return (
    <button className="imprint-card" onClick={onSelect} type="button">
      <span className="imprint-card__icon">
        <ImprintIcon id={definition.id} rarity={definition.rarity} size={46} />
      </span>
      <span className="imprint-card__body">
        <strong>{definition.name}</strong>
        <small>Power +{imprint.refinement}</small>
        <span>{definition.description}</span>
      </span>
      <em className={imprint.attachment ? undefined : 'is-unbound'}>
        {imprint.attachment ? 'Bound' : 'Ready'}
      </em>
    </button>
  )
}
