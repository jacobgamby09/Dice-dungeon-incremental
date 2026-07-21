import { useState } from 'react'
import { motion } from 'framer-motion'
import { Anvil, ChevronLeft, Flame, Hammer } from 'lucide-react'
import { FaceIcon } from '../components/newgame/FaceIcon'
import { FACE_META } from '../components/newgame/faceVisuals'
import { PermanentResourceHud } from '../components/newgame/PermanentResourceHud'
import { BASE_FACE_CAP, getFaceUpgradeCost } from '../game/content/upgradeCosts'
import type { FaceType } from '../game/types/dice'
import { useNewGameStore } from '../store/newGameStore'

interface ForgeImpact {
  cost: number
  type: FaceType
  version: number
}

export function WorkshopScreen() {
  const profile = useNewGameStore((state) => state.profile)
  const goToHub = useNewGameStore((state) => state.goToHub)
  const upgradeFace = useNewGameStore((state) => state.upgradeFace)
  const [selectedDieId, setSelectedDieId] = useState(profile.diceCollection[0]?.id ?? '')
  const [selectedFaceId, setSelectedFaceId] = useState(profile.diceCollection[0]?.faces[0]?.id ?? '')
  const [forgeImpact, setForgeImpact] = useState<ForgeImpact | null>(null)

  const selectedDie = profile.diceCollection.find((die) => die.id === selectedDieId) ?? profile.diceCollection[0]
  const selectedFace = selectedDie?.faces.find((face) => face.id === selectedFaceId) ?? selectedDie?.faces[0]
  const upgradeCost = selectedFace ? getFaceUpgradeCost(selectedFace.value) : null
  const canUpgrade = upgradeCost !== null && profile.bankedSouls >= upgradeCost

  function chooseDie(dieId: string) {
    const die = profile.diceCollection.find((candidate) => candidate.id === dieId)
    if (!die) return
    setSelectedDieId(die.id)
    setSelectedFaceId(die.faces[0].id)
    setForgeImpact(null)
  }

  function chooseFace(faceId: string) {
    setSelectedFaceId(faceId)
    setForgeImpact(null)
  }

  function handleUpgrade() {
    if (!selectedDie || !selectedFace || upgradeCost === null) return
    if (!upgradeFace(selectedDie.id, selectedFace.id)) return
    setForgeImpact((current) => ({
      cost: upgradeCost,
      type: selectedFace.type,
      version: (current?.version ?? 0) + 1,
    }))
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
          <span>Permanent upgrades</span>
          <h1 id="workshop-title">Die Workshop</h1>
        </header>
        <PermanentResourceHud bankedSouls={profile.bankedSouls} compact />
      </section>

      <section className="forge-rack" aria-labelledby="forge-rack-title">
        <header className="forge-section-heading">
          <div><span className="eyebrow">Dice rack</span><h2 id="forge-rack-title">Choose a Die</h2></div>
          <span>{profile.diceCollection.length} owned</span>
        </header>
        <div className="die-tabs" aria-label="Choose a die">
          {profile.diceCollection.map((die) => (
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

      {selectedDie && selectedFace && (
        <section className="forge-bench" aria-labelledby="forge-faces-title">
          <header className="forge-section-heading">
            <div><span className="eyebrow">Face bench</span><h2 id="forge-faces-title">Choose One Face</h2></div>
            <FaceIcon type={selectedDie.family} size={24} />
          </header>

          <div className="workshop-faces">
            {selectedDie.faces.map((face, faceIndex) => (
              <button
                aria-label={`${face.value} ${FACE_META[face.type].label}, face ${faceIndex + 1}`}
                aria-pressed={face.id === selectedFace.id}
                className={`workshop-face workshop-face--${face.type}`}
                key={face.id}
                onClick={() => chooseFace(face.id)}
                type="button"
              >
                <small>Face {faceIndex + 1}</small>
                <motion.strong
                  animate={{ scale: [1.35, 0.9, 1] }}
                  key={`${face.id}-${face.value}`}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  {face.value}
                </motion.strong>
                <FaceIcon type={face.type} size={18} />
              </button>
            ))}
          </div>

          <div className={`forge-anvil forge-anvil--${selectedFace.type}`}>
            <div className="forge-anvil__face">
              <span>Current</span>
              <strong>{selectedFace.value}</strong>
              <FaceIcon type={selectedFace.type} size={20} />
            </div>
            <div className="forge-anvil__tool">
              <Hammer aria-hidden="true" size={26} />
              <span>Forge</span>
            </div>
            <div className="forge-anvil__face forge-anvil__face--next">
              <span>{upgradeCost === null ? 'Maximum' : 'After'}</span>
              <strong>{Math.min(BASE_FACE_CAP, selectedFace.value + 1)}</strong>
              <FaceIcon type={selectedFace.type} size={20} />
            </div>
            {forgeImpact && (
              <motion.div
                animate={{ opacity: [0, 1, 1, 0], scale: [0.7, 1.25, 1, 1.45], x: [76, 32, 0, 0], y: [-76, -35, 0, 0] }}
                className={`forge-impact forge-impact--${forgeImpact.type}`}
                initial={{ opacity: 0 }}
                key={forgeImpact.version}
                transition={{ duration: 0.72, ease: 'easeOut' }}
              >
                <Flame aria-hidden="true" size={16} /> -{forgeImpact.cost}
              </motion.div>
            )}
          </div>

          <div aria-live="polite" className="forge-message">
            {upgradeCost === null
              ? 'This face has reached the current permanent cap.'
              : canUpgrade
                ? `Only Face ${selectedDie.faces.findIndex((face) => face.id === selectedFace.id) + 1} will improve. The other five stay unchanged.`
                : `Extract ${upgradeCost - profile.bankedSouls} more Banked Souls to forge this face.`}
          </div>

          <button
            className="pixel-button pixel-button--upgrade forge-button"
            disabled={!canUpgrade}
            onClick={handleUpgrade}
            type="button"
          >
            <Hammer aria-hidden="true" size={17} />
            {upgradeCost === null
              ? 'Face Cap Reached'
              : canUpgrade
                ? `Forge Face · ${upgradeCost} Souls`
                : `Need ${upgradeCost} Souls`}
          </button>
        </section>
      )}
    </main>
  )
}
