import { useState } from 'react'
import type { Ref } from 'react'
import type { RoundTotals } from '../../game/types/combat'
import type { FaceType } from '../../game/types/dice'
import type { EnemyDieDefinition, EnemyRollResult } from '../../game/types/enemyDice'
import { EnemyIntentDie } from './EnemyIntentDie'
import type { EnemyIntentDieStage } from './EnemyIntentDie'
import { FaceIcon } from './FaceIcon'
import { FACE_META } from './faceVisuals'

export type EnemyIntentTrayStage =
  | 'rolling'
  | 'landed'
  | 'healing'
  | 'attacking'
  | 'cancelled'

interface EnemyIntentTrayProps {
  activeShield: number
  attackTotalRef?: Ref<HTMLSpanElement>
  dice: EnemyDieDefinition[]
  results: EnemyRollResult[]
  rollDuration: number
  rollStagger: number
  stage: EnemyIntentTrayStage
  totals: RoundTotals
}

const TYPE_ORDER: FaceType[] = ['attack', 'shield', 'heal']

export function EnemyIntentTray({
  activeShield,
  attackTotalRef,
  dice,
  results,
  rollDuration,
  rollStagger,
  stage,
  totals,
}: EnemyIntentTrayProps) {
  const [inspectedDieId, setInspectedDieId] = useState<string | null>(null)
  const inspectedDie = dice.find((die) => die.id === inspectedDieId) ?? null
  const visibleTypes = TYPE_ORDER.filter((type) => results.some((result) => result.type === type))

  const label = stage === 'rolling'
    ? 'Enemy rolling'
    : stage === 'cancelled'
      ? 'Intent cancelled'
      : 'Enemy intent'

  return (
    <div className={`enemy-intent-tray enemy-intent-tray--${stage}`}>
      <span className="enemy-intent-tray__label">{label}</span>
      <div
        className="enemy-intent-tray__dice"
        aria-label={`${dice.length} enemy ${dice.length === 1 ? 'die' : 'dice'}`}
      >
        {dice.map((die, index) => {
          const result = results[index]
          if (!result) return null
          const dieStage: EnemyIntentDieStage = stage === 'rolling'
            ? 'rolling'
            : stage === 'cancelled'
              ? 'cancelled'
              : (stage === 'attacking' && result.type === 'attack')
                || (stage === 'healing' && result.type === 'heal')
                ? 'active'
                : 'landed'
          return (
            <EnemyIntentDie
              die={die}
              isInspecting={inspectedDieId === die.id}
              key={die.id}
              onInspect={() => setInspectedDieId((current) => current === die.id ? null : die.id)}
              result={result}
              rollDelay={index * rollStagger}
              rollDuration={rollDuration}
              stage={dieStage}
            />
          )
        })}
      </div>
      <div className="enemy-intent-tray__totals" aria-label="Enemy intent totals">
        {visibleTypes.map((type) => {
          const value = type === 'shield' ? activeShield : totals[type]
          return (
            <span
              className={`enemy-intent-total enemy-intent-total--${type}`}
              data-enemy-intent-type={type}
              key={type}
              ref={type === 'attack' ? attackTotalRef : undefined}
            >
              <FaceIcon type={type} size={13} />
              <strong>{stage === 'rolling' ? '?' : value}</strong>
              <small>{FACE_META[type].label}</small>
            </span>
          )
        })}
      </div>
      {inspectedDie && stage !== 'rolling' && stage !== 'cancelled' && (
        <div className="enemy-intent-tray__details" role="note">
          <strong>{inspectedDie.name}</strong>
          <div aria-label={`Faces: ${inspectedDie.faces.map((face) => face.value).join(', ')}`}>
            {inspectedDie.faces.map((face) => (
              <span key={face.id}>
                <strong>{face.value}</strong>
                <FaceIcon type={face.type} size={11} />
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
