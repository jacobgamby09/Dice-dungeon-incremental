import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Lock, ShieldAlert, Swords } from 'lucide-react'
import { useGameStore, getCurrentAct, GAME_ACTS, UNIQUE_DIE_TYPES } from '../store/gameStore'
import type { Die, DieType } from '../store/gameStore'
import { dieTypeStyle } from './DieCard'
import { SkillTree } from './SkillTree'
import { DiceLibrary } from './DiceLibrary'
import { DiceInspectorModal } from './DiceInspectorModal'
import { DIE_ROLES } from '../diceDescriptions'

// ── Static data ───────────────────────────────────────────────────────────────

const DIE_NAMES: Partial<Record<DieType, string>> = {
  white:          'The Basic',
  blue:           'The Guard',
  green:          'The Mender',
  cursed:         'The Cursed',
  heavy:          'The Heavy',
  paladin:        'The Paladin',
  gambler:        'The Gambler',
  scavenger:      'The Scavenger',
  wall:           'The Wall',
  jackpot:        'The Jackpot',
  vampire:        'The Vampire',
  priest:         'The Priest',
  fortune_teller: 'The Fortune Teller',
  joker:          'The Joker',
  unique:         'The Multiplier',
  warden:         'The Warden',
  bulwark:        'The Bulwark',
}

const MODIFIER_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  none:       { label: 'No Modifier',      color: '#6b7280', icon: null },
  thorns:     { label: 'Thorns Active',    color: '#ef4444', icon: <ShieldAlert size={11} strokeWidth={2.5} /> },
  damage_cap: { label: 'Damage Cap Active',color: '#f59e0b', icon: <Swords      size={11} strokeWidth={2.5} /> },
}

// Infinite-supply base die types available in the pool
const BASE_POOL: DieType[] = ['white', 'blue', 'green']

// ── Infinite base pool card ───────────────────────────────────────────────────

function AddButton({ label, disabled, onClick, color }: { label: string; disabled: boolean; onClick: () => void; color: string }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        minWidth: 92,
        background: disabled ? '#374151' : color,
        border: '3px solid #000',
        boxShadow: disabled ? '3px 3px 0 #111827' : '3px 3px 0 #000',
        color: '#fff',
        fontFamily: 'inherit',
        fontSize: '0.62rem',
        fontWeight: 900,
        letterSpacing: '0.08em',
        padding: '10px 8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        textTransform: 'uppercase',
      }}
    >
      {disabled ? 'FULL' : label}
    </button>
  )
}

function InspectButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 44,
        background: '#111827',
        border: '3px solid #000',
        boxShadow: '3px 3px 0 #000',
        color: '#d1d5db',
        fontFamily: 'inherit',
        fontSize: '1rem',
        fontWeight: 900,
        padding: '9px 0',
        cursor: 'pointer',
      }}
      title="Inspect die"
    >
      ⌕
    </button>
  )
}

