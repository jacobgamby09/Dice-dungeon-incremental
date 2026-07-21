import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Swords, Shield, Heart, Skull, Flame, Droplets, Star, Shuffle, FlaskConical, Clock, RefreshCw } from 'lucide-react'
import type { Die, DieType, DieFace, ResolvingPhase } from '../store/gameStore'

// ── Visual tables ────────────────────────────────────────────────────────────

export const dieTypeStyle: Record<DieType, { bg: string; shadow: string; text: string }> = {
  white:     { bg: '#e2e2e2', shadow: '#666666', text: '#1a1a2e' },
  blue:      { bg: '#3b82f6', shadow: '#1e3a8a', text: '#ffffff' },
  green:     { bg: '#4ade80', shadow: '#15803d', text: '#052e16' },
  cursed:    { bg: '#581c87', shadow: '#3b0764', text: '#f5d0fe' },
  heavy:     { bg: '#fecaca', shadow: '#991b1b', text: '#7f1d1d' },
  paladin:   { bg: '#fef3c7', shadow: '#92400e', text: '#78350f' },
  gambler:   { bg: '#e9d5ff', shadow: '#6d28d9', text: '#4c1d95' },
  scavenger: { bg: '#fed7aa', shadow: '#c2410c', text: '#7c2d12' },
  wall:      { bg: '#bfdbfe', shadow: '#1d4ed8', text: '#1e3a8a' },
  jackpot:       { bg: '#fbbf24', shadow: '#78350f',  text: '#1c0a00' },
  vampire:       { bg: '#7f1d1d', shadow: '#450a0a',  text: '#fca5a5' },
  priest:        { bg: '#fef9c3', shadow: '#a16207',  text: '#713f12' },
  fortune_teller:{ bg: '#6366f1', shadow: '#1e1b4b',  text: '#e0e7ff' },
  joker:         { bg: '#d1d5db', shadow: '#6b7280',  text: '#111827' },
  unique:        { bg: '#06b6d4', shadow: '#0e7490',  text: '#ffffff' },
  blight:        { bg: '#4d7c0f', shadow: '#1a2e05',  text: '#d9f99d' },
  rejuvenator:   { bg: '#bbf7d0', shadow: '#15803d',  text: '#052e16' },
  mirror:        { bg: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 40%, #94a3b8 100%)', shadow: '#475569', text: '#0f172a' },
  vessel:        { bg: '#f8fafc', shadow: '#64748b',  text: '#0f172a' },
  warden:        { bg: '#1f2937', shadow: '#b45309',  text: '#d1d5db' },
  bulwark:       { bg: 'linear-gradient(135deg, #0f2747 0%, #1e3a8a 52%, #38bdf8 100%)', shadow: '#0f172a',  text: '#e0f2fe' },
}

// Custom loot dice use their die text color for all face content (monochrome)
const CUSTOM_LOOT_DIES = new Set<DieType>(['heavy', 'paladin', 'gambler', 'scavenger', 'wall', 'jackpot', 'vampire', 'priest', 'fortune_teller', 'joker', 'unique', 'blight', 'vessel', 'warden', 'bulwark'])

export const faceColor: Record<DieFace['type'], string> = {
  damage:         '#dc2626',
  shield:         '#38bdf8',
  heal:           '#22c55e',
  skull:          '#7c3aed',
  souls:          '#a855f7',
  lifesteal:      '#e879f9',
  choose_next:    '#a5b4fc',
  wildcard:       '#a8a29e',
  blank:          '#374151',
  purified_skull: '#ffffff',
  multiplier:     '#a3e635',
  poison:         '#4ade80',
  hot:            '#4ade80',
  mirror:         '#334155',
  seal:           '#f97316',
  shield_bash:    '#93c5fd',
}

export const faceShadow: Record<DieFace['type'], string> = {
  damage:         '#7f1d1d',
  shield:         '#1e3a8a',
  heal:           '#15803d',
  skull:          '#3b0764',
  souls:          '#6d28d9',
  lifesteal:      '#701a75',
  choose_next:    '#3730a3',
  wildcard:       '#57534e',
  blank:          '#1f2937',
  purified_skull: '#9f1239',
  multiplier:     '#3f6212',
  poison:         '#15803d',
  hot:            '#15803d',
  mirror:         '#0f172a',
  seal:           '#7c2d12',
  shield_bash:    '#1e3a8a',
}

// ── Type icon ────────────────────────────────────────────────────────────────

function TypeIcon({ type, size = 13, forceColor }: { type: DieFace['type']; size?: number; forceColor?: string }) {
  const color = forceColor ?? faceColor[type]
  if (type === 'damage')      return <Swords   size={size} color={color} strokeWidth={2.5} />
  if (type === 'shield')      return <Shield   size={size} color={color} strokeWidth={2.5} />
  if (type === 'skull')       return <Skull    size={size} color={color} strokeWidth={2.5} />
  if (type === 'souls')       return <Flame    size={size} color={color} strokeWidth={2.5} />
  if (type === 'lifesteal')   return <Droplets size={size} color={color} strokeWidth={2.5} />
  if (type === 'choose_next') return <Star          size={size} color={color} strokeWidth={2.5} />
  if (type === 'wildcard')    return <Shuffle       size={size} color={color} strokeWidth={2.5} />
  if (type === 'poison')      return <FlaskConical  size={size} color={color} strokeWidth={2.5} />
  if (type === 'seal')        return <MaelstromIcon size={size} color={color} />
  if (type === 'shield_bash') return <ShieldBashIcon size={size} color={color} />
  return                             <Heart         size={size} color={color} strokeWidth={2.5} />
}

function MaelstromIcon({ size = 24, color = '#f97316' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 12a7 7 0 0 1-11.9 5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M5 12a7 7 0 0 1 11.9-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M8 17H5v-3" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 7h3v3" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z" stroke={color} strokeWidth="2" />
    </svg>
  )
}

function ShieldBashIcon({ size = 24, color = '#93c5fd' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 4h8l2 4v6c0 3.5-2.3 5.5-6 7-3.7-1.5-6-3.5-6-7V8l2-4Z" stroke={color} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M4 13h7" stroke={color} strokeWidth="2.8" strokeLinecap="round" />
      <path d="M7 10l4 3-4 3" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 9l3 3-3 3" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── DiceFace ─────────────────────────────────────────────────────────────────

function DiceFace({ face, textColor, dieType, mergeLevel = 0 }: { face: DieFace; textColor: string; dieType: DieType; mergeLevel?: number }) {
  // Custom loot dice use their die text color for all icons (monochrome palette)
  const iconColor = CUSTOM_LOOT_DIES.has(dieType) ? textColor : undefined

  // Blank — completely empty face
  if (face.type === 'blank') {
    return <div style={{ width: '100%', height: '100%' }} />
  }

  // Purified skull — white skull with red X overlay
  if (face.type === 'purified_skull') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', position: 'relative' }}>
        <Skull size={32} color="#ffffff" strokeWidth={2.5} />
        <svg
          style={{ position: 'absolute', pointerEvents: 'none', zIndex: 10 }}
          width="36" height="36" viewBox="0 0 36 36"
        >
          <line x1="3" y1="3" x2="33" y2="33" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
          <line x1="33" y1="3" x2="3" y2="33" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
        </svg>
      </div>
    )
  }

  // Multiplier face — shows ×{value}
  if (face.type === 'multiplier') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 900, color: iconColor ?? faceColor.multiplier, lineHeight: 1 }}>
          ×{face.value}
        </span>
      </div>
    )
  }

  // Skull and wildcard — icon only
  if (face.type === 'skull' || face.type === 'wildcard') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        <TypeIcon type={face.type} size={32} forceColor={iconColor} />
      </div>
    )
  }

  // HoT face — +value [Plus] on top, [Clock] duration on bottom, dark contrast on light-green bg
  if (face.type === 'hot') {
    const c = '#064e3b'
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: '1rem', fontWeight: 900, color: c, lineHeight: 1 }}>+{face.value}</span>
          <Heart size={11} color={c} strokeWidth={2.5} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: '1rem', fontWeight: 900, color: c, lineHeight: 1 }}>+{face.duration ?? 1}</span>
          <Clock size={11} color={c} strokeWidth={2.5} />
        </div>
      </div>
    )
  }

  // Mirror face — circular refresh icon on glossy silver bg
  if (face.type === 'mirror') {
    const color = iconColor ?? faceColor.mirror
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '100%', height: '100%', position: 'relative',
        boxShadow: 'inset 0 2px 5px rgba(255,255,255,0.85), inset 0 -1px 3px rgba(0,0,0,0.15)',
      }}>
        <RefreshCw size={28} color={color} strokeWidth={2.5} />
      </div>
    )
  }

  if (face.type === 'seal') {
    const color = iconColor ?? faceColor.seal
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', position: 'relative' }}>
        <MaelstromIcon size={34} color={color} />
        <Skull size={13} color={color} strokeWidth={3} style={{ position: 'absolute' }} />
      </div>
    )
  }

  if (face.type === 'shield_bash') {
    const color = iconColor ?? faceColor.shield_bash
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', position: 'relative' }}>
        <ShieldBashIcon size={34} color={color} />
      </div>
    )
  }

  // choose_next — icon + optional x{N} multiplier badge
  if (face.type === 'choose_next') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', gap: 2 }}>
        <TypeIcon type={face.type} size={28} forceColor={iconColor} />
        {mergeLevel > 0 && (
          <span style={{ fontSize: '0.55rem', fontWeight: 900, color: iconColor ?? faceColor.choose_next, lineHeight: 1 }}>
            x{mergeLevel + 1}
          </span>
        )}
      </div>
    )
  }
  return (
    <div style={{
      display: 'flex', flexDirection: 'row',
      alignItems: 'center', justifyContent: 'center',
      gap: 5, width: '100%', height: '100%',
    }}>
      <span style={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1, color: textColor }}>
        {face.value}
      </span>
      <TypeIcon type={face.type} size={16} forceColor={iconColor} />
    </div>
  )
}

