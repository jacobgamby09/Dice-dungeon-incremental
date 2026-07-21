import { useState } from 'react'
import { Flame, FlaskConical, Swords, Shield, Heart, Skull, Droplets, Star, Shuffle, Lock, LockOpen, Clock, RefreshCw } from 'lucide-react'
import { useGameStore, DIE_TEMPLATES, UNIQUE_DIE_TYPES, DIE_NAMES } from '../store/gameStore'
import { dieTypeStyle, faceColor } from './DieCard'
import { DiceInspectorModal } from './DiceInspectorModal'
import type { DieType, DieFace, Die } from '../store/gameStore'
import { DIE_ROLES } from '../diceDescriptions'

// ── Face icon ─────────────────────────────────────────────────────────────────

function FaceIcon({ type, size = 13 }: { type: DieFace['type']; size?: number }) {
  const color = faceColor[type]
  if (type === 'damage')      return <Swords   size={size} color={color} strokeWidth={2.5} />
  if (type === 'shield')      return <Shield   size={size} color={color} strokeWidth={2.5} />
  if (type === 'skull')       return <Skull    size={size} color={color} strokeWidth={2.5} />
  if (type === 'souls')       return <Flame    size={size} color={color} strokeWidth={2.5} />
  if (type === 'lifesteal')   return <Droplets size={size} color={color} strokeWidth={2.5} />
  if (type === 'choose_next') return <Star     size={size} color={color} strokeWidth={2.5} />
  if (type === 'wildcard')    return <Shuffle      size={size} color={color} strokeWidth={2.5} />
  if (type === 'poison')      return <FlaskConical size={size} color={color} strokeWidth={2.5} />
  if (type === 'seal')        return <MaelstromIcon size={size} color={color} />
  if (type === 'shield_bash') return <ShieldBashIcon size={size} color={color} />
  return <Heart size={size} color={color} strokeWidth={2.5} />
}

