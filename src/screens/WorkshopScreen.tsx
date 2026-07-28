import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Anvil,
  ChevronLeft,
  Crosshair,
  Dices,
  Flame,
  Hammer,
  Sparkles,
} from 'lucide-react'
import { EvolutionIcon } from '../components/newgame/EvolutionIcon'
import { getEvolutionVisualStyle } from '../components/newgame/evolutionVisuals'
import { FaceIcon } from '../components/newgame/FaceIcon'
import { FACE_META } from '../components/newgame/faceVisuals'
import { PermanentResourceHud } from '../components/newgame/PermanentResourceHud'
import {
  ATTACK_EVOLUTIONS,
  getChaosEligibleFaces,
  getChaosForgeCost,
  getPrecisionForgeCost,
} from '../game/forge/forge'
import type { AttackEvolutionId, FaceType } from '../game/types/dice'
import { useNewGameStore } from '../store/newGameStore'

type ForgeMode = 'chaos' | 'precision'

interface ForgeImpact {
  cost: number
  faceId: string
  faceNumber: number
  mode: ForgeMode
  type: FaceType
  version: number
}

function createOperationId() {
  return globalThis.crypto?.randomUUID?.()
    ?? `forge-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function WorkshopScreen() {
  const diceCollection = useNewGameStore((state) => state.profile.diceCollection)
  const bankedSouls = useNewGameStore((state) => state.profile.bankedSouls)
  const goToHub = useNewGameStore((state) => state.goToHub)
  const chaosForgeDie = useNewGameStore((state) => state.chaosForgeDie)
  const precisionForgeFace = useNewGameStore((state) => state.precisionForgeFace)
  const evolveFace = useNewGameStore((state) => state.evolveFace)
  const [selectedDieId, setSelectedDieId] = useState(diceCollection[0]?.id ?? '')
  const [selectedFaceId, setSelectedFaceId] = useState(diceCollection[0]?.faces[0]?.id ?? '')
  const [forgeMode, setForgeMode] = useState<ForgeMode>('chaos')
  const [forgeImpact, setForgeImpact] = useState<ForgeImpact | null>(null)
  const [pendingEvolutionId, setPendingEvolutionId] = useState<AttackEvolutionId | null>(null)
  const forgeLock = useRef(false)

  const selectedDie = diceCollection.find((die) => die.id === selectedDieId) ?? diceCollection[0]
  const selectedFace = selectedDie?.faces.find((face) => face.id === selectedFaceId) ?? selectedDie?.faces[0]
  const chaosCost = selectedDie ? getChaosForgeCost(selectedDie) : null
  const precisionCost = selectedFace ? getPrecisionForgeCost(selectedFace) : null
  const activeCost = forgeMode === 'chaos' ? chaosCost : precisionCost
  const canForge = activeCost !== null && bankedSouls >= activeCost
  const eligibleChaosFaces = selectedDie ? getChaosEligibleFaces(selectedDie).length : 0

  function chooseDie(dieId: string) {
    const die = diceCollection.find((candidate) => candidate.id === dieId)
    if (!die) return
    setSelectedDieId(die.id)
    setSelectedFaceId(die.faces[0].id)
    setForgeImpact(null)
    setPendingEvolutionId(null)
  }

  function handleForge() {
    if (!selectedDie || !selectedFace || !canForge || forgeLock.current) return
    forgeLock.current = true
    const result = forgeMode === 'chaos'
      ? chaosForgeDie(selectedDie.id, createOperationId())
      : precisionForgeFace(selectedDie.id, selectedFace.id, createOperationId())
    forgeLock.current = false
    if (!result) return
    setSelectedFaceId(result.faceId)
    setPendingEvolutionId(null)
    setForgeImpact((current) => ({
      cost: result.cost,
      faceId: result.faceId,
      faceNumber: selectedDie.faces.findIndex((face) => face.id === result.faceId) + 1,
      mode: forgeMode,
      type: selectedDie.family,
      version: (current?.version ?? 0) + 1,
    }))
  }

  function handleEvolution(evolutionId: AttackEvolutionId) {
    if (!selectedDie || !selectedFace) return
    if (!evolveFace(selectedDie.id, selectedFace.id, evolutionId)) return
    setForgeImpact(null)
    setPendingEvolutionId(null)
  }

  return (
    <main className="game-shell workshop-screen">
      <section className="forge-header" aria-labelledby="workshop-title">
        <button aria-label="Back to Hub" className="forge-header__back" onClick={goToHub} type="button">
          <ChevronLeft aria-hidden="true" size={20} />
        </button>
        <div aria-hidden="true" className="forge-header__glow" />
        <div aria-hidden="true" className="forge-header__anvil"><Anvil size={60} /></div>
        <header className="forge-sign">
          <span>Controlled chance</span>
          <h1 id="workshop-title">Soul Forge</h1>
        </header>
        <PermanentResourceHud bankedSouls={bankedSouls} compact />
      </section>

      <section className="forge-rack" aria-labelledby="forge-rack-title">
        <header className="forge-section-heading">
          <div><span className="eyebrow">Dice rack</span><h2 id="forge-rack-title">Choose a Die</h2></div>
          <span>{diceCollection.length} owned</span>
        </header>
        <div className="die-tabs" aria-label="Choose a die">
          {diceCollection.map((die) => (
            <button
              aria-pressed={die.id === selectedDie?.id}
              className={`die-tab die-tab--${die.family}`}
              key={die.id}
              onClick={() => chooseDie(die.id)}
              type="button"
            >
              <span className="die-tab__icon"><FaceIcon type={die.family} size={18} /></span>
              <span><strong>{die.name}</strong><small>6 permanent faces</small></span>
            </button>
          ))}
        </div>
      </section>

      {selectedDie && selectedFace ? (
        <section className="forge-bench" aria-labelledby="forge-faces-title">
          <header className="forge-section-heading">
            <div><span className="eyebrow">Forge method</span><h2 id="forge-faces-title">Shape Your Die</h2></div>
            <FaceIcon type={selectedDie.family} size={24} />
          </header>

          <div className="forge-mode-switch" role="group" aria-label="Forge method">
            <button
              aria-pressed={forgeMode === 'chaos'}
              onClick={() => setForgeMode('chaos')}
              type="button"
            >
              <Dices aria-hidden="true" size={20} />
              <span><strong>Chaos Forge</strong><small>Random face · lower cost</small></span>
            </button>
            <button
              aria-pressed={forgeMode === 'precision'}
              onClick={() => setForgeMode('precision')}
              type="button"
            >
              <Crosshair aria-hidden="true" size={20} />
              <span><strong>Precision Forge</strong><small>Choose face · higher cost</small></span>
            </button>
          </div>

          <div className="workshop-faces">
            {selectedDie.faces.map((face, faceIndex) => {
              const isEligible = getPrecisionForgeCost(face) !== null
              return (
                <button
                  aria-label={`${face.value} ${FACE_META[face.type].label}, face ${faceIndex + 1}${face.evolution ? `, ${face.evolution.name}` : ''}`}
                  aria-pressed={face.id === selectedFace.id}
                  className={`workshop-face workshop-face--${face.type}${face.evolutionReady ? ' workshop-face--ready' : ''}${face.evolution ? ` evolution-face-surface evolution-face-surface--${face.evolution.id}` : ''}`}
                  key={face.id}
                  onClick={() => {
                    setSelectedFaceId(face.id)
                    setPendingEvolutionId(null)
                  }}
                  style={face.evolution ? getEvolutionVisualStyle(face.evolution.id) : undefined}
                  type="button"
                >
                  <small>Face {faceIndex + 1}</small>
                  <motion.strong
                    animate={{ scale: [1.35, 0.9, 1] }}
                    key={`${face.id}-${face.value}-${face.evolution?.id ?? 'base'}`}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    {face.value}
                  </motion.strong>
                  {face.evolution
                    ? <EvolutionIcon evolutionId={face.evolution.id} size={18} />
                    : <FaceIcon type={face.type} size={18} />}
                  {face.evolutionReady ? <em><Sparkles size={11} /> Evolve</em> : null}
                  {face.evolution ? <em className="workshop-face__evolution-name">{face.evolution.name}</em> : null}
                  {!isEligible && !face.evolutionReady && !face.evolution ? <em>Max</em> : null}
                </button>
              )
            })}
          </div>
          {forgeImpact?.mode === 'chaos' ? (
            <motion.div
              animate={{ opacity: [0, 1, 1], rotate: [-12, 8, -4, 0], scale: [0.55, 1.12, 0.94, 1] }}
              className={`forge-chaos-result forge-chaos-result--${forgeImpact.type}`}
              initial={{ opacity: 0 }}
              key={`chaos-result-${forgeImpact.version}-${forgeImpact.faceId}`}
              transition={{ duration: 0.68, ease: 'easeOut' }}
            >
              <span><strong>{forgeImpact.faceNumber}</strong><FaceIcon type={forgeImpact.type} size={16} /></span>
              <div><small>Chaos landed</small><strong>Face {forgeImpact.faceNumber} · -{forgeImpact.cost} Souls</strong></div>
            </motion.div>
          ) : null}

          {selectedFace.evolutionReady ? (
            <section className="evolution-panel" aria-labelledby="evolution-title">
              <header>
                <Sparkles aria-hidden="true" size={20} />
                <div><span className="eyebrow">Evolution ready</span><h3 id="evolution-title">Choose Its Identity</h3></div>
              </header>
              <p>This choice is permanent and costs no additional Souls.</p>
              <div className="evolution-choices">
                {(Object.keys(ATTACK_EVOLUTIONS) as AttackEvolutionId[]).map((evolutionId) => {
                  const evolution = ATTACK_EVOLUTIONS[evolutionId]
                  return (
                    <button
                      aria-pressed={pendingEvolutionId === evolution.id}
                      className={`evolution-choice evolution-choice--${evolution.id}`}
                      key={evolution.id}
                      onClick={() => setPendingEvolutionId(evolution.id)}
                      style={getEvolutionVisualStyle(evolution.id)}
                      type="button"
                    >
                      <EvolutionIcon evolutionId={evolution.id} size={21} />
                      <span><strong>{evolution.name}</strong><small>{evolution.description}</small></span>
                    </button>
                  )
                })}
              </div>
              {pendingEvolutionId ? (
                <div className="evolution-confirm">
                  <span>Bind {ATTACK_EVOLUTIONS[pendingEvolutionId].name} to this face?</span>
                  <button onClick={() => setPendingEvolutionId(null)} type="button">Cancel</button>
                  <button onClick={() => handleEvolution(pendingEvolutionId)} type="button">Confirm</button>
                </div>
              ) : null}
            </section>
          ) : (
            <>
              <div className={`forge-anvil forge-anvil--${selectedFace.type}`}>
                <div className="forge-anvil__face">
                  <span>{forgeMode === 'chaos' ? 'Eligible' : 'Selected'}</span>
                  <strong>{forgeMode === 'chaos' ? eligibleChaosFaces : selectedFace.value}</strong>
                  {forgeMode === 'chaos'
                    ? <Dices aria-hidden="true" size={20} />
                    : <FaceIcon type={selectedFace.type} size={20} />}
                </div>
                <div className="forge-anvil__tool">
                  <Hammer aria-hidden="true" size={26} />
                  <span>Forge</span>
                </div>
                <div className="forge-anvil__face forge-anvil__face--next">
                  <span>Result</span>
                  <strong>{forgeMode === 'chaos' ? '?' : selectedFace.value === 3 && selectedFace.type === 'attack' ? '✦' : selectedFace.value + 1}</strong>
                  <FaceIcon type={selectedFace.type} size={20} />
                </div>
                {forgeImpact?.mode === 'precision' ? (
                    <motion.div
                      animate={{ opacity: [0, 1, 1, 0], scale: [0.7, 1.25, 1, 1.45], x: [76, 32, 0, 0], y: [-76, -35, 0, 0] }}
                      className={`forge-impact forge-impact--${forgeImpact.type}`}
                      initial={{ opacity: 0 }}
                      key={`${forgeImpact.version}-${forgeImpact.faceId}`}
                      transition={{ duration: 0.72, ease: 'easeOut' }}
                    >
                      <Flame aria-hidden="true" size={16} /> Face {forgeImpact.faceNumber} · -{forgeImpact.cost}
                    </motion.div>
                ) : null}
              </div>

              <div aria-live="polite" className="forge-message">
                {activeCost === null
                  ? 'This die has no faces available for this forge method.'
                  : canForge
                    ? forgeMode === 'chaos'
                      ? `One of ${eligibleChaosFaces} eligible faces will be rolled and improved. The discount shrinks as the pool gets smaller.`
                      : selectedFace.type === 'attack' && selectedFace.value === 3
                        ? 'Awaken this face, then choose Power, Momentum or Rend for free.'
                        : `Face ${selectedDie.faces.findIndex((face) => face.id === selectedFace.id) + 1} will improve. No other face changes.`
                    : `Collect ${activeCost - bankedSouls} more Souls to use this forge.`}
              </div>

              <button
                className="pixel-button pixel-button--upgrade forge-button"
                disabled={!canForge}
                onClick={handleForge}
                type="button"
              >
                <Hammer aria-hidden="true" size={17} />
                {activeCost === null
                  ? 'No Eligible Faces'
                  : canForge
                    ? `${forgeMode === 'chaos' ? 'Roll Chaos Forge' : 'Precision Forge'} · ${activeCost} Souls`
                    : `Need ${activeCost} Souls`}
              </button>
            </>
          )}
        </section>
      ) : null}
    </main>
  )
}
