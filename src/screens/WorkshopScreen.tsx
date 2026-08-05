import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  Anvil,
  ChevronLeft,
  Dices,
  Hammer,
  RotateCw,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FaceIcon } from '../components/newgame/FaceIcon'
import { FACE_META } from '../components/newgame/faceVisuals'
import { DieLoadoutStatus } from '../components/newgame/DieLoadoutStatus'
import { getDieLoadoutSlotIndex } from '../components/newgame/dieLoadout'
import { PermanentResourceHud } from '../components/newgame/PermanentResourceHud'
import { ImprintIcon } from '../components/newgame/ImprintIcon'
import { SignatureIcon } from '../components/newgame/SignatureIcon'
import { getSignatureVisualStyle } from '../components/newgame/signatureVisuals'
import { WorkshopDie } from '../components/newgame/WorkshopDie'
import {
  getWorkshopResultPresentation,
  type WorkshopPresentationPhase,
} from '../components/newgame/workshopResultPresentation'
import {
  createForwardTargetSequence,
  getTargetTickDelay,
} from '../components/newgame/workshopTargetSequence'
import {
  getChaosEligibleFaces,
  getChaosForgeCost,
} from '../game/forge/forge'
import {
  getWorkshopDieFaces,
  getWorkshopCostMultiplier,
  getReforgeRefundRate,
  hasAutoForgeUnlocked,
  hasReforgeUnlocked,
} from '../game/progression/talents'
import {
  getDieForgeRecord,
  getReforgeRefund,
} from '../game/forge/reforge'
import { SIGNATURE_DEFINITIONS } from '../game/content/faceEffects'
import type { FaceType } from '../game/types/dice'
import { applyImprintsToDice } from '../game/progression/imprints'
import { useNewGameStore } from '../store/newGameStore'

interface ForgeImpact {
  amount: number
  faceId: string
  faceNumber: number
  isJackpot: boolean
  newValue: number
  previousValue: number
  rolledAmount: number
  type: FaceType
  version: number
  workshopFaceId: string | null
}

const POWER_ROLL_DURATION_MS = 900

