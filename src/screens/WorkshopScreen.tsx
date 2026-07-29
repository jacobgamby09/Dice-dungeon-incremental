import { AnimatePresence, motion } from 'framer-motion'
import {
  Anvil,
  ChevronLeft,
  Dices,
  Flame,
  Hammer,
  Sparkles,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { FaceIcon } from '../components/newgame/FaceIcon'
import { FACE_META } from '../components/newgame/faceVisuals'
import { PermanentResourceHud } from '../components/newgame/PermanentResourceHud'
import {
  getChaosEligibleFaces,
  getChaosForgeCost,
} from '../game/forge/forge'
import { getForgeCriticalChance, getWorkshopFaceCap } from '../game/progression/talents'
import type { FaceType } from '../game/types/dice'
import { useNewGameStore } from '../store/newGameStore'

interface ForgeImpact {
  amount: number
  faceId: string
  faceNumber: number
  newValue: number
  previousValue: number
  type: FaceType
  version: number
  wasCritical: boolean
}

function createOperationId() {
  return globalThis.crypto?.randomUUID?.()
    ?? `forge-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getAverage(values: readonly number[]): string {
  if (values.length === 0) return '0.00'
  return (values.reduce((total, value) => total + value, 0) / values.length).toFixed(2)
}

export function WorkshopScreen() {
  const diceCollection = useNewGameStore((state) => state.profile.diceCollection)
  const bankedSouls = useNewGameStore((state) => state.profile.bankedSouls)
  const talentRanks = useNewGameStore((state) => state.profile.talentRanks)
  const goToHub = useNewGameStore((state) => state.goToHub)
  const chaosForgeDie = useNewGameStore((state) => state.chaosForgeDie)
  const [selectedDieId, setSelectedDieId] = useState(diceCollection[0]?.id ?? '')
  const [forgeImpact, setForgeImpact] = useState<ForgeImpact | null>(null)
  const forgeLock = useRef(false)

  const selectedDie = diceCollection.find((die) => die.id === selectedDieId)
    ?? diceCollection[0]
  const faceCap = getWorkshopFaceCap(talentRanks)
  const criticalChance = getForgeCriticalChance(talentRanks)
  const forgeCost = selectedDie ? getChaosForgeCost(selectedDie, faceCap) : null
  const eligibleFaces = selectedDie ? getChaosEligibleFaces(selectedDie, faceCap) : []
  const canForge = forgeCost !== null && bankedSouls >= forgeCost

  useEffect(() => {
    window.scrollTo({ left: 0, top: 0 })
  }, [])

  function chooseDie(dieId: string) {
    if (!diceCollection.some((die) => die.id === dieId)) return
    setSelectedDieId(dieId)
    setForgeImpact(null)
  }

  function handleForge() {
    if (!selectedDie || !canForge || forgeLock.current) return
    forgeLock.current = true
    const result = chaosForgeDie(selectedDie.id, createOperationId())
    forgeLock.current = false
    if (!result) return

    setForgeImpact((current) => ({
      amount: result.amount,
      faceId: result.faceId,
      faceNumber: selectedDie.faces.findIndex((face) => face.id === result.faceId) + 1,
      newValue: result.newValue,
      previousValue: result.previousValue,
      type: selectedDie.family,
      version: (current?.version ?? 0) + 1,
      wasCritical: result.wasCritical,
    }))
  }

  return (
    <main className="game-shell workshop-screen classic-workshop">
      <section className="forge-header" aria-labelledby="workshop-title">
        <button aria-label="Back to Hub" className="forge-header__back" onClick={goToHub} type="button">
          <ChevronLeft aria-hidden="true" size={20} />
        </button>
        <div aria-hidden="true" className="forge-header__glow" />
        <div aria-hidden="true" className="forge-header__anvil"><Anvil size={60} /></div>
        <header className="forge-sign">
          <span>Random permanent growth</span>
          <h1 id="workshop-title">Chaos Workshop</h1>
        </header>
        <PermanentResourceHud bankedSouls={bankedSouls} compact />
      </section>

      <section className="forge-rack" aria-labelledby="forge-rack-title">
        <header className="forge-section-heading">
          <div>
            <span className="eyebrow">Permanent dice</span>
            <h2 id="forge-rack-title">Choose a Die</h2>
          </div>
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
              <span>
                <strong>{die.name}</strong>
                <small>Average {getAverage(die.faces.map((face) => face.value))}</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      {selectedDie ? (
        <section className="forge-bench classic-workshop__bench" aria-labelledby="forge-faces-title">
          <header className="forge-section-heading">
            <div>
              <span className="eyebrow">{selectedDie.family} family</span>
              <h2 id="forge-faces-title">{selectedDie.name}</h2>
            </div>
            <FaceIcon type={selectedDie.family} size={24} />
          </header>

          <div className="classic-workshop__stats" aria-label="Workshop statistics">
            <span><small>Die average</small><strong>{getAverage(selectedDie.faces.map((face) => face.value))}</strong></span>
            <span><small>Face cap</small><strong>{faceCap}</strong></span>
            <span><small>Critical</small><strong>{Math.round(criticalChance * 100)}%</strong></span>
          </div>

          <div className="workshop-faces classic-workshop__faces" aria-label="Current permanent faces">
            {selectedDie.faces.map((face, faceIndex) => {
              const isResult = forgeImpact?.faceId === face.id
              const isCapped = face.value >= faceCap
              return (
                <motion.div
                  aria-label={`Face ${faceIndex + 1}: ${face.value} ${FACE_META[face.type].label}${isCapped ? ', maximum' : ''}`}
                  className={`workshop-face workshop-face--${face.type}${isResult ? ' classic-workshop__face--hit' : ''}${isCapped ? ' classic-workshop__face--capped' : ''}`}
                  key={face.id}
                  animate={isResult
                    ? { rotate: [0, -8, 7, -3, 0], scale: [1, 1.2, 0.94, 1] }
                    : { rotate: 0, scale: 1 }}
                  transition={{ duration: 0.58, ease: 'easeOut' }}
                >
                  <small>Face {faceIndex + 1}</small>
                  <strong>{face.value}</strong>
                  <FaceIcon type={face.type} size={18} />
                  {isCapped ? <em>Max</em> : null}
                </motion.div>
              )
            })}
          </div>

          <div className={`classic-workshop__machine classic-workshop__machine--${selectedDie.family}`}>
            <Dices aria-hidden="true" size={35} />
            <div>
              <small>Next upgrade</small>
              <strong>One random face gains +1</strong>
              <span>
                {criticalChance > 0
                  ? `${Math.round(criticalChance * 100)}% chance to gain +2`
                  : 'Workshop talents can unlock critical +2 upgrades'}
              </span>
            </div>
            <Flame aria-hidden="true" size={24} />
          </div>

          <AnimatePresence mode="wait">
            {forgeImpact ? (
              <motion.div
                aria-live="polite"
                className={`classic-forge-result classic-forge-result--${forgeImpact.type}${forgeImpact.wasCritical ? ' classic-forge-result--critical' : ''}`}
                key={`${forgeImpact.version}-${forgeImpact.faceId}`}
                initial={{ opacity: 0, rotateX: -80, scale: 0.62, y: -18 }}
                animate={{ opacity: 1, rotateX: 0, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.86 }}
                transition={{ duration: 0.46, ease: [0.2, 0.82, 0.24, 1] }}
              >
                <span className="classic-forge-result__die">
                  <strong>{forgeImpact.newValue}</strong>
                  <FaceIcon type={forgeImpact.type} size={18} />
                </span>
                <div>
                  <small>{forgeImpact.wasCritical ? 'Critical forge!' : 'Chaos chose'}</small>
                  <strong>Face {forgeImpact.faceNumber} · +{forgeImpact.amount}</strong>
                  <span>{forgeImpact.previousValue} → {forgeImpact.newValue}</span>
                </div>
                {forgeImpact.wasCritical ? <Sparkles aria-hidden="true" size={24} /> : null}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <p className="forge-message classic-workshop__message">
            You choose the die. The Workshop chooses the face. Every purchase is permanent,
            and uneven faces are the point.
          </p>

          <button
            className="pixel-button pixel-button--upgrade forge-button"
            disabled={!canForge}
            onClick={handleForge}
            type="button"
          >
            <Hammer aria-hidden="true" size={17} />
            {forgeCost === null
              ? 'Every Face Is Capped'
              : canForge
                ? `Forge a Random Face · ${forgeCost} Souls`
                : `Need ${forgeCost - bankedSouls} More Souls`}
          </button>

          <small className="classic-workshop__eligible">
            {eligibleFaces.length}/6 faces can currently be chosen.
          </small>
        </section>
      ) : null}
    </main>
  )
}
