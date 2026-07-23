import { useEffect, useState } from 'react'
import { Backpack, ChevronLeft, Dices, Heart, Sparkles } from 'lucide-react'
import { TalentDetailPanel } from '../components/newgame/TalentDetailPanel'
import { TalentNode } from '../components/newgame/TalentNode'
import type { TalentNodeState } from '../components/newgame/TalentNode'
import { TALENT_IDS, TALENTS, TALENTS_BY_ID } from '../game/content/talents'
import {
  areTalentPrerequisitesMet,
  getDiceCapacity,
  getNextTalentRank,
  getPlayerMaxHp,
  getTalentMaxRank,
  getTalentRank,
  getTalentVisibility,
} from '../game/progression/talents'
import type {
  TalentDefinition,
  TalentRanks,
  TalentTrack,
} from '../game/types/progression'
import type { TalentVisibility } from '../game/progression/talents'
import { useNewGameStore } from '../store/newGameStore'

const CORE_TALENTS = TALENTS.filter((talent) => talent.track === 'core')
const BRANCH_TRACKS: Exclude<TalentTrack, 'core'>[] = ['survival', 'arsenal', 'control']

const TRACK_META: Record<Exclude<TalentTrack, 'core'>, { label: string; subtitle: string }> = {
  survival: { label: 'Survival', subtitle: 'Endure' },
  arsenal: { label: 'Arsenal', subtitle: 'Expand' },
  control: { label: 'Control', subtitle: 'Automate' },
}

type CeremonyStage = 'rolling' | 'propagating' | 'revealing'

interface VisibilityChange {
  after: TalentVisibility
  before: TalentVisibility
  talentId: string
}

interface PurchaseCeremony {
  changes: VisibilityChange[]
  rank: number
  talentId: string
}

function getTalentDepth(talent: TalentDefinition, visited: ReadonlySet<string> = new Set()): number {
  if (talent.prerequisiteIds.length === 0 || visited.has(talent.id)) return 0

  const nextVisited = new Set(visited)
  nextVisited.add(talent.id)
  return 1 + Math.max(...talent.prerequisiteIds.map((prerequisiteId) => {
    const prerequisite = TALENTS_BY_ID[prerequisiteId]
    return prerequisite ? getTalentDepth(prerequisite, nextVisited) : 0
  }))
}

function getNodeState(
  talent: TalentDefinition,
  talentRanks: Readonly<TalentRanks>,
  visibility: TalentVisibility,
  xp: number,
): TalentNodeState | null {
  if (visibility === 'hidden') return null
  if (visibility === 'silhouette') return 'silhouette'

  const rank = getTalentRank(talentRanks, talent.id)
  if (rank >= getTalentMaxRank(talent)) return 'maxed'
  if (!areTalentPrerequisitesMet(talentRanks, talent)) return 'locked'
  if (rank > 0) return 'active'

  const nextRank = getNextTalentRank(talentRanks, talent)
  return nextRank && xp >= nextRank.cost ? 'ready' : 'unaffordable'
}

function getVisibilityChanges(
  beforeRanks: Readonly<TalentRanks>,
  afterRanks: Readonly<TalentRanks>,
): VisibilityChange[] {
  return TALENTS
    .map((talent) => ({
      after: getTalentVisibility(afterRanks, talent),
      before: getTalentVisibility(beforeRanks, talent),
      talentId: talent.id,
    }))
    .filter((change) => change.before !== change.after)
    .sort((left, right) => (
      getTalentDepth(TALENTS_BY_ID[left.talentId])
      - getTalentDepth(TALENTS_BY_ID[right.talentId])
    ))
}

