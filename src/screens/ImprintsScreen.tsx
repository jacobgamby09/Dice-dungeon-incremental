import { ChevronLeft, Link, Unlink } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ImprintIcon } from '../components/newgame/ImprintIcon'
import { IMPRINT_DEFINITIONS, getImprintMinimumValue } from '../game/content/imprints'
import type { ImprintInstance } from '../game/types/imprints'
import { useNewGameStore } from '../store/newGameStore'

export function ImprintsScreen() {
  const imprints = useNewGameStore((state) => state.profile.imprints)
  const dice = useNewGameStore((state) => state.profile.diceCollection)
  const goToHub = useNewGameStore((state) => state.goToHub)
  const attach = useNewGameStore((state) => state.attachImprint)
  const detach = useNewGameStore((state) => state.detachImprint)
  const [selectedId, setSelectedId] = useState(imprints[0]?.id ?? '')
  const selected = imprints.find((imprint) => imprint.id === selectedId) ?? imprints[0]
  const grouped = useMemo(() => ({
    rare: imprints.filter((imprint) => IMPRINT_DEFINITIONS[imprint.definitionId].rarity === 'rare'),
    epic: imprints.filter((imprint) => IMPRINT_DEFINITIONS[imprint.definitionId].rarity === 'epic'),
    legendary: imprints.filter((imprint) => IMPRINT_DEFINITIONS[imprint.definitionId].rarity === 'legendary'),
  }), [imprints])

  return (
    <main className="game-shell imprints-screen">
      <header className="imprints-header">
        <button aria-label="Back to Hub" onClick={goToHub} type="button"><ChevronLeft /></button>
        <div><span>Permanent face relics</span><h1>Imprints</h1></div>
        <strong>{imprints.length}/3</strong>
      </header>

      <p className="imprints-intro">
        Bind an Imprint to one physical face. Its refinement follows it when moved;
        the original face returns unchanged when removed.
      </p>

      {(['rare', 'epic', 'legendary'] as const).map((rarity) => (
        <section className={`imprint-rarity imprint-rarity--${rarity}`} key={rarity}>
          <header><h2>{rarity}</h2><span>{grouped[rarity].length}/1</span></header>
          <div className="imprint-rarity__grid">
            {grouped[rarity].length > 0 ? grouped[rarity].map((imprint) => (
              <ImprintCard
                imprint={imprint}
                key={imprint.id}
                onSelect={() => setSelectedId(imprint.id)}
                selected={imprint.id === selected?.id}
              />
            )) : <div className="imprint-card imprint-card--unknown">?</div>}
          </div>
        </section>
      ))}

      {selected ? (
        <section className={`imprint-binding imprint-binding--${IMPRINT_DEFINITIONS[selected.definitionId].rarity}`}>
          <header>
            <ImprintIcon id={selected.definitionId} rarity={IMPRINT_DEFINITIONS[selected.definitionId].rarity} size={42} />
            <div>
              <span>{IMPRINT_DEFINITIONS[selected.definitionId].rarity} imprint</span>
              <h2>{IMPRINT_DEFINITIONS[selected.definitionId].name}</h2>
            </div>
            <strong>Min. {getImprintMinimumValue(selected)}</strong>
          </header>
          <p>{IMPRINT_DEFINITIONS[selected.definitionId].description}</p>
          <small>Refinement +{selected.refinement}</small>

          {selected.attachment ? (
            <div className="imprint-current-binding">
              <span>Bound to</span>
              <strong>{dice.find((die) => die.id === selected.attachment?.dieId)?.name ?? 'Unknown die'}</strong>
              <button onClick={() => detach(selected.id)} type="button"><Unlink size={17} /> Remove</button>
            </div>
          ) : null}

          <div className="imprint-dice-list">
            {dice.map((die) => (
              <section key={die.id}>
                <h3>{die.name}</h3>
                <div>
                  {die.faces.map((face, index) => {
                    const occupied = imprints.some((candidate) => (
                      candidate.id !== selected.id
                      && candidate.attachment?.dieId === die.id
                      && candidate.attachment.faceId === face.id
                    ))
                    return (
                      <button
                        disabled={
                          Boolean(face.signature)
                          || occupied
                          || face.type !== IMPRINT_DEFINITIONS[selected.definitionId].type
                        }
                        key={face.id}
                        onClick={() => attach(selected.id, die.id, face.id)}
                        type="button"
                      >
                        <span>{index + 1}</span><strong>{face.value}</strong>
                        <Link size={13} />
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}

function ImprintCard({
  imprint,
  onSelect,
  selected,
}: {
  imprint: ImprintInstance
  onSelect: () => void
  selected: boolean
}) {
  const definition = IMPRINT_DEFINITIONS[imprint.definitionId]
  return (
    <button
      aria-pressed={selected}
      className="imprint-card"
      onClick={onSelect}
      type="button"
    >
      <ImprintIcon id={definition.id} rarity={definition.rarity} size={44} />
      <span>{definition.name}</span>
      <small>Refinement +{imprint.refinement}</small>
      {imprint.attachment ? <em>Bound</em> : null}
    </button>
  )
}
