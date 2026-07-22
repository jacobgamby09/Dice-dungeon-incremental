import { useState } from 'react'
import { Backpack, ChevronLeft, Dice6, Heart, Sparkles } from 'lucide-react'
import { TalentDialog } from '../components/newgame/TalentDialog'
import { TalentNode } from '../components/newgame/TalentNode'
import type { TalentNodeState } from '../components/newgame/TalentNode'
import { createDieById } from '../game/content/dice'
import { TALENT_IDS, TALENTS, TALENTS_BY_ID } from '../game/content/talents'
import { getDiceCapacity, getPlayerMaxHp, isTalentRevealed } from '../game/progression/talents'
import type { TalentDefinition, TalentTrack } from '../game/types/progression'
import { useNewGameStore } from '../store/newGameStore'

const CORE_TALENTS = TALENTS.filter((talent) => talent.track === 'core')
const BRANCH_TRACKS: Exclude<TalentTrack, 'core'>[] = ['survival', 'arsenal', 'control']

const TRACK_META: Record<Exclude<TalentTrack, 'core'>, { label: string; subtitle: string }> = {
  survival: { label: 'Survival', subtitle: 'Endure' },
  arsenal: { label: 'Arsenal', subtitle: 'Expand' },
  control: { label: 'Control', subtitle: 'Automate' },
}

function getNodeState(
  talent: TalentDefinition,
  xp: number,
  unlockedTalentIds: readonly string[],
): TalentNodeState {
  if (!isTalentRevealed(unlockedTalentIds, talent)) return 'hidden'
  if (unlockedTalentIds.includes(talent.id)) return 'purchased'
  if (talent.prerequisiteIds.some((id) => !unlockedTalentIds.includes(id))) return 'locked'
  if (xp < talent.cost) return 'too-expensive'
  return 'ready'
}

function getConnectionState(nodeState: TalentNodeState): 'dark' | 'reachable' | 'lit' {
  if (nodeState === 'purchased') return 'lit'
  if (nodeState === 'ready' || nodeState === 'too-expensive') return 'reachable'
  return 'dark'
}