function MaelstromIcon({ size, color }: { size: number; color: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M19 12a7 7 0 0 1-12 5M5 12a7 7 0 0 1 12-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" /><path d="M8 17H5v-3M16 7h3v3" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3.5" stroke={color} strokeWidth="2" /></svg>
}

function ShieldBashIcon({ size, color }: { size: number; color: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M8 4h8l2 4v6c0 3.5-2.3 5.5-6 7-3.7-1.5-6-3.5-6-7V8l2-4Z" stroke={color} strokeWidth="2.4" strokeLinejoin="round" /><path d="M4 13h7M7 10l4 3-4 3M14 9l3 3-3 3" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

// ── Single die choice card ────────────────────────────────────────────────────

function DieChoiceCard({
  dieType, isLocked, onSelect, onToggleLock, onInspect,
}: {
  dieType: DieType
  isLocked: boolean; onSelect: () => void; onToggleLock: () => void; onInspect: () => void
}) {
  const template = DIE_TEMPLATES[dieType]
  const s = dieTypeStyle[dieType]
  const name = `${DIE_NAMES[dieType] ?? dieType}${UNIQUE_DIE_TYPES.has(dieType) ? ' ★' : ''}`

  return (
    <div style={{
      background: '#1a1a2e',
      border: `3px solid ${isLocked ? '#d97706' : '#000'}`,
      boxShadow: `4px 4px 0 ${isLocked ? '#92400e' : '#000'}`,
      padding: '14px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* Die header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 18, height: 18, flexShrink: 0,
          background: s.bg,
          border: '2px solid #000',
          boxShadow: `2px 2px 0 ${s.shadow}`,
        }} />
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: s.bg, flex: 1 }}>
          {name}
        </span>
        {/* Lock toggle */}
        <button
          onClick={onToggleLock}
          title={isLocked ? 'Unlock (carry to next draft)' : 'Lock (carry to next draft)'}
          style={{
            background: isLocked ? '#92400e' : '#1e293b',
            border: `2px solid ${isLocked ? '#d97706' : '#374151'}`,
            boxShadow: isLocked ? '2px 2px 0 #78350f' : 'none',
            padding: '4px 5px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 0, flexShrink: 0,
          }}
        >
          {isLocked
            ? <Lock     size={12} color="#fbbf24" strokeWidth={2.5} />
            : <LockOpen size={12} color="#6b7280" strokeWidth={2.5} />
          }
        </button>
      </div>

      {/* Face grid: 3 columns × 2 rows */}
      <button
        onClick={onInspect}
        style={{
          background: '#0f0f1a',
          border: '2px solid #000',
          padding: '7px 8px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '0.82rem', color: '#d1d5db', lineHeight: 1.55 }}>
          {DIE_ROLES[dieType]}
        </span>
        <span style={{
          display: 'block',
          marginTop: 3,
          fontSize: '0.54rem',
          color: '#6b7280',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          Tap for details
        </span>
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {template.faces.map((face, i) => (
          <div
            key={i}
            style={{
              background: s.bg,
              border: '2px solid #000',
              boxShadow: `2px 2px 0 ${s.shadow}`,
              minHeight: 32,
              padding: '6px 4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}
          >
            {face.type === 'blank' ? null
              : face.type === 'multiplier' ? (
                <span style={{ fontSize: '0.9rem', fontWeight: 900, color: s.text, lineHeight: 1 }}>
                  ×{face.value}
                </span>
              ) : face.type === 'mirror' ? (
                <RefreshCw size={16} color="#334155" strokeWidth={2.5} />
              ) : face.type === 'hot' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#064e3b', lineHeight: 1 }}>+{face.value}</span>
                    <Heart size={10} color="#064e3b" strokeWidth={2.5} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#064e3b', lineHeight: 1 }}>+{face.duration ?? 1}</span>
                    <Clock size={9} color="#064e3b" strokeWidth={2.5} />
                  </div>
                </div>
              ) : face.type === 'purified_skull' ? (
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Skull size={18} color="#ffffff" strokeWidth={2.5} />
                  <svg style={{ position: 'absolute', pointerEvents: 'none' }} width="24" height="24" viewBox="0 0 24 24">
                    <line x1="2" y1="2" x2="22" y2="22" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
                    <line x1="22" y1="2" x2="2" y2="22" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
                  </svg>
                </div>
              ) : (face.type === 'skull' || face.type === 'choose_next' || face.type === 'wildcard' || face.type === 'seal' || face.type === 'shield_bash') ? (
                <FaceIcon type={face.type} size={18} />
              ) : (
                <>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: s.text, lineHeight: 1 }}>
                    {face.value}
                  </span>
                  <FaceIcon type={face.type} size={12} />
                </>
              )}
          </div>
        ))}
      </div>

      {/* Select button */}
      <button
        onClick={onSelect}
        className="pixel-btn"
        style={{ background: s.shadow, color: '#fff', textShadow: '1px 1px 0 #000', letterSpacing: '0.2em' }}
      >
        SELECT
      </button>
    </div>
  )
}

// ── Draft screen ──────────────────────────────────────────────────────────────

export function DraftScreen() {
  const draftChoices    = useGameStore(s => s.draftChoices)
  const lastSoulsEarned = useGameStore(s => s.lastSoulsEarned)
  const runSouls        = useGameStore(s => s.runSouls)
  const rerollCost      = useGameStore(s => s.rerollCost)
  const currentFloor    = useGameStore(s => s.currentFloor)
  const selectDraftDie  = useGameStore(s => s.selectDraftDie)
  const rerollDraft     = useGameStore(s => s.rerollDraft)
  const extractToBase   = useGameStore(s => s.extractToBase)
  const inventory = useGameStore((s) => s.inventory)
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set())
  const [showBagModal, setShowBagModal] = useState(false)
  const [inspectorDie, setInspectorDie] = useState<Die | null>(null)

  function toggleLock(id: string) {
    setLockedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const allLocked = draftChoices.length > 0 && draftChoices.every((d) => lockedIds.has(d.id))
  const canReroll = runSouls >= rerollCost && !allLocked

  return (
    <div style={{
      maxWidth: 384, margin: '0 auto', height: '100dvh',
      display: 'flex', flexDirection: 'column',
      background: '#0f0f1a', color: '#fff', overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{
        background: '#1a1a2e', padding: '12px 16px',
        borderBottom: '3px solid #000',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{
          fontSize: '1.1rem', fontWeight: 700,
          color: '#fbbf24', textShadow: '2px 2px 0 #78350f',
          letterSpacing: '0.1em',
        }}>
          VICTORY!
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: '0.62rem', color: '#9ca3af',
            letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>
            Floor {currentFloor}
          </span>
          {lastSoulsEarned > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Flame size={14} color="#a855f7" strokeWidth={2.5} />
              <span style={{ color: '#a855f7', fontWeight: 700, fontSize: '0.85rem' }}>
                +{lastSoulsEarned} Souls
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Subheader */}
      <div style={{
        background: '#12121f', padding: '10px 16px',
        borderBottom: '2px solid #000',
        textAlign: 'center',
      }}>
        <span style={{
          fontSize: '0.65rem', color: '#9ca3af',
          letterSpacing: '0.3em', textTransform: 'uppercase',
        }}>
          Choose your reward · Lock to carry forward
        </span>
      </div>

      {/* Die choices */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {draftChoices.map((die) => (
          <DieChoiceCard
            key={die.id}
            dieType={die.dieType}
            isLocked={lockedIds.has(die.id)}
            onToggleLock={() => toggleLock(die.id)}
            onInspect={() => setInspectorDie(die)}
            onSelect={() => {
              const otherLockedIds = draftChoices
                .filter((d) => d.id !== die.id && lockedIds.has(d.id))
                .map((d) => d.id)
              selectDraftDie(die.id, otherLockedIds)
            }}
          />
        ))}
      </div>

      {/* View Bag strip */}
      <div style={{ padding: '8px 16px', background: '#0f0f1a' }}>
        <button
          onClick={() => setShowBagModal(true)}
          style={{
            width: '100%', padding: '10px',
            background: '#1e293b',
            border: '2px solid #374151',
            boxShadow: '3px 3px 0 #000',
            color: '#94a3b8',
            fontFamily: 'inherit', fontSize: '0.75rem', fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          VIEW BAG
        </button>
      </div>

      {/* Footer */}
      <div style={{ background: '#1a1a2e', padding: '12px 16px', borderTop: '3px solid #000', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={() => rerollDraft([...lockedIds])}
          disabled={!canReroll}
          className="pixel-btn"
          style={{
            background: canReroll ? '#7c3aed' : '#374151',
            color: '#e9d5ff',
            textShadow: '1px 1px 0 #000',
            opacity: canReroll ? 1 : 0.5,
          }}
        >
          <Flame size={13} strokeWidth={2.5} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
          RE-ROLL DICE (-{rerollCost} Souls)
        </button>
        <button
          onClick={extractToBase}
          className="pixel-btn"
          style={{ background: '#7f1d1d', color: '#fca5a5', textShadow: '1px 1px 0 #000' }}
        >
          FLEE THE DEPTHS
          {runSouls > 0 && (
            <span style={{ marginLeft: 8, fontSize: '0.7rem', color: '#fbbf24', fontWeight: 700 }}>
              (bank {runSouls} Souls)
            </span>
          )}
        </button>
      </div>

      {/* Bag modal */}
      {showBagModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.88)',
          zIndex: 100,
          maxWidth: 384, margin: '0 auto',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            background: '#1a1a2e', padding: '12px 16px',
            borderBottom: '3px solid #000',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: '0.65rem', color: '#9ca3af', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
              Your Bag
            </span>
            <span style={{ fontSize: '0.65rem', color: '#6b7280', letterSpacing: '0.1em' }}>
              {inventory.length} dice
            </span>
          </div>
          <div style={{
            flex: 1, overflowY: 'auto', padding: '10px 14px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {inventory.length === 0 ? (
              <span style={{ color: '#6b7280', fontSize: '0.8rem', textAlign: 'center', padding: '12px 0' }}>
                Bag is empty
              </span>
            ) : inventory.map((die) => {
              const s = dieTypeStyle[die.dieType]
              return (
                <button
                  key={die.id}
                  onClick={() => setInspectorDie(die)}
                  style={{
                    background: '#12121f', border: `2px solid ${s.shadow}`,
                    boxShadow: `3px 3px 0 ${s.shadow}`,
                    padding: '8px 10px', cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#1a1a2e')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#12121f')}
                >
                  <div style={{
                    width: 14, height: 14, flexShrink: 0,
                    background: s.bg, border: '2px solid #000',
                    boxShadow: `1px 1px 0 ${s.shadow}`,
                  }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: s.bg, flex: 1, letterSpacing: '0.05em' }}>
                    {DIE_NAMES[die.dieType] ?? die.dieType}{UNIQUE_DIE_TYPES.has(die.dieType) ? ' ★' : ''}
                    {(die.mergeLevel ?? 0) > 0 && (
                      <span style={{ color: '#f59e0b', fontWeight: 900, marginLeft: 4 }}>+{die.mergeLevel}</span>
                    )}
                  </span>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {die.faces.map((face, i) => (
                      <div key={i} style={{
                        width: 28, height: 28,
                        background: s.bg, border: '2px solid #000',
                        boxShadow: `1px 1px 0 ${s.shadow}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontWeight: 700,
                        color: face.type === 'skull' || face.type === 'purified_skull' ? faceColor.skull : s.text,
                      }}>
                        {face.type === 'skull' ? '💀'
                          : face.type === 'purified_skull' ? '☠'
                          : face.type === 'choose_next' ? '✦'
                          : face.type === 'wildcard' ? '~'
                          : face.type === 'blank' ? ''
                          : face.value}
                      </div>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
          <div style={{ background: '#1a1a2e', padding: '12px 16px', borderTop: '3px solid #000' }}>
            <button
              onClick={() => { setShowBagModal(false); setInspectorDie(null) }}
              className="pixel-btn"
              style={{ background: '#374151' }}
            >
              BACK TO DRAFT
            </button>
          </div>
        </div>
      )}

      {inspectorDie && (
        <DiceInspectorModal
          types={[inspectorDie.dieType]}
          faces={inspectorDie.faces}
          mergeLevel={inspectorDie.mergeLevel}
          onClose={() => setInspectorDie(null)}
        />
      )}
    </div>
  )
}
