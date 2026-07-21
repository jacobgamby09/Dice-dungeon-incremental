import { useState } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { Flame, X, Check } from 'lucide-react'
import { useGameStore, SKILL_TREE_NODES } from '../store/gameStore'
import type { SkillNode } from '../store/gameStore'

const CANVAS_W = 1500
const CANVAS_H = 900
const NODE_W   = 130
const NODE_H   = 80
const OFFSET_X = 470
const OFFSET_Y = 430

const TRACK_META = {
  root:       { label: 'CORE',       color: '#c4b5fd', glow: 'rgba(196,181,253,0.24)' },
  extraction: { label: 'EXTRACTION', color: '#a855f7', glow: 'rgba(168,85,247,0.18)' },
  forge:      { label: 'FORGE',      color: '#f97316', glow: 'rgba(249,115,22,0.18)' },
  survival:   { label: 'SURVIVAL',   color: '#22c55e', glow: 'rgba(34,197,94,0.18)' },
  control:    { label: 'CONTROL',    color: '#38bdf8', glow: 'rgba(56,189,248,0.18)' },
} as const

const TRACK_LANES = [
  { track: 'extraction' as const, y: -300 },
  { track: 'forge' as const, y: -100 },
  { track: 'survival' as const, y: 100 },
  { track: 'control' as const, y: 300 },
]

function nodeCenter(node: SkillNode) {
  return { x: node.x + OFFSET_X + NODE_W / 2, y: node.y + OFFSET_Y + NODE_H / 2 }
}

function isEligible(node: SkillNode, unlocked: string[]) {
  return node.requires.length === 0 || node.requires.every((r) => unlocked.includes(r))
}

