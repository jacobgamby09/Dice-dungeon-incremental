import { Skull, Swords, Shield, Heart, Flame, FlaskConical, Droplets, Star, Shuffle } from 'lucide-react'
import { useGameStore, DIE_TEMPLATES } from '../store/gameStore'
import { dieTypeStyle, faceColor } from './DieCard'
import type { DieFace } from '../store/gameStore'

function FaceIcon({ type, size = 12 }: { type: DieFace['type']; size?: number }) {
  const color = faceColor[type]
  if (type === 'damage')      return <Swords   size={size} color={color} strokeWidth={2.5} />
  if (type === 'shield')      return <Shield   size={size} color={color} strokeWidth={2.5} />
  if (type === 'skull')       return <Skull    size={size} color="#ffffff" strokeWidth={2.5} />
  if (type === 'souls')       return <Flame    size={size} color={color} strokeWidth={2.5} />
  if (type === 'lifesteal')   return <Droplets size={size} color={color} strokeWidth={2.5} />
  if (type === 'choose_next') return <Star     size={size} color={color} strokeWidth={2.5} />
  if (type === 'wildcard')    return <Shuffle      size={size} color={color} strokeWidth={2.5} />
  if (type === 'poison')      return <FlaskConical size={size} color={color} strokeWidth={2.5} />
  return <Heart size={size} color={color} strokeWidth={2.5} />
}

export function BossRewardModal() {
  const claimBossReward = useGameStore((s) => s.claimBossReward)
  const template = DIE_TEMPLATES['cursed']
  const s = dieTypeStyle['cursed']

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.92)',
        maxWidth: 384, margin: '0 auto',
      }}
    >
      <div style={{
        background: '#05030a',
        border: '3px solid #7c3aed',
        boxShadow: '0 0 30px 6px rgba(124,58,237,0.55), 6px 6px 0 #000',
        padding: '20px 16px',
        width: '88%', maxWidth: 320,
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        {/* Icon + Title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Skull size={28} color="#a855f7" strokeWidth={2.5} />
          <span style={{
            fontSize: '0.7rem', fontWeight: 900,
            color: '#a855f7', letterSpacing: '0.2em',
            textTransform: 'uppercase', textAlign: 'center',
            textShadow: '0 0 12px rgba(168,85,247,0.8)',
          }}>
            Boss Defeated
          </span>
          <span style={{
            fontSize: '0.85rem', fontWeight: 900,
            color: '#f5d0fe', letterSpacing: '0.12em',
            textTransform: 'uppercase', textAlign: 'center',
            textShadow: '2px 2px 0 #000',
          }}>
            You received a Cursed die
          </span>
        </div>

        {/* Die badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 10px',
          background: '#0f0314',
          border: `2px solid ${s.shadow}`,
          boxShadow: `0 0 8px rgba(147,51,234,0.3)`,
        }}>
          <div style={{
            width: 14, height: 14, flexShrink: 0,
            background: s.bg, border: '2px solid #000',
            boxShadow: `2px 2px 0 ${s.shadow}`,
          }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: s.bg }}>
            CURSED DIE
          </span>
          <span style={{ fontSize: '0.55rem', color: '#6b7280', marginLeft: 'auto', letterSpacing: '0.1em' }}>
            {template.sides} sides
          </span>
        </div>

        {/* Faces grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 6,
        }}>
          {template.faces.map((face, i) => (
            <div
              key={i}
              style={{
                background: s.bg,
                border: '3px solid #000',
                boxShadow: `3px 3px 0 ${s.shadow}`,
                padding: '10px 4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              {face.type === 'skull' ? (
                <FaceIcon type="skull" size={22} />
              ) : (
                <>
                  <span style={{ fontSize: '1.15rem', fontWeight: 700, color: s.text, lineHeight: 1 }}>
                    {face.value}
                  </span>
                  <FaceIcon type={face.type} size={13} />
                </>
              )}
            </div>
          ))}
        </div>

        {/* Flavour */}
        <p style={{
          fontSize: '0.6rem', color: '#6b7280', textAlign: 'center',
          letterSpacing: '0.08em', margin: 0,
          fontStyle: 'italic',
        }}>
          This die has been added to your bag. Beware its skulls.
        </p>

        {/* Claim button */}
        <button
          onClick={claimBossReward}
          className="pixel-btn"
          style={{
            background: '#4c1d95',
            color: '#f5d0fe',
            textShadow: '1px 1px 0 #000',
            boxShadow: '3px 3px 0 #000, 0 0 12px rgba(124,58,237,0.4)',
          }}
        >
          ✦ CLAIM
        </button>
      </div>
    </div>
  )
}
