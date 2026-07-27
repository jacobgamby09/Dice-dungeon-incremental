import {
  Backpack,
  Castle,
  Dices,
  DoorOpen,
  FastForward,
  Hammer,
  RotateCcw,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { DieSummary } from '../components/newgame/DieSummary'
import { PermanentResourceHud } from '../components/newgame/PermanentResourceHud'
import { POST_DUNGEON_ONE_DEV_PRESET } from '../game/dev/postDungeonOnePreset'
import { getDiceCapacity } from '../game/progression/talents'
import { useNewGameStore } from '../store/newGameStore'

export function HubScreen() {
  const [devAction, setDevAction] = useState<'preset' | 'reset' | null>(null)
  const [presetLoaded, setPresetLoaded] = useState(false)
  const profile = useNewGameStore(useShallow((state) => ({
    bankedSouls: state.profile.bankedSouls,
    diceCollection: state.profile.diceCollection,
    equippedDieIds: state.profile.equippedDieIds,
    talentRanks: state.profile.talentRanks,
    xp: state.profile.xp,
  })))
  const openDungeonSelect = useNewGameStore((state) => state.openDungeonSelect)
  const openWorkshop = useNewGameStore((state) => state.openWorkshop)
  const openTalentTree = useNewGameStore((state) => state.openTalentTree)
  const openLoadout = useNewGameStore((state) => state.openLoadout)
  const loadPostDungeonOneDevPreset = useNewGameStore(
    (state) => state.loadPostDungeonOneDevPreset,
  )
  const resetProgress = useNewGameStore((state) => state.resetProgress)
  const diceCapacity = getDiceCapacity(profile.talentRanks)

  const confirmReset = () => {
    resetProgress()
    setDevAction(null)
    setPresetLoaded(false)
  }

  const confirmPostDungeonOnePreset = () => {
    loadPostDungeonOneDevPreset()
    setDevAction(null)
    setPresetLoaded(true)
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
          <span>Incremental dice combat</span>
          <h1 id="hub-title">Dice Dungeon</h1>
        </header>
        <p>Forge permanent dice. Brave the depths. Every victory makes you stronger.</p>
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
          <span><small>Begin a dungeon descent</small><strong>Enter Dungeon</strong></span>
          <DoorOpen aria-hidden="true" className="hub-action__door" size={20} />
        </button>
      </footer>

      <section
        aria-label="Developer tools"
        className="dev-tools"
      >
        <span className="dev-tools__label">Developer tools</span>
        {presetLoaded && (
          <p aria-live="polite" className="dev-tools__status">
            Dungeon 2 test profile loaded.
          </p>
        )}

        {devAction === 'preset' ? (
          <div className="dev-preset__confirmation">
            <FastForward aria-hidden="true" size={19} />
            <div>
              <strong>Load post-Dungeon-1 profile?</strong>
              <p>
                Replaces the current save with a realistic boss-clear build and leaves
                The Iron Descent ready to enter.
              </p>
            </div>
            <dl className="dev-preset__summary">
              <div><dt>Max HP</dt><dd>{POST_DUNGEON_ONE_DEV_PRESET.maxHp}</dd></div>
              <div><dt>Loadout</dt><dd>{POST_DUNGEON_ONE_DEV_PRESET.diceCount}/{POST_DUNGEON_ONE_DEV_PRESET.diceSlots}</dd></div>
              <div><dt>Faces</dt><dd>Min {POST_DUNGEON_ONE_DEV_PRESET.faceMinimum}</dd></div>
              <div><dt>Dungeon 1</dt><dd>Cleared</dd></div>
              <div><dt>XP spent</dt><dd>{POST_DUNGEON_ONE_DEV_PRESET.xpSpent}</dd></div>
              <div><dt>Souls spent</dt><dd>{POST_DUNGEON_ONE_DEV_PRESET.soulsSpent}</dd></div>
            </dl>
            <div className="dev-reset__actions">
              <button
                className="dev-reset__cancel"
                onClick={() => setDevAction(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="dev-preset__confirm"
                onClick={confirmPostDungeonOnePreset}
                type="button"
              >
                Load test profile
              </button>
            </div>
          </div>
        ) : devAction === 'reset' ? (
          <div aria-live="polite" className="dev-reset__confirmation">
            <TriangleAlert aria-hidden="true" size={18} />
            <div>
              <strong>Reset all progress?</strong>
              <p>XP, Souls, dice upgrades and the active run will be permanently cleared.</p>
            </div>
            <div className="dev-reset__actions">
              <button
                className="dev-reset__cancel"
                onClick={() => setDevAction(null)}
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
          <div className="dev-tools__triggers">
            <button
              className="dev-preset__trigger"
              onClick={() => setDevAction('preset')}
              type="button"
            >
              <FastForward aria-hidden="true" size={15} />
              DEV · Load Dungeon 2 profile
            </button>
            <button
              className="dev-reset__trigger"
              onClick={() => setDevAction('reset')}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={14} />
              DEV · Reset game
            </button>
          </div>
        )}
      </section>
    </main>
  )
}