function BasePoolCard({ dieType, onEquip, onInspect, disabled }: { dieType: DieType; onEquip: () => void; onInspect: () => void; disabled: boolean }) {
  const s       = dieTypeStyle[dieType]
  const name    = `${DIE_NAMES[dieType] ?? dieType}${UNIQUE_DIE_TYPES.has(dieType) ? ' ★' : ''}`
  return (
    <div
      style={{
        background: '#12121f',
        border: `3px solid ${disabled ? '#1e293b' : s.shadow}`,
        boxShadow: disabled ? 'none' : `3px 3px 0 ${s.shadow}`,
        padding: '10px 12px',
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{
          width: 18, height: 18, flexShrink: 0,
          background: s.bg, border: '2px solid #000',
          boxShadow: `2px 2px 0 ${s.shadow}`,
        }} />
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontWeight: 900, fontSize: '0.78rem', color: s.bg, letterSpacing: '0.04em' }}>
            {name}
          </span>
          <span style={{ fontSize: '0.66rem', color: '#d1d5db', lineHeight: 1.35 }}>
            {DIE_ROLES[dieType]}
          </span>
          <span style={{ fontSize: '0.52rem', color: '#22c55e', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Unlimited supply
          </span>
        </div>
      </div>
      <InspectButton onClick={onInspect} />
      <AddButton label="Add" disabled={disabled} onClick={onEquip} color={s.shadow} />
    </div>
  )
}

// ── Reserved die card (owned modified dice) ───────────────────────────────────

function ReserveDieCard({ die, onEquip, onInspect, disabled }: { die: Die; onEquip: () => void; onInspect: () => void; disabled: boolean }) {
  const s    = dieTypeStyle[die.dieType]
  const name = `${DIE_NAMES[die.dieType] ?? die.dieType}${UNIQUE_DIE_TYPES.has(die.dieType) ? ' ★' : ''}`
  return (
    <div
      style={{
        background: '#12121f',
        border: `3px solid ${disabled ? '#1e293b' : s.shadow}`,
        boxShadow: disabled ? 'none' : `3px 3px 0 ${s.shadow}`,
        padding: '10px 12px',
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{
          width: 18, height: 18, flexShrink: 0,
          background: s.bg, border: '2px solid #000',
          boxShadow: `2px 2px 0 ${s.shadow}`,
        }} />
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontWeight: 900, fontSize: '0.78rem', color: s.bg, letterSpacing: '0.04em' }}>
            {name}
            {(die.mergeLevel ?? 0) > 0 && (
              <span style={{ color: '#f59e0b', fontWeight: 900, marginLeft: 4 }}>+{die.mergeLevel}</span>
            )}
          </span>
          <span style={{ fontSize: '0.66rem', color: '#d1d5db', lineHeight: 1.35 }}>
            {DIE_ROLES[die.dieType]}
          </span>
        </div>
      </div>
      <InspectButton onClick={onInspect} />
      <AddButton label="Equip" disabled={disabled} onClick={onEquip} color={s.shadow} />
    </div>
  )
}

