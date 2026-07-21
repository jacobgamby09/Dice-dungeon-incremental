import { useState } from 'react'
import { Clock, Flame, FlaskConical, RefreshCw, Swords, Shield, Heart, Skull, Droplets, Star, Shuffle } from 'lucide-react'
import { useGameStore, DIE_NAMES, UNIQUE_DIE_TYPES } from '../store/gameStore'
import { dieTypeStyle, faceColor } from './DieCard'
import type { DieFace } from '../store/gameStore'

const CULL_TARGET = 7

function FaceIcon({ type, size = 13 }: { type: DieFace['type']; size?: number }) {
  const color = faceColor[type]
  if (type === 'damage')      return <Swords       size={size} color={color} strokeWidth={2.5} />
  if (type === 'shield')      return <Shield       size={size} color={color} strokeWidth={2.5} />
  if (type === 'skull')       return <Skull        size={size} color={color} strokeWidth={2.5} />
  if (type === 'souls')       return <Flame        size={size} color={color} strokeWidth={2.5} />
  if (type === 'lifesteal')   return <Droplets     size={size} color={color} strokeWidth={2.5} />
  if (type === 'choose_next') return <Star         size={size} color={color} strokeWidth={2.5} />
  if (type === 'wildcard')    return <Shuffle      size={size} color={color} strokeWidth={2.5} />
  if (type === 'poison')      return <FlaskConical size={size} color={color} strokeWidth={2.5} />
  if (type === 'seal')        return <MaelstromIcon size={size} color={color} />
  if (type === 'shield_bash') return <ShieldBashIcon size={size} color={color} />
  if (type === 'mirror')      return <RefreshCw    size={size} color={color} strokeWidth={2.5} />
  if (type === 'heal')        return <Heart        size={size} color={color} strokeWidth={2.5} />
  return null
}

