import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Dices,
  DoorOpen,
  Droplets,
  FastForward,
  Heart,
  Pause,
  Swords,
} from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { EnemySprite } from '../components/EnemySprite'
import { EnemyDamageTransfer } from '../components/newgame/EnemyDamageTransfer'
import { CombatCharmBar } from '../components/newgame/CombatCharmBar'
import { CurrencyIcon } from '../components/newgame/CurrencyIcon'
import type { EnemyDamageTransferPath } from '../components/newgame/EnemyDamageTransfer'
import { EnemyIntentTray } from '../components/newgame/EnemyIntentTray'
import { FaceIcon } from '../components/newgame/FaceIcon'
import { HpBar } from '../components/newgame/HpBar'
import { ImprintInspectOverlay } from '../components/newgame/ImprintInspectOverlay'
import { RollDieTile } from '../components/newgame/RollDieTile'
import { RoundTotalsPanel } from '../components/newgame/RoundTotalsPanel'
import { RunMenu } from '../components/newgame/RunMenu'
import { ScoreTransfer } from '../components/newgame/ScoreTransfer'
import type { ScoreTransferPath } from '../components/newgame/ScoreTransfer'
import {
  AUTO_COMBAT_DRAW_PAUSE_MS,
  AUTO_COMBAT_RESOLVE_PAUSE_MS,
} from '../game/automation/autoCombat'
import { DUNGEONS } from '../game/content/dungeons'
import { totalEnemyRolls } from '../game/combat/rollEnemyDie'
import { getRollContributions } from '../game/combat/rollDie'
import { getEnemyDie } from '../game/content/enemyDice'
import { getRollSpeed, hasAutoCombatUnlocked } from '../game/progression/talents'
import type { ImprintSnapshot } from '../game/types/imprints'
import { useNewGameStore } from '../store/newGameStore'

interface ActiveRoll {
  faceId: string
  stage: 'rolling' | 'landed'
}

const ENEMY_INTENT_ROLL_MS = 480
const ENEMY_INTENT_LANDING_PAUSE_MS = 200
const ENEMY_INTENT_STAGGER_MS = 90
const MIN_STANDARD_LANDING_PAUSE_MS = 120
const MIN_HERO_LANDING_PAUSE_MS = 260

function scaledPresentationDelay(
  baseMilliseconds: number,
  minimumMilliseconds: number,
  speed: number,
) {
  return Math.max(minimumMilliseconds, baseMilliseconds / speed)
}