export function SkillTree({ onClose }: { onClose: () => void }) {
  const bankedSouls  = useGameStore((s) => s.bankedSouls)
  const unlockedNodes = useGameStore((s) => s.unlockedNodes)
  const unlockNode   = useGameStore((s) => s.unlockNode)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedNode = selectedId ? SKILL_TREE_NODES.find((n) => n.id === selectedId) ?? null : null

  const [scale, setScale] = useState(1)
  const clampScale = (v: number) => Math.min(2, Math.max(0.5, v))

  const dragX = useMotionValue(384 / 2 - (OFFSET_X + NODE_W / 2))
  const dragY = useMotionValue(300 - (OFFSET_Y + NODE_H / 2))

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 40,
      maxWidth: 384, margin: '0 auto',
      display: 'flex', flexDirection: 'column',
      background: '#0a0a14',
    }}>
      {/* Header */}
      <div style={{
        background: '#1a1a2e', padding: '12px 16px',
        borderBottom: '3px solid #000',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{ fontWeight: 700, fontSize: '1rem', color: '#c4b5fd', letterSpacing: '0.15em' }}>
          ✦ TALENTS
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Flame size={14} color="#a855f7" strokeWidth={2.5} />
          <span style={{ color: '#a855f7', fontWeight: 700, fontSize: '0.9rem' }}>{bankedSouls}</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#9ca3af' }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Draggable canvas area */}
      <div
        style={{ flex: 1, overflow: 'hidden', position: 'relative', cursor: 'grab' }}
        onClick={() => setSelectedId(null)}
        onWheel={(e) => { e.preventDefault(); setScale((p) => clampScale(p - e.deltaY * 0.001)) }}
      >
        {/* Zoom buttons */}
        <div style={{
          position: 'absolute', bottom: 10, right: 10, zIndex: 10,
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {(['+', '−'] as const).map((label) => (
            <button
              key={label}
              onClick={(e) => { e.stopPropagation(); setScale((p) => clampScale(p + (label === '+' ? 0.15 : -0.15))) }}
              style={{
                width: 32, height: 32,
                background: '#1a1a2e', border: '2px solid #4c1d95',
                boxShadow: '2px 2px 0 #000', color: '#c4b5fd',
                fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', lineHeight: 1,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <motion.div
          drag
          dragMomentum={false}
          style={{ x: dragX, y: dragY, scale, width: CANVAS_W, height: CANVAS_H, position: 'relative', transformOrigin: '0 0' }}
        >
          {/* Track lanes */}
          {TRACK_LANES.map((lane) => {
            const meta = TRACK_META[lane.track]
            return (
              <div
                key={lane.track}
                style={{
                  position: 'absolute',
                  left: OFFSET_X - 250,
                  top: lane.y + OFFSET_Y - 24,
                  width: 1120,
                  height: 128,
                  border: `2px solid ${meta.color}`,
                  background: meta.glow,
                  opacity: 0.55,
                  boxShadow: '3px 3px 0 #000',
                  pointerEvents: 'none',
                }}
              >
                <span style={{
                  position: 'absolute',
                  left: 10,
                  top: 8,
                  color: meta.color,
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                }}>
                  {meta.label}
                </span>
              </div>
            )
          })}

          {/* SVG connections */}
          <svg
            style={{ position: 'absolute', inset: 0, width: CANVAS_W, height: CANVAS_H, pointerEvents: 'none' }}
          >
            {SKILL_TREE_NODES.flatMap((node) =>
              node.requires.map((reqId) => {
                const req = SKILL_TREE_NODES.find((n) => n.id === reqId)
                if (!req) return null
                const from = nodeCenter(req)
                const to   = nodeCenter(node)
                const bothUnlocked = unlockedNodes.includes(node.id) && unlockedNodes.includes(reqId)
                return (
                  <line
                    key={`${reqId}-${node.id}`}
                    x1={from.x} y1={from.y}
                    x2={to.x}   y2={to.y}
                    stroke={bothUnlocked ? '#7c3aed' : '#3b2d6b'}
                    strokeWidth={4}
                    strokeDasharray={bothUnlocked ? undefined : '6 4'}
                  />
                )
              })
            )}
          </svg>

          {/* Nodes */}
          {SKILL_TREE_NODES.map((node) => {
            const unlocked   = unlockedNodes.includes(node.id)
            const eligible   = isEligible(node, unlockedNodes)
            const affordable = bankedSouls >= node.cost
            const selected   = selectedId === node.id
            const trackMeta  = TRACK_META[node.track ?? 'root']

            const borderColor = unlocked          ? '#facc15'
                              : selected          ? trackMeta.color
                              : eligible && affordable ? trackMeta.color
                              : eligible          ? trackMeta.color
                              : '#374151'
            const shadow = unlocked
              ? '3px 3px 0 #78350f, 0 0 12px 2px rgba(250,204,21,0.35)'
              : selected
              ? `3px 3px 0 #000, 0 0 10px 2px ${trackMeta.glow}`
              : '3px 3px 0 #000'

            const left = node.x + OFFSET_X
            const top  = node.y + OFFSET_Y

            return (
              <button
                key={node.id}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedId(selectedId === node.id ? null : node.id)
                }}
                style={{
                  position: 'absolute',
                  left, top,
                  width: NODE_W, height: NODE_H,
                  background: unlocked ? '#1c1607' : '#12121f',
                  border: `3px solid ${borderColor}`,
                  boxShadow: shadow,
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 4,
                  padding: 6,
                  fontFamily: 'inherit',
                  opacity: !unlocked && !eligible ? 0.45 : 1,
                  filter: !unlocked && !eligible ? 'grayscale(0.7)' : 'none',
                }}
              >
                {node.track && node.track !== 'root' && (
                  <span style={{
                    position: 'absolute',
                    top: 4,
                    right: 5,
                    fontSize: '0.45rem',
                    fontWeight: 800,
                    color: trackMeta.color,
                    letterSpacing: '0.08em',
                  }}>
                    {TRACK_META[node.track].label.slice(0, 3)}
                  </span>
                )}
                {unlocked && (
                  <Check size={22} color="#facc15" strokeWidth={3} style={{ flexShrink: 0 }} />
                )}
                {!unlocked && !eligible && (
                  <span style={{ fontSize: '0.85rem', lineHeight: 1, flexShrink: 0 }}>🔒</span>
                )}
                <span style={{
                  fontSize: '0.75rem', fontWeight: 700,
                  color: unlocked ? '#facc15' : eligible ? trackMeta.color : '#6b7280',
                  textAlign: 'center', lineHeight: 1.3, letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}>
                  {node.name}
                </span>
                {!unlocked && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Flame size={13} color={eligible && affordable ? '#a855f7' : '#6b7280'} strokeWidth={2.5} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: eligible && affordable ? '#a855f7' : '#6b7280' }}>
                      {node.cost}
                    </span>
                  </div>
                )}
              </button>
            )
          })}
        </motion.div>
      </div>

      {/* Selected node panel */}
      {selectedNode && (() => {
        const owned     = unlockedNodes.includes(selectedNode.id)
        const eligible  = isEligible(selectedNode, unlockedNodes)
        const canAfford = bankedSouls >= selectedNode.cost
        const canBuy    = eligible && canAfford
        const trackMeta = TRACK_META[selectedNode.track ?? 'root']
        return (
          <div style={{
            background: '#1a1a2e', borderTop: `3px solid ${owned ? '#facc15' : eligible ? trackMeta.color : '#374151'}`,
            padding: '14px 16px', flexShrink: 0,
          }}>
            <p style={{ margin: '0 0 4px', color: trackMeta.color, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.16em' }}>
              {trackMeta.label}
            </p>
            <p style={{ margin: '0 0 6px', fontWeight: 700, color: owned ? '#facc15' : eligible ? trackMeta.color : '#6b7280', fontSize: '1.4rem' }}>
              {selectedNode.name}
            </p>
            <p style={{ margin: '0 0 12px', color: '#9ca3af', fontSize: '1rem' }}>
              {selectedNode.description}
            </p>
            {!eligible && (
              <p style={{ margin: '0 0 8px', color: '#ef4444', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                🔒 Requires unlocking a prerequisite node first
              </p>
            )}
            {owned ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={20} color="#22c55e" strokeWidth={3} />
                <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.1em' }}>
                  ALREADY OWNED
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Flame size={18} color={eligible ? '#a855f7' : '#6b7280'} strokeWidth={2.5} />
                <span style={{ color: eligible ? '#a855f7' : '#6b7280', fontWeight: 700, fontSize: '1.2rem' }}>
                  {selectedNode.cost} Souls
                </span>
                <button
                  disabled={!canBuy}
                  onClick={() => { unlockNode(selectedNode.id); setSelectedId(null) }}
                  className="pixel-btn"
                  style={{
                    marginLeft: 'auto',
                    background: canBuy ? '#6d28d9' : '#374151',
                    opacity: canBuy ? 1 : 0.6,
                    cursor: canBuy ? 'pointer' : 'not-allowed',
                  }}
                >
                  BUY
                </button>
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