function BagSlot({ die, index, onRemove }: { die?: Die; index: number; onRemove: () => void }) {
  if (!die) {
    return (
      <div style={{
        height: 42,
        background: '#0b1020',
        border: '2px dashed #334155',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#475569',
        fontSize: '0.55rem',
        fontWeight: 900,
      }}>
        EMPTY
      </div>
    )
  }

  const s = dieTypeStyle[die.dieType]
  const locked = die.dieType === 'cursed'
  return (
    <button
      onClick={locked ? undefined : onRemove}
      style={{
        height: 42,
        background: '#12121f',
        border: `2px solid ${locked ? '#ef4444' : s.shadow}`,
        boxShadow: `2px 2px 0 ${locked ? '#7f1d1d' : s.shadow}`,
        fontFamily: 'inherit',
        color: s.bg,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 5px',
        cursor: locked ? 'default' : 'pointer',
        minWidth: 0,
      }}
      title={locked ? 'Locked Cursed die' : 'Remove from bag'}
    >
      <span style={{
        width: 14,
        height: 14,
        background: s.bg,
        border: '2px solid #000',
        boxShadow: `1px 1px 0 ${s.shadow}`,
        flexShrink: 0,
      }} />
      <span style={{ fontSize: '0.52rem', fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {locked ? 'CURSED' : `${index + 1}`}
      </span>
      {locked && <Lock size={9} color="#ef4444" strokeWidth={3} style={{ marginLeft: 'auto', flexShrink: 0 }} />}
    </button>
  )
}

// ── Loadout screen ────────────────────────────────────────────────────────────

export function LoadoutScreen() {
  const currentFloor   = useGameStore(s => s.currentFloor)
  const startCombat    = useGameStore(s => s.startCombat)
  const devJumpToForge = useGameStore(s => s.devJumpToForge)
  const inventory      = useGameStore(s => s.inventory)
  const maxEquippedDice = useGameStore(s => s.maxEquippedDice)
  const toggleEquipDie = useGameStore(s => s.toggleEquipDie)
  const resetLoadout   = useGameStore(s => s.resetLoadout)
  const equipBaseDie   = useGameStore(s => s.equipBaseDie)
  const bankedSouls        = useGameStore((s) => s.bankedSouls)

  const [showTalents, setShowTalents] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [inspectType, setInspectType] = useState<DieType | null>(null)

  // Reset to clean slate on mount
  useEffect(() => { resetLoadout() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const currentAct  = getCurrentAct(currentFloor)
  const modMeta     = MODIFIER_META[currentAct.modifier]
  const equipped    = inventory.filter((d) => d.isEquipped !== false)
  const reserved    = inventory.filter((d) => d.isEquipped === false)
  const atCapacity  = equipped.length >= maxEquippedDice
  const canStart    = equipped.length === maxEquippedDice
  const emptySlots  = Math.max(0, maxEquippedDice - equipped.length)
  const slotDice    = [...equipped, ...Array.from({ length: emptySlots }, () => undefined as Die | undefined)]

  return (
    <div style={{
      maxWidth: 384, margin: '0 auto', height: '100dvh',
      display: 'flex', flexDirection: 'column',
      background: '#0f0f1a', color: '#fff', overflow: 'hidden',
      position: 'relative',
    }}>

      {/* ── Fixed top ── */}

      {/* Header */}
      <div style={{
        background: '#1a1a2e', padding: '10px 16px',
        borderBottom: '3px solid #000',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Flame size={14} color="#a855f7" strokeWidth={2.5} />
          <motion.span
            key={bankedSouls}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.25 }}
            style={{ fontSize: '0.9rem', fontWeight: 900, color: '#a855f7' }}
          >
            {bankedSouls}
          </motion.span>
          <span style={{ fontSize: '0.55rem', color: '#7c3aed', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Souls
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {GAME_ACTS.map((a) => (
            <div key={a.id} style={{
              width: 7, height: 7,
              background: a.id === currentAct.id ? '#e2e8f0' : '#374151',
              border: '1px solid #000',
            }} />
          ))}
          <span style={{ fontSize: '0.55rem', color: '#6b7280', letterSpacing: '0.1em', marginLeft: 4 }}>
            Floor {currentFloor}
          </span>
        </div>
      </div>

      {/* Act banner */}
      <div style={{
        background: '#12121f', padding: '6px 16px',
        borderBottom: '2px solid #000',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#e2e8f0' }}>{currentAct.name}</div>
          <div style={{ fontSize: '0.55rem', color: '#9ca3af' }}>{currentAct.description}</div>
        </div>
        {currentAct.modifier !== 'none' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 6px',
            background: 'rgba(239,68,68,0.08)',
            border: `1px solid ${modMeta.color}`,
          }}>
            <span style={{ color: modMeta.color, lineHeight: 0 }}>{modMeta.icon}</span>
            <span style={{ fontSize: '0.5rem', color: modMeta.color, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {modMeta.label}
            </span>
          </div>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* ── Starting bag section ── */}
        <div style={{ padding: '12px 16px 8px', display: 'flex', flexDirection: 'column', gap: 9 }}>
          <div style={{
            background: '#12121f',
            border: `3px solid ${canStart ? '#16a34a' : '#334155'}`,
            boxShadow: '4px 4px 0 #000',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: '0.86rem', color: '#e2e8f0', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Starting Bag
                </span>
                <span style={{ fontSize: '0.62rem', color: '#94a3b8', lineHeight: 1.35 }}>
                  Fill the empty slots before descending.
                </span>
              </div>
              <span style={{
                fontSize: '1rem',
                fontWeight: 900,
                color: canStart ? '#22c55e' : '#f59e0b',
                whiteSpace: 'nowrap',
              }}>
                {equipped.length}/{maxEquippedDice}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 6 }}>
              {slotDice.map((die, i) => (
                <BagSlot
                  key={die?.id ?? `empty-${i}`}
                  die={die}
                  index={i}
                  onRemove={() => die && toggleEquipDie(die.id)}
                />
              ))}
            </div>

            <span style={{
              color: canStart ? '#22c55e' : '#fca5a5',
              fontSize: '0.62rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}>
              {canStart ? 'Ready to descend' : `Add ${maxEquippedDice - equipped.length} more dice to descend`}
            </span>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ borderTop: '2px solid #1e293b', margin: '4px 16px 0' }} />

        {/* ── Infinite base pool ── */}
        <div style={{ padding: '10px 16px 4px', display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontSize: '0.72rem', color: '#e2e8f0', fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              Available Base Dice
            </span>
            <span style={{ fontSize: '0.62rem', color: '#94a3b8', lineHeight: 1.35 }}>
              Add copies to your starting bag. Inspect for exact faces.
            </span>
          </div>
          {BASE_POOL.map((t) => (
            <BasePoolCard
              key={t}
              dieType={t}
              onEquip={() => equipBaseDie(t)}
              onInspect={() => setInspectType(t)}
              disabled={atCapacity}
            />
          ))}
        </div>

        {/* ── Reserved modified dice ── */}
        {reserved.length > 0 && (
          <div style={{ padding: '10px 16px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ borderTop: '2px solid #1e293b', marginBottom: 3 }} />
            <span style={{ fontSize: '0.6rem', color: '#6b7280', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              Your Dice — {reserved.length} in reserve
            </span>
            {reserved.map((die) => (
              <ReserveDieCard
                key={die.id}
                die={die}
                onEquip={() => toggleEquipDie(die.id)}
                onInspect={() => setInspectType(die.dieType)}
                disabled={atCapacity}
              />
            ))}
          </div>
        )}

        <div style={{ height: 8 }} />
      </div>

      {/* ── Fixed footer ── */}
      <div style={{
        background: '#1a1a2e', padding: '10px 16px',
        borderTop: '3px solid #000',
        display: 'flex', flexDirection: 'column', gap: 7,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowTalents(true)}
            className="pixel-btn"
            style={{ flex: 1, background: '#7c3aed', color: '#ede9fe', textShadow: '1px 1px 0 #4c1d95', fontSize: '0.65rem' }}
          >
            ✦ TALENTS
          </button>
          <button
            onClick={() => setShowLibrary(true)}
            className="pixel-btn"
            style={{ flex: 1, background: '#b45309', color: '#fef3c7', textShadow: '1px 1px 0 #78350f', fontSize: '0.65rem' }}
          >
            ✦ LIBRARY
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={startCombat}
            disabled={!canStart}
            className="pixel-btn"
            style={{
              flex: 1,
              background: canStart ? '#16a34a' : '#374151',
              color: '#f0fdf4',
              textShadow: canStart ? '1px 1px 0 #14532d' : 'none',
              opacity: canStart ? 1 : 0.6,
              cursor: canStart ? 'pointer' : 'not-allowed',
            }}
          >
            {canStart ? '▶ DESCEND' : `Add ${maxEquippedDice - equipped.length} more dice`}
          </button>
          <button
            onClick={devJumpToForge}
            title="DEV: Start at Floor 7 / Shieldbearer with 3 random Global/Act 1 dice"
            style={{
              width: 44, flexShrink: 0,
              background: '#1c1c2e', border: '2px dashed #4b5563', color: '#6b7280',
              fontSize: '0.55rem', fontWeight: 700, fontFamily: 'inherit',
              letterSpacing: '0.05em', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
            }}
          >
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>🛠</span>
            <span>TEST</span>
          </button>
        </div>
      </div>

      {showTalents && <SkillTree   onClose={() => setShowTalents(false)} />}
      {showLibrary && <DiceLibrary onClose={() => setShowLibrary(false)} />}
      {inspectType && (
        <DiceInspectorModal
          types={[inspectType]}
          initialType={inspectType}
          onClose={() => setInspectType(null)}
        />
      )}

      {/* DEV: grant souls */}
      <button
        onClick={() => useGameStore.setState((s) => ({ bankedSouls: s.bankedSouls + 10000 }))}
        style={{
          position: 'absolute', bottom: 8, left: 8,
          background: 'none', border: '1px solid #374151',
          color: '#6b7280', fontSize: '0.55rem', padding: '3px 7px',
          cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.05em',
          opacity: 0.35, transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.35')}
      >
        DEV: +10k Souls
      </button>
    </div>
  )
}
