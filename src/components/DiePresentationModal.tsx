import { motion } from 'framer-motion'
import { Swords, Shield, Heart, Skull, Flame, FlaskConical, Droplets, Star, Shuffle } from 'lucide-react'
import type { Die, DieFace } from '../store/gameStore'
import { UNIQUE_DIE_TYPES } from '../store/gameStore'
import { dieTypeStyle, faceColor } from './DieCard'

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

export function DiePresentationModal({
  die, action, onClose,
}: {
  die: Die; action: 'merge' | 'craft'; onClose: () => void
}) {
  const s          = dieTypeStyle[die.dieType]
  const mergeLevel = die.mergeLevel ?? 0
  const name       = `${die.name}${UNIQUE_DIE_TYPES.has(die.dieType) ? ' ★' : ''}`
  const actionColor = action === 'merge' ? '#d97706' : '#dc2626'
  const actionLabel = action === 'merge' ? 'MERGED!' : 'CRAFTED!'

  const ringBorder = mergeLevel >= 3 ? '4px solid #dc2626'
    : mergeLevel === 2 ? '3px solid #f97316'
    : mergeLevel === 1 ? '2px solid #22d3ee'
    : `2px solid ${s.shadow}`

  const ringGlow = mergeLevel >= 3 ? '0 0 30px rgba(220,38,38,0.9)'
    : mergeLevel === 2 ? '0 0 20px rgba(249,115,22,0.8)'
    : mergeLevel === 1 ? '0 0 16px rgba(34,211,238,0.7)'
    : 'none'

  return (
    <motion.div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.80)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        maxWidth: 384, margin: '0 auto',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        style={{
          width: '100%', padding: '0 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        }}
        initial={{ scale: 0.75, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 20, delay: 0.1 }}
      >
        {/* Action header */}
        <div style={{
          fontSize: '1.5rem', fontWeight: 900, color: actionColor,
          letterSpacing: '0.2em', textShadow: '2px 2px 0 #000',
        }}>
          {actionLabel}
        </div>

        {/* Large die swatch */}
        <div style={{
          position: 'relative',
          width: 96, height: 96,
          background: 'transparent',
          border: ringBorder,
          boxShadow: ringGlow !== 'none'
            ? `${ringGlow}, inset 0 0 18px rgba(255,255,255,0.06)`
            : `0 0 12px rgba(255,255,255,0.08), inset 0 0 18px rgba(255,255,255,0.06)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {mergeLevel > 0 && (
            <div style={{
              position: 'absolute', top: 4, left: 4,
              background: 'rgba(0,0,0,0.82)', color: '#fff',
              fontSize: '0.6rem', fontWeight: 900, lineHeight: 1, padding: '2px 5px',
            }}>
              +{mergeLevel}
            </div>
          )}
          {mergeLevel >= 3 && (
            <motion.div
              style={{ position: 'absolute', inset: -3, border: '3px solid #dc2626', pointerEvents: 'none' }}
              animate={{
                opacity: [1, 0.3, 1],
                boxShadow: [
                  '0 0 12px 4px rgba(220,38,38,0.5)',
                  '0 0 30px 10px rgba(220,38,38,0.95)',
                  '0 0 12px 4px rgba(220,38,38,0.5)',
                ],
              }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>

        {/* Die name + level */}
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: s.bg }}>
            {name}
          </span>
          {mergeLevel > 0 && (
            <span style={{ color: '#f59e0b', fontWeight: 900, marginLeft: 6, fontSize: '1rem' }}>
              +{mergeLevel}
            </span>
          )}
        </div>

        {/* Face grid — 3 cols */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, width: '100%',
        }}>
          {die.faces.map((face, i) => (
            <div key={i} style={{
              background: s.bg, border: '2px solid #000',
              boxShadow: `2px 2px 0 ${s.shadow}`,
              padding: '12px 4px', minHeight: 52,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3,
            }}>
              {face.type === 'blank' ? null
                : (face.type === 'skull' || face.type === 'purified_skull' || face.type === 'choose_next' || face.type === 'wildcard' || face.type === 'seal' || face.type === 'shield_bash')
                  ? <FaceIcon type={face.type} size={22} />
                  : (
                    <>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: s.text, lineHeight: 1 }}>
                        {face.value}
                      </span>
                      <FaceIcon type={face.type} size={13} />
                    </>
                  )
              }
            </div>
          ))}
        </div>

        <button onClick={onClose} className="pixel-btn" style={{ background: actionColor, marginTop: 4 }}>
          CONTINUE
        </button>
      </motion.div>
    </motion.div>
  )
}