function createOperationId() {
  return globalThis.crypto?.randomUUID?.()
    ?? `forge-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getAverage(values: readonly number[]): string {
  if (values.length === 0) return '0.00'
  return (values.reduce((total, value) => total + value, 0) / values.length).toFixed(2)
}

function getPhaseCopy(phase: WorkshopPresentationPhase): string {
  switch (phase) {
    case 'selecting_target':
      return 'The forge is choosing a permanent face'
    case 'target_locked':
      return 'Target locked · Roll the Workshop Die'
    case 'rolling_power':
      return 'The Workshop Die decides the upgrade'
    case 'result':
      return 'Permanent upgrade complete'
    default:
      return 'Choose a die and begin the ritual'
  }
}

export function WorkshopScreen() {
  const diceCollection = useNewGameStore((state) => state.profile.diceCollection)
  const equippedDieIds = useNewGameStore((state) => state.profile.equippedDieIds)
  const bankedSouls = useNewGameStore((state) => state.profile.bankedSouls)
  const talentRanks = useNewGameStore((state) => state.profile.talentRanks)
  const pendingForge = useNewGameStore((state) => state.profile.pendingWorkshopForge)
  const imprints = useNewGameStore((state) => state.profile.imprints)
  const dieForgeRecords = useNewGameStore((state) => state.profile.dieForgeRecords)
  const goToHub = useNewGameStore((state) => state.goToHub)
  const beginWorkshopForge = useNewGameStore((state) => state.beginWorkshopForge)
  const rerollPendingWorkshopTarget = useNewGameStore(
    (state) => state.rerollPendingWorkshopTarget,
  )
  const completePendingWorkshopForge = useNewGameStore(
    (state) => state.completePendingWorkshopForge,
  )
  const reforgeDie = useNewGameStore((state) => state.reforgeDie)
  const reduceMotion = useReducedMotion()
  const initialDieId = pendingForge?.dieId ?? diceCollection[0]?.id ?? ''
  const [selectedDieId, setSelectedDieId] = useState(initialDieId)
  const [phase, setPhase] = useState<WorkshopPresentationPhase>(
    pendingForge ? 'target_locked' : 'idle',
  )
  const [highlightedFaceId, setHighlightedFaceId] = useState<string | null>(
    pendingForge?.targetFaceId ?? null,
  )
  const [forgeImpact, setForgeImpact] = useState<ForgeImpact | null>(null)
  const [reforgeOpen, setReforgeOpen] = useState(false)
  const [autoForgeRemaining, setAutoForgeRemaining] = useState(0)
  const forgeLock = useRef(false)

  const effectiveDice = useMemo(
    () => applyImprintsToDice(diceCollection, imprints),
    [diceCollection, imprints],
  )
  const selectedDie = effectiveDice.find((die) => (
    die.id === (pendingForge?.dieId ?? selectedDieId)
  )) ?? effectiveDice[0]
  const highlightedFace = selectedDie?.faces.find((face) => face.id === highlightedFaceId)
  const workshopFaces = useMemo(
    () => getWorkshopDieFaces(talentRanks),
    [talentRanks],
  )
  const forgeRecord = selectedDie
    ? getDieForgeRecord(dieForgeRecords, selectedDie.id)
    : null
  const forgeCost = selectedDie
    ? getChaosForgeCost(
        selectedDie,
        getWorkshopCostMultiplier(talentRanks),
        forgeRecord?.forgePowerAdded ?? 0,
      )
    : null
  const reforgeRefundRate = getReforgeRefundRate(talentRanks)
  const reforgeRefund = forgeRecord
    ? getReforgeRefund(forgeRecord, reforgeRefundRate)
    : 0
  const reforgeUnlocked = hasReforgeUnlocked(talentRanks)
  const autoForgeUnlocked = hasAutoForgeUnlocked(talentRanks)
  const eligibleFaces = selectedDie ? getChaosEligibleFaces(selectedDie) : []
  const displayedWorkshopFaces = workshopFaces
  const revealedWorkshopResult = getWorkshopResultPresentation(phase, forgeImpact)
  const isAnimating = phase === 'selecting_target' || phase === 'rolling_power'
  const canBeginForge = (
    !pendingForge
    && forgeCost !== null
    && bankedSouls >= forgeCost
    && !isAnimating
  )

  useEffect(() => {
    window.scrollTo({ left: 0, top: 0 })
  }, [])

  useEffect(() => {
    if (phase !== 'selecting_target' || !pendingForge || !selectedDie) return
    if (reduceMotion) {
      const timer = window.setTimeout(() => {
        setHighlightedFaceId(pendingForge.targetFaceId)
        setPhase('target_locked')
      }, 0)
      return () => window.clearTimeout(timer)
    }

    const faceIds = getChaosEligibleFaces(selectedDie).map((face) => face.id)
    if (faceIds.length === 0) return
    const previousTargetFaceId = pendingForge.targetFaceHistory.at(-2) ?? null
    const targetSequence = createForwardTargetSequence(
      faceIds,
      pendingForge.targetFaceId,
      previousTargetFaceId,
    )
    const timers: number[] = []
    let elapsed = 0

    targetSequence.forEach((faceId, index) => {
      const delay = getTargetTickDelay(index, targetSequence.length)
      elapsed += delay
      timers.push(window.setTimeout(() => {
        setHighlightedFaceId(faceId)
      }, elapsed))
    })
    timers.push(window.setTimeout(() => {
      setPhase('target_locked')
    }, elapsed + 150))

    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [pendingForge, phase, reduceMotion, selectedDie])

  useEffect(() => {
    if (phase !== 'rolling_power' || !pendingForge || !selectedDie) return
    const timer = window.setTimeout(() => {
      const result = completePendingWorkshopForge(pendingForge.operationId)
      forgeLock.current = false
      if (!result) {
        setPhase('target_locked')
        return
      }

      setForgeImpact((current) => ({
        amount: result.amount,
        faceId: result.faceId,
        faceNumber: selectedDie.faces.findIndex((face) => face.id === result.faceId) + 1,
        isJackpot: result.isJackpot,
        newValue: result.newValue,
        previousValue: result.previousValue,
        rolledAmount: result.rolledAmount,
        type: selectedDie.family,
        version: (current?.version ?? 0) + 1,
        workshopFaceId: result.workshopFaceId,
      }))
      setHighlightedFaceId(result.faceId)
      setPhase('result')
      setAutoForgeRemaining((remaining) => Math.max(0, remaining - 1))
    }, reduceMotion ? 20 : POWER_ROLL_DURATION_MS)

    return () => window.clearTimeout(timer)
  }, [
    completePendingWorkshopForge,
    pendingForge,
    phase,
    reduceMotion,
    selectedDie,
  ])

  useEffect(() => {
    if (autoForgeRemaining <= 0 || !autoForgeUnlocked) return
    if (phase === 'target_locked' && pendingForge) {
      const timer = window.setTimeout(() => rollWorkshopPower(), reduceMotion ? 20 : 220)
      return () => window.clearTimeout(timer)
    }
    if ((phase === 'idle' || phase === 'result') && !pendingForge) {
      if (!canBeginForge) {
        const timer = window.setTimeout(() => setAutoForgeRemaining(0), 0)
        return () => window.clearTimeout(timer)
      }
      const timer = window.setTimeout(() => beginForge(), reduceMotion ? 20 : 320)
      return () => window.clearTimeout(timer)
    }
  // beginForge and rollWorkshopPower are event helpers whose current render state is
  // intentionally captured by this short-lived orchestration timer.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    autoForgeRemaining,
    autoForgeUnlocked,
    canBeginForge,
    pendingForge,
    phase,
    reduceMotion,
  ])

  function chooseDie(dieId: string) {
    if (pendingForge || isAnimating) return
    if (!effectiveDice.some((die) => die.id === dieId)) return
    setSelectedDieId(dieId)
    setForgeImpact(null)
    setHighlightedFaceId(null)
    setPhase('idle')
    setAutoForgeRemaining(0)
  }

  function beginForge() {
    if (!selectedDie || !canBeginForge || forgeLock.current) return
    forgeLock.current = true
    const lockedForge = beginWorkshopForge(
      selectedDie.id,
      createOperationId(),
    )
    forgeLock.current = false
    if (!lockedForge) return

    setForgeImpact(null)
    setHighlightedFaceId(null)
    setPhase('selecting_target')
  }

  function rollWorkshopPower() {
    if (!pendingForge || phase !== 'target_locked' || forgeLock.current) return
    forgeLock.current = true
    setPhase('rolling_power')
  }

  function rerollTarget() {
    if (
      !pendingForge
      || phase !== 'target_locked'
      || pendingForge.rerollsRemaining <= 0
      || forgeLock.current
    ) return
    forgeLock.current = true
    const rerolled = rerollPendingWorkshopTarget(
      pendingForge.operationId,
      createOperationId(),
    )
    forgeLock.current = false
    if (!rerolled) return
    setHighlightedFaceId(null)
    setPhase('selecting_target')
  }

  function confirmReforge() {
    if (!selectedDie || !reforgeUnlocked) return
    const refund = reforgeDie(selectedDie.id, createOperationId())
    if (refund === null) return
    setReforgeOpen(false)
    setAutoForgeRemaining(0)
    setForgeImpact(null)
    setHighlightedFaceId(null)
    setPhase('idle')
  }

  const primaryAction = phase === 'target_locked'
    ? rollWorkshopPower
    : beginForge
  const primaryDisabled = phase === 'target_locked'
    ? false
    : !canBeginForge
  const primaryLabel = (() => {
    if (phase === 'selecting_target') return 'Selecting a Face...'
    if (phase === 'target_locked') return 'Roll Workshop Die'
    if (phase === 'rolling_power') return 'Workshop Die Rolling...'
    if (forgeCost === null) return 'No Forgeable Faces'
    if (!canBeginForge) return `Need ${forgeCost - bankedSouls} More Souls`
    return `${phase === 'result' ? 'Forge Again' : 'Begin Forge'} · ${forgeCost} Souls`
  })()

  return (
    <main className="game-shell workshop-ritual">
      <section className="workshop-ritual__header" aria-labelledby="workshop-title">
        <button
          aria-label="Back to Hub"
          className="workshop-ritual__back"
          disabled={isAnimating}
          onClick={goToHub}
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={22} />
        </button>
        <header>
          <span>Permanent dice forging</span>
          <h1 id="workshop-title">Workshop</h1>
        </header>
        <PermanentResourceHud bankedSouls={bankedSouls} compact />
      </section>

      <section className="workshop-ritual__rack" aria-labelledby="workshop-rack-title">
        <header>
          <span>Choose a permanent die</span>
          <strong id="workshop-rack-title">{diceCollection.length} owned</strong>
        </header>
        <div className="workshop-ritual__tabs" aria-label="Choose a die">
          {effectiveDice.map((die) => {
            const equippedSlotIndex = getDieLoadoutSlotIndex(equippedDieIds, die.id)
            return (
              <button
                aria-pressed={die.id === selectedDie?.id}
                className={`workshop-ritual__tab workshop-ritual__tab--${die.family}`}
                disabled={Boolean(pendingForge) || isAnimating}
                key={die.id}
                onClick={() => chooseDie(die.id)}
                type="button"
              >
                <FaceIcon type={die.family} size={18} />
                <span>
                  <strong>{die.name}</strong>
                  <small>Average {getAverage(die.faces.map((face) => face.value))}</small>
                  <DieLoadoutStatus slotIndex={equippedSlotIndex} />
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {selectedDie ? (
        <section
          aria-busy={isAnimating}
          className={`workshop-ritual__chamber workshop-ritual__chamber--${selectedDie.family}`}
          aria-labelledby="workshop-selected-die"
        >
          <header className="workshop-ritual__die-heading">
            <div>
              <span>{selectedDie.family} die</span>
              <h2 id="workshop-selected-die">{selectedDie.name}</h2>
            </div>
            <div>
              <small>Forge ranks</small>
              <strong>
                {forgeRecord?.forgePowerAdded ?? 0}
              </strong>
            </div>
          </header>

          {reforgeUnlocked ? (
            <button
              className="workshop-reforge__open"
              disabled={Boolean(pendingForge) || isAnimating}
              onClick={() => setReforgeOpen(true)}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={18} />
              <span><strong>Reforge Die</strong><small>Recover {Math.round(reforgeRefundRate * 100)}% · {reforgeRefund} Souls</small></span>
            </button>
          ) : null}

          <section className="workshop-target" aria-labelledby="workshop-target-title">
            <header>
              <span>01</span>
              <div>
                <small>Target roll</small>
                <h3 id="workshop-target-title">Which face?</h3>
              </div>
            </header>

            <div
              aria-label="Current permanent faces"
              className={`workshop-target__faces${phase === 'selecting_target' ? ' workshop-target__faces--scanning' : ''}`}
            >
              {selectedDie.faces.map((face, faceIndex) => {
                const isHighlighted = highlightedFaceId === face.id
                const signatureStyle = face.signature
                  ? getSignatureVisualStyle(face.signature.id)
                  : undefined
                const isLockedTarget = (
                  isHighlighted
                  && ['target_locked', 'rolling_power', 'result'].includes(phase)
                )
                return (
                  <motion.div
                    animate={isHighlighted
                      ? { scale: [1, 1.12, 1.05], y: [0, -5, -3] }
                      : { scale: 1, y: 0 }}
                    aria-label={`Face ${faceIndex + 1}: ${face.value} ${FACE_META[face.type].label}${face.signature ? `, ${face.signature.name} Signature` : ''}${face.imprint ? `, ${face.imprint.name} Imprint` : ''}`}
                    className={`workshop-target__face workshop-target__face--${face.type}${face.signature ? ` workshop-target__face--signature workshop-target__face--signature-${face.signature.id}` : ''}${face.imprint ? ` workshop-target__face--imprint workshop-target__face--imprint-${face.imprint.rarity}` : ''}${isHighlighted ? ' workshop-target__face--highlighted' : ''}${isLockedTarget ? ' workshop-target__face--locked' : ''}`}
                    key={face.id}
                    style={signatureStyle}
                    transition={{ duration: 0.14 }}
                  >
                    <small>{faceIndex + 1}</small>
                    <strong>{face.value}</strong>
                    {face.imprint ? (
                      <ImprintIcon id={face.imprint.definitionId} rarity={face.imprint.rarity} size={18} />
                    ) : face.signature ? (
                      <SignatureIcon signatureId={face.signature.id} size={18} />
                    ) : <FaceIcon type={face.type} size={17} />}
                    {face.imprint ? <span className="workshop-target__imprint-badge">Imprint</span> : null}
                    {face.signature ? <span className="workshop-target__signature-badge">{face.signature.name}</span> : null}
                    {isLockedTarget ? <em>Target</em> : null}
                  </motion.div>
                )
              })}
            </div>

            {phase !== 'selecting_target' && highlightedFace?.imprint ? (
              <div className={`workshop-target__imprint-detail workshop-target__imprint-detail--${highlightedFace.imprint.rarity}`}>
                <ImprintIcon
                  id={highlightedFace.imprint.definitionId}
                  rarity={highlightedFace.imprint.rarity}
                  size={30}
                />
                <div>
                  <span>{highlightedFace.imprint.rarity} Imprint · Effective {highlightedFace.value}</span>
                  <strong>{highlightedFace.imprint.name}</strong>
                  <small>Imprint Power +{highlightedFace.imprint.refinement} · Workshop upgrades this permanent power when the face is selected.</small>
                </div>
              </div>
            ) : null}

            {phase !== 'selecting_target' && highlightedFace?.signature ? (
              <div
                className={`workshop-target__signature-detail workshop-target__signature-detail--${highlightedFace.signature.id}`}
                style={getSignatureVisualStyle(highlightedFace.signature.id)}
              >
                <SignatureIcon signatureId={highlightedFace.signature.id} size={30} />
                <div>
                  <span>Signature Face · Current {highlightedFace.value} {FACE_META[highlightedFace.type].label}</span>
                  <strong>{highlightedFace.signature.name}</strong>
                  <small>{SIGNATURE_DEFINITIONS[highlightedFace.signature.id].description} Workshop permanently upgrades this face's base value.</small>
                </div>
              </div>
            ) : null}

            {phase === 'target_locked' && pendingForge?.rerollsRemaining ? (
              <button
                className="workshop-target__reroll"
                onClick={rerollTarget}
                type="button"
              >
                <RotateCw aria-hidden="true" size={18} />
                <span>
                  <strong>Roll Another Face</strong>
                  <small>{pendingForge.rerollsRemaining} rerolls left</small>
                </span>
              </button>
            ) : null}
          </section>

          <div aria-hidden="true" className="workshop-ritual__conduit">
            <span />
            <Anvil size={28} />
            <span />
          </div>

          <section className="workshop-power" aria-labelledby="workshop-power-title">
            <header>
              <span>02</span>
              <div>
                <small>Forge power</small>
                <h3 id="workshop-power-title">Workshop Die</h3>
              </div>
              <div>
                <small>Average</small>
                <strong>{getAverage(displayedWorkshopFaces.map((face) => face.value))}</strong>
              </div>
            </header>

            <div className="workshop-power__stage">
              <div className="workshop-power__distribution" aria-label="Workshop Die distribution">
                {displayedWorkshopFaces.map((face) => (
                  <span
                    className={revealedWorkshopResult.workshopFaceId === face.id
                      ? 'workshop-power__distribution-face--rolled'
                      : undefined}
                    key={face.id}
                  >
                    {face.value}
                  </span>
                ))}
              </div>
              <WorkshopDie
                appliedAmount={revealedWorkshopResult.amount}
                faces={displayedWorkshopFaces}
                rolledFaceId={pendingForge?.workshopFaceId ?? forgeImpact?.workshopFaceId ?? null}
                stage={phase === 'rolling_power'
                  ? 'rolling'
                  : phase === 'result'
                    ? 'landed'
                    : 'idle'}
              />
            </div>
          </section>

          <AnimatePresence mode="wait">
            {forgeImpact ? (
              <motion.div
                aria-live="polite"
                className={`workshop-impact workshop-impact--${forgeImpact.type}${forgeImpact.isJackpot ? ' workshop-impact--jackpot' : ''}`}
                initial={{ opacity: 0, scale: 0.72, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.88 }}
                key={`${forgeImpact.version}-${forgeImpact.faceId}`}
              >
                <Sparkles aria-hidden="true" size={22} />
                <div>
                  <small>{forgeImpact.isJackpot ? 'Jackpot forge' : 'Permanent upgrade'}</small>
                  <strong>Face {forgeImpact.faceNumber} · +{forgeImpact.amount}</strong>
                  <span>{forgeImpact.previousValue} → {forgeImpact.newValue}</span>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div aria-live="polite" className="workshop-ritual__status">
            {getPhaseCopy(phase)}
          </div>

          <button
            className={`workshop-ritual__action${phase === 'target_locked' ? ' workshop-ritual__action--power' : ''}`}
            disabled={primaryDisabled || isAnimating}
            onClick={primaryAction}
            type="button"
          >
            {phase === 'target_locked'
              ? <Dices aria-hidden="true" size={19} />
              : <Hammer aria-hidden="true" size={19} />}
            {primaryLabel}
          </button>

          {autoForgeUnlocked ? (
            <section className="workshop-auto" aria-label="Auto Forge queue">
              <div>
                <strong>Auto Forge</strong>
                <small>{autoForgeRemaining > 0 ? `${autoForgeRemaining} forges remaining` : 'Accepts the first rolled target'}</small>
              </div>
              <div>
                {[1, 5, 10].map((count) => (
                  <button
                    disabled={isAnimating || Boolean(pendingForge) || !canBeginForge}
                    key={count}
                    onClick={() => setAutoForgeRemaining(count)}
                    type="button"
                  >
                    {count}×
                  </button>
                ))}
                {autoForgeRemaining > 0 ? (
                  <button onClick={() => setAutoForgeRemaining(0)} type="button">Stop</button>
                ) : null}
              </div>
            </section>
          ) : null}

          <small className="workshop-ritual__odds">
            {eligibleFaces.length}/6 target faces · Workshop Die {displayedWorkshopFaces.map((face) => face.value).join('–')}
          </small>
        </section>
      ) : null}

      <AnimatePresence>
        {reforgeOpen && selectedDie && forgeRecord ? (
          <motion.div
            aria-modal="true"
            className="workshop-reforge"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setReforgeOpen(false)}
            role="dialog"
          >
            <motion.section
              aria-labelledby="reforge-title"
              initial={{ scale: 0.9, y: 18 }}
              animate={{ scale: 1, y: 0 }}
              onClick={(event) => event.stopPropagation()}
            >
              <RotateCcw aria-hidden="true" size={34} />
              <span>Permanent reconstruction</span>
              <h2 id="reforge-title">Reforge {selectedDie.name}?</h2>
              <p>All Workshop upgrades on this die are removed. Attached Imprints return safely to your collection and keep their Power.</p>
              <dl>
                <div><dt>Souls invested</dt><dd>{forgeRecord.soulsSpent}</dd></div>
                <div><dt>Recovery rate</dt><dd>{Math.round(reforgeRefundRate * 100)}%</dd></div>
                <div><dt>Souls returned</dt><dd>{reforgeRefund}</dd></div>
                <div><dt>Souls lost</dt><dd>{forgeRecord.soulsSpent - reforgeRefund}</dd></div>
              </dl>
              <div className="workshop-reforge__actions">
                <button onClick={() => setReforgeOpen(false)} type="button">Cancel</button>
                <button disabled={forgeRecord.soulsSpent <= 0} onClick={confirmReforge} type="button">Confirm Reforge</button>
              </div>
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  )
}
