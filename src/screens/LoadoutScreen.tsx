import { useCallback, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Backpack,
  Check,
  ChevronLeft,
  Info,
  LockKeyhole,
} from 'lucide-react'
import { DieDetailsPanel } from '../components/newgame/DieDetailsPanel'
import { DieSummary } from '../components/newgame/DieSummary'
import { FaceIcon } from '../components/newgame/FaceIcon'
import { getDiceCapacity } from '../game/progression/talents'
import { useNewGameStore } from '../store/newGameStore'

export function LoadoutScreen() {
  const diceCollection = useNewGameStore((state) => state.profile.diceCollection)
  const equippedDieIds = useNewGameStore((state) => state.profile.equippedDieIds)
  const talentRanks = useNewGameStore((state) => state.profile.talentRanks)
  const equipDie = useNewGameStore((state) => state.equipDie)
  const unequipDie = useNewGameStore((state) => state.unequipDie)
  const moveEquippedDie = useNewGameStore((state) => state.moveEquippedDie)
  const goToHub = useNewGameStore((state) => state.goToHub)
  const capacity = getDiceCapacity(talentRanks)
  const [inspectedDieId, setInspectedDieId] = useState<string | null>(null)
  const inspectedDie = diceCollection.find((die) => die.id === inspectedDieId) ?? null
  const closeDieDetails = useCallback(() => setInspectedDieId(null), [])

  return (
    <main className="game-shell loadout-screen">
      <header className="collection-header">
        <button aria-label="Back to Hub" className="collection-header__back" onClick={goToHub} type="button">
          <ChevronLeft aria-hidden="true" size={20} />
        </button>
        <div>
          <span className="eyebrow">Permanent collection</span>
          <h1>Loadout Rack</h1>
        </div>
        <div className="capacity-badge" aria-label={`${equippedDieIds.length} of ${capacity} dice slots equipped`}>
          <Backpack aria-hidden="true" size={18} />
          <strong>{equippedDieIds.length}/{capacity}</strong>
        </div>
      </header>

      <p className="collection-intro">Choose which owned dice enter the next run. Active runs keep their original snapshot.</p>

      <section aria-labelledby="loadout-order-title" className="loadout-order">
        <header>
          <div>
            <span className="eyebrow">Combat sequence</span>
            <h2 id="loadout-order-title">Roll Order</h2>
          </div>
          <small>Slot 1 rolls first</small>
        </header>
        <ol>
          {equippedDieIds.map((dieId, index) => {
            const die = diceCollection.find((candidate) => candidate.id === dieId)
            if (!die) return null
            return (
              <li key={die.id}>
                <strong aria-label={`Roll slot ${index + 1}`}>{index + 1}</strong>
                <FaceIcon type={die.family} size={18} />
                <span>{die.name}</span>
                <div>
                  <button
                    aria-label={`Move ${die.name} earlier`}
                    disabled={index === 0}
                    onClick={() => moveEquippedDie(die.id, -1)}
                    type="button"
                  >
                    <ArrowUp aria-hidden="true" size={16} />
                  </button>
                  <button
                    aria-label={`Move ${die.name} later`}
                    disabled={index === equippedDieIds.length - 1}
                    onClick={() => moveEquippedDie(die.id, 1)}
                    type="button"
                  >
                    <ArrowDown aria-hidden="true" size={16} />
                  </button>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="collection-rack" aria-label="Owned permanent dice">
        {diceCollection.map((die) => {
          const equipped = equippedDieIds.includes(die.id)
          const loadoutFull = equippedDieIds.length >= capacity
          const lastEquippedDie = equipped && equippedDieIds.length <= 1
          return (
            <article className={`collection-die${equipped ? ' collection-die--equipped' : ''}`} key={die.id}>
              <DieSummary die={die} compact />
              <div className="collection-die__actions">
                <button
                  className="collection-details"
                  onClick={() => setInspectedDieId(die.id)}
                  type="button"
                >
                  <Info aria-hidden="true" size={15} /> Details
                </button>
                <button
                  aria-pressed={equipped}
                  className="collection-toggle"
                  disabled={equipped ? lastEquippedDie : loadoutFull}
                  onClick={() => (equipped ? unequipDie(die.id) : equipDie(die.id))}
                  type="button"
                >
                  {equipped ? <Check aria-hidden="true" size={16} /> : <Backpack aria-hidden="true" size={16} />}
                  {equipped ? (lastEquippedDie ? 'Required' : 'Unequip') : loadoutFull ? 'Slots Full' : 'Equip'}
                </button>
              </div>
            </article>
          )
        })}
      </section>

      <aside className="collection-rule">
        <LockKeyhole aria-hidden="true" size={18} />
        <p>Each die is a unique permanent object. Unlocks add one concrete die—never infinite copies.</p>
      </aside>
      <DieDetailsPanel die={inspectedDie} onClose={closeDieDetails} />
    </main>
  )
}
