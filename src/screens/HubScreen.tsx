import {
  Backpack,
  Castle,
  Dices,
  DoorOpen,
  FastForward,
  Hammer,
  RotateCcw,
  Rocket,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from 'react'
import { useShallow } from 'zustand/react/shallow'
import { DieSummary } from '../components/newgame/DieSummary'
import { PermanentResourceHud } from '../components/newgame/PermanentResourceHud'
import { POST_DUNGEON_ONE_DEV_PRESET } from '../game/dev/postDungeonOnePreset'
import { EARLY_QOL_TEST_XP } from '../game/dev/earlyQolPreset'
import { getDiceCapacity } from '../game/progression/talents'
import { useNewGameStore } from '../store/newGameStore'

export function HubScreen() {
  const [devAction, setDevAction] = useState<'early-qol' | 'preset' | 'reset' | null>(null)
  const [loadedPreset, setLoadedPreset] = useState<'early-qol' | 'dungeon-two' | null>(null)
  const [isRackDragging, setIsRackDragging] = useState(false)
  const rackDrag = useRef({
    pointerId: null as number | null,
    startScrollLeft: 0,
    startX: 0,
  })
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
  const loadEarlyQolDevPreset = useNewGameStore((state) => state.loadEarlyQolDevPreset)
  const resetProgress = useNewGameStore((state) => state.resetProgress)
  const diceCapacity = getDiceCapacity(profile.talentRanks)

  useEffect(() => {
    window.scrollTo({ left: 0, top: 0 })
  }, [])

  const confirmReset = () => {
    resetProgress()
    setDevAction(null)
    setLoadedPreset(null)
  }

  const confirmPostDungeonOnePreset = () => {
    loadPostDungeonOneDevPreset()
    setDevAction(null)
    setLoadedPreset('dungeon-two')
  }

  const confirmEarlyQolPreset = () => {
    loadEarlyQolDevPreset()
    setDevAction(null)
    setLoadedPreset('early-qol')
  }

  const startRackDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    rackDrag.current = {
      pointerId: event.pointerId,
      startScrollLeft: event.currentTarget.scrollLeft,
      startX: event.clientX,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsRackDragging(true)
  }

  const moveRackDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (rackDrag.current.pointerId !== event.pointerId) return
    event.preventDefault()
    event.currentTarget.scrollLeft = (
      rackDrag.current.startScrollLeft + rackDrag.current.startX - event.clientX
    )
  }

  const finishRackDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (rackDrag.current.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    rackDrag.current.pointerId = null
    setIsRackDragging(false)
  }

  const scrollRackWithWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    const rack = event.currentTarget
    const maxScrollLeft = rack.scrollWidth - rack.clientWidth
    if (maxScrollLeft <= 0) return

    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ? event.deltaX
      : event.deltaY
    const nextScrollLeft = Math.max(0, Math.min(maxScrollLeft, rack.scrollLeft + delta))
    if (nextScrollLeft === rack.scrollLeft) return

    event.preventDefault()
    rack.scrollLeft = nextScrollLeft
  }

  const navigateRackWithKeyboard = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const rack = event.currentTarget
    const page = Math.max(180, rack.clientWidth * 0.82)
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      rack.scrollBy({ behavior: 'smooth', left: -page })
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      rack.scrollBy({ behavior: 'smooth', left: page })
    } else if (event.key === 'Home') {
      event.preventDefault()
      rack.scrollTo({ behavior: 'smooth', left: 0 })
    } else if (event.key === 'End') {
      event.preventDefault()
      rack.scrollTo({ behavior: 'smooth', left: rack.scrollWidth })
    }
  }

  return (
    <main className="game-shell hub-screen">
      <section className="hub-gate hub-header" aria-labelledby="hub-title">
        <header className="hub-sign">
          <span>Permanent Dice Incremental</span>
          <h1 id="hub-title">Dice Dungeon</h1>
        </header>
        <p>Fail, forge a random face, and return stronger. Every run moves the wall.</p>
      </section>

      <PermanentResourceHud bankedSouls={profile.bankedSouls} xp={profile.xp} />

      <section className="loadout-vault" aria-labelledby="loadout-title">
        <header className="loadout-vault__heading">
          <div>
            <span className="eyebrow">Current build</span>
            <h2 id="loadout-title">Permanent Dice</h2>
          </div>
          <span className="loadout-count"><Dices aria-hidden="true" size={14} /> {profile.equippedDieIds.length}/{diceCapacity}</span>
        </header>
        <div
          aria-label="Equipped permanent dice. Swipe, drag, scroll, or use arrow keys to browse."
          className={`dice-rack${isRackDragging ? ' dice-rack--dragging' : ''}`}
          onDragStart={(event) => event.preventDefault()}
          onKeyDown={navigateRackWithKeyboard}
          onPointerCancel={finishRackDrag}
          onPointerDown={startRackDrag}
          onPointerMove={moveRackDrag}
          onPointerUp={finishRackDrag}
          onWheel={scrollRackWithWheel}
          role="region"
          tabIndex={0}
        >
          {profile.equippedDieIds.map((dieId) => {
            const die = profile.diceCollection.find((candidate) => candidate.id === dieId)
            return die ? <DieSummary die={die} key={die.id} /> : null
          })}
        </div>
      </section>

      <footer className="hub-actions">
        <button className="hub-action hub-action--dungeon" onClick={openDungeonSelect} type="button">
          <span className="hub-action__icon"><Castle aria-hidden="true" size={24} /></span>
          <span><small>Begin a descent</small><strong>Enter Dungeon</strong></span>
          <DoorOpen aria-hidden="true" className="hub-action__door" size={20} />
        </button>
        <button className="hub-action hub-action--talents" onClick={openTalentTree} type="button">
          <span className="hub-action__icon"><Sparkles aria-hidden="true" size={22} /></span>
          <span><small>Spend XP</small><strong>Talent Tree</strong></span>
        </button>
        <button className="hub-action hub-action--workshop" onClick={openWorkshop} type="button">
          <span className="hub-action__icon"><Hammer aria-hidden="true" size={22} /></span>
          <span><small>Improve dice</small><strong>Workshop</strong></span>
        </button>
        <button className="hub-action hub-action--loadout" onClick={openLoadout} type="button">
          <span className="hub-action__icon"><Backpack aria-hidden="true" size={22} /></span>
          <span><small>Choose your dice</small><strong>Loadout</strong></span>
        </button>
      </footer>

      <section
        aria-label="Developer tools"
        className="dev-tools"
      >
        <span className="dev-tools__label">Developer tools</span>
        {loadedPreset ? (
          <p aria-live="polite" className="dev-tools__status">
            {loadedPreset === 'early-qol'
              ? `Fresh QoL test save loaded with ${EARLY_QOL_TEST_XP} XP.`
              : 'Dungeon 2 test profile loaded.'}
          </p>
        ) : null}

        {devAction === 'early-qol' ? (
          <div className="dev-preset__confirmation">
            <Rocket aria-hidden="true" size={19} />
            <div>
              <strong>Start a fresh QoL test?</strong>
              <p>
                Replaces the current save with the normal starting die and exactly
                enough XP to buy the path to Auto Combat and Quick Draw.
              </p>
            </div>
            <dl className="dev-preset__summary">
              <div><dt>Starting XP</dt><dd>{EARLY_QOL_TEST_XP}</dd></div>
              <div><dt>Starting die</dt><dd>1 Attack</dd></div>
              <div><dt>Talents</dt><dd>Unspent</dd></div>
              <div><dt>Dungeon 1</dt><dd>Fresh</dd></div>
            </dl>
            <div className="dev-reset__actions">
              <button className="dev-reset__cancel" onClick={() => setDevAction(null)} type="button">
                Cancel
              </button>
              <button className="dev-preset__confirm" onClick={confirmEarlyQolPreset} type="button">
                Start QoL test
              </button>
            </div>
          </div>
        ) : devAction === 'preset' ? (
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
              <div>
                <dt>Dice</dt>
                <dd>
                  {POST_DUNGEON_ONE_DEV_PRESET.collectionCount} owned ·{' '}
                  {POST_DUNGEON_ONE_DEV_PRESET.equippedCount}/{POST_DUNGEON_ONE_DEV_PRESET.diceSlots} equipped
                </dd>
              </div>
              <div>
                <dt>Faces</dt>
                <dd>
                  Min {POST_DUNGEON_ONE_DEV_PRESET.faceMinimum} ·{' '}
                  {POST_DUNGEON_ONE_DEV_PRESET.evolutionCount} evolutions
                </dd>
              </div>
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
              onClick={() => setDevAction('early-qol')}
              type="button"
            >
              <Rocket aria-hidden="true" size={15} />
              DEV · Fresh QoL test · {EARLY_QOL_TEST_XP} XP
            </button>
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