export function TalentTreeScreen() {
  const xp = useNewGameStore((state) => state.profile.xp)
  const diceCollectionCount = useNewGameStore((state) => state.profile.diceCollection.length)
  const equippedDiceCount = useNewGameStore((state) => state.profile.equippedDieIds.length)
  const talentRanks = useNewGameStore((state) => state.profile.talentRanks)
  const purchaseTalent = useNewGameStore((state) => state.purchaseTalent)
  const goToHub = useNewGameStore((state) => state.goToHub)

  const [selectedTalentId, setSelectedTalentId] = useState<string | null>(null)
  const [ceremony, setCeremony] = useState<PurchaseCeremony | null>(null)
  const [ceremonyStage, setCeremonyStage] = useState<CeremonyStage>('rolling')

  const diceCapacity = getDiceCapacity(talentRanks)
  const maxHp = getPlayerMaxHp(talentRanks)
  const selectedTalent = selectedTalentId ? TALENTS_BY_ID[selectedTalentId] : null
  const selectedRank = selectedTalent ? getTalentRank(talentRanks, selectedTalent.id) : 0
  const selectedNextRank = selectedTalent ? getNextTalentRank(talentRanks, selectedTalent) : null
  const selectedVisibility = selectedTalent
    ? getTalentVisibility(talentRanks, selectedTalent)
    : 'hidden'
  const selectedNodeState = selectedTalent
    ? getNodeState(selectedTalent, talentRanks, selectedVisibility, xp)
    : null
  const selectedIsAffordable = Boolean(
    selectedTalent
    && selectedNextRank
    && areTalentPrerequisitesMet(talentRanks, selectedTalent)
    && xp >= selectedNextRank.cost,
  )

  useEffect(() => {
    if (!ceremony) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const hasReveal = ceremony.changes.length > 0
    const propagationDelay = reduceMotion ? 20 : 650
    const revealDelay = reduceMotion ? 40 : 960
    const finishDelay = reduceMotion ? 80 : hasReveal ? 1740 : 820

    const timers = [
      window.setTimeout(() => setCeremonyStage('propagating'), propagationDelay),
      ...(hasReveal
        ? [window.setTimeout(() => setCeremonyStage('revealing'), revealDelay)]
        : []),
      window.setTimeout(() => setCeremony(null), finishDelay),
    ]

    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [ceremony])

  const displayVisibility = (talent: TalentDefinition): TalentVisibility => {
    const actualVisibility = getTalentVisibility(talentRanks, talent)
    if (!ceremony || ceremonyStage === 'revealing') return actualVisibility
    return ceremony.changes.find((change) => change.talentId === talent.id)?.before
      ?? actualVisibility
  }

  const visibleCoreTalents = CORE_TALENTS.filter(
    (talent) => displayVisibility(talent) !== 'hidden',
  )

  const visibleBranchTalents = Object.fromEntries(
    BRANCH_TRACKS.map((track) => [
      track,
      TALENTS.filter((talent) => (
        talent.track === track && displayVisibility(talent) !== 'hidden'
      )),
    ]),
  ) as Record<Exclude<TalentTrack, 'core'>, TalentDefinition[]>

  const branchFanVisible = BRANCH_TRACKS.some(
    (track) => visibleBranchTalents[track].length > 0,
  )
  const shieldcraftPurchased = getTalentRank(talentRanks, TALENT_IDS.shieldcraft) > 0

  const selectTalent = (talent: TalentDefinition) => {
    if (ceremony) return
    setSelectedTalentId(talent.id)
  }

  const confirmPurchase = () => {
    if (!selectedTalent || !selectedNextRank || ceremony) return

    const currentRank = getTalentRank(talentRanks, selectedTalent.id)
    const afterRanks = {
      ...talentRanks,
      [selectedTalent.id]: currentRank + 1,
    }
    const changes = getVisibilityChanges(talentRanks, afterRanks)

    if (!purchaseTalent(selectedTalent.id)) return

    setSelectedTalentId(null)
    setCeremonyStage('rolling')
    setCeremony({
      changes,
      rank: currentRank + 1,
      talentId: selectedTalent.id,
    })
  }

  const renderNode = (talent: TalentDefinition, branchIndex = 0) => {
    const visibility = displayVisibility(talent)
    const state = getNodeState(talent, talentRanks, visibility, xp)
    if (!state) return null

    const rank = getTalentRank(talentRanks, talent.id)
    const nextRank = getNextTalentRank(talentRanks, talent)
    const revealOrder = Math.max(
      0,
      ceremony?.changes.findIndex((change) => change.talentId === talent.id) ?? 0,
    )
    const isNew = Boolean(
      ceremony
      && ceremonyStage === 'revealing'
      && ceremony.changes.some((change) => change.talentId === talent.id),
    )
    const isAffordable = Boolean(
      nextRank
      && areTalentPrerequisitesMet(talentRanks, talent)
      && xp >= nextRank.cost,
    )

    return (
      <TalentNode
        disabled={Boolean(ceremony)}
        isActivating={ceremony?.talentId === talent.id && ceremonyStage === 'rolling'}
        isAffordable={isAffordable}
        isNew={isNew}
        isSelected={selectedTalentId === talent.id}
        key={talent.id}
        nextCost={nextRank?.cost ?? null}
        onSelect={selectTalent}
        rank={rank}
        revealOrder={isNew ? revealOrder + branchIndex : 0}
        state={state}
        talent={talent}
      />
    )
  }

  return (
    <main className="game-shell talent-screen">
      <header className="talent-header">
        <button
          aria-label="Back to Hub"
          className="talent-header__back"
          disabled={Boolean(ceremony)}
          onClick={goToHub}
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={20} />
        </button>
        <div>
          <span className="eyebrow">Permanent progression</span>
          <h1>Talent Tree</h1>
          <p>Spend XP to awaken new capabilities.</p>
        </div>
        <div
          aria-label={`${xp} permanent XP available`}
          className={`talent-xp${ceremony ? ' talent-xp--spending' : ''}`}
        >
          <Sparkles aria-hidden="true" size={15} />
          <strong>{xp}</strong>
          <span>XP</span>
        </div>
      </header>

      <section className="talent-ledger" aria-label="Permanent capability summary">
        <div><Heart aria-hidden="true" size={15} /><span>Max HP</span><strong>{maxHp}</strong></div>
        <div><Backpack aria-hidden="true" size={15} /><span>Loadout</span><strong>{equippedDiceCount}/{diceCapacity}</strong></div>
        <div><Dices aria-hidden="true" size={15} /><span>Owned</span><strong>{diceCollectionCount}</strong></div>
      </section>

      <section className="talent-map" aria-label="Permanent talent tree">
        <header className="talent-map__heading">
          <span>Foundation</span>
          <strong>Awaken the path</strong>
        </header>

        <div className="talent-core-path">
          {visibleCoreTalents.map((talent, index) => {
            const isCharging = Boolean(
              ceremony
              && (ceremonyStage === 'propagating' || ceremonyStage === 'revealing')
              && ceremony.changes.some((change) => change.talentId === talent.id),
            )
            return (
              <div
                className={`talent-node-slot${isCharging ? ' talent-node-slot--charging' : ''}`}
                key={talent.id}
              >
                {index > 0 && <span aria-hidden="true" className="talent-connector" />}
                {renderNode(talent)}
              </div>
            )
          })}
        </div>

        {branchFanVisible && (
          <>
            <div
              aria-hidden="true"
              className={[
                'talent-split',
                shieldcraftPurchased ? 'talent-split--active' : 'talent-split--veiled',
                ceremony?.talentId === TALENT_IDS.shieldcraft
                  && ceremonyStage !== 'rolling'
                  ? 'talent-split--charging'
                  : '',
              ].filter(Boolean).join(' ')}
            >
              <span /><span /><Sparkles size={17} /><span /><span />
            </div>

            <div className={`talent-branches${shieldcraftPurchased ? ' talent-branches--revealed' : ' talent-branches--veiled'}`}>
              {BRANCH_TRACKS.map((track, branchIndex) => {
                const talents = visibleBranchTalents[track]
                const meta = TRACK_META[track]
                return (
                  <section className={`talent-branch talent-branch--${track}`} key={track}>
                    <header aria-hidden={!shieldcraftPurchased}>
                      <span>{shieldcraftPurchased ? meta.subtitle : 'Sealed'}</span>
                      <h2>{shieldcraftPurchased ? meta.label : 'Unknown'}</h2>
                    </header>
                    <div className="talent-branch__path">
                      {talents.map((talent, index) => {
                        const isCharging = Boolean(
                          ceremony
                          && (ceremonyStage === 'propagating' || ceremonyStage === 'revealing')
                          && ceremony.changes.some((change) => change.talentId === talent.id),
                        )
                        return (
                          <div
                            className={`talent-node-slot${isCharging ? ' talent-node-slot--charging' : ''}`}
                            key={talent.id}
                          >
                            {(index > 0 || branchFanVisible) && (
                              <span aria-hidden="true" className="talent-connector" />
                            )}
                            {renderNode(talent, branchIndex)}
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
            </div>
          </>
        )}

        <div aria-live="polite" className="talent-ceremony-status">
          {ceremony && (
            <span>
              <Sparkles aria-hidden="true" size={12} />
              {ceremonyStage === 'rolling'
                ? `${TALENTS_BY_ID[ceremony.talentId].name} awakening`
                : ceremonyStage === 'propagating'
                  ? 'Power moving through the path'
                  : ceremony.changes.length > 0
                    ? 'New paths revealed'
                    : `Rank ${ceremony.rank} active`}
            </span>
          )}
        </div>
      </section>

      <TalentDetailPanel
        isAnimating={Boolean(ceremony)}
        isAffordable={selectedIsAffordable}
        nextRank={selectedNextRank}
        nodeState={
          selectedNodeState && selectedNodeState !== 'silhouette'
            ? selectedNodeState
            : 'locked'
        }
        onClose={() => setSelectedTalentId(null)}
        onPurchase={confirmPurchase}
        rank={selectedRank}
        talent={selectedTalent}
        xp={xp}
      />
    </main>
  )
}
