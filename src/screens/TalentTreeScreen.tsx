import { Backpack, ChevronLeft, Heart, LockKeyhole, Sparkles, Swords, Zap } from 'lucide-react'
import { TALENTS } from '../game/content/talents'
import { getTalentPurchaseReason } from '../game/progression/talents'
import type { TalentTrack } from '../game/types/progression'
import { useNewGameStore } from '../store/newGameStore'

const TRACK_META: Record<TalentTrack, { label: string; icon: typeof Heart }> = {
  core: { label: 'Foundation', icon: Sparkles },
  survival: { label: 'Survival', icon: Heart },
  arsenal: { label: 'Arsenal', icon: Swords },
  control: { label: 'Control', icon: Zap },
}

const TRACK_ORDER: TalentTrack[] = ['core', 'survival', 'arsenal', 'control']

export function TalentTreeScreen() {
  const profile = useNewGameStore((state) => state.profile)
  const purchaseTalent = useNewGameStore((state) => state.purchaseTalent)
  const openLoadout = useNewGameStore((state) => state.openLoadout)
  const goToHub = useNewGameStore((state) => state.goToHub)

  return (
    <main className="game-shell talent-screen">
      <header className="talent-shrine">
        <button aria-label="Back to Hub" className="talent-shrine__back" onClick={goToHub} type="button">
          <ChevronLeft aria-hidden="true" size={20} />
        </button>
        <Sparkles aria-hidden="true" className="talent-shrine__sigil" size={48} />
        <div>
          <span className="eyebrow">Permanent capability</span>
          <h1>Talent Shrine</h1>
        </div>
        <div className="talent-xp"><Sparkles aria-hidden="true" size={17} /><strong>{profile.xp}</strong><span>XP</span></div>
      </header>

      <p className="talent-intro">XP unlocks what your adventurer can do. Souls never purchase talents.</p>

      <div className="talent-tracks">
        {TRACK_ORDER.map((track) => {
          const meta = TRACK_META[track]
          const TrackIcon = meta.icon
          const talents = TALENTS.filter((talent) => talent.track === track)
          return (
            <section className={`talent-track talent-track--${track}`} key={track}>
              <header><TrackIcon aria-hidden="true" size={18} /><h2>{meta.label}</h2></header>
              <div className="talent-nodes">
                {talents.map((talent) => {
                  const reason = getTalentPurchaseReason(profile, talent)
                  const purchased = reason === 'purchased'
                  const locked = reason === 'prerequisite'
                  return (
                    <button
                      aria-pressed={purchased}
                      className={`talent-node${purchased ? ' talent-node--purchased' : ''}${locked ? ' talent-node--locked' : ''}`}
                      disabled={reason !== null}
                      key={talent.id}
                      onClick={() => purchaseTalent(talent.id)}
                      type="button"
                    >
                      <span className="talent-node__state">
                        {purchased ? <Sparkles aria-hidden="true" size={17} /> : locked ? <LockKeyhole aria-hidden="true" size={16} /> : <span />}
                      </span>
                      <span className="talent-node__copy"><strong>{talent.name}</strong><small>{talent.description}</small></span>
                      <span className="talent-node__cost">{purchased ? 'Active' : `${talent.cost} XP`}</span>
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {profile.diceCollection.length > profile.equippedDieIds.length && (
        <button className="talent-loadout-cta" onClick={openLoadout} type="button">
          <Backpack aria-hidden="true" size={18} /> New dice await in Loadout
        </button>
      )}
    </main>
  )
}
