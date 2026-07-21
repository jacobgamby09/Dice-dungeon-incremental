import { useState } from 'react'
import { X, Swords, Shield, Heart, Skull, Flame, FlaskConical, Droplets, Star, Shuffle, Clock, RefreshCw } from 'lucide-react'
import { DIE_TEMPLATES, UNIQUE_DIE_TYPES, DIE_NAMES, getDiePoolLabel } from '../store/gameStore'
import type { DieType, DieFace } from '../store/gameStore'
import { dieTypeStyle, faceColor } from './DieCard'
import { DIE_ROLES, DIE_TIPS } from '../diceDescriptions'
import { RELICS, RELIC_POOL } from '../relics'

const LIBRARY_TYPES: DieType[] = ['white', 'blue', 'green', 'cursed', 'heavy', 'paladin', 'gambler', 'scavenger', 'wall', 'jackpot', 'vampire', 'priest', 'fortune_teller', 'joker', 'unique', 'blight', 'rejuvenator', 'mirror', 'vessel', 'warden', 'bulwark']

const POOL_BADGE_STYLE: Record<string, { bg: string; border: string; color: string }> = {
  Base:    { bg: '#e5e7eb', border: '#6b7280', color: '#111827' },
  Cursed:  { bg: '#6d28d9', border: '#a78bfa', color: '#f5f3ff' },
  Global:  { bg: '#0891b2', border: '#67e8f9', color: '#ecfeff' },
  'Act 1': { bg: '#d97706', border: '#fbbf24', color: '#fffbeb' },
  'Act 2': { bg: '#4d7c0f', border: '#a3e635', color: '#f7fee7' },
  Unknown: { bg: '#374151', border: '#9ca3af', color: '#f9fafb' },
}

function FaceIcon({ type, size = 11 }: { type: DieFace['type']; size?: number }) {
  const color = faceColor[type]
  if (type === 'damage') return <Swords size={size} color={color} strokeWidth={2.5} />
  if (type === 'shield') return <Shield size={size} color={color} strokeWidth={2.5} />
  if (type === 'skull') return <Skull size={size} color={color} strokeWidth={2.5} />
  if (type === 'souls') return <Flame size={size} color={color} strokeWidth={2.5} />
  if (type === 'lifesteal') return <Droplets size={size} color={color} strokeWidth={2.5} />
  if (type === 'choose_next') return <Star size={size} color={color} strokeWidth={2.5} />
  if (type === 'wildcard') return <Shuffle size={size} color={color} strokeWidth={2.5} />
  if (type === 'poison') return <FlaskConical size={size} color={color} strokeWidth={2.5} />
  if (type === 'seal') return <MaelstromIcon size={size} color={color} />
  if (type === 'shield_bash') return <ShieldBashIcon size={size} color={color} />
  return <Heart size={size} color={color} strokeWidth={2.5} />
}

