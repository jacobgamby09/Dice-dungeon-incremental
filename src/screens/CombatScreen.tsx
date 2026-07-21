import { useCallback, useEffect, useRef, useState } from 'react'
import { Dices, Flame, Heart, Swords } from 'lucide-react'
import { EnemySprite } from '../components/EnemySprite'
import { HpBar } from '../components/newgame/HpBar'
import { RollDieTile } from '../components/newgame/RollDieTile'
import { RoundTotalsPanel } from '../components/newgame/RoundTotalsPanel'
import { ScoreTransfer } from '../components/newgame/ScoreTransfer'
import type { ScoreTransferPath } from '../components/newgame/ScoreTransfer'
import { DUNGEONS } from '../game/content/dungeons'
import { useNewGameStore } from '../store/newGameStore'

interface ActiveRoll {
  faceId: string
  stage: 'rolling' | 'landed'
}

export function CombatScreen() {
  const profile = useNewGameStore((state) => state.profile)
  const run = useNewGameStore((state) => state.run)
  const combat = useNewGameStore((state) => state.combat)
  const drawNextDie = useNewGameStore((state) => state.drawNextDie)
  const beginRoundResolution = useNewGameStore((state) => state.beginRoundResolution)
  const advanceRoundResolution = useNewGameStore((state) => state.advanceRoundResolution)
  const finishRoundResolution = useNewGameStore((state) => state.finishRoundResolution)

  const [activeRoll, setActiveRoll] = useState<ActiveRoll | null>(null)
  const [scoreTransfer, setScoreTransfer] = useState<ScoreTransferPath | null>(null)
  const [enemyHitVersion, setEnemyHitVersion] = useState(0)
  const [enemyAttackVersion, setEnemyAttackVersion] = useState(0)
  const rollTimers = useRef<number[]>([])
  const activeDieElement = useRef<HTMLDivElement | null>(null)
  const scoreStageElement = useRef<HTMLDivElement | null>(null)
  const scoreTargetElement = useRef<HTMLDivElement | null>(null)

  useEffect(() => () => {
    rollTimers.current.forEach((timer) => window.clearTimeout(timer))
  }, [])

  const completeScoreTransfer = useCallback(() => {
    setScoreTransfer(null)
    rollTimers.current = []
  }, [])

  useEffect(() => {
    const resolution = combat.lastResolution
    if (combat.phase !== 'resolving' || !resolution) return
    const resolutionStep = combat.resolutionStep ?? 'player'

    const timers: number[] = []
    if (resolutionStep === 'player' && resolution.attackDamageToEnemy > 0) {
      timers.push(window.setTimeout(() => {
        setEnemyHitVersion((version) => version + 1)
      }, 0))
    }
    if (resolutionStep === 'player' && resolution.enemyActed) {
      timers.push(window.setTimeout(advanceRoundResolution, 720))
    } else if (resolutionStep === 'enemy') {
      timers.push(window.setTimeout(() => {
        setEnemyAttackVersion((version) => version + 1)
      }, 0))
      timers.push(window.setTimeout(finishRoundResolution, 860))
    } else {
      timers.push(window.setTimeout(finishRoundResolution, 900))
    }

    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [
    advanceRoundResolution,
    combat.lastResolution,
    combat.phase,
    combat.resolutionStep,
    combat.resolutionVersion,
    finishRoundResolution,
  ])

  const enemy = run.enemy
  if (!enemy || !run.dungeonId) return null
  const dungeon = DUNGEONS[run.dungeonId]
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
  const rollSpeed = Math.max(0.25, profile.settings.rollSpeed)
  const rollDurationMilliseconds = 620 / rollSpeed
  const rollDurationSeconds = rollDurationMilliseconds / 1000
  const isScoreAnimating = pendingFaceId !== null
  const animationLabel = activeRoll?.stage === 'rolling' ? 'Rolling...' : 'Scoring...'
  const activeDie = activeRoll && pendingResult
    ? run.equippedDiceSnapshot.find((candidate) => candidate.id === pendingResult.dieId)
    : undefined
  const roundReady = diceLeft === 0 && !isScoreAnimating
  const enemyDefeated = enemy.hp <= 0

  function handleDraw() {
    if (isScoreAnimating) return
    const result = drawNextDie()
    if (!result) return
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
          fromX,
          fromY,
          toX,
          toY,
          duration: Math.max(0.34, 0.46 / rollSpeed),
        })
        setActiveRoll(null)
      }, 260 / rollSpeed)

      rollTimers.current.push(collectionTimer)
    }, rollDurationMilliseconds)

    rollTimers.current = [landingTimer]
  }

  return (
    <main className="game-shell combat-screen">
      <header className="combat-meta">
        <div><span>Encounter</span><strong>{run.encounterIndex + 1}/{dungeon.encounters.length}</strong></div>
        <div><span>Round</span><strong>{combat.roundNumber}</strong></div>
        <div className="run-souls"><Flame aria-hidden="true" size={15} /><strong>{run.runSouls}</strong><span>at risk</span></div>
      </header>

      <section
        className={`enemy-zone enemy-zone--${enemyDefeated ? 'defeated' : combat.resolutionStep ?? 'watching'}`}
        aria-label={`${enemy.name}, ${enemy.hp} health`}
      >
        <div aria-hidden="true" className="enemy-zone__arch" />
        <header className="enemy-zone__title">
          <span className="eyebrow">Enemy ahead</span>
          <h1>{enemy.name}</h1>
        </header>
        <div className="enemy-zone__sprite">
          <EnemySprite
            enemyAttackVersion={enemyAttackVersion}
            enemyHitVersion={enemyHitVersion}
            enemyName={enemy.spriteName}
            hp={enemy.hp}
            size={6}
          />
        </div>
        <div aria-hidden="true" className="enemy-zone__pedestal" />
        <div className="intent-badge">
          <span>{enemyDefeated ? 'Intent cancelled' : 'Next intent'}</span>
          <strong>
            <Swords aria-hidden="true" size={16} />
            {enemyDefeated ? 'No counterattack' : `Attack ${enemy.intent.value}`}
          </strong>
        </div>
        <div className="enemy-zone__vitals">
          <div className="hp-label"><span>HP</span><strong>{enemy.hp}/{enemy.maxHp}</strong></div>
          <HpBar current={enemy.hp} max={enemy.maxHp} tone="enemy" />
        </div>
      </section>

      <section
        className={`player-zone${scoredResults.length > 0 ? ' player-zone--with-totals' : ''}`}
        aria-label="Adventurer status and round power"
      >
        <div className="player-vitals">
          <span className="player-vitals__label">Adventurer</span>
          <div className="player-health">
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
              : combat.resolutionStep === 'enemy'
                ? `${combat.lastResolution.enemyDamageBlocked} blocked · ${combat.lastResolution.playerDamageTaken} damage taken`
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
          <div aria-hidden="true" className="dice-arena__runes" />
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
            ) : (
              <div className={`roll-prompt${roundReady ? ' roll-prompt--ready' : ''}`}>
                {roundReady ? <Swords aria-hidden="true" size={24} /> : <Dices aria-hidden="true" size={24} />}
                <strong>{roundReady ? 'Power gathered' : 'Pedestal waiting'}</strong>
                <span>{roundReady ? 'Resolve when ready' : 'Draw to reveal a face'}</span>
              </div>
            )}
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
        {combat.phase === 'awaiting_resolve' ? (
          <button className="pixel-button pixel-button--resolve" disabled={isScoreAnimating} onClick={beginRoundResolution} type="button">
            <Swords aria-hidden="true" size={18} />
            {isScoreAnimating ? animationLabel : 'Resolve Round'}
          </button>
        ) : (
          <button
            className="pixel-button pixel-button--primary"
            disabled={combat.phase !== 'awaiting_roll' || isScoreAnimating}
            onClick={handleDraw}
            type="button"
          >
            <Dices aria-hidden="true" size={18} />
            {isScoreAnimating
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
    </main>
  )
}
