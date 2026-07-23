import { Backpack, Check, ChevronLeft, LockKeyhole } from 'lucide-react'
import { DieSummary } from '../components/newgame/DieSummary'
import { getDiceCapacity } from '../game/progression/talents'
import { useNewGameStore } from '../store/newGameStore'

export function LoadoutScreen() {
  const diceCollection = useNewGameStore((state) => state.profile.diceCollection)
  const equippedDieIds = useNewGameStore((state) => state.profile.equippedDieIds)
  const talentRanks = useNewGameStore((state) => state.profile.talentRanks)
  const equipDie = useNewGameStore((state) => state.equipDie)
  const unequipDie = useNewGameStore((state) => state.unequipDie)
  const goToHub = useNewGameStore((state) => state.goToHub)
  const capacity = getDiceCapacity(talentRanks)

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

      <section className="collection-rack" aria-label="Owned permanent dice">
        {diceCollection.map((die) => {
          const equipped = equippedDieIds.includes(die.id)
          const loadoutFull = equippedDieIds.length >= capacity
          const lastEquippedDie = equipped && equippedDieIds.length <= 1
          return (
            <article className={`collection-die${equipped ? ' collection-die--equipped' : ''}`} key={die.id}>
              <DieSummary die={die} compact />
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
            </article>
          )
        })}
      </section>

      <aside className="collection-rule">
        <LockKeyhole aria-hidden="true" size={18} />
        <p>Each die is a unique permanent object. Unlocks add one concrete die—never infinite copies.</p>
      </aside>
    </main>
  )
}
