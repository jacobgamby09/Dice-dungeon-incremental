import { useState } from 'react'
import { Flame } from 'lucide-react'
import { FaceIcon } from '../components/newgame/FaceIcon'
import { FACE_META } from '../components/newgame/faceVisuals'
import { BASE_FACE_CAP, getFaceUpgradeCost } from '../game/content/upgradeCosts'
import { useNewGameStore } from '../store/newGameStore'

export function WorkshopScreen() {
  const profile = useNewGameStore((state) => state.profile)
  const goToHub = useNewGameStore((state) => state.goToHub)
  const upgradeFace = useNewGameStore((state) => state.upgradeFace)
  const [selectedDieId, setSelectedDieId] = useState(profile.diceCollection[0]?.id ?? '')
  const [selectedFaceId, setSelectedFaceId] = useState(profile.diceCollection[0]?.faces[0]?.id ?? '')

  const selectedDie = profile.diceCollection.find((die) => die.id === selectedDieId) ?? profile.diceCollection[0]
  const selectedFace = selectedDie?.faces.find((face) => face.id === selectedFaceId) ?? selectedDie?.faces[0]
  const upgradeCost = selectedFace ? getFaceUpgradeCost(selectedFace.value) : null
  const canUpgrade = upgradeCost !== null && profile.bankedSouls >= upgradeCost

  function chooseDie(dieId: string) {
    const die = profile.diceCollection.find((candidate) => candidate.id === dieId)
    if (!die) return
    setSelectedDieId(die.id)
    setSelectedFaceId(die.faces[0].id)
  }

  function handleUpgrade() {
    if (!selectedDie || !selectedFace) return
    upgradeFace(selectedDie.id, selectedFace.id)
  }

  return (
    <main className="game-shell workshop-screen">
      <header className="screen-header screen-header--row">
        <div>
          <span className="eyebrow">Permanent upgrades</span>
          <h1>Die Workshop</h1>
        </div>
        <div className="banked-badge"><Flame aria-hidden="true" size={17} /><strong>{profile.bankedSouls}</strong></div>
      </header>

      <section className="die-tabs" aria-label="Choose a die">
        {profile.diceCollection.map((die) => (
          <button
            aria-pressed={die.id === selectedDie?.id}
            className={`die-tab die-tab--${die.family}`}
            key={die.id}
            onClick={() => chooseDie(die.id)}
            type="button"
          >
            <FaceIcon type={die.family} size={17} />
            {die.name}
          </button>
        ))}
      </section>

      {selectedDie && selectedFace && (
        <section className="panel workshop-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Choose one permanent face</span>
              <h2>{selectedDie.name}</h2>
            </div>
            <FaceIcon type={selectedDie.family} size={24} />
          </div>

          <div className="workshop-faces">
            {selectedDie.faces.map((face) => (
              <button
                aria-label={`${face.value} ${FACE_META[face.type].label}, face ${face.id}`}
                aria-pressed={face.id === selectedFace.id}
                className={`workshop-face workshop-face--${face.type}`}
                key={face.id}
                onClick={() => setSelectedFaceId(face.id)}
                type="button"
              >
                <strong>{face.value}</strong>
                <FaceIcon type={face.type} size={18} />
              </button>
            ))}
          </div>

          <div className="upgrade-preview">
            <span className="eyebrow">Selected face</span>
            <div className="upgrade-values">
              <strong>{selectedFace.value}</strong>
              <span>→</span>
              <strong>{Math.min(BASE_FACE_CAP, selectedFace.value + 1)}</strong>
              <FaceIcon type={selectedFace.type} size={20} />
            </div>
            {upgradeCost === null ? (
              <p>Base face cap reached. A future talent will unlock further progression.</p>
            ) : (
              <p>This changes only <code>{selectedFace.id}</code>. The other five faces remain untouched.</p>
            )}
          </div>

          <button
            className="pixel-button pixel-button--upgrade"
            disabled={!canUpgrade}
            onClick={handleUpgrade}
            type="button"
          >
            {upgradeCost === null
              ? 'Face Cap Reached'
              : canUpgrade
                ? `Upgrade for ${upgradeCost} Souls`
                : `Need ${upgradeCost} Souls`}
          </button>
        </section>
      )}

      <button className="pixel-button pixel-button--ghost" onClick={goToHub} type="button">Back to Hub</button>
    </main>
  )
}
