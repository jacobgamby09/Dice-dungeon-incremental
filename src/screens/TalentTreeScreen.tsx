import { ChevronLeft, LocateFixed, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { TalentDetailPanel } from '../components/newgame/TalentDetailPanel'
import { TalentTreeCanvas } from '../components/newgame/TalentTreeCanvas'
import type {
  TalentCanvasFocusRequest,
  TalentCanvasNode,
} from '../components/newgame/TalentTreeCanvas'
import type { TalentNodeState } from '../components/newgame/TalentNode'
import { getTalentTreeFrontierPoint } from '../components/newgame/talentTreeLayout'
import { TALENTS, TALENTS_BY_ID } from '../game/content/talents'
import {
  areTalentPrerequisitesMet,
  getNextTalentRank,
  getTalentMaxRank,
  getTalentRank,
  getTalentVisibility,
} from '../game/progression/talents'
import type { TalentVisibility } from '../game/progression/talents'
import type {
  TalentDefinition,
  TalentRanks,
} from '../game/types/progression'
import { useNewGameStore } from '../store/newGameStore'

type CeremonyStage = 'rolling' | 'propagating' | 'revealing'

interface VisibilityChange {
  after: TalentVisibility
  before: TalentVisibility
  talentId: string
}

interface PurchaseCeremony {
  changes: VisibilityChange[]
  focusPoint: TalentCanvasFocusRequest['point']
  rank: number
  talentId: string
}

function getTalentDepth(
  talent: TalentDefinition,
  visited: ReadonlySet<string> = new Set(),
): number {
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
  const talentRanks = useNewGameStore((state) => state.profile.talentRanks)
  const purchaseTalent = useNewGameStore((state) => state.purchaseTalent)
  const goToHub = useNewGameStore((state) => state.goToHub)

  const [selectedTalentId, setSelectedTalentId] = useState<string | null>(null)
  const [ceremony, setCeremony] = useState<PurchaseCeremony | null>(null)
  const [ceremonyStage, setCeremonyStage] = useState<CeremonyStage>('rolling')
  const [focusRequest, setFocusRequest] = useState<TalentCanvasFocusRequest>(() => ({
    id: 0,
    point: getTalentTreeFrontierPoint(talentRanks),
  }))

  const selectedTalent = selectedTalentId ? TALENTS_BY_ID[selectedTalentId] : null
  const selectedRank = selectedTalent ? getTalentRank(talentRanks, selectedTalent.id) : 0
  const selectedNextRank = selectedTalent
    ? getNextTalentRank(talentRanks, selectedTalent)
    : null
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
    const propagationDelay = reduceMotion ? 20 : 640
    const revealDelay = reduceMotion ? 40 : 1010
    const finishDelay = reduceMotion ? 90 : hasReveal ? 1840 : 860

    const propagationTimer = window.setTimeout(
      () => setCeremonyStage('propagating'),
      propagationDelay,
    )
    const revealTimer = hasReveal
      ? window.setTimeout(() => {
          setCeremonyStage('revealing')
          setFocusRequest((current) => ({
            id: current.id + 1,
            point: ceremony.focusPoint,
          }))
        }, revealDelay)
      : null
    const finishTimer = window.setTimeout(() => setCeremony(null), finishDelay)

    return () => {
      window.clearTimeout(propagationTimer)
      if (revealTimer !== null) window.clearTimeout(revealTimer)
      window.clearTimeout(finishTimer)
    }
  }, [ceremony])

  const canvasNodes = useMemo<TalentCanvasNode[]>(() => TALENTS.flatMap((talent) => {
    const actualVisibility = getTalentVisibility(talentRanks, talent)
    const visibility = ceremony && ceremonyStage !== 'revealing'
      ? ceremony.changes.find((change) => change.talentId === talent.id)?.before
        ?? actualVisibility
      : actualVisibility
    const state = getNodeState(talent, talentRanks, visibility, xp)
    if (!state) return []

    const rank = getTalentRank(talentRanks, talent.id)
    const nextRank = getNextTalentRank(talentRanks, talent)
    const revealIndex = ceremony?.changes.findIndex(
      (change) => change.talentId === talent.id,
    ) ?? -1

    return [{
      isActivating: ceremony?.talentId === talent.id && ceremonyStage === 'rolling',
      isAffordable: Boolean(
        nextRank
        && areTalentPrerequisitesMet(talentRanks, talent)
        && xp >= nextRank.cost,
      ),
      isNew: Boolean(ceremony && ceremonyStage === 'revealing' && revealIndex >= 0),
      nextCost: nextRank?.cost ?? null,
      rank,
      revealOrder: Math.max(0, revealIndex),
      state,
      talent,
    }]
  }), [ceremony, ceremonyStage, talentRanks, xp])

  const chargingTalentIds = useMemo(
    () => ceremony && ceremonyStage !== 'rolling'
      ? ceremony.changes.map((change) => change.talentId)
      : [],
    [ceremony, ceremonyStage],
  )

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
      focusPoint: getTalentTreeFrontierPoint(afterRanks),
      rank: currentRank + 1,
      talentId: selectedTalent.id,
    })
  }

  const recenterTree = () => {
    setFocusRequest((current) => ({
      id: current.id + 1,
      point: getTalentTreeFrontierPoint(talentRanks),
    }))
  }

  return (
    <main className="game-shell talent-canvas-screen">
      <h1 className="talent-canvas-screen__title">Talent Tree</h1>

      <div className="talent-canvas-hud">
        <button
          aria-label="Back to Hub"
          className="talent-canvas-hud__button"
          disabled={Boolean(ceremony)}
          onClick={goToHub}
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={22} />
        </button>

        <div
          aria-label={`${xp} permanent XP available`}
          className={`talent-canvas-xp${ceremony ? ' talent-canvas-xp--spending' : ''}`}
        >
          <Sparkles aria-hidden="true" size={15} />
          <strong>{xp}</strong>
          <span>XP</span>
        </div>
      </div>

      <TalentTreeCanvas
        chargingTalentIds={chargingTalentIds}
        disabled={Boolean(ceremony)}
        focusRequest={focusRequest}
        nodes={canvasNodes}
        onClearSelection={() => setSelectedTalentId(null)}
        onSelectTalent={selectTalent}
        selectedTalentId={selectedTalentId}
      />

      <button
        aria-label="Center on current frontier"
        className="talent-canvas-recenter"
        disabled={Boolean(ceremony)}
        onClick={recenterTree}
        type="button"
      >
        <LocateFixed aria-hidden="true" size={19} />
      </button>

      <div aria-live="polite" className="talent-canvas-status">
        {ceremony && (
          <span>
            <Sparkles aria-hidden="true" size={12} />
            {ceremonyStage === 'rolling'
              ? `${TALENTS_BY_ID[ceremony.talentId].name} awakening`
              : ceremonyStage === 'propagating'
                ? 'Power moving through the dark'
                : ceremony.changes.length > 0
                  ? 'A new path emerges'
                  : `Rank ${ceremony.rank} awakened`}
          </span>
        )}
      </div>

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
