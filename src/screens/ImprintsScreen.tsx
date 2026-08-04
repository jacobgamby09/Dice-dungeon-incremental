import { ArrowRight, ChevronLeft, Link, Sparkles, Unlink } from 'lucide-react'
import { useMemo, useState } from 'react'
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
  const [selectedId, setSelectedId] = useState(imprints[0]?.id ?? '')
  const selected = imprints.find((imprint) => imprint.id === selectedId) ?? imprints[0]
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

      <section className="imprints-guide" aria-labelledby="imprints-guide-title">
        <header>
          <Sparkles aria-hidden="true" size={18} />
          <div><span>Permanent face crafting</span><h2 id="imprints-guide-title">How Imprints Work</h2></div>
        </header>
        <ol>
          <li><strong>1 · Find</strong><span>Discover Imprints in Dungeon loot.</span></li>
          <li><strong>2 · Bind</strong><span>Attach one to a matching permanent face.</span></li>
          <li><strong>3 · Refine</strong><span>Workshop hits raise its permanent Refinement.</span></li>
        </ol>
        <p>Removing or moving an Imprint restores the original face. Its Refinement always travels with it.</p>
      </section>

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

      {selected && selectedDefinition ? (
        <section className={`imprint-binding imprint-binding--${selectedDefinition.rarity}`}>
          <header>
            <ImprintIcon id={selected.definitionId} rarity={selectedDefinition.rarity} size={42} />
            <div>
              <span>{selectedDefinition.rarity} imprint</span>
              <h2>{selectedDefinition.name}</h2>
            </div>
            <strong>{effectiveValue}</strong>
          </header>
          <p>{selectedDefinition.description}</p>

          <dl className="imprint-stats">
            <div><dt>Dungeon source</dt><dd>{DUNGEONS[selectedDefinition.dungeonId].name}</dd></div>
            <div><dt>Host face</dt><dd>{attachedFace ? attachedFace.value : 'Not bound'}</dd></div>
            <div><dt>Imprint base</dt><dd>{selectedDefinition.baseValue}</dd></div>
            <div><dt>Refinement</dt><dd>+{selected.refinement}</dd></div>
            <div className="imprint-stats__result"><dt>Effective face</dt><dd>{effectiveValue}</dd></div>
          </dl>

          <div className="imprint-formula" aria-label="Effective Imprint value formula">
            <span>Higher of host {attachedFace?.value ?? '—'} or base {selectedDefinition.baseValue}</span>
            <ArrowRight aria-hidden="true" size={16} />
            <span>+{selected.refinement} Refinement</span>
            <ArrowRight aria-hidden="true" size={16} />
            <strong>{effectiveValue}</strong>
          </div>
          <p className="imprint-refinement-note">
            Refinement is permanent power stored on the Imprint. It is earned when Workshop selects this face and remains when the Imprint moves.
          </p>

          {selected.attachment ? (
            <div className="imprint-current-binding">
              <span>Bound to</span>
              <strong>{attachedDie?.name ?? 'Unknown die'} · Face {(attachedDie?.faces.findIndex((face) => face.id === attachedFace?.id) ?? -1) + 1}</strong>
              <button onClick={() => detach(selected.id)} type="button"><Unlink size={17} /> Remove</button>
            </div>
          ) : null}

          <div className="imprint-dice-list">
            {dice.map((die) => {
              const equippedSlotIndex = getDieLoadoutSlotIndex(equippedDieIds, die.id)
              return (
                <section
                  className={equippedSlotIndex !== null ? 'is-equipped' : undefined}
                  key={die.id}
                >
                  <header>
                    <h3>{die.name}</h3>
                    <DieLoadoutStatus slotIndex={equippedSlotIndex} />
                  </header>
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
                            || face.type !== selectedDefinition.type
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
              )
            })}
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