export function TalentTreeScreen() {
  const xp = useNewGameStore((state) => state.profile.xp)
  const diceCollection = useNewGameStore((state) => state.profile.diceCollection)
  const equippedDieIds = useNewGameStore((state) => state.profile.equippedDieIds)
  const unlockedTalentIds = useNewGameStore((state) => state.profile.unlockedTalentIds)
  const purchaseTalent = useNewGameStore((state) => state.purchaseTalent)
  const openLoadout = useNewGameStore((state) => state.openLoadout)
  const goToHub = useNewGameStore((state) => state.goToHub)
  const [detailTalentId, setDetailTalentId] = useState<string | null>(null)
  const [rewardTalentId, setRewardTalentId] = useState<string | null>(null)
  const [newTalentIds, setNewTalentIds] = useState<string[]>([])

  const diceCapacity = getDiceCapacity(unlockedTalentIds)
  const maxHp = getPlayerMaxHp(unlockedTalentIds)
  const detailTalent = detailTalentId ? TALENTS_BY_ID[detailTalentId] : null
  const rewardTalent = rewardTalentId ? TALENTS_BY_ID[rewardTalentId] : null

  const presentedTalent = rewardTalent ?? detailTalent
  const grantedDice = presentedTalent?.effects.flatMap((effect) => {
    if (effect.type !== 'grant_die') return []
    const die = createDieById(effect.dieId)
    return die ? [die] : []
  }) ?? []

  const selectTalent = (talent: TalentDefinition) => {
    setNewTalentIds((current) => current.filter((id) => id !== talent.id))
    setDetailTalentId(talent.id)
  }

  const confirmPurchase = () => {
    if (!detailTalent) return
    const beforeUnlocked = unlockedTalentIds
    if (!purchaseTalent(detailTalent.id)) return

    const afterUnlocked = [...beforeUnlocked, detailTalent.id]
    const revealedByPurchase = TALENTS.filter((talent) => (
      !afterUnlocked.includes(talent.id)
      && (
        (!isTalentRevealed(beforeUnlocked, talent) && isTalentRevealed(afterUnlocked, talent))
        || talent.prerequisiteIds.includes(detailTalent.id)
      )
    )).map((talent) => talent.id)

    setNewTalentIds(revealedByPurchase)
    setRewardTalentId(detailTalent.id)
    setDetailTalentId(null)
  }

  const closeDialog = () => {
    setDetailTalentId(null)
    setRewardTalentId(null)
  }

  const goToLoadout = () => {
    closeDialog()
    openLoadout()
  }

  const shieldcraftPurchased = unlockedTalentIds.includes(TALENT_IDS.shieldcraft)

  return (
    <main className="game-shell talent-screen">
      <header className="talent-shrine">
        <button aria-label="Back to Hub" className="talent-shrine__back" onClick={goToHub} type="button">
          <ChevronLeft aria-hidden="true" size={20} />
        </button>
        <div className="talent-shrine__sigil" aria-hidden="true">
          <span /><Sparkles size={31} /><span />
        </div>
        <div className="talent-shrine__title">
          <span className="eyebrow">Permanent capability</span>
          <h1>Talent Shrine</h1>
          <p>Awaken what your adventurer can do.</p>
        </div>
        <div className="talent-xp" aria-label={`${xp} permanent XP available`}>
          <Sparkles aria-hidden="true" size={16} />
          <strong>{xp}</strong>
          <span>XP</span>
        </div>
      </header>

      <section className="talent-ledger" aria-label="Permanent capability summary">
        <div><Heart aria-hidden="true" size={15} /><span>Max HP</span><strong>{maxHp}</strong></div>
        <div><Backpack aria-hidden="true" size={15} /><span>Loadout</span><strong>{equippedDieIds.length}/{diceCapacity}</strong></div>
        <div><Dice6 aria-hidden="true" size={15} /><span>Owned</span><strong>{diceCollection.length}</strong></div>
      </section>

      <p className="talent-intro"><Sparkles aria-hidden="true" size={14} /> XP opens capabilities. Souls strengthen individual faces in the Workshop.</p>

      <section className="talent-tree" aria-label="MVP talent tree">
        <div className="talent-tree__arch" aria-hidden="true"><span /><span /><span /></div>
        <header className="talent-tree__plaque">
          <span>Awakening path</span>
          <strong>Follow the cyan current</strong>
        </header>

        <div className="talent-core" aria-label="Foundation talents">
          {CORE_TALENTS.map((talent, index) => {
            const nodeState = getNodeState(talent, xp, unlockedTalentIds)
            return (
              <div
                className={`talent-path-step talent-connector--${getConnectionState(nodeState)}`}
                key={talent.id}
              >
                {index > 0 && <span className="talent-path-step__line" aria-hidden="true" />}
                <TalentNode
                  isNew={newTalentIds.includes(talent.id)}
                  isSelected={detailTalentId === talent.id}
                  onSelect={selectTalent}
                  state={nodeState}
                  talent={talent}
                  xp={xp}
                />
              </div>
            )
          })}
        </div>

        <div className={`talent-junction${shieldcraftPurchased ? ' talent-junction--active' : ''}`} aria-hidden="true">
          <span /><span /><Sparkles size={18} /><span /><span />
        </div>

        <div className={`talent-branch-fan${shieldcraftPurchased ? ' talent-branch-fan--open' : ''}`}>
          {BRANCH_TRACKS.map((track) => {
            const meta = TRACK_META[track]
            const branchTalents = TALENTS.filter((talent) => talent.track === track)
            return (
              <section className={`talent-branch talent-branch--${track}`} key={track}>
                <header>
                  <span>{meta.subtitle}</span>
                  <h2>{meta.label}</h2>
                </header>
                <div className="talent-branch__nodes">
                  {branchTalents.map((talent, index) => {
                    const nodeState = getNodeState(talent, xp, unlockedTalentIds)
                    return (
                      <div
                        className={`talent-branch__step talent-connector--${getConnectionState(nodeState)}`}
                        key={talent.id}
                      >
                        {index > 0 && <span className="talent-branch__line" aria-hidden="true" />}
                        <TalentNode
                          isNew={newTalentIds.includes(talent.id)}
                          isSelected={detailTalentId === talent.id}
                          onSelect={selectTalent}
                          state={nodeState}
                          talent={talent}
                          xp={xp}
                        />
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>

        <footer className="talent-tree__depths" aria-hidden="true">
          <span /><strong>Deeper paths sealed</strong><span />
        </footer>
      </section>

      {detailTalent && (
        <TalentDialog
          grantedDice={grantedDice}
          mode="preview"
          nodeState={getNodeState(detailTalent, xp, unlockedTalentIds) as Exclude<TalentNodeState, 'hidden'>}
          onClose={closeDialog}
          onConfirm={confirmPurchase}
          onOpenLoadout={goToLoadout}
          talent={detailTalent}
          xp={xp}
        />
      )}

      {rewardTalent && (
        <TalentDialog
          grantedDice={grantedDice}
          mode="reward"
          nodeState="purchased"
          onClose={closeDialog}
          onConfirm={confirmPurchase}
          onOpenLoadout={goToLoadout}
          talent={rewardTalent}
          xp={xp}
        />
      )}
    </main>
  )
}
