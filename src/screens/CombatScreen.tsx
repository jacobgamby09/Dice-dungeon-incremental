import { useEffect, useRef, useState } from 'react'
import { Flame, Heart, Swords } from 'lucide-react'
import { EnemySprite } from '../components/EnemySprite'
import { HpBar } from '../components/newgame/HpBar'
import { RollDieTile } from '../components/newgame/RollDieTile'
import { RoundTotalsPanel } from '../components/newgame/RoundTotalsPanel'
import { DUNGEONS } from '../game/content/dungeons'
import { useNewGameStore } from '../store/newGameStore'

export function CombatScreen() {
  const profile = useNewGameStore((state) => state.profile)
  const run = useNewGameStore((state) => state.run)
  const combat = useNewGameStore((state) => state.combat)
  const drawNextDie = useNewGameStore((state) => state.drawNextDie)
  const beginRoundResolution = useNewGameStore((state) => state.beginRoundResolution)
  const advanceRoundResolution = useNewGameStore((state) => state.advanceRoundResolution)
  const finishRoundResolution = useNewGameStore((state) => state.finishRoundResolution)

  const [rollingFaceId, setRollingFaceId] = useState<string | null>(null)
  const [enemyHitVersion, setEnemyHitVersion] = useState(0)
  const [enemyAttackVersion, setEnemyAttackVersion] = useState(0)
  const rollTimer = useRef<number | null>(null)

  useEffect(() => () => {
    if (rollTimer.current !== null) window.clearTimeout(rollTimer.current)
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

  function handleDraw() {
    if (rollingFaceId !== null) return
    const result = drawNextDie()
    if (!result) return
    setRollingFaceId(result.faceId)
    rollTimer.current = window.setTimeout(() => {
      setRollingFaceId(null)
      rollTimer.current = null
    }, 540 / profile.settings.rollSpeed)
  }

  return (
    <main className="game-shell combat-screen">
      <header className="combat-meta">
        <div><span>Encounter</span><strong>{run.encounterIndex + 1}/{dungeon.encounters.length}</strong></div>
        <div><span>Round</span><strong>{combat.roundNumber}</strong></div>
        <div className="run-souls"><Flame aria-hidden="true" size={15} /><strong>{run.runSouls}</strong><span>at risk</span></div>
      </header>

      <section className="enemy-zone" aria-label={`${enemy.name}, ${enemy.hp} health`}>
        <div className="enemy-zone__sprite">
          <EnemySprite
            enemyAttackVersion={enemyAttackVersion}
            enemyHitVersion={enemyHitVersion}
            enemyName={enemy.spriteName}
            hp={enemy.hp}
            size={5}
          />
        </div>
        <div className="enemy-zone__info">
          <span className="eyebrow">Enemy intent</span>
          <h1>{enemy.name}</h1>
          <div className="intent-badge"><Swords aria-hidden="true" size={16} /> Attack {enemy.intent.value}</div>
          <div className="hp-label"><span>HP</span><strong>{enemy.hp}/{enemy.maxHp}</strong></div>
          <HpBar current={enemy.hp} max={enemy.maxHp} tone="enemy" />
        </div>
      </section>

      <section className="player-zone">
        <div className="player-health">
          <Heart aria-hidden="true" size={18} />
          <strong>{run.playerHp}</strong>
          <span>/ {run.playerMaxHp} HP</span>
        </div>
        <HpBar current={run.playerHp} max={run.playerMaxHp} />
        <RoundTotalsPanel results={combat.results} totals={combat.totals} />
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
        <div className="section-heading section-heading--compact">
          <div>
            <span className="eyebrow">Random draw bag</span>
            <h2>{diceLeft > 0 ? `${diceLeft} left in bag` : 'All dice drawn'}</h2>
          </div>
        </div>
        <div className="roll-grid">
          {combat.results.length === 0 && (
            <p className="draw-empty">No dice played yet. Draw from the shuffled bag.</p>
          )}
          {combat.results.map((result) => {
            const die = run.equippedDiceSnapshot.find((candidate) => candidate.id === result.dieId)
            return die ? (
              <RollDieTile
                die={die}
                isRolling={result.faceId === rollingFaceId}
                key={result.faceId}
                result={result}
              />
            ) : null
          })}
        </div>
      </section>

      <footer className="combat-actions">
        {combat.phase === 'awaiting_resolve' ? (
          <button className="pixel-button pixel-button--attack" disabled={rollingFaceId !== null} onClick={beginRoundResolution} type="button">
            Resolve Round
          </button>
        ) : (
          <button
            className="pixel-button pixel-button--primary"
            disabled={combat.phase !== 'awaiting_roll' || rollingFaceId !== null}
            onClick={handleDraw}
            type="button"
          >
            {rollingFaceId !== null
              ? 'Drawing...'
              : diceLeft > 0
                ? `Draw (${diceLeft} left)`
                : 'Waiting...'}
          </button>
        )}
      </footer>
    </main>
  )
}
