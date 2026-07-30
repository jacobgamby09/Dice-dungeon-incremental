import { ArrowLeft, Gem, LockKeyhole, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { CharmIcon } from '../components/newgame/CharmIcon'
import { FateTokenIcon } from '../components/newgame/FateTokenIcon'
import { CHARMS, CHARM_DEFINITIONS } from '../game/content/charms'
import {
  FATE_DRAW_COST,
  FATE_PITY_THRESHOLD,
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
    fatePity: state.profile.fatePity,
    fateTokens: state.profile.fateTokens,
    pendingFateDraw: state.profile.pendingFateDraw,
    talentRanks: state.profile.talentRanks,
  })))
  const beginFateDraw = useNewGameStore((state) => state.beginFateDraw)
  const claimFateCharm = useNewGameStore((state) => state.claimFateCharm)
  const equipCharm = useNewGameStore((state) => state.equipCharm)
  const unequipCharm = useNewGameStore((state) => state.unequipCharm)
  const goToHub = useNewGameStore((state) => state.goToHub)
  const [revealedCount, setRevealedCount] = useState(0)
  const [lastClaimed, setLastClaimed] = useState<CharmId | null>(null)
  const capacity = getCharmCapacity(profile.talentRanks)
  const ownedCharms = CHARMS.filter((charm) => (profile.charmRanks[charm.id] ?? 0) > 0)
  const eligibleCount = CHARMS.filter(
    (charm) => (profile.charmRanks[charm.id] ?? 0) < MAX_CHARM_RANK,
  ).length

  useEffect(() => {
    if (!profile.pendingFateDraw) return
    const timers = [0, 1, 2].map((index) => window.setTimeout(
      () => setRevealedCount(index + 1),
      320 + index * 360,
    ))
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [profile.pendingFateDraw])

  const equippedSlots = useMemo(
    () => Array.from({ length: capacity }, (_, index) => profile.equippedCharmIds[index] ?? null),
    [capacity, profile.equippedCharmIds],
  )

  const startDraw = () => {
    setLastClaimed(null)
    setRevealedCount(0)
    beginFateDraw(createOperationId())
  }

  const chooseCharm = (charmId: CharmId) => {
    if (claimFateCharm(charmId)) setLastClaimed(charmId)
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

      <section className="fate-pity" aria-label={`Fate pity ${profile.fatePity} of ${FATE_PITY_THRESHOLD}`}>
        <div>
          <span>Fate signal</span>
          <strong>{profile.fatePity}/{FATE_PITY_THRESHOLD}</strong>
        </div>
        <div className="fate-pity__pips" aria-hidden="true">
          {Array.from({ length: FATE_PITY_THRESHOLD }, (_, index) => (
            <span className={index < profile.fatePity ? 'is-filled' : ''} key={index} />
          ))}
        </div>
        <p>A Token is guaranteed on the fifth eligible kill without a drop.</p>
      </section>

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
          <span className="eyebrow">Choose one of three</span>
          <h2 id="fate-draw-title">Fate Draw</h2>
        </header>

        {profile.pendingFateDraw ? (
          <div className="fate-offers" aria-live="polite">
            {profile.pendingFateDraw.offeredCharmIds.map((charmId, index) => {
              const charm = CHARM_DEFINITIONS[charmId]
              const rank = profile.charmRanks[charmId] ?? 0
              const revealed = index < revealedCount
              return (
                <button
                  aria-label={revealed ? `Choose ${charm.name}` : 'Sealed Charm'}
                  className={`fate-offer${revealed ? ' is-revealed' : ''}`}
                  disabled={!revealed || revealedCount < 3}
                  key={charmId}
                  onClick={() => chooseCharm(charmId)}
                  style={{ '--charm-accent': charm.accent } as CSSProperties}
                  type="button"
                >
                  {revealed ? (
                    <>
                      <CharmIcon charmId={charmId} size={58} />
                      <strong>{charm.name}</strong>
                      <span>{rank > 0 ? `Rank ${rank} → ${rank + 1}` : 'New Charm'}</span>
                      <small>{charm.ranks[Math.min(rank, 2)].description}</small>
                    </>
                  ) : (
                    <>
                      <Gem aria-hidden="true" size={38} />
                      <strong>Sealed</strong>
                    </>
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="fate-reliquary">
            <img alt="" src="/sprites/charms/fate-reliquary.png" />
            {lastClaimed ? (
              <p><strong>{CHARM_DEFINITIONS[lastClaimed].name}</strong> is now part of your collection.</p>
            ) : (
              <p>Spend Fate Tokens to reveal three permanent Charms.</p>
            )}
            <button
              className="pixel-button pixel-button--primary"
              disabled={profile.fateTokens < FATE_DRAW_COST || eligibleCount < 3}
              onClick={startDraw}
              type="button"
            >
              <Sparkles aria-hidden="true" size={18} />
              Draw Fate · {FATE_DRAW_COST}
            </button>
          </div>
        )}
      </section>

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
