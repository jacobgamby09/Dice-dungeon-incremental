import { useCallback, useEffect, useRef, useState } from 'react'
import { Dices, DoorOpen, Droplets, Flame, Heart, Swords } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { EnemySprite } from '../components/EnemySprite'
import { EnemyDamageTransfer } from '../components/newgame/EnemyDamageTransfer'
import type { EnemyDamageTransferPath } from '../components/newgame/EnemyDamageTransfer'
import { EnemyIntentTray } from '../components/newgame/EnemyIntentTray'
import { HpBar } from '../components/newgame/HpBar'
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
import { getEnemyDie } from '../game/content/enemyDice'
import { getRollSpeed, hasAutoCombatUnlocked } from '../game/progression/talents'
import { useNewGameStore } from '../store/newGameStore'

interface ActiveRoll {
  faceId: string
  stage: 'rolling' | 'landed'
}

const ENEMY_INTENT_ROLL_MS = 480
const ENEMY_INTENT_LANDING_PAUSE_MS = 200
const ENEMY_INTENT_STAGGER_MS = 90

export function CombatScreen() {
  const profile = useNewGameStore(useShallow((state) => ({
    automationPaused: state.awayRecap !== null || state.runMenuOpen,
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
    enemy: state.run.enemy,
  })))
  const combat = useNewGameStore(useShallow((state) => ({
    phase: state.combat.phase,
    roundNumber: state.combat.roundNumber,
    drawPileDieIds: state.combat.drawPileDieIds,
    results: state.combat.results,
    totals: state.combat.totals,
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
  const checkpointAutoCombat = useNewGameStore((state) => state.checkpointAutoCombat)
  const runMenuOpen = useNewGameStore((state) => state.runMenuOpen)
  const openRunMenu = useNewGameStore((state) => state.openRunMenu)
  const closeRunMenu = useNewGameStore((state) => state.closeRunMenu)
  const leaveDungeonRun = useNewGameStore((state) => state.leaveDungeonRun)

  const [activeRoll, setActiveRoll] = useState<ActiveRoll | null>(null)
  const [scoreTransfer, setScoreTransfer] = useState<ScoreTransferPath | null>(null)
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
        checkpointAutoCombat()
      }, 720))
    } else if (resolutionStep === 'enemy_heal') {
      timers.push(window.setTimeout(() => {
        advanceRoundResolution()
        checkpointAutoCombat()
      }, 620))
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
        checkpointAutoCombat()
      }, 860))
    } else {
      timers.push(window.setTimeout(() => {
        finishRoundResolution()
        checkpointAutoCombat()
      }, 900))
    }

    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [
    advanceRoundResolution,
    checkpointAutoCombat,
    combat.lastResolution,
    combat.phase,
    combat.resolutionStep,
    combat.resolutionVersion,
    finishRoundResolution,
  ])

  const rollSpeed = getRollSpeed(
    profile.talentRanks,
    profile.settings.rollSpeed,
  )

  useEffect(() => {
    if (combat.phase !== 'revealing_enemy_intent') return
    const revealDuration = (
      ENEMY_INTENT_ROLL_MS
      + ENEMY_INTENT_STAGGER_MS * Math.max(0, (run.enemy?.intentRolls.length ?? 1) - 1)
      + ENEMY_INTENT_LANDING_PAUSE_MS
    ) / rollSpeed
    const timer = window.setTimeout(() => {
      finishEnemyIntentReveal()
      checkpointAutoCombat()
    }, revealDuration)
    return () => window.clearTimeout(timer)
  }, [
    checkpointAutoCombat,
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
  const displayedTotals = pendingResult
    ? {
        ...combat.totals,
        [pendingResult.type]: Math.max(0, combat.totals[pendingResult.type] - pendingResult.value),
      }
    : combat.totals
  const autoCombatUnlocked = hasAutoCombatUnlocked(profile.talentRanks)
  const rollDurationMilliseconds = 620 / rollSpeed
  const rollDurationSeconds = rollDurationMilliseconds / 1000
  const isScoreAnimating = pendingFaceId !== null
  const animationLabel = activeRoll?.stage === 'rolling' ? 'Rolling...' : 'Scoring...'
  const activeDie = activeRoll && pendingResult
    ? run.equippedDiceSnapshot.find((candidate) => candidate.id === pendingResult.dieId)
    : undefined
  const roundReady = diceLeft === 0 && !isScoreAnimating

  const handleDraw = useCallback(() => {
    if (isScoreAnimating) return
    const result = drawNextDie()
    if (!result) return
    checkpointAutoCombat()
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
          faceId: result.faceId,
          type: result.type,
          value: result.value,
          evolution: result.evolution,
          fromX,
          fromY,
          toX,
          toY,
          duration: Math.max(0.34, 0.46 / rollSpeed),
        })
        setActiveRoll(null)
      }, result.evolution ? Math.max(360, 260 / rollSpeed) : 260 / rollSpeed)

      rollTimers.current.push(collectionTimer)
    }, rollDurationMilliseconds)

    rollTimers.current = [landingTimer]
  }, [
    checkpointAutoCombat,
    drawNextDie,
    isScoreAnimating,
    rollDurationMilliseconds,
    rollSpeed,
  ])

  useEffect(() => {
    if (!profile.settings.autoCombat || profile.automationPaused) return
    if (combat.phase !== 'awaiting_roll' || diceLeft <= 0 || isScoreAnimating) return
    const timer = window.setTimeout(handleDraw, AUTO_COMBAT_DRAW_PAUSE_MS)
    return () => window.clearTimeout(timer)
  }, [
    combat.phase,
    diceLeft,
    handleDraw,
    isScoreAnimating,
    profile.automationPaused,
    profile.settings.autoCombat,
  ])

  useEffect(() => {
    if (!profile.settings.autoCombat || profile.automationPaused) return
    if (combat.phase !== 'awaiting_resolve' || isScoreAnimating) return
    const timer = window.setTimeout(() => {
      beginRoundResolution()
      checkpointAutoCombat()
    }, AUTO_COMBAT_RESOLVE_PAUSE_MS)
    return () => window.clearTimeout(timer)
  }, [
    beginRoundResolution,
    checkpointAutoCombat,
    combat.phase,
    isScoreAnimating,
    profile.automationPaused,
    profile.settings.autoCombat,
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
    <main className="game-shell combat-screen">
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
        <div className="permanent-souls"><Flame aria-hidden="true" size={15} /><strong>{profile.bankedSouls}</strong><span>souls</span></div>
      </header>

      <section
        className={[
          'enemy-zone',
          floor.isBoss ? 'enemy-zone--boss' : '',
          `enemy-zone--${enemyDefeated ? 'defeated' : combat.resolutionStep ?? 'watching'}`,
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
              <span className="enemy-bleed" aria-label={`${enemy.bleed} Bleed`}>
                <Droplets aria-hidden="true" size={11} /> {enemy.bleed}
              </span>
            ) : null}
            <strong>{enemy.hp}/{enemy.maxHp}</strong>
          </div>
          <HpBar current={enemy.hp} max={enemy.maxHp} tone="enemy" />
        </div>
      </section>

      <section
        className={`player-zone${scoredResults.length > 0 ? ' player-zone--with-totals' : ''}`}
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
        <HpBar current={run.playerHp} max={run.playerMaxHp} />
        <div className="round-totals-stage" ref={scoreStageElement}>
          <RoundTotalsPanel results={scoredResults} totals={displayedTotals} />
          <div aria-hidden="true" className="score-target-anchor" ref={scoreTargetElement} />
        </div>
        {combat.phase === 'resolving' && combat.lastResolution && (
          <div className={`resolution-banner resolution-banner--${combat.resolutionStep ?? 'player'}`} role="status">
            {combat.lastResolution.outcome === 'victory'
              ? 'Enemy defeated — its intent is cancelled!'
              : combat.resolutionStep === 'enemy_heal'
                ? `${enemy.name} heals ${combat.lastResolution.enemyHealApplied}`
                : combat.resolutionStep === 'enemy_attack'
                ? `${combat.lastResolution.enemyDamageBlocked} blocked · ${combat.lastResolution.playerDamageTaken} damage taken`
                : combat.lastResolution.bleedDamageToEnemy > 0
                  ? `Bleed ${combat.lastResolution.bleedDamageToEnemy} · Attack ${combat.lastResolution.attackDamageToEnemy}`
                  : `Your attack lands for ${combat.lastResolution.attackDamageToEnemy}`}
          </div>
        )}
      </section>

      <section className="roll-zone" aria-label="Played dice">
        <header className="dice-stage-header">
          <div>
            <span className="eyebrow">Shuffled draw</span>
            <h2>{roundReady ? 'Round armed' : 'Roll the bag'}</h2>
          </div>
          <div className="bag-counter" aria-label={`${diceLeft} dice left in bag`}>
            <Dices aria-hidden="true" size={17} />
            <strong>{diceLeft}</strong>
            <span>left</span>
          </div>
        </header>

        <div className="dice-arena">
          <div className={`roll-pedestal${activeDie ? ' roll-pedestal--active' : ''}`}>
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
            aria-pressed={profile.settings.autoCombat}
            className={`auto-combat-toggle${profile.settings.autoCombat ? ' auto-combat-toggle--active' : ''}`}
            onClick={() => setAutoCombat(!profile.settings.autoCombat)}
            type="button"
          >
            Auto Combat {profile.settings.autoCombat ? 'On' : 'Off'}
          </button>
        )}
        {combat.phase === 'awaiting_resolve' ? (
          <button
            className="pixel-button pixel-button--resolve"
            disabled={isScoreAnimating || profile.settings.autoCombat}
            onClick={beginRoundResolution}
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
            className="pixel-button pixel-button--primary"
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
