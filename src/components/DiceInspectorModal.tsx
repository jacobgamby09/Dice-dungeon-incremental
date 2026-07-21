import { useState } from 'react'
import { X, Swords, Shield, Heart, Skull, Flame, FlaskConical, Droplets, Star, Shuffle, Clock, RefreshCw } from 'lucide-react'
import type { DieType, DieFace, Die } from '../store/gameStore'
import { DIE_TEMPLATES, UNIQUE_DIE_TYPES, DIE_NAMES } from '../store/gameStore'
import { dieTypeStyle, faceColor } from './DieCard'
import { DIE_ROLES, DIE_TIPS, FACE_DESCRIPTIONS, describeFace } from '../diceDescriptions'

function dieName(t: DieType) { return `${DIE_NAMES[t]}${UNIQUE_DIE_TYPES.has(t) ? ' ★' : ''}` }

function FaceIcon({ type, size = 13 }: { type: DieFace['type']; size?: number }) {
  const color = faceColor[type]
  if (type === 'damage')    return <Swords   size={size} color={color} strokeWidth={2.5} />
  if (type === 'shield')    return <Shield   size={size} color={color} strokeWidth={2.5} />
  if (type === 'skull')     return <Skull    size={size} color='#ffffff' strokeWidth={2.5} />
  if (type === 'souls')     return <Flame    size={size} color={color} strokeWidth={2.5} />
  if (type === 'lifesteal')   return <Droplets size={size} color={color} strokeWidth={2.5} />
  if (type === 'choose_next') return <Star     size={size} color={color} strokeWidth={2.5} />
  if (type === 'wildcard')    return <Shuffle      size={size} color={color} strokeWidth={2.5} />
  if (type === 'poison')      return <FlaskConical size={size} color={color} strokeWidth={2.5} />
  if (type === 'hot')         return <Clock        size={size} color="#064e3b" strokeWidth={2.5} />
  if (type === 'mirror')      return <RefreshCw    size={size} color="#94a3b8" strokeWidth={2.5} />
  if (type === 'seal')        return <MaelstromIcon size={size} color={color} />
  if (type === 'shield_bash') return <ShieldBashIcon size={size} color={color} />
  if (type === 'multiplier')  return <span style={{ color: '#ffffff', fontSize: size + 2, fontWeight: 900, lineHeight: 1 }}>×</span>
  if (type === 'blank')       return <span style={{ color: '#6b7280', fontSize: size, fontWeight: 900 }}>-</span>
  if (type === 'purified_skull') return <Skull size={size} color="#ffffff" strokeWidth={2.5} />
  return <Heart size={size} color={color} strokeWidth={2.5} />
}