function MaelstromIcon({ size, color }: { size: number; color: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M19 12a7 7 0 0 1-12 5M5 12a7 7 0 0 1 12-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" /><path d="M8 17H5v-3M16 7h3v3" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3.5" stroke={color} strokeWidth="2" /></svg>
}

function ShieldBashIcon({ size, color }: { size: number; color: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M8 4h8l2 4v6c0 3.5-2.3 5.5-6 7-3.7-1.5-6-3.5-6-7V8l2-4Z" stroke={color} strokeWidth="2.4" strokeLinejoin="round" /><path d="M4 13h7M7 10l4 3-4 3M14 9l3 3-3 3" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

export function DiceLibrary({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'dice' | 'relics'>('dice')

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 40,
      maxWidth: 384, margin: '0 auto',
      display: 'flex', flexDirection: 'column',
      background: '#0a0a14',
    }}>
      <div style={{
        background: '#1a1a2e', padding: '12px 16px',
        borderBottom: '3px solid #000',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{ fontWeight: 700, fontSize: '1rem', color: '#d1d5db', letterSpacing: '0.15em' }}>
          {activeTab === 'dice' ? 'DICE LIBRARY' : 'RELIC LIBRARY'}
        </span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#9ca3af' }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{
        background: '#12121f',
        borderBottom: '3px solid #000',
        padding: '10px 24px',
        display: 'flex',
        justifyContent: 'center',
        gap: 10,
        flexShrink: 0,
      }}>
        {([
          { id: 'dice', label: 'DICE' },
          { id: 'relics', label: 'RELICS' },
        ] as const).map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="pixel-btn"
              style={{
                flex: '0 1 150px',
                height: 40,
                fontSize: '0.72rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                background: isActive ? '#4c1d95' : '#0a0a14',
                color: isActive ? '#ede9fe' : '#9ca3af',
                border: `3px solid ${isActive ? '#7c3aed' : '#000'}`,
                boxShadow: `3px 3px 0 ${isActive ? '#2e1065' : '#000'}`,
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {activeTab === 'dice' && LIBRARY_TYPES.map((type) => {
          const template = DIE_TEMPLATES[type]
          const s = dieTypeStyle[type]
          const poolLabel = getDiePoolLabel(type)
          const poolBadge = POOL_BADGE_STYLE[poolLabel] ?? POOL_BADGE_STYLE.Unknown
          return (
            <div
              key={type}
              style={{
                background: '#12121f',
                border: '3px solid #000',
                boxShadow: `4px 4px 0 ${s.shadow}`,
                padding: '10px 12px',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 16, height: 16, flexShrink: 0,
                  background: s.bg, border: '2px solid #000',
                  boxShadow: `2px 2px 0 ${s.shadow}`,
                }} />
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: s.bg, flex: 1 }}>
                  {DIE_NAMES[type]}{UNIQUE_DIE_TYPES.has(type) ? ' *' : ''}
                </span>
                <span style={{
                  fontSize: '0.62rem',
                  color: poolBadge.color,
                  background: poolBadge.bg,
                  border: `2px solid ${poolBadge.border}`,
                  boxShadow: '2px 2px 0 #000',
                  padding: '3px 6px',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  fontWeight: 900,
                  lineHeight: 1,
                }}>
                  {poolLabel}
                </span>
              </div>

              <div style={{
                background: '#0f0f1a',
                border: '2px solid #000',
                padding: '7px 8px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}>
                <span style={{ fontSize: '0.82rem', color: '#d1d5db', lineHeight: 1.55 }}>
                  {DIE_ROLES[type]}
                </span>
                {DIE_TIPS[type] && (
                  <span style={{ fontSize: '0.76rem', color: '#aeb7c5', lineHeight: 1.5 }}>
                    {DIE_TIPS[type]}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
                {template.faces.map((face, i) => (
                  <div
                    key={i}
                    style={{
                      background: s.bg,
                      border: '2px solid #000',
                      boxShadow: `2px 2px 0 ${s.shadow}`,
                      padding: '6px 2px',
                      minHeight: 36,
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 2,
                    }}
                  >
                    {face.type === 'blank' ? null
                      : face.type === 'multiplier' ? (
                        <span style={{ fontSize: '0.75rem', fontWeight: 900, color: s.text, lineHeight: 1 }}>
                          x{face.value}
                        </span>
                      ) : face.type === 'mirror' ? (
                        <RefreshCw size={14} color="#334155" strokeWidth={2.5} />
                      ) : face.type === 'hot' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#064e3b', lineHeight: 1 }}>+{face.value}</span>
                            <Heart size={8} color="#064e3b" strokeWidth={2.5} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#064e3b', lineHeight: 1 }}>+{face.duration ?? 1}</span>
                            <Clock size={7} color="#064e3b" strokeWidth={2.5} />
                          </div>
                        </div>
                      ) : (face.type === 'skull' || face.type === 'purified_skull' || face.type === 'choose_next' || face.type === 'wildcard' || face.type === 'seal' || face.type === 'shield_bash') ? (
                        <FaceIcon type={face.type} size={14} />
                      ) : (
                        <>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: s.text, lineHeight: 1 }}>
                            {face.value}
                          </span>
                          <FaceIcon type={face.type} size={10} />
                        </>
                      )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {activeTab === 'relics' && RELIC_POOL.map((id) => {
          const relic = RELICS[id]
          return (
            <div
              key={id}
              style={{
                background: '#12121f',
                border: '3px solid #000',
                boxShadow: `4px 4px 0 ${relic.accent}`,
                padding: '10px 12px',
                display: 'grid',
                gridTemplateColumns: '54px 1fr',
                gap: 12,
                alignItems: 'center',
              }}
            >
              <div style={{
                width: 50,
                height: 50,
                background: '#0a0a14',
                border: `2px solid ${relic.accent}`,
                boxShadow: '3px 3px 0 #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <img src={relic.icon} alt="" style={{ width: 42, height: 42, imageRendering: 'pixelated' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 900, fontSize: '0.88rem', color: relic.accent, flex: 1 }}>
                    {relic.name}
                  </span>
                  <span style={{
                    fontSize: '0.55rem',
                    color: '#6b7280',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}>
                    Relic
                  </span>
                </div>

                <div style={{
                  background: '#0f0f1a',
                  border: '2px solid #000',
                  padding: '8px 9px',
                }}>
                  <span style={{ fontSize: '0.8rem', color: '#d1d5db', lineHeight: 1.5 }}>
                    {relic.description}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ background: '#1a1a2e', padding: '12px 16px', borderTop: '3px solid #000', flexShrink: 0 }}>
        <button onClick={onClose} className="pixel-btn" style={{ background: '#374151' }}>
          CLOSE
        </button>
      </div>
    </div>
  )
}
