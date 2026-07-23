import {
  Backpack,
  Castle,
  Dices,
  DoorOpen,
  Hammer,
  RotateCcw,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import { useState } from 'react'
import { DieSummary } from '../components/newgame/DieSummary'
import { PermanentResourceHud } from '../components/newgame/PermanentResourceHud'
import { getDiceCapacity } from '../game/progression/talents'
import { useNewGameStore } from '../store/newGameStore'

export function HubScreen() {
  const [resetIsArmed, setResetIsArmed] = useState(false)
  const profile = useNewGameStore((state) => state.profile)
  const openDungeonSelect = useNewGameStore((state) => state.openDungeonSelect)
  const openWorkshop = useNewGameStore((state) => state.openWorkshop)
  const openTalentTree = useNewGameStore((state) => state.openTalentTree)
  const openLoadout = useNewGameStore((state) => state.openLoadout)
  const resetProgress = useNewGameStore((state) => state.resetProgress)
  const diceCapacity = getDiceCapacity(profile.talentRanks)

  const confirmReset = () => {
    resetProgress()
    setResetIsArmed(false)
  }

  return (
    <main className="game-shell hub-screen">
      <section className="hub-gate" aria-labelledby="hub-title">
        <div aria-hidden="true" className="hub-gate__glow" />
        <span aria-hidden="true" className="hub-soul hub-soul--one" />
        <span aria-hidden="true" className="hub-soul hub-soul--two" />
        <span aria-hidden="true" className="hub-soul hub-soul--three" />
        <div aria-hidden="true" className="hub-gate__door"><DoorOpen size={58} /></div>
        <header className="hub-sign">
          <span>Extraction runner</span>
          <h1 id="hub-title">Dice Dungeon</h1>
        </header>
        <p>Forge permanent dice. Brave the depths. Extract before the dungeon takes your Souls.</p>
      </section>

      <PermanentResourceHud bankedSouls={profile.bankedSouls} xp={profile.xp} />

      <section className="loadout-vault" aria-labelledby="loadout-title">
        <header className="loadout-vault__heading">
          <div>
            <span className="eyebrow">Adventurer's rack</span>
            <h2 id="loadout-title">Equipped Dice</h2>
          </div>
          <span className="loadout-count"><Dices aria-hidden="true" size={14} /> {profile.equippedDieIds.length}/{diceCapacity}</span>
        </header>
        <div className="dice-rack">
          {profile.equippedDieIds.map((dieId) => {
            const die = profile.diceCollection.find((candidate) => candidate.id === dieId)
            return die ? <DieSummary die={die} key={die.id} /> : null
          })}
        </div>
        <button className="loadout-manage" onClick={openLoadout} type="button">
          <Backpack aria-hidden="true" size={16} /> Manage Loadout
        </button>
      </section>

      <footer className="hub-actions">
        <button className="hub-action hub-action--talents" onClick={openTalentTree} type="button">
          <span className="hub-action__icon"><Sparkles aria-hidden="true" size={22} /></span>
          <span><small>Spend permanent XP</small><strong>Talent Tree</strong></span>
        </button>
        <button className="hub-action hub-action--workshop" onClick={openWorkshop} type="button">
          <span className="hub-action__icon"><Hammer aria-hidden="true" size={22} /></span>
          <span><small>Improve permanent faces</small><strong>Enter Workshop</strong></span>
        </button>
        <button className="hub-action hub-action--dungeon" onClick={openDungeonSelect} type="button">
          <span className="hub-action__icon"><Castle aria-hidden="true" size={24} /></span>
          <span><small>Begin an extraction run</small><strong>Enter Dungeon</strong></span>
          <DoorOpen aria-hidden="true" className="hub-action__door" size={20} />
        </button>
      </footer>

      <section
        aria-label="Developer tools"
        className={`dev-reset${resetIsArmed ? ' dev-reset--armed' : ''}`}
      >
        {resetIsArmed ? (
          <div aria-live="polite" className="dev-reset__confirmation">
            <TriangleAlert aria-hidden="true" size={18} />
            <div>
              <strong>Reset all progress?</strong>
              <p>XP, Souls, dice upgrades and the active run will be permanently cleared.</p>
            </div>
            <div className="dev-reset__actions">
              <button
                className="dev-reset__cancel"
                onClick={() => setResetIsArmed(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="dev-reset__confirm"
                onClick={confirmReset}
                type="button"
              >
                Reset everything
              </button>
            </div>
          </div>
        ) : (
          <button
            className="dev-reset__trigger"
            onClick={() => setResetIsArmed(true)}
            type="button"
          >
            <RotateCcw aria-hidden="true" size={14} />
            DEV · Reset game
          </button>
        )}
      </section>
    </main>
  )
}
