import { ArrowLeft, Gem, LockKeyhole, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { CharmIcon } from '../components/newgame/CharmIcon'
import { FateDrawOverlay } from '../components/newgame/FateDrawOverlay'
import { FateTokenIcon } from '../components/newgame/FateTokenIcon'
import { CHARMS, CHARM_DEFINITIONS } from '../game/content/charms'
import {
  FATE_DRAW_COST,
  MAX_CHARM_RANK,
} from '../game/progression/fate'
import { getCharmCapacity } from '../game/progression/talents'
import type { CharmId } from '../game/types/charms'
import { useNewGameStore } from '../store/newGameStore'

function createOperationId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `fate-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function FateSanctumScreen() {
  const profile = useNewGameStore(useShallow((state) => ({
    charmRanks: state.profile.charmRanks,
    equippedCharmIds: state.profile.equippedCharmIds,
    fateTokens: state.profile.fateTokens,
    pendingFateDraw: state.profile.pendingFateDraw,
    talentRanks: state.profile.talentRanks,
  })))
  const beginFateDraw = useNewGameStore((state) => state.beginFateDraw)
  const claimFateCharm = useNewGameStore((state) => state.claimFateCharm)
  const equipCharm = useNewGameStore((state) => state.equipCharm)
  const unequipCharm = useNewGameStore((state) => state.unequipCharm)
  const goToHub = useNewGameStore((state) => state.goToHub)
  const [animatedOperationId, setAnimatedOperationId] = useState<string | null>(null)
  const [lastClaimed, setLastClaimed] = useState<CharmId | null>(null)
  const capacity = getCharmCapacity(profile.talentRanks)
  const ownedCharms = CHARMS.filter((charm) => (profile.charmRanks[charm.id] ?? 0) > 0)
  const eligibleCount = CHARMS.filter(
    (charm) => (profile.charmRanks[charm.id] ?? 0) < MAX_CHARM_RANK,
  ).length

  const equippedSlots = useMemo(
    () => Array.from({ length: capacity }, (_, index) => profile.equippedCharmIds[index] ?? null),
    [capacity, profile.equippedCharmIds],
  )

  const startDraw = () => {
    setLastClaimed(null)
    const pending = beginFateDraw(createOperationId())
    if (pending) setAnimatedOperationId(pending.operationId)
  }

  const claimSelectedCharm = () => {
    const selectedCharmId = profile.pendingFateDraw?.selectedCharmId
    if (selectedCharmId && claimFateCharm()) {
      setLastClaimed(selectedCharmId)
      setAnimatedOperationId(null)
    }
  }

  return (
    <main className="game-shell fate-screen">
      <header className="fate-header">
        <button aria-label="Back to Hub" className="icon-button" onClick={goToHub} type="button">
          <ArrowLeft aria-hidden="true" size={22} />
        </button>
        <div>
          <span className="eyebrow">Permanent Fatecraft</span>
          <h1>Fate Sanctum</h1>
        </div>
        <div className="fate-token-total">
          <FateTokenIcon size={22} />
          <strong>{profile.fateTokens}</strong>
        </div>
      </header>

      <section className="charm-loadout" aria-labelledby="equipped-charms-title">
        <header>
          <div>
            <span className="eyebrow">Bound to your next descent</span>
            <h2 id="equipped-charms-title">Equipped Charms</h2>
          </div>
          <strong>{profile.equippedCharmIds.length}/{capacity}</strong>
        </header>
        <div className="charm-slots">
          {equippedSlots.length > 0 ? equippedSlots.map((charmId, index) => (
            <div className={`charm-slot${charmId ? ' is-filled' : ''}`} key={charmId ?? `slot-${index}`}>
              {charmId ? (
                <>
                  <CharmIcon charmId={charmId} size={48} />
                  <span>{CHARM_DEFINITIONS[charmId].name}</span>
                  <button onClick={() => unequipCharm(charmId)} type="button">Unbind</button>
                </>
              ) : (
                <>
                  <Gem aria-hidden="true" size={28} />
                  <span>Empty slot</span>
                </>
              )}
            </div>
          )) : (
            <div className="charm-slot charm-slot--locked">
              <LockKeyhole aria-hidden="true" size={28} />
              <span>Purchase Fatecraft to bind Charms.</span>
            </div>
          )}
        </div>
      </section>

      <section className="fate-draw" aria-labelledby="fate-draw-title">
        <header>
          <span className="eyebrow">One permanent result</span>
          <h2 id="fate-draw-title">Fate Draw</h2>
        </header>

        {profile.pendingFateDraw ? (
          <div className="fate-reliquary">
            <img alt="" src="/sprites/charms/fate-reliquary.png" />
            <p>Your result is secured. Complete the reveal to add it to your collection.</p>
          </div>
        ) : (
          <div className="fate-reliquary">
            <img alt="" src="/sprites/charms/fate-reliquary.png" />
            {lastClaimed ? (
              <p><strong>{CHARM_DEFINITIONS[lastClaimed].name}</strong> is now part of your collection.</p>
            ) : (
              <p>Spend Fate Tokens to draw one permanent Charm.</p>
            )}
            <button
              className="pixel-button pixel-button--primary"
              disabled={profile.fateTokens < FATE_DRAW_COST || eligibleCount < 1}
              onClick={startDraw}
              type="button"
            >
              <Sparkles aria-hidden="true" size={18} />
              Draw Fate · {FATE_DRAW_COST}
            </button>
          </div>
        )}
      </section>

      {profile.pendingFateDraw ? (
        <FateDrawOverlay
          animate={animatedOperationId === profile.pendingFateDraw.operationId}
          currentRank={profile.charmRanks[profile.pendingFateDraw.selectedCharmId] ?? 0}
          draw={profile.pendingFateDraw}
          key={profile.pendingFateDraw.operationId}
          onClaim={claimSelectedCharm}
        />
      ) : null}

      <section className="charm-collection" aria-labelledby="charm-collection-title">
        <header>
          <span className="eyebrow">Permanent collection</span>
          <h2 id="charm-collection-title">Charms</h2>
        </header>
        <div className="charm-grid">
          {CHARMS.map((charm) => {
            const rank = profile.charmRanks[charm.id] ?? 0
            const equipped = profile.equippedCharmIds.includes(charm.id)
            const full = profile.equippedCharmIds.length >= capacity
            return (
              <article
                className={`charm-card${rank > 0 ? ' is-owned' : ' is-unknown'}`}
                key={charm.id}
                style={{ '--charm-accent': charm.accent } as CSSProperties}
              >
                <CharmIcon charmId={charm.id} size={56} />
                <div>
                  <h3>{rank > 0 ? charm.name : 'Unknown Charm'}</h3>
                  <span>{rank > 0 ? `Rank ${rank}/${MAX_CHARM_RANK}` : 'Find through Fate Draw'}</span>
                </div>
                {rank > 0 ? (
                  <>
                    <p>{charm.ranks[rank - 1].description}</p>
                    <div className="charm-ranks" aria-label={`Rank ${rank} of ${MAX_CHARM_RANK}`}>
                      {Array.from({ length: MAX_CHARM_RANK }, (_, index) => (
                        <span className={index < rank ? 'is-filled' : ''} key={index} />
                      ))}
                    </div>
                    <button
                      disabled={!equipped && (full || capacity === 0)}
                      onClick={() => (equipped ? unequipCharm(charm.id) : equipCharm(charm.id))}
                      type="button"
                    >
                      {equipped ? 'Unbind' : 'Equip'}
                    </button>
                  </>
                ) : null}
              </article>
            )
          })}
        </div>
        {ownedCharms.length === 0 ? <p className="charm-empty">Your first Fate Draw will begin the collection.</p> : null}
      </section>
    </main>
  )
}
