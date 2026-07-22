import { useEffect, useRef } from 'react'
import { Backpack, Bot, Dice6, Heart, Sparkles, X, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { DieInstance } from '../../game/types/dice'
import type { TalentDefinition, TalentEffect } from '../../game/types/progression'
import { TALENTS_BY_ID } from '../../game/content/talents'
import { DieSummary } from './DieSummary'
import type { TalentNodeState } from './TalentNode'

interface TalentDialogProps {
  grantedDice: DieInstance[]
  mode: 'preview' | 'reward'
  nodeState: Exclude<TalentNodeState, 'hidden'>
  onClose: () => void
  onConfirm: () => void
  onOpenLoadout: () => void
  talent: TalentDefinition
  xp: number
}

const EFFECT_META: Record<TalentEffect['type'], { icon: LucideIcon; label: (effect: TalentEffect) => string }> = {
  max_hp: {
    icon: Heart,
    label: (effect) => effect.type === 'max_hp' ? `+${effect.amount} Max HP` : '',
  },
  dice_slots: {
    icon: Backpack,
    label: (effect) => effect.type === 'dice_slots' ? `+${effect.amount} Dice Slot` : '',
  },
  grant_die: {
    icon: Dice6,
    label: () => '1 unique permanent die',
  },
  roll_speed: {
    icon: Zap,
    label: (effect) => effect.type === 'roll_speed' ? `${Math.round((effect.multiplier - 1) * 100)}% faster rolls` : '',
  },
  unlock_auto_roll: {
    icon: Bot,
    label: () => 'Auto Roll toggle',
  },
}

function getBlockedLabel(state: Exclude<TalentNodeState, 'hidden'>, talent: TalentDefinition, xp: number): string {
  if (state === 'purchased') return 'Talent already active'
  if (state === 'locked') {
    const prerequisiteNames = talent.prerequisiteIds.map((id) => TALENTS_BY_ID[id]?.name).filter(Boolean)
    return `Requires ${prerequisiteNames.join(' + ')}`
  }
  if (state === 'too-expensive') return `Need ${talent.cost - xp} more XP`
  return `Activate for ${talent.cost} XP`
}

export function TalentDialog({
  grantedDice,
  mode,
  nodeState,
  onClose,
  onConfirm,
  onOpenLoadout,
  talent,
  xp,
}: TalentDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const canPurchase = nodeState === 'ready'

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    return () => dialog.close()
  }, [])

  return (
    <dialog
      aria-labelledby="talent-dialog-title"
      className={`talent-dialog talent-dialog--${mode}`}
      onCancel={onClose}
      ref={dialogRef}
    >
      <div className="talent-dialog__altar" aria-hidden="true" />
      <header className="talent-dialog__header">
        <span className="eyebrow">{mode === 'reward' ? 'Shrine awakened' : 'Talent preview'}</span>
        <h2 id="talent-dialog-title">{talent.name}</h2>
        <button aria-label="Close talent details" className="talent-dialog__close" onClick={onClose} type="button">
          <X aria-hidden="true" size={18} />
        </button>
      </header>

      {mode === 'reward' ? (
        <div className="talent-dialog__activation" aria-live="polite">
          <Sparkles aria-hidden="true" size={34} />
          <strong>Talent activated</strong>
          <span>{talent.cost} XP offered to the shrine</span>
        </div>
      ) : (
        <p className="talent-dialog__description">{talent.description}</p>
      )}

      <div className="talent-dialog__effects" aria-label="Permanent effects">
        {talent.effects.map((effect, index) => {
          const meta = EFFECT_META[effect.type]
          const EffectIcon = meta.icon
          return (
            <div className="talent-dialog__effect" key={`${effect.type}-${index}`}>
              <EffectIcon aria-hidden="true" size={18} />
              <span><small>Permanent capability</small><strong>{meta.label(effect)}</strong></span>
            </div>
          )
        })}
      </div>

      {grantedDice.map((die) => (
        <div className="talent-dialog__die" key={die.id}>
          <span className="talent-dialog__die-label"><Dice6 aria-hidden="true" size={16} /> Concrete item received</span>
          <DieSummary die={die} />
          <p>One named die was added to your collection. This does not create unlimited {die.family} dice.</p>
        </div>
      ))}

      {mode === 'preview' && (
        <div
          aria-label={`${xp} of ${talent.cost} XP available`}
          aria-valuemax={talent.cost}
          aria-valuemin={0}
          aria-valuenow={Math.min(xp, talent.cost)}
          className="talent-dialog__xp"
          role="progressbar"
        >
          <span><Sparkles aria-hidden="true" size={14} /> XP OFFERING</span>
          <strong>{Math.min(xp, talent.cost)} / {talent.cost}</strong>
          <span className="talent-dialog__xp-track" aria-hidden="true">
            <span style={{ width: `${Math.min(100, (xp / talent.cost) * 100)}%` }} />
          </span>
        </div>
      )}

      <footer className="talent-dialog__actions">
        {mode === 'reward' && grantedDice.length > 0 ? (
          <button className="talent-dialog__primary" onClick={onOpenLoadout} type="button">
            <Backpack aria-hidden="true" size={18} /> Go to Loadout
          </button>
        ) : mode === 'reward' ? (
          <button className="talent-dialog__primary" onClick={onClose} type="button">
            <Sparkles aria-hidden="true" size={18} /> Return to Shrine
          </button>
        ) : (
          <button className="talent-dialog__primary" disabled={!canPurchase} onClick={onConfirm} type="button">
            <Sparkles aria-hidden="true" size={18} /> {getBlockedLabel(nodeState, talent, xp)}
          </button>
        )}
        {mode === 'reward' && grantedDice.length > 0 && (
          <button className="talent-dialog__secondary" onClick={onClose} type="button">Inspect Shrine</button>
        )}
      </footer>
    </dialog>
  )
}