function MaelstromIcon({ size, color }: { size: number; color: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M19 12a7 7 0 0 1-12 5M5 12a7 7 0 0 1 12-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" /><path d="M8 17H5v-3M16 7h3v3" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3.5" stroke={color} strokeWidth="2" /></svg>
}

function ShieldBashIcon({ size, color }: { size: number; color: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M8 4h8l2 4v6c0 3.5-2.3 5.5-6 7-3.7-1.5-6-3.5-6-7V8l2-4Z" stroke={color} strokeWidth="2.4" strokeLinejoin="round" /><path d="M4 13h7M7 10l4 3-4 3M14 9l3 3-3 3" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

interface Props {
  types: DieType[]
  initialType?: DieType
  mergeLevel?: number
  faces?: DieFace[]
  dieLookup?: Partial<Record<DieType, Die>>
  onClose: () => void
}

export function DiceInspectorModal({ types, initialType, mergeLevel, faces, dieLookup, onClose }: Props) {
  const [selected, setSelected] = useState<DieType>(initialType ?? types[0])
  const template = DIE_TEMPLATES[selected]
  const instance = dieLookup?.[selected]
  const displayFaces = instance?.faces ?? faces ?? template.faces
  const displayMergeLevel = instance?.mergeLevel ?? mergeLevel
  const s = dieTypeStyle[selected]

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.82)',
        zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1a1a2e',
          border: '3px solid #000',
          boxShadow: '5px 5px 0 #000',
          padding: '16px',
          maxWidth: 320, width: '90%',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{
            fontSize: '0.6rem', color: '#9ca3af',
            letterSpacing: '0.3em', textTransform: 'uppercase',
          }}>
            Dice Inspector
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, lineHeight: 0 }}
          >
            <X size={16} color="#9ca3af" />
          </button>
        </div>

        {/* Type tabs */}
        {types.length > 1 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {types.map((t) => {
              const ts = dieTypeStyle[t]
              const active = t === selected
              return (
                <button
                  key={t}
                  onClick={() => setSelected(t)}
                  style={{
                    flex: 1,
                    background: active ? ts.bg : '#0f0f1a',
                    color: active ? ts.text : '#6b7280',
                    border: `2px solid ${active ? ts.shadow : '#374151'}`,
                    boxShadow: active ? `2px 2px 0 ${ts.shadow}` : 'none',
                    padding: '5px 0',
                    fontSize: '0.6rem', letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
                    minWidth: 48,
                  }}
                >
                  {dieName(t)}
                </button>
              )
            })}
          </div>
        )}

        {/* Die badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 10px', marginBottom: 12,
          background: '#0f0f1a',
          border: `2px solid ${s.shadow}`,
        }}>
          <div style={{
            width: 14, height: 14,
            background: s.bg, border: '2px solid #000',
            boxShadow: `2px 2px 0 ${s.shadow}`, flexShrink: 0,
          }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: s.bg }}>
            {dieName(selected)}
            {(displayMergeLevel ?? 0) > 0 && (
              <span style={{ color: '#f59e0b', fontWeight: 900, marginLeft: 5 }}>+{displayMergeLevel}</span>
            )}
          </span>
          <span style={{ fontSize: '0.6rem', color: '#6b7280', marginLeft: 'auto' }}>
            {template.sides} sides
          </span>
        </div>

        <div style={{
          background: '#0f0f1a',
          border: '2px solid #000',
          padding: '8px 10px',
          marginBottom: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
        }}>
          <span style={{ fontSize: '0.86rem', lineHeight: 1.6, color: '#d1d5db' }}>
            {DIE_ROLES[selected]}
          </span>
          {DIE_TIPS[selected] && (
            <span style={{ fontSize: '0.8rem', lineHeight: 1.55, color: '#aeb7c5' }}>
              {DIE_TIPS[selected]}
            </span>
          )}
        </div>

        {/* Faces grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8, marginBottom: 16,
        }}>
          {displayFaces.map((face, i) => (
            <div
              key={i}
              style={{
                background: s.bg,
                border: '3px solid #000',
                boxShadow: `3px 3px 0 ${s.shadow}`,
                padding: '10px 4px',
                minHeight: 56,
                position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              {face.type === 'blank' ? null
              : face.type === 'multiplier' ? (
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: s.text, lineHeight: 1 }}>
                  ×{face.value}
                </span>
              ) : face.type === 'purified_skull' ? (
                <>
                  <Skull size={22} color="#ffffff" strokeWidth={2.5} />
                  <svg style={{ position: 'absolute', pointerEvents: 'none', zIndex: 10 }} width="28" height="28" viewBox="0 0 28 28">
                    <line x1="2" y1="2" x2="26" y2="26" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
                    <line x1="26" y1="2" x2="2" y2="26" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </>
              ) : face.type === 'mirror' ? (
                <RefreshCw size={22} color="#334155" strokeWidth={2.5} />
              ) : face.type === 'hot' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span style={{ fontSize: '1rem', fontWeight: 900, color: '#064e3b', lineHeight: 1 }}>+{face.value}</span>
                    <Heart size={13} color="#064e3b" strokeWidth={2.5} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#064e3b', lineHeight: 1 }}>+{face.duration ?? 1}</span>
                    <Clock size={11} color="#064e3b" strokeWidth={2.5} />
                  </div>
                </div>
              ) : (face.type === 'skull' || face.type === 'wildcard' || face.type === 'choose_next' || face.type === 'seal' || face.type === 'shield_bash') ? (
                <FaceIcon type={face.type} size={22} />
              ) : (
                <>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: s.text, lineHeight: 1 }}>
                    {face.value}
                  </span>
                  <FaceIcon type={face.type} size={14} />
                </>
              )}
            </div>
          ))}
        </div>

        <div style={{
          background: '#0f0f1a',
          border: '2px solid #000',
          padding: '8px 10px',
          marginBottom: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          <span style={{
            fontSize: '0.58rem',
            color: '#6b7280',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}>
            Face Effects
          </span>
          {Array.from(new Set(displayFaces.map((face) => face.type))).map((type) => (
            <div key={type} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <FaceIcon type={type} size={13} />
              <span style={{ fontSize: '0.8rem', color: '#d1d5db', lineHeight: 1.55 }}>
                {FACE_DESCRIPTIONS[type]}
              </span>
            </div>
          ))}
          {displayFaces.some((face) => face.type === 'hot' || face.type === 'multiplier' || face.type === 'seal' || face.type === 'shield_bash') && (
            <span style={{ fontSize: '0.76rem', color: '#aeb7c5', lineHeight: 1.55 }}>
              {displayFaces
                .filter((face) => face.type === 'hot' || face.type === 'multiplier' || face.type === 'seal' || face.type === 'shield_bash')
                .map(describeFace)
                .join(' ')}
            </span>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="pixel-btn"
          style={{ background: '#374151' }}
        >
          CLOSE
        </button>
      </div>
    </div>
  )
}