// ── Particle burst ────────────────────────────────────────────────────────────

function ParticleBurst({ faceType }: { faceType: DieFace['type'] }) {
  const count    = 7
  const baseSize = 4
  const color    = faceColor[faceType]
  const shadow   = faceShadow[faceType]
  const baseDist = 28
  const dur      = 0.38

  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (360 / count) * i + (i % 2 === 0 ? 7 : -7)
        const dist  = baseDist + (i % 3) * 6
        const rad   = (angle * Math.PI) / 180
        const sz    = baseSize + (i % 2)
        return (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: sz, height: sz,
              background: color,
              border: `1px solid ${shadow}`,
              top: '50%', left: '50%',
              marginTop: -sz / 2, marginLeft: -sz / 2,
              pointerEvents: 'none', zIndex: 30,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(rad) * dist, y: Math.sin(rad) * dist, opacity: 0, scale: 0.4 }}
            transition={{ duration: dur, ease: 'easeOut', delay: i * 0.012 }}
          />
        )
      })}
    </>
  )
}

// ── Heavy: violent red impact flash ──────────────────────────────────────────

function HeavyImpactFlash() {
  return (
    <motion.div
      style={{
        position: 'absolute', inset: -4,
        border: '3px solid #dc2626',
        pointerEvents: 'none', zIndex: 20,
      }}
      initial={{ boxShadow: '0 0 30px 10px #dc2626', opacity: 1 }}
      animate={{ boxShadow: '0 0 0px 0px #dc2626',   opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    />
  )
}

// ── Paladin: golden aura pulse + floating holy-light particles ───────────────

const PALADIN_PARTICLES = [
  { x: -14, delay: 0    },
  { x:   6, delay: 0.45 },
  { x:  -4, delay: 0.9  },
  { x:  15, delay: 1.35 },
]

function PaladinAura() {
  return (
    <>
      <motion.div
        style={{
          position: 'absolute', inset: -3,
          pointerEvents: 'none', zIndex: 0,
          boxShadow: '0 0 0px 0px rgba(251,191,36,0)',
        }}
        animate={{
          boxShadow: [
            '0 0 0px 0px rgba(251,191,36,0)',
            '0 0 16px 5px rgba(251,191,36,0.75)',
            '0 0 0px 0px rgba(251,191,36,0)',
          ],
        }}
        transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
      />
      {PALADIN_PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: 3, height: 3,
            background: '#fbbf24',
            left: `calc(50% + ${p.x}px)`,
            bottom: 8,
            pointerEvents: 'none', zIndex: 40,
          }}
          animate={{ y: [0, -28], opacity: [0, 0.9, 0] }}
          transition={{ duration: 1.4, delay: p.delay, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
    </>
  )
}

// ── Gambler: jackpot colour-cycling border ────────────────────────────────────

function GamblerJackpot() {
  return (
    <motion.div
      style={{
        position: 'absolute', inset: -3,
        border: '3px solid #fbbf24',
        pointerEvents: 'none', zIndex: 20,
      }}
      animate={{
        borderColor:  ['#fbbf24', '#ffffff', '#7c3aed', '#fbbf24'],
        boxShadow:    [
          '0 0 8px 2px #fbbf24',
          '0 0 14px 4px #ffffff',
          '0 0 10px 2px #7c3aed',
          '0 0 8px 2px #fbbf24',
        ],
      }}
      transition={{ duration: 0.28, repeat: Infinity, ease: 'linear' }}
    />
  )
}

// ── Scavenger: snappy slide-in from the left + orange impact flash ────────────

function ScavengerFlash() {
  return (
    <motion.div
      style={{
        position: 'absolute', inset: -4,
        border: '3px solid #ea580c',
        pointerEvents: 'none', zIndex: 20,
      }}
      initial={{ boxShadow: '0 0 22px 8px #ea580c', opacity: 1 }}
      animate={{ boxShadow: '0 0 0px 0px #ea580c',  opacity: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    />
  )
}

// ── Wall: heavy drop + solid blue shield-impact flash ────────────────────────

function WallImpactFlash() {
  return (
    <motion.div
      style={{
        position: 'absolute', inset: -4,
        border: '3px solid #1e40af',
        pointerEvents: 'none', zIndex: 20,
      }}
      initial={{ boxShadow: '0 0 28px 10px #1e40af', opacity: 1 }}
      animate={{ boxShadow: '0 0 0px 0px #1e40af',   opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    />
  )
}

// ── Priest: holy beam + rising gold particles ─────────────────────────────────

const PRIEST_PARTICLES = [
  { left: '22%', delay: 0    },
  { left: '45%', delay: 0.07 },
  { left: '68%', delay: 0.14 },
  { left: '35%', delay: 0.04 },
]

function PriestBeam() {
  return (
    <>
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: -18,
          width: 22, height: 'calc(100% + 36px)', marginLeft: -11,
          background: 'rgba(251,191,36,0.32)',
          pointerEvents: 'none', zIndex: 20,
        }}
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: [0, 1, 0], scaleX: [0, 1, 0] }}
        transition={{ duration: 0.48, ease: 'easeOut' }}
      />
      {PRIEST_PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute', width: 4, height: 4,
            background: '#fbbf24', border: '1px solid #92400e',
            left: p.left, top: '45%',
            pointerEvents: 'none', zIndex: 40,
          }}
          initial={{ y: 0, opacity: 1, scale: 1 }}
          animate={{ y: -36, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.6, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </>
  )
}

// ── Rejuvenator: soft green pulse aura + rising heal particles ───────────────

const REJUVENATOR_PARTICLES = [
  { left: '18%', delay: 0   },
  { left: '48%', delay: 0.8 },
  { left: '72%', delay: 1.6 },
  { left: '33%', delay: 2.4 },
]

function RejuvenatorAura() {
  return (
    <>
      <motion.div
        style={{
          position: 'absolute', inset: -3,
          border: '2px solid #4ade80',
          pointerEvents: 'none', zIndex: 0,
        }}
        animate={{
          opacity: [0.25, 0.85, 0.25],
          boxShadow: [
            '0 0 6px 2px rgba(74,222,128,0.15)',
            '0 0 18px 6px rgba(74,222,128,0.6)',
            '0 0 6px 2px rgba(74,222,128,0.15)',
          ],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {REJUVENATOR_PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: 4, height: 4,
            borderRadius: '50%',
            background: '#4ade80', border: '1px solid #15803d',
            left: p.left, bottom: 4,
            pointerEvents: 'none', zIndex: 40,
          }}
          animate={{ y: [0, -38], opacity: [0, 1, 0], scale: [0.6, 1, 0.3] }}
          transition={{ duration: 2.0, delay: p.delay, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
    </>
  )
}

function RejuvenatorHealFlash() {
  return (
    <motion.div
      style={{
        position: 'absolute', inset: -4,
        border: '3px solid #4ade80',
        pointerEvents: 'none', zIndex: 20,
      }}
      initial={{ boxShadow: '0 0 26px 10px rgba(74,222,128,0.8)', opacity: 1 }}
      animate={{ boxShadow: '0 0 0px 0px rgba(74,222,128,0)',     opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    />
  )
}

// ── Mirror: diagonal shine sweep + white flash on impact ──────────────────────

function MirrorShimmer() {
  return (
    <>
      <motion.div
        style={{
          position: 'absolute', inset: -2,
          border: '2px solid #e2e8f0',
          pointerEvents: 'none', zIndex: 0,
        }}
        animate={{
          borderColor: ['#e2e8f0', '#ffffff', '#94a3b8', '#ffffff', '#e2e8f0'],
          boxShadow: [
            '0 0 4px 1px rgba(226,232,240,0.3)',
            '0 0 14px 5px rgba(255,255,255,0.75)',
            '0 0 4px 1px rgba(226,232,240,0.3)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Diagonal shine sweep — clipped to die bounds */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 25 }}>
        <motion.div
          style={{
            position: 'absolute',
            top: '-60%', width: '45%', height: '220%',
            background: 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
            transform: 'skewX(-12deg)',
            pointerEvents: 'none',
          }}
          animate={{ left: ['-60%', '140%'] }}
          transition={{ duration: 1.0, repeat: Infinity, repeatDelay: 3.2, ease: 'easeInOut' }}
        />
      </div>
    </>
  )
}

function MirrorFlash() {
  return (
    <motion.div
      style={{
        position: 'absolute', inset: -4,
        border: '3px solid #ffffff',
        pointerEvents: 'none', zIndex: 20,
      }}
      initial={{ boxShadow: '0 0 30px 12px rgba(255,255,255,0.9)', opacity: 1 }}
      animate={{ boxShadow: '0 0 0px 0px rgba(255,255,255,0)',     opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    />
  )
}

function WardenGateFlash() {
  return (
    <>
      <motion.div
        style={{
          position: 'absolute', inset: -4,
          border: '3px solid #f97316',
          pointerEvents: 'none', zIndex: 24,
        }}
        initial={{ boxShadow: '0 0 24px 8px rgba(249,115,22,0.8)', opacity: 1 }}
        animate={{ boxShadow: '0 0 0px 0px rgba(249,115,22,0)', opacity: 0 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
      {[-1, 1].map((dir) => (
        <motion.div
          key={dir}
          style={{
            position: 'absolute',
            top: -3,
            bottom: -3,
            width: '46%',
            background: '#111827',
            border: '2px solid #b45309',
            boxShadow: '2px 2px 0 #000',
            pointerEvents: 'none',
            zIndex: 23,
          }}
          initial={{ x: dir < 0 ? '-115%' : '115%', opacity: 0.85 }}
          animate={{ x: dir < 0 ? '-8%' : '8%', opacity: [0.85, 1, 0] }}
          transition={{ duration: 0.85, times: [0, 0.65, 1], ease: 'easeOut' }}
        />
      ))}
    </>
  )
}

function ShieldBashFlash() {
  return (
    <>
      <motion.div
        style={{
          position: 'absolute', inset: -5,
          border: '3px solid #93c5fd',
          pointerEvents: 'none', zIndex: 28,
        }}
        initial={{ boxShadow: '0 0 30px 12px rgba(147,197,253,0.9)', opacity: 1, scale: 0.9 }}
        animate={{ boxShadow: '0 0 0px 0px rgba(147,197,253,0)', opacity: 0, scale: 1.2 }}
        transition={{ duration: 0.65, ease: 'easeOut' }}
      />
      <motion.div
        style={{
          position: 'absolute',
          left: '18%', top: '44%',
          width: '64%', height: 10,
          background: '#93c5fd',
          border: '2px solid #1e3a8a',
          boxShadow: '3px 3px 0 #000',
          pointerEvents: 'none',
          zIndex: 29,
        }}
        initial={{ x: -34, opacity: 0, scaleX: 0.45 }}
        animate={{ x: [ -34, 12, 44 ], opacity: [0, 1, 0], scaleX: [0.45, 1.15, 0.25] }}
        transition={{ duration: 0.55, times: [0, 0.45, 1], ease: 'easeOut' }}
      />
    </>
  )
}

// ── DieCard ──────────────────────────────────────────────────────────────────

interface DieCardProps {
  die: Die
  onClick?: () => void
  dimmed?: boolean
  isResolving?: boolean
  resolvingPhase?: ResolvingPhase
}

export const DieCard = React.memo(function DieCard({
  die, onClick, dimmed = false, isResolving = false, resolvingPhase = null,
}: DieCardProps) {
  const s          = dieTypeStyle[die.dieType]
  const face       = die.currentFace
  const mergeLevel = die.mergeLevel ?? 0

  const isSpinning = isResolving && resolvingPhase === 'spinning'
  const isLanded   = isResolving && resolvingPhase === 'landed'

  // Cycle through faces while spinning
  const [spinFace, setSpinFace] = useState<DieFace | null>(null)
  useEffect(() => {
    if (!isSpinning) { setSpinFace(null); return }
    const id = setInterval(() => {
      setSpinFace(die.faces[Math.floor(Math.random() * die.faces.length)])
    }, 75)
    return () => clearInterval(id)
  }, [isSpinning])

  // One-shot burst on impact
  const [burst, setBurst] = useState(false)
  const prevLanded = useRef(false)
  useEffect(() => {
    if (isLanded && !prevLanded.current) {
      setBurst(true)
      const t = setTimeout(() => setBurst(false), 700)
      return () => clearTimeout(t)
    }
    prevLanded.current = isLanded
  }, [isLanded])

  // ── Per-die outer animation (spin state) ────────────────────────────────────
  let outerSpinAnimate: Record<string, unknown>
  let outerSpinTransition: Record<string, unknown>

  if (die.dieType === 'heavy') {
    outerSpinAnimate   = { y: -70, scale: 2, rotate: -15, filter: 'blur(1px)' }
    outerSpinTransition = {
      y:      { duration: 0.18, ease: 'easeOut' },
      scale:  { duration: 0.18 },
      rotate: { duration: 0.18 },
      filter: { duration: 0.1 },
    }
  } else if (die.dieType === 'paladin' || die.dieType === 'priest') {
    outerSpinAnimate   = { y: -40, opacity: 0.1, filter: 'blur(0.5px)', scale: 1 }
    outerSpinTransition = {
      y:       { duration: 0.25, ease: 'easeOut' },
      opacity: { duration: 0.2 },
      filter:  { duration: 0.15 },
    }
  } else if (die.dieType === 'gambler') {
    outerSpinAnimate   = { y: -50, filter: 'blur(2px)', rotateY: 360, scale: 1 }
    outerSpinTransition = {
      y:       { duration: 0.2, ease: 'easeOut' },
      filter:  { duration: 0.15 },
      rotateY: { duration: 0.1, repeat: Infinity, ease: 'linear' },
      scale:   { duration: 0.1 },
    }
  } else if (die.dieType === 'scavenger') {
    outerSpinAnimate   = { x: -100, rotateZ: -90, opacity: 0, filter: 'blur(1px)', scale: 1 }
    outerSpinTransition = {
      x:       { duration: 0.18, ease: 'easeOut' },
      rotateZ: { duration: 0.18 },
      opacity: { duration: 0.12 },
      filter:  { duration: 0.1 },
    }
  } else if (die.dieType === 'wall') {
    outerSpinAnimate   = { y: -50, scale: 1.2, filter: 'blur(1px)' }
    outerSpinTransition = {
      y:      { duration: 0.16, ease: 'easeOut' },
      scale:  { duration: 0.16 },
      filter: { duration: 0.1 },
    }
  } else {
    outerSpinAnimate   = { y: -28, filter: 'blur(2.5px)', rotateY: 360, scale: 1 }
    outerSpinTransition = {
      y:       { duration: 0.22, ease: 'easeOut' },
      filter:  { duration: 0.15 },
      rotateY: { duration: 0.22, repeat: Infinity, ease: 'linear' },
      scale:   { duration: 0.12 },
    }
  }

  // ── Per-die outer animation (land state) ────────────────────────────────────
  let outerLandAnimate: Record<string, unknown>
  let outerLandTransition: Record<string, unknown>

  if (die.dieType === 'heavy') {
    outerLandAnimate   = { y: 0, scale: 1, rotate: 0, filter: 'blur(0px)' }
    outerLandTransition = {
      y:      { type: 'spring', stiffness: 400, damping: 10 },
      scale:  { type: 'spring', stiffness: 400, damping: 10 },
      rotate: { type: 'spring', stiffness: 400, damping: 10 },
      filter: { duration: 0.08 },
    }
  } else if (die.dieType === 'paladin' || die.dieType === 'priest') {
    outerLandAnimate   = { y: 0, opacity: 1, filter: 'blur(0px)', scale: 1 }
    outerLandTransition = {
      y:       { type: 'spring', stiffness: 100, damping: 15 },
      opacity: { duration: 0.35 },
      filter:  { duration: 0.2 },
      scale:   { duration: 0.2 },
    }
  } else if (die.dieType === 'gambler') {
    outerLandAnimate   = { y: 0, rotateY: 0, filter: 'blur(0px)', scale: [0.78, 1.18, 1] as number[] }
    outerLandTransition = {
      y:       { type: 'spring', stiffness: 300, damping: 15 },
      rotateY: { type: 'spring', stiffness: 300, damping: 15 },
      scale:   { duration: 0.32, ease: [0.15, 0, 0.1, 1.9] },
      filter:  { duration: 0.08 },
    }
  } else if (die.dieType === 'scavenger') {
    outerLandAnimate   = { x: 0, rotateZ: 0, opacity: 1, filter: 'blur(0px)', scale: 1 }
    outerLandTransition = {
      x:       { type: 'spring', stiffness: 500, damping: 30 },
      rotateZ: { type: 'spring', stiffness: 500, damping: 30 },
      opacity: { duration: 0.15 },
      filter:  { duration: 0.08 },
    }
  } else if (die.dieType === 'wall') {
    outerLandAnimate   = { y: 0, scale: 1, filter: 'blur(0px)' }
    outerLandTransition = {
      y:      { type: 'spring', stiffness: 500, damping: 40 },
      scale:  { type: 'spring', stiffness: 500, damping: 40 },
      filter: { duration: 0.08 },
    }
  } else {
    outerLandAnimate   = { y: 0, filter: 'blur(0px)', rotateY: 0, scale: [0.78, 1.18, 1] as number[] }
    outerLandTransition = {
      y:       { type: 'spring', stiffness: 900, damping: 22 },
      scale:   { duration: 0.32, ease: [0.15, 0, 0.1, 1.9] },
      filter:  { duration: 0.08 },
      rotateY: { duration: 0.12 },
    }
  }

  // Idle — restore any props animated during spin (opacity, x, rotateZ)
  let outerIdleAnimate: Record<string, unknown>
  if (die.dieType === 'paladin' || die.dieType === 'priest') {
    outerIdleAnimate = { y: 0, filter: 'blur(0px)', rotateY: 0, scale: 1, opacity: 1 }
  } else if (die.dieType === 'scavenger') {
    outerIdleAnimate = { x: 0, rotateZ: 0, opacity: 1, filter: 'blur(0px)', scale: 1 }
  } else {
    outerIdleAnimate = { y: 0, filter: 'blur(0px)', rotateY: 0, scale: 1 }
  }

  const outerAnimate    = isSpinning ? outerSpinAnimate    : isLanded ? outerLandAnimate    : outerIdleAnimate
  const outerTransition = isSpinning ? outerSpinTransition : isLanded ? outerLandTransition : { duration: 0.22 }

  // ── Per-die inner die body init/transition ──────────────────────────────────
  let innerInitial: Record<string, unknown>
  let innerTransition: Record<string, unknown>

  if (!isLanded) {
    innerInitial    = { scale: 0.6, rotate: -15, opacity: 0.5 }
    innerTransition = { type: 'spring', stiffness: 500, damping: 18 }
  } else if (die.dieType === 'heavy') {
    innerInitial    = { scale: 0.2, rotate: -22, opacity: 0.6 }
    innerTransition = { type: 'spring', stiffness: 500, damping: 8, mass: 0.6 }
  } else if (die.dieType === 'paladin') {
    innerInitial    = { scale: 0.9, rotate: 0, opacity: 0 }
    innerTransition = { type: 'spring', stiffness: 80, damping: 12 }
  } else if (die.dieType === 'gambler') {
    innerInitial    = { scale: 0.4, rotate: 18, opacity: 0.6 }
    innerTransition = { type: 'spring', stiffness: 350, damping: 10, mass: 0.7 }
  } else if (die.dieType === 'scavenger') {
    innerInitial    = { scale: 0.7, rotate: 12, opacity: 0.5 }
    innerTransition = { type: 'spring', stiffness: 500, damping: 22 }
  } else if (die.dieType === 'wall') {
    innerInitial    = { scale: 0.55, rotate: 0, opacity: 0.8 }
    innerTransition = { type: 'spring', stiffness: 500, damping: 40 }
  } else {
    innerInitial    = { scale: 0.35, rotate: -6, opacity: 0.7 }
    innerTransition = { type: 'spring', stiffness: 360, damping: 9, mass: 0.55 }
  }

  const displayFace = isSpinning ? spinFace : face

  // Continuous effects only visible once the face is revealed
  const showPersistentEffects = !!face && !isSpinning

  // ── Idle loop wrapper (Paladin float, Gambler jitter) ───────────────────────
  const showIdleLoop = !!face && !isSpinning
  let idleLoopAnimate: Record<string, unknown>
  let idleLoopTransition: Record<string, unknown>

  if (showIdleLoop && die.dieType === 'paladin') {
    idleLoopAnimate    = { y: [0, -4, 0] }
    idleLoopTransition = { repeat: Infinity, duration: 2, ease: 'easeInOut' }
  } else if (showIdleLoop && die.dieType === 'gambler') {
    idleLoopAnimate    = { x: [0, -2, 2, -2, 2, 0] }
    idleLoopTransition = { repeat: Infinity, duration: 0.4, repeatDelay: 2.5 }
  } else {
    idleLoopAnimate    = { y: 0, x: 0 }
    idleLoopTransition = { duration: 0.2 }
  }

  return (
    <motion.div
      style={{ display: 'inline-block', position: 'relative' }}
      animate={idleLoopAnimate as never}
      transition={idleLoopTransition as never}
    >
    <motion.div
      data-die-id={die.id}
      style={{ display: 'inline-block', position: 'relative', transformPerspective: 600 }}
      animate={outerAnimate as never}
      transition={outerTransition as never}
    >
      <motion.div
        key={`${die.id}-${face?.type ?? 'none'}-${face?.value ?? 0}`}
        initial={innerInitial as never}
        animate={{ scale: 1, rotate: 0, opacity: dimmed ? 0.45 : 1 }}
        transition={innerTransition as never}
        className="pixel-die"
        onClick={onClick}
        style={{
          position: 'relative',
          background: s.bg,
          boxShadow: die.dieType === 'unique'
            ? `4px 4px 0 ${s.shadow}, 0 0 18px rgba(6,182,212,0.75)`
            : mergeLevel >= 3
              ? `4px 4px 0 ${s.shadow}, 0 0 25px rgba(220,38,38,0.9)`
              : mergeLevel === 2
                ? `4px 4px 0 ${s.shadow}, 0 0 16px rgba(249,115,22,0.8)`
                : mergeLevel === 1
                  ? `4px 4px 0 ${s.shadow}, 0 0 12px rgba(34,211,238,0.7)`
                  : `4px 4px 0 ${s.shadow}`,
          border: die.dieType === 'unique'
            ? '3px solid #06b6d4'
            : mergeLevel >= 3
              ? '4px solid #dc2626'
              : mergeLevel === 2
                ? '3px solid #f97316'
                : mergeLevel === 1
                  ? '2px solid #22d3ee'
                  : undefined,
          cursor: onClick ? 'pointer' : 'default',
          flexDirection: 'column',
        }}
      >
        {displayFace
          ? <DiceFace face={displayFace} textColor={s.text} dieType={die.dieType} mergeLevel={mergeLevel} />
          : <span style={{ fontSize: '1.5rem', fontWeight: 700, color: s.text }}>?</span>
        }

        {/* Merge level badge */}
        {mergeLevel > 0 && (
          <div style={{
            position: 'absolute', top: 3, left: 3,
            background: 'rgba(0,0,0,0.82)',
            color: '#fff',
            fontSize: '0.55rem', fontWeight: 900,
            lineHeight: 1, padding: '2px 4px',
            pointerEvents: 'none', zIndex: 10,
          }}>
            +{mergeLevel}
          </div>
        )}

        {/* Purple pulse — Cursed dice only */}
        {die.dieType === 'cursed' && face?.type === 'skull' && !isSpinning && (
          <motion.div
            style={{
              position: 'absolute', inset: -3,
              border: '3px solid #7c3aed',
              pointerEvents: 'none', zIndex: 1,
            }}
            animate={{
              opacity: [0.35, 1, 0.35],
              boxShadow: [
                '0 0 6px 2px rgba(124,58,237,0.25)',
                '0 0 18px 7px rgba(124,58,237,0.75)',
                '0 0 6px 2px rgba(124,58,237,0.25)',
              ],
            }}
            transition={{ duration: 2.0, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Merge level 3+ — pulsing red aura overlay */}
        {mergeLevel >= 3 && (
          <motion.div
            style={{
              position: 'absolute', inset: -3,
              border: '3px solid #dc2626',
              pointerEvents: 'none', zIndex: 1,
            }}
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

        {/* Unique die — permanent iridescent teal pulse */}
        {die.dieType === 'unique' && (
          <motion.div
            style={{
              position: 'absolute', inset: -3,
              border: '3px solid #06b6d4',
              pointerEvents: 'none', zIndex: 1,
            }}
            animate={{
              opacity: [1, 0.4, 1],
              boxShadow: [
                '0 0 14px 5px rgba(6,182,212,0.5)',
                '0 0 32px 12px rgba(6,182,212,0.95)',
                '0 0 14px 5px rgba(6,182,212,0.5)',
              ],
            }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Impact particle burst — all dice */}
        {burst && face && <ParticleBurst faceType={face.type} />}

        {/* Heavy — violent red flash on impact */}
        <AnimatePresence>
          {die.dieType === 'heavy' && burst && <HeavyImpactFlash key="heavy-flash" />}
        </AnimatePresence>

        {/* Paladin — continuous golden aura + holy particles */}
        {die.dieType === 'paladin' && showPersistentEffects && <PaladinAura />}

        {/* Gambler — jackpot border flash when 8 is rolled */}
        {die.dieType === 'gambler' && showPersistentEffects && face?.value === 8 && <GamblerJackpot />}

        {/* Scavenger — orange impact flash */}
        <AnimatePresence>
          {die.dieType === 'scavenger' && burst && <ScavengerFlash key="scavenger-flash" />}
        </AnimatePresence>

        {/* Wall — blue shield-impact flash */}
        <AnimatePresence>
          {die.dieType === 'wall' && burst && <WallImpactFlash key="wall-flash" />}
        </AnimatePresence>

        {/* Priest — holy beam + rising particles on heal */}
        <AnimatePresence>
          {die.dieType === 'priest' && burst && face?.type === 'heal' && (
            <PriestBeam key="priest-beam" />
          )}
        </AnimatePresence>

        {/* Rejuvenator — soft green pulse + rising heal particles */}
        {die.dieType === 'rejuvenator' && showPersistentEffects && <RejuvenatorAura />}

        {/* Rejuvenator — green glow flash on impact */}
        <AnimatePresence>
          {die.dieType === 'rejuvenator' && burst && <RejuvenatorHealFlash key="rejuvenator-flash" />}
        </AnimatePresence>

        {/* Mirror — diagonal shine sweep + silver border shimmer */}
        {die.dieType === 'mirror' && showPersistentEffects && <MirrorShimmer />}

        {/* Mirror — white flash on impact */}
        <AnimatePresence>
          {die.dieType === 'mirror' && burst && <MirrorFlash key="mirror-flash" />}
        </AnimatePresence>

        {/* Warden — iron gate snap on Seal */}
        <AnimatePresence>
          {die.dieType === 'warden' && burst && face?.type === 'seal' && face.triggered && <WardenGateFlash key="warden-gate" />}
        </AnimatePresence>

        {/* Bulwark — shield bash impact */}
        <AnimatePresence>
          {die.dieType === 'bulwark' && burst && face?.type === 'shield_bash' && <ShieldBashFlash key="shield-bash" />}
        </AnimatePresence>
      </motion.div>
    </motion.div>
    </motion.div>
  )
})

// ── EmptySlot ────────────────────────────────────────────────────────────────

export function EmptySlot() {
  return (
    <div
      className="pixel-die"
      style={{
        background: 'transparent',
        border: '3px dashed #374151',
        boxShadow: 'none',
        color: '#374151',
        fontSize: '1.5rem',
      }}
    >
      +
    </div>
  )
}