function MaelstromIcon({ size, color }: { size: number; color: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M19 12a7 7 0 0 1-12 5M5 12a7 7 0 0 1 12-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" /><path d="M8 17H5v-3M16 7h3v3" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3.5" stroke={color} strokeWidth="2" /></svg>
}

function ShieldBashIcon({ size, color }: { size: number; color: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M8 4h8l2 4v6c0 3.5-2.3 5.5-6 7-3.7-1.5-6-3.5-6-7V8l2-4Z" stroke={color} strokeWidth="2.4" strokeLinejoin="round" /><path d="M4 13h7M7 10l4 3-4 3M14 9l3 3-3 3" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

export function InterActScreen() {
  const inventory    = useGameStore((s) => s.inventory)
  const bankedSouls  = useGameStore((s) => s.bankedSouls)
  const cullInventory = useGameStore((s) => s.cullInventory)
  const cullableDice = inventory.filter((die) => die.dieType !== 'cursed')

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < CULL_TARGET) {
        next.add(id)
      }
      return next
    })
  }

  const canDescend = selectedIds.size === CULL_TARGET

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
          color: '#ef4444', textShadow: '2px 2px 0 #7f1d1d',
          letterSpacing: '0.1em',
        }}>
          THE CULLING
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Flame size={14} color="#a855f7" strokeWidth={2.5} />
          <span style={{ color: '#a855f7', fontWeight: 700, fontSize: '0.85rem' }}>
            {bankedSouls} Banked
          </span>
        </div>
      </div>

      {/* Subheader */}
      <div style={{
        background: '#12121f', padding: '10px 16px',
        borderBottom: '2px solid #000',
        textAlign: 'center',
        display: 'flex', flexDirection: 'column', gap: 3,
      }}>
        <span style={{ fontSize: '0.65rem', color: '#9ca3af', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
          Choose {CULL_TARGET} dice to carry into Act 2
        </span>
        <span style={{ fontSize: '0.6rem', color: '#6b7280', letterSpacing: '0.15em' }}>
          3 Cursed dice will be added automatically
        </span>
      </div>

      {/* Dice list */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '10px 16px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {cullableDice.map((die) => {
          const s = dieTypeStyle[die.dieType]
          const isSelected = selectedIds.has(die.id)
          const isDisabled = !isSelected && selectedIds.size >= CULL_TARGET
          const baseName = DIE_NAMES[die.dieType] ?? die.dieType

          return (
            <button
              key={die.id}
              onClick={() => { if (!isDisabled) toggleSelect(die.id) }}
              style={{
                background: isSelected ? '#1a1a3a' : '#12121f',
                border: `2px solid ${isSelected ? '#7c3aed' : s.shadow}`,
                boxShadow: isSelected ? '3px 3px 0 #4c1d95' : `3px 3px 0 ${s.shadow}`,
                padding: '10px 12px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 10,
                opacity: isDisabled ? 0.35 : 1,
              }}
            >
              {/* Colour swatch */}
              <div style={{
                width: 14, height: 14, flexShrink: 0,
                background: s.bg, border: '2px solid #000',
                boxShadow: `1px 1px 0 ${s.shadow}`,
              }} />

              {/* Name, with merge level / unique star on second line */}
              <div style={{ width: 72, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isSelected ? '#a5b4fc' : s.bg, letterSpacing: '0.05em', wordBreak: 'break-word' }}>
                  {baseName}
                </span>
                {UNIQUE_DIE_TYPES.has(die.dieType) && (
                  <span style={{ fontSize: '0.6rem', fontWeight: 900, color: isSelected ? '#a5b4fc' : s.bg, lineHeight: 1 }}>★</span>
                )}
                {(die.mergeLevel ?? 0) > 0 && (
                  <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>+{die.mergeLevel}</span>
                )}
              </div>

              {/* Face mini-cells */}
              <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                {die.faces.map((face, i) => (
                  <div
                    key={i}
                    style={{
                      width: 26, height: 26,
                      background: s.bg, border: '2px solid #000',
                      boxShadow: `1px 1px 0 ${s.shadow}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {face.type === 'blank' || face.type === 'multiplier' ? (
                      <span style={{ fontSize: '0.6rem', fontWeight: 900, color: s.text }}>
                        {face.type === 'multiplier' ? `×${face.value}` : ''}
                      </span>
                    ) : face.type === 'hot' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span style={{ fontSize: '0.58rem', fontWeight: 900, color: s.text, lineHeight: 1 }}>+{face.value}</span>
                          <Heart size={8} color={faceColor.hot} strokeWidth={2.5} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span style={{ fontSize: '0.48rem', fontWeight: 800, color: s.text, lineHeight: 1 }}>+{face.duration ?? 1}</span>
                          <Clock size={7} color={faceColor.hot} strokeWidth={2.5} />
                        </div>
                      </div>
                    ) : face.type === 'purified_skull' ? (
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Skull size={13} color="#ffffff" strokeWidth={2.5} />
                        <svg style={{ position: 'absolute', pointerEvents: 'none' }} width="18" height="18" viewBox="0 0 18 18">
                          <line x1="2" y1="2" x2="16" y2="16" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
                          <line x1="16" y1="2" x2="2" y2="16" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                      </div>
                    ) : (face.type === 'skull' || face.type === 'choose_next' || face.type === 'wildcard' || face.type === 'souls' || face.type === 'poison' || face.type === 'seal' || face.type === 'shield_bash') ? (
                      <FaceIcon type={face.type} size={13} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: s.text, lineHeight: 1 }}>
                          {face.value}
                        </span>
                        <FaceIcon type={face.type} size={9} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Checkbox */}
              <div style={{
                width: 18, height: 18, flexShrink: 0,
                background: isSelected ? '#7c3aed' : '#1e293b',
                border: `2px solid ${isSelected ? '#a855f7' : '#374151'}`,
                boxShadow: isSelected ? '1px 1px 0 #4c1d95' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', color: '#fff', fontWeight: 900,
              }}>
                {isSelected ? '✓' : ''}
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{
        background: '#1a1a2e', padding: '12px 16px',
        borderTop: '3px solid #000',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{
          textAlign: 'center', fontWeight: 700, letterSpacing: '0.2em',
          fontSize: '0.8rem',
          color: canDescend ? '#a855f7' : '#6b7280',
        }}>
          {selectedIds.size} / {CULL_TARGET} selected
        </div>

        <button
          onClick={() => { if (canDescend) cullInventory([...selectedIds]) }}
          disabled={!canDescend}
          className="pixel-btn"
          style={{
            background: canDescend ? '#7c3aed' : '#374151',
            color: '#e9d5ff',
            textShadow: '1px 1px 0 #000',
            opacity: canDescend ? 1 : 0.5,
            letterSpacing: '0.15em',
          }}
        >
          DESCEND TO ACT 2
          <span style={{ fontSize: '0.65rem', color: '#fca5a5', marginLeft: 8, fontWeight: 700 }}>
            (+3 CURSES)
          </span>
        </button>
      </div>
    </div>
  )
}