export function CombatScreen() {
  const profile = useNewGameStore(useShallow((state) => ({
    automationPaused: state.runMenuOpen,
    bankedSouls: state.profile.bankedSouls,
    settings: state.profile.settings,
    talentRanks: state.profile.talentRanks,
  })))
  const run = useNewGameStore(useShallow((state) => ({
    dungeonId: state.run.dungeonId,
    encounterIndex: state.run.encounterIndex,
    playerHp: state.run.playerHp,
    playerMaxHp: state.run.playerMaxHp,
    equippedDiceSnapshot: state.run.equippedDiceSnapshot,
    equippedCharmSnapshot: state.run.equippedCharmSnapshot,
    charmState: state.run.charmState,
    enemy: state.run.enemy,
  })))
  const combat = useNewGameStore(useShallow((state) => ({
    phase: state.combat.phase,
    roundNumber: state.combat.roundNumber,
    drawPileDieIds: state.combat.drawPileDieIds,
    results: state.combat.results,
    totals: state.combat.totals,
    pendingFortify: state.combat.pendingFortify,
    pendingEmpower: state.combat.pendingEmpower,
    pendingWeaken: state.combat.pendingWeaken,
    playerPoison: state.combat.playerPoison,
    lastCharmTriggers: state.combat.lastCharmTriggers,
    charmTriggerVersion: state.combat.charmTriggerVersion,
    carriedShield: state.combat.carriedShield,
    carriedHeal: state.combat.carriedHeal,
    lastResolution: state.combat.lastResolution,
    resolutionVersion: state.combat.resolutionVersion,
    resolutionStep: state.combat.resolutionStep,
  })))
  const drawNextDie = useNewGameStore((state) => state.drawNextDie)
  const finishEnemyIntentReveal = useNewGameStore((state) => state.finishEnemyIntentReveal)
  const beginRoundResolution = useNewGameStore((state) => state.beginRoundResolution)
  const advanceRoundResolution = useNewGameStore((state) => state.advanceRoundResolution)
  const finishRoundResolution = useNewGameStore((state) => state.finishRoundResolution)
  const setAutoCombat = useNewGameStore((state) => state.setAutoCombat)
  const runMenuOpen = useNewGameStore((state) => state.runMenuOpen)
  const openRunMenu = useNewGameStore((state) => state.openRunMenu)
  const closeRunMenu = useNewGameStore((state) => state.closeRunMenu)
  const leaveDungeonRun = useNewGameStore((state) => state.leaveDungeonRun)

  const [activeRoll, setActiveRoll] = useState<ActiveRoll | null>(null)
  const [scoreTransfer, setScoreTransfer] = useState<ScoreTransferPath | null>(null)
  const [inspectedImprint, setInspectedImprint] = useState<ImprintSnapshot | null>(null)
  const [enemyHitVersion, setEnemyHitVersion] = useState(0)
  const [enemyAttackVersion, setEnemyAttackVersion] = useState(0)
  const [enemyDamageTransfer, setEnemyDamageTransfer] = useState<EnemyDamageTransferPath | null>(null)
  const rollTimers = useRef<number[]>([])
  const activeDieElement = useRef<HTMLDivElement | null>(null)
  const enemyIntentElement = useRef<HTMLSpanElement | null>(null)
  const playerHealthElement = useRef<HTMLDivElement | null>(null)
  const scoreStageElement = useRef<HTMLDivElement | null>(null)
  const scoreTargetElement = useRef<HTMLDivElement | null>(null)

  useEffect(() => () => {
    rollTimers.current.forEach((timer) => window.clearTimeout(timer))
  }, [])

  const completeScoreTransfer = useCallback(() => {
    setScoreTransfer(null)
    rollTimers.current = []
  }, [])

  const completeEnemyDamageTransfer = useCallback(() => {
    setEnemyDamageTransfer(null)
  }, [])

  const closeImprintInspection = useCallback(() => {
    setInspectedImprint(null)
  }, [])

  const rollSpeed = getRollSpeed(
    profile.talentRanks,
    profile.settings.rollSpeed,
  )

  useEffect(() => {
    const resolution = combat.lastResolution
    if (combat.phase !== 'resolving' || !resolution) return
    const resolutionStep = combat.resolutionStep ?? 'player'

    const timers: number[] = []
    if (
      resolutionStep === 'player'
      && resolution.attackDamageToEnemy + resolution.bleedDamageToEnemy > 0
    ) {
      timers.push(window.setTimeout(() => {
        setEnemyHitVersion((version) => version + 1)
      }, 0))
    }
    if (resolutionStep === 'player' && resolution.enemyActed) {
      timers.push(window.setTimeout(() => {
        advanceRoundResolution()
      }, scaledPresentationDelay(720, 420, rollSpeed)))
    } else if (resolutionStep === 'enemy_heal') {
      timers.push(window.setTimeout(() => {
        advanceRoundResolution()
      }, scaledPresentationDelay(620, 360, rollSpeed)))
    } else if (resolutionStep === 'enemy_attack') {
      timers.push(window.setTimeout(() => {
        setEnemyAttackVersion((version) => version + 1)
        const sourceRect = enemyIntentElement.current?.getBoundingClientRect()
        const targetRect = playerHealthElement.current?.getBoundingClientRect()
        if (sourceRect && targetRect) {
          setEnemyDamageTransfer({
            blocked: resolution.enemyDamageBlocked,
            fromX: sourceRect.left + sourceRect.width / 2,
            fromY: sourceRect.top + sourceRect.height / 2,
            incoming: resolution.enemyDamageBlocked + resolution.playerDamageTaken,
            taken: resolution.playerDamageTaken,
            toX: targetRect.left + targetRect.width / 2,
            toY: targetRect.top + targetRect.height / 2,
          })
        }
      }, 0))
      timers.push(window.setTimeout(() => {
        finishRoundResolution()
      }, scaledPresentationDelay(860, 520, rollSpeed)))
    } else {
      timers.push(window.setTimeout(() => {
        finishRoundResolution()
      }, scaledPresentationDelay(900, 480, rollSpeed)))
    }

    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [
    advanceRoundResolution,
    combat.lastResolution,
    combat.phase,
    combat.resolutionStep,
    combat.resolutionVersion,
    finishRoundResolution,
    rollSpeed,
  ])

  useEffect(() => {
    if (combat.phase !== 'revealing_enemy_intent') return
    const revealDuration = (
      ENEMY_INTENT_ROLL_MS
      + ENEMY_INTENT_STAGGER_MS * Math.max(0, (run.enemy?.intentRolls.length ?? 1) - 1)
      + ENEMY_INTENT_LANDING_PAUSE_MS
    ) / rollSpeed
    const timer = window.setTimeout(() => {
      finishEnemyIntentReveal()
    }, revealDuration)
    return () => window.clearTimeout(timer)
  }, [
    combat.phase,
    finishEnemyIntentReveal,
    rollSpeed,
    run.enemy?.intentRolls.length,
  ])

  const diceLeft = combat.drawPileDieIds.length
  const pendingFaceId = activeRoll?.faceId ?? scoreTransfer?.faceId ?? null
  const pendingResult = pendingFaceId
    ? combat.results.find((result) => result.faceId === pendingFaceId)
    : undefined
  const scoredResults = pendingFaceId
    ? combat.results.filter((result) => result.faceId !== pendingFaceId)
    : combat.results
  const rollContributions = getRollContributions(
    combat.results,
    diceLeft,
    {
      enemyHp: run.enemy?.hp,
      enemyMaxHp: run.enemy?.maxHp,
    },
  )
  const pendingContribution = pendingFaceId
    ? rollContributions.find(({ result }) => result.faceId === pendingFaceId)
    : undefined
  const displayedTotals = pendingResult
    ? {
        ...combat.totals,
        [pendingResult.type]: Math.max(
          0,
          combat.totals[pendingResult.type] - (pendingContribution?.totalValue ?? pendingResult.value),
        ),
        attack: Math.max(
          0,
          combat.totals.attack
            - (pendingResult.type === 'attack' ? (pendingContribution?.totalValue ?? pendingResult.value) : 0)
        ),
        shield: Math.max(
          0,
          combat.totals.shield
            - (pendingResult.type === 'shield' ? (pendingContribution?.totalValue ?? pendingResult.value) : 0)
            - (pendingResult.type === 'shield' ? 0 : (pendingContribution?.fortifyBonus ?? 0)),
        ),
      }
    : combat.totals
  const displayedFortify = pendingFaceId ? 0 : combat.pendingFortify
  const autoCombatUnlocked = hasAutoCombatUnlocked(profile.talentRanks)
  const rollDurationMilliseconds = 620 / rollSpeed
  const rollDurationSeconds = rollDurationMilliseconds / 1000
  const isScoreAnimating = pendingFaceId !== null
  const animationLabel = activeRoll?.stage === 'rolling' ? 'Rolling...' : 'Scoring...'
  const activeDie = activeRoll && pendingResult
    ? run.equippedDiceSnapshot.find((candidate) => candidate.id === pendingResult.dieId)
    : undefined
  const roundReady = diceLeft === 0 && !isScoreAnimating
  const hasVisibleRoundPower = scoredResults.length > 0
    || combat.carriedHeal > 0
    || combat.carriedShield > 0
    || displayedFortify > 0
    || displayedTotals.bleed > 0
    || displayedTotals.ward > 0
    || displayedTotals.regrowth > 0
    || displayedTotals.overflow > 0
  const resolution = combat.lastResolution
  const resolutionTone = resolution?.outcome === 'victory'
    ? 'victory'
    : combat.resolutionStep === 'enemy_heal'
      ? 'heal'
      : combat.resolutionStep === 'enemy_attack'
        ? resolution?.enemyDamageBlocked && !resolution.playerDamageTaken
          ? 'block'
          : 'enemy'
        : 'player'
  const enemyHpImpact = combat.phase === 'resolving'
    ? combat.resolutionStep === 'enemy_heal'
      ? 'heal'
      : combat.resolutionStep === 'player'
        && resolution
        && resolution.attackDamageToEnemy + resolution.bleedDamageToEnemy > 0
        ? 'damage'
        : null
    : null
  const playerHpImpact = combat.phase === 'resolving'
    && combat.resolutionStep === 'enemy_attack'
    && resolution
    ? resolution.playerDamageTaken > 0
      ? 'damage'
      : resolution.enemyDamageBlocked > 0
        ? 'block'
        : null
    : null
  const rollState = activeRoll?.stage ?? (scoreTransfer ? 'scoring' : 'idle')
  const resolutionMessage = resolution
    ? resolution.outcome === 'victory'
      ? 'Enemy defeated — intent cancelled'
      : combat.resolutionStep === 'enemy_heal'
        ? `${run.enemy?.name ?? 'Enemy'} heals ${resolution.enemyHealApplied}`
        : combat.resolutionStep === 'enemy_attack'
          ? resolution.enemyDamageBlocked > 0 && resolution.playerDamageTaken > 0
            ? `${resolution.enemyDamageBlocked} blocked · ${resolution.playerDamageTaken} damage`
            : resolution.enemyDamageBlocked > 0
              ? `Blocked ${resolution.enemyDamageBlocked} damage`
              : `${resolution.playerDamageTaken} damage taken`
          : resolution.bleedDamageToEnemy > 0
            ? `Bleed ${resolution.bleedDamageToEnemy} · Attack ${resolution.attackDamageToEnemy}`
            : `Attack lands for ${resolution.attackDamageToEnemy}`
    : ''

  const handleDraw = useCallback(() => {
    if (isScoreAnimating) return
    const result = drawNextDie()
    if (!result) return
    const resultContribution = getRollContributions(
      [...combat.results, result],
      Math.max(0, diceLeft - 1),
      {
        enemyHp: run.enemy?.hp,
        enemyMaxHp: run.enemy?.maxHp,
      },
    ).at(-1)
    setActiveRoll({ faceId: result.faceId, stage: 'rolling' })

    const landingTimer = window.setTimeout(() => {
      setActiveRoll({ faceId: result.faceId, stage: 'landed' })

      const collectionTimer = window.setTimeout(() => {
        const sourceRect = activeDieElement.current?.getBoundingClientRect()
        const existingTypeTarget = scoreStageElement.current?.querySelector<HTMLElement>(
          `[data-total-type="${result.type}"]`,
        )
        const totalsRail = existingTypeTarget?.parentElement
        if (existingTypeTarget && totalsRail) {
          totalsRail.scrollLeft = Math.max(
            0,
            existingTypeTarget.offsetLeft - totalsRail.clientWidth / 2 + existingTypeTarget.offsetWidth / 2,
          )
        }
        const targetRect = (existingTypeTarget ?? scoreTargetElement.current)?.getBoundingClientRect()
        const fromX = sourceRect ? sourceRect.left + sourceRect.width / 2 : window.innerWidth / 2
        const fromY = sourceRect ? sourceRect.top + sourceRect.height / 2 : window.innerHeight / 2
        const toX = targetRect ? targetRect.left + targetRect.width / 2 : window.innerWidth / 2
        const toY = targetRect ? targetRect.top + targetRect.height / 2 : fromY - 100

        setScoreTransfer({
          drainAttackValue: resultContribution?.drainAttackValue,
          executeBonus: resultContribution?.executeBonus,
          faceId: result.faceId,
          fortifyArmed: resultContribution?.fortifyArmed,
          fortifyBonus: resultContribution?.fortifyBonus,
          type: result.type,
          value: resultContribution?.totalValue ?? result.value,
          signature: result.signature,
          imprint: result.imprint,
          imprintBonus: result.imprintBonus,
          fromX,
          fromY,
          toX,
          toY,
          duration: Math.max(0.3, 0.46 / rollSpeed),
        })
        setActiveRoll(null)
      }, result.signature || result.imprint
        ? scaledPresentationDelay(360, MIN_HERO_LANDING_PAUSE_MS, rollSpeed)
        : scaledPresentationDelay(260, MIN_STANDARD_LANDING_PAUSE_MS, rollSpeed))

      rollTimers.current.push(collectionTimer)
    }, rollDurationMilliseconds)

    rollTimers.current = [landingTimer]
  }, [
    combat.results,
    diceLeft,
    drawNextDie,
    isScoreAnimating,
    rollDurationMilliseconds,
    rollSpeed,
    run.enemy?.hp,
    run.enemy?.maxHp,
  ])

  useEffect(() => {
    if (!profile.settings.autoCombat || profile.automationPaused || inspectedImprint) return
    if (combat.phase !== 'awaiting_roll' || diceLeft <= 0 || isScoreAnimating) return
    const timer = window.setTimeout(
      handleDraw,
      scaledPresentationDelay(AUTO_COMBAT_DRAW_PAUSE_MS, 80, rollSpeed),
    )
    return () => window.clearTimeout(timer)
  }, [
    combat.phase,
    diceLeft,
    handleDraw,
    inspectedImprint,
    isScoreAnimating,
    profile.automationPaused,
    profile.settings.autoCombat,
    rollSpeed,
  ])

  useEffect(() => {
    if (!profile.settings.autoCombat || profile.automationPaused || inspectedImprint) return
    if (combat.phase !== 'awaiting_resolve' || isScoreAnimating) return
    const timer = window.setTimeout(() => {
      beginRoundResolution()
    }, scaledPresentationDelay(AUTO_COMBAT_RESOLVE_PAUSE_MS, 120, rollSpeed))
    return () => window.clearTimeout(timer)
  }, [
    beginRoundResolution,
    combat.phase,
    isScoreAnimating,
    inspectedImprint,
    profile.automationPaused,
    profile.settings.autoCombat,
    rollSpeed,
  ])

  const enemy = run.enemy
  if (!enemy || !run.dungeonId) return null
  const dungeon = DUNGEONS[run.dungeonId]
  const floor = dungeon.floors[run.encounterIndex]
  const enemyDefeated = enemy.hp <= 0
  const enemyDice = enemy.dieIds.map(getEnemyDie)
  const enemyIntentTotals = totalEnemyRolls(enemy.intentRolls)
  const enemyIntentStage = enemyDefeated
    ? 'cancelled'
    : combat.phase === 'revealing_enemy_intent'
      ? 'rolling'
      : combat.phase === 'resolving' && combat.resolutionStep === 'enemy_heal'
        ? 'healing'
        : combat.phase === 'resolving' && combat.resolutionStep === 'enemy_attack'
        ? 'attacking'
        : 'landed'

  return (
    <main
      className={`game-shell combat-screen combat-screen--${combat.phase}${profile.settings.autoCombat ? ' combat-screen--auto' : ''}`}
      data-roll-state={rollState}
    >
      <header className="combat-meta">
        <button
          aria-label="Open run menu"
          className="run-menu-trigger"
          disabled={combat.phase === 'resolving'}
          onClick={openRunMenu}
          title="Run menu"
          type="button"
        >
          <DoorOpen aria-hidden="true" size={17} />
        </button>
        <div><span>Floor</span><strong>{run.encounterIndex + 1}/{dungeon.floors.length}</strong></div>
        <div><span>Round</span><strong>{combat.roundNumber}</strong></div>
        <div className="permanent-souls"><CurrencyIcon currency="souls" size={17} /><strong>{profile.bankedSouls}</strong><span>souls</span></div>
      </header>

      <section
        className={[
          'enemy-zone',
          floor.isBoss ? 'enemy-zone--boss' : '',
          `enemy-zone--${enemyDefeated ? 'defeated' : combat.resolutionStep ?? 'watching'}`,
          enemyHpImpact ? `enemy-zone--impact-${enemyHpImpact}` : '',
        ].filter(Boolean).join(' ')}
        aria-label={`${enemy.name}, ${enemy.hp} health`}
      >
        <div className="enemy-zone__sprite">
          <EnemySprite
            enemyAttackVersion={enemyAttackVersion}
            enemyHitVersion={enemyHitVersion}
            enemyName={enemy.spriteName}
            hp={enemy.hp}
            size={6}
          />
        </div>
        <div className="enemy-zone__intel">
          <header className="enemy-zone__title">
            <span className="eyebrow">Enemy ahead</span>
            <h1>{enemy.name}</h1>
            <span className="enemy-zone__level">
              {floor.isBoss ? 'Boss' : enemy.level >= 3 ? `Elite · Level ${enemy.level}` : `Level ${enemy.level}`}
            </span>
          </header>
          <EnemyIntentTray
            activeShield={enemy.shield}
            attackTotalRef={enemyIntentElement}
            dice={enemyDice}
            key={`${combat.roundNumber}-${enemy.intentRolls.map((roll) => roll.faceId).join('-')}`}
            rollDuration={ENEMY_INTENT_ROLL_MS / 1000 / rollSpeed}
            rollStagger={ENEMY_INTENT_STAGGER_MS / 1000 / rollSpeed}
            stage={enemyIntentStage}
            results={enemy.intentRolls}
            totals={enemyIntentTotals}
          />
        </div>
        <div className="enemy-zone__vitals">
          <div className="hp-label">
            <span>HP</span>
            {enemy.bleed > 0 ? (
              <span
                aria-label={`${enemy.bleed} Bleed`}
                className="enemy-bleed"
                key={`bleed-${enemy.bleed}-${combat.resolutionVersion}`}
              >
                <Droplets aria-hidden="true" size={11} /> {enemy.bleed}
              </span>
            ) : null}
            {enemy.poison > 0 ? (
              <span aria-label={`${enemy.poison} Poison`} className="combat-status combat-status--poison">
                <FaceIcon type="poison" size={11} /> {enemy.poison}
              </span>
            ) : null}
            <strong>{enemy.hp}/{enemy.maxHp}</strong>
          </div>
          <HpBar
            current={enemy.hp}
            impact={enemyHpImpact}
            impactVersion={combat.resolutionVersion}
            max={enemy.maxHp}
            tone="enemy"
          />
        </div>
      </section>

      <section
        className={`player-zone${hasVisibleRoundPower ? ' player-zone--with-totals' : ''}${playerHpImpact ? ` player-zone--impact-${playerHpImpact}` : ''}`}
        aria-label="Adventurer status and round power"
      >
        <div className="player-vitals">
          <span className="player-vitals__label">Adventurer</span>
          <div className="player-health" ref={playerHealthElement}>
            <Heart aria-hidden="true" size={18} />
            <strong>{run.playerHp}</strong>
            <span>/ {run.playerMaxHp} HP</span>
          </div>
        </div>
        <HpBar
          current={run.playerHp}
          impact={playerHpImpact}
          impactVersion={combat.resolutionVersion}
          max={run.playerMaxHp}
        />
        {combat.playerPoison > 0 || combat.pendingWeaken > 0 || combat.pendingEmpower > 0 ? (
          <div aria-label="Active combat statuses" className="combat-statuses">
            {combat.playerPoison > 0 ? (
              <span className="combat-status combat-status--poison">
                <FaceIcon type="poison" size={13} /> Poison {combat.playerPoison}
              </span>
            ) : null}
            {combat.pendingWeaken > 0 ? (
              <span className="combat-status combat-status--weaken">
                <FaceIcon type="weaken" size={13} /> Weaken {combat.pendingWeaken}
              </span>
            ) : null}
            {combat.pendingEmpower > 0 ? (
              <span className="combat-status combat-status--empower">
                <FaceIcon type="empower" size={13} /> Empower {combat.pendingEmpower}
              </span>
            ) : null}
          </div>
        ) : null}
        <CombatCharmBar
          charms={run.equippedCharmSnapshot}
          charmState={run.charmState}
          charmTriggerVersion={combat.charmTriggerVersion}
          triggers={combat.lastCharmTriggers}
        />
        <div className="round-totals-stage" ref={scoreStageElement}>
          <RoundTotalsPanel
            carriedHeal={combat.carriedHeal}
            carriedShield={combat.carriedShield}
            pendingFortify={displayedFortify}
            results={scoredResults}
            totals={displayedTotals}
          />
          <div aria-hidden="true" className="score-target-anchor" ref={scoreTargetElement} />
        </div>
        {combat.phase === 'resolving' && combat.lastResolution && (
          <div className={`resolution-banner resolution-banner--${resolutionTone}`} role="status">
            {resolutionMessage}
          </div>
        )}
      </section>

      <section className="roll-zone" aria-label="Played dice">
        <header className="dice-stage-header">
          <div>
            <span className="eyebrow">Loadout order</span>
            <h2>{roundReady ? 'Round armed' : 'Roll your dice'}</h2>
          </div>
          <div className="bag-counter" aria-label={`${diceLeft} dice left in bag`}>
            <Dices aria-hidden="true" size={17} />
            <strong>{diceLeft}</strong>
            <span>left</span>
          </div>
        </header>

        <div className="dice-arena">
          <div className={`roll-pedestal roll-pedestal--${rollState}${activeDie ? ' roll-pedestal--active' : ''}`}>
            {activeDie && pendingResult && activeRoll ? (
              <RollDieTile
                activeElementRef={activeDieElement}
                die={activeDie}
                key={pendingResult.faceId}
                result={pendingResult}
                rollDuration={rollDurationSeconds}
                stage={activeRoll.stage}
              />
            ) : null}
          </div>

          <div className="played-dice-rack">
            <span className="played-dice-rack__label">
              {scoredResults.length > 0 ? `Draw order · ${scoredResults.length} played` : 'Draw order · no results yet'}
            </span>
            <div className="roll-grid">
              {scoredResults.map((result) => {
                const die = run.equippedDiceSnapshot.find((candidate) => candidate.id === result.dieId)
                return die ? (
                  <RollDieTile
                    die={die}
                    key={result.faceId}
                    onInspectImprint={result.imprint
                      ? () => setInspectedImprint(result.imprint ?? null)
                      : undefined}
                    result={result}
                    rollDuration={rollDurationSeconds}
                    stage="settled"
                  />
                ) : null
              })}
            </div>
          </div>
        </div>
      </section>

      <footer className="combat-actions">
        {autoCombatUnlocked && (
          <button
            aria-label={profile.settings.autoCombat ? 'Pause Auto Combat' : 'Enable Auto Combat'}
            aria-pressed={profile.settings.autoCombat}
            className={`auto-combat-toggle${profile.settings.autoCombat ? ' auto-combat-toggle--active' : ''}`}
            onClick={() => setAutoCombat(!profile.settings.autoCombat)}
            type="button"
          >
            {profile.settings.autoCombat
              ? <Pause aria-hidden="true" size={16} />
              : <FastForward aria-hidden="true" size={16} />}
            <span>
              <strong>Auto Combat</strong>
              <small>{profile.settings.autoCombat ? 'Running · tap to pause' : 'Off · tap to enable'}</small>
            </span>
          </button>
        )}
        {combat.phase === 'awaiting_resolve' ? (
          <button
            className={`pixel-button pixel-button--resolve${profile.settings.autoCombat ? ' pixel-button--automation' : ''}`}
            disabled={isScoreAnimating || profile.settings.autoCombat}
            onClick={() => beginRoundResolution()}
            type="button"
          >
            <Swords aria-hidden="true" size={18} />
            {profile.settings.autoCombat
              ? 'Auto resolving...'
              : isScoreAnimating
                ? animationLabel
                : 'Resolve Round'}
          </button>
        ) : (
          <button
            className={`pixel-button pixel-button--primary${profile.settings.autoCombat ? ' pixel-button--automation' : ''}`}
            disabled={combat.phase !== 'awaiting_roll' || isScoreAnimating || profile.settings.autoCombat}
            onClick={handleDraw}
            type="button"
          >
            <Dices aria-hidden="true" size={18} />
            {profile.settings.autoCombat
              ? 'Auto combat running...'
              : combat.phase === 'revealing_enemy_intent'
                ? 'Enemy rolling...'
              : isScoreAnimating
              ? animationLabel
              : diceLeft > 0
                ? `Draw (${diceLeft} left)`
                : combat.phase === 'resolving'
                  ? 'Resolving...'
                  : 'Waiting...'}
          </button>
        )}
      </footer>
      {scoreTransfer && <ScoreTransfer onComplete={completeScoreTransfer} path={scoreTransfer} />}
      {inspectedImprint ? (
        <ImprintInspectOverlay
          imprint={inspectedImprint}
          onClose={closeImprintInspection}
        />
      ) : null}
      {enemyDamageTransfer && (
        <EnemyDamageTransfer
          onComplete={completeEnemyDamageTransfer}
          path={enemyDamageTransfer}
        />
      )}
      {runMenuOpen && (
        <RunMenu onClose={closeRunMenu} onLeave={leaveDungeonRun} />
      )}
    </main>
  )
}
