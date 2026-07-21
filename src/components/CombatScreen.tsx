import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, animate, useAnimate } from 'framer-motion'

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
import { Shield, ShieldOff, Heart, Swords, Skull, Flame, FlaskConical, Biohazard, Plus } from 'lucide-react'
import { useGameStore, isVenomActive, getVenomLimit, getVenomPenalty } from '../store/gameStore'
import { useShallow } from 'zustand/shallow'
import type { Die, EnemyIntent, ResolvingPhase, RelicTrigger } from '../store/gameStore'
import { DieCard, faceColor, faceShadow, dieTypeStyle } from './DieCard'
import { EnemySprite } from './EnemySprite'
import { DiceInspectorModal } from './DiceInspectorModal'
import { RelicHud } from './RelicHud'

// ── Label ────────────────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: '0.65rem',
      color: '#9ca3af',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.25em',
      textShadow: '1px 1px 0 #000, -1px 0 0 #000',
      background: 'rgba(0,0,0,0.45)',
      padding: '2px 6px',
    }}>
      {children}
    </span>
  )
}

// ── HP bar ───────────────────────────────────────────────────────────────────
function HpBar({ hp, maxHp, color }: { hp: number; maxHp: number; color: string }) {
  const pct = Math.max(0, (hp / maxHp) * 100)
  return (
    <div className="pixel-bar-track" style={{ width: '100%' }}>
      <motion.div
        className="pixel-bar-fill"
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ background: color }}
      />
    </div>
  )
}

// ── Damage counter ───────────────────────────────────────────────────────────
function DamageCounter({ target, bonus = 0, rollStartVersion, counterVersion, attackTier }: {
  target: number; rollStartVersion: number; counterVersion: number
  bonus?: number
  attackTier: 1 | 2 | 3 | null
}) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v))
  const [spanScope, animateSpan] = useAnimate()

  useEffect(() => { count.set(0) }, [rollStartVersion])
  useEffect(() => {
    if (counterVersion === 0) return
    const controls = animate(count, target, { duration: 0.15, ease: 'easeOut' })
    return controls.stop
  }, [counterVersion, target])

  useEffect(() => {
    if (!spanScope.current || attackTier === null) return
    if (attackTier === 2) {
      animateSpan(spanScope.current, { color: ['#fbbf24', '#f97316', '#fbbf24'] }, { duration: 0.5 })
    } else if (attackTier === 3) {
      animateSpan(spanScope.current, {
        scale: [1, 1.5, 1],
        color: ['#fbbf24', '#ef4444', '#fbbf24'],
      }, { duration: 0.6 })
    }
  }, [attackTier])

  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8 }}>
      <motion.span ref={spanScope} style={{
        fontSize: '3.8rem',
        fontWeight: 700,
        color: '#fbbf24',
        lineHeight: 1,
        textShadow: '3px 3px 0 #78350f',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {rounded}
      </motion.span>
      <AnimatePresence>
        {bonus > 0 && (
          <motion.span
            key={bonus}
            initial={{ opacity: 0, scale: 0.8, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -6 }}
            style={{
              fontSize: '1.15rem',
              fontWeight: 900,
              color: '#facc15',
              textShadow: '2px 2px 0 #78350f',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            (+{bonus})
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Stat badge (heal / shield / souls secondary counter) ─────────────────────
function StatBadge({
  target, bonus = 0, color, shadow, icon, rollStartVersion, counterVersion,
}: {
  target: number; color: string; shadow: string; icon: React.ReactNode
  bonus?: number
  rollStartVersion: number; counterVersion: number
}) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v))

  useEffect(() => { count.set(0) }, [rollStartVersion])
  useEffect(() => {
    if (counterVersion === 0 || target === 0) return
    const controls = animate(count, target, { duration: 0.15, ease: 'easeOut' })
    return controls.stop
  }, [counterVersion, target])

  if (target === 0 && bonus === 0) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: '#0a0a14',
      border: `2px solid ${shadow}`,
      boxShadow: `2px 2px 0 ${shadow}`,
      padding: '4px 10px',
    }}>
      {icon}
      <motion.span style={{
        fontSize: '1rem',
        fontWeight: 700,
        color,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {rounded}
      </motion.span>
      <AnimatePresence>
        {bonus > 0 && (
          <motion.span
            key={bonus}
            initial={{ opacity: 0, scale: 0.85, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -4 }}
            style={{
              fontSize: '0.82rem',
              fontWeight: 900,
              color: '#facc15',
              textShadow: '1px 1px 0 #78350f',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            (+{bonus})
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

function RetaliationFloat({ trigger }: { trigger: RelicTrigger }) {
  if (trigger?.id !== 'retaliation_plate' || trigger.kind !== 'damage' || !trigger.value) return null

  return (
    <AnimatePresence>
      <motion.div
        key={trigger.version}
        initial={{ opacity: 0, y: 10, scale: 0.8 }}
        animate={{ opacity: [0, 1, 1, 0], y: [10, -8, -18, -28], scale: [0.8, 1.15, 1, 0.95] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.05, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          left: 78,
          top: 58,
          zIndex: 20,
          pointerEvents: 'none',
          fontSize: '1rem',
          fontWeight: 900,
          color: '#fb923c',
          textShadow: '2px 2px 0 #7c2d12, 0 0 8px #000',
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
        }}
      >
        -{trigger.value} COUNTER
      </motion.div>
    </AnimatePresence>
  )
}

function CarefulRhythmPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -6 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 3,
        background: '#1f1600',
        border: '2px solid #facc15',
        boxShadow: '2px 2px 0 #78350f',
        padding: '4px 9px',
        color: '#facc15',
        fontSize: '0.78rem',
        fontWeight: 900,
        textShadow: '1px 1px 0 #78350f',
      }}
    >
      <span>(</span>
      <span>+5</span>
      <Swords size={13} color="#facc15" strokeWidth={2.8} />
      <span>+5</span>
      <Shield size={13} color="#facc15" strokeWidth={2.8} />
      <span>)</span>
    </motion.div>
  )
}

// ── Skull tracker ─────────────────────────────────────────────────────────────
function RetaliationPlatePreview({ damage }: { damage: number }) {
  if (damage <= 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -6 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        marginTop: 3,
        background: '#2a0713',
        border: '2px solid #fb7185',
        boxShadow: '2px 2px 0 #831843',
        padding: '4px 9px',
        color: '#fda4af',
        fontSize: '0.78rem',
        fontWeight: 900,
        textShadow: '1px 1px 0 #831843',
      }}
    >
      <span>(</span>
      <span>+{damage}</span>
      <Swords size={13} color="#fda4af" strokeWidth={2.8} />
      <span>)</span>
    </motion.div>
  )
}

function SkullTracker({ skullCount }: { skullCount: number }) {
  const isDanger = skullCount >= 2
  const icons = (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <Skull
          key={i}
          size={22}
          color={i < skullCount ? '#a855f7' : '#374151'}
          strokeWidth={2.5}
          style={{
            opacity: i < skullCount ? 1 : 0.3,
            transition: 'color 0.15s, opacity 0.15s',
          }}
        />
      ))}
    </div>
  )

  if (isDanger) {
    return (
      <motion.div
        animate={{
          filter: [
            'drop-shadow(0 0 3px #ef4444)',
            'drop-shadow(0 0 10px #ef4444)',
            'drop-shadow(0 0 3px #ef4444)',
          ],
          scale: [1, 1.07, 1],
        }}
        transition={{ duration: 0.65, repeat: Infinity, ease: 'easeInOut' }}
      >
        {icons}
      </motion.div>
    )
  }

  return icons
}

// ── Multiplier fired overlay ─────────────────────────────────────────────────
function MultiplierFiredOverlay({ multiplierFiredVersion }: { multiplierFiredVersion: number }) {
  const [key, setKey] = useState(0)
  const [visible, setVisible] = useState(false)
  const prevVersion = useRef(multiplierFiredVersion)

  useEffect(() => {
    if (multiplierFiredVersion === prevVersion.current) return
    prevVersion.current = multiplierFiredVersion
    setKey((k) => k + 1)
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 800)
    return () => clearTimeout(t)
  }, [multiplierFiredVersion])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={key}
          style={{
            position: 'fixed', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', zIndex: 500,
            maxWidth: 384, margin: '0 auto',
          }}
          initial={{ scale: 0.7, opacity: 1 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
        >
          <span style={{
            fontSize: '3rem', fontWeight: 900,
            color: '#a3e635',
            textShadow: '0 0 20px #a3e635, 3px 3px 0 #3f6212',
            letterSpacing: '0.05em',
          }}>
            DOUBLED!
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Skull jumpscare overlay ───────────────────────────────────────────────────
function SkullJumpscareOverlay({ skullRolledVersion }: { skullRolledVersion: number }) {
  const [key, setKey] = useState(0)
  const [visible, setVisible] = useState(false)
  const prevVersion = useRef(skullRolledVersion)

  useEffect(() => {
    if (skullRolledVersion === prevVersion.current) return
    prevVersion.current = skullRolledVersion
    setKey((k) => k + 1)
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 700)
    return () => clearTimeout(t)
  }, [skullRolledVersion])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={key}
          style={{
            position: 'fixed', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 500,
          }}
          initial={{ scale: 0.5, opacity: 1 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Skull
            size={160}
            color="#7c3aed"
            strokeWidth={1.5}
            style={{ filter: 'drop-shadow(0 0 24px #a855f7)' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Flying orbs ──────────────────────────────────────────────────────────────
type Orb = { id: number; color: string; shadow: string; sx: number; sy: number; ex: number; ey: number }

function OrbLayer({ playedDice, orbVersion, resolvingDieIndex, damageRef, healRef, shieldRef, skullRef, soulsRef, poisonRef }: {
  playedDice: Die[]
  orbVersion: number
  resolvingDieIndex: number | null
  damageRef: React.RefObject<HTMLDivElement | null>
  healRef: React.RefObject<HTMLDivElement | null>
  shieldRef: React.RefObject<HTMLDivElement | null>
  skullRef: React.RefObject<HTMLDivElement | null>
  soulsRef: React.RefObject<HTMLDivElement | null>
  poisonRef: React.RefObject<HTMLDivElement | null>
}) {
  const [orbs, setOrbs] = useState<Orb[]>([])
  const prevVersion = useRef(orbVersion)

  useEffect(() => {
    if (orbVersion === prevVersion.current) return
    prevVersion.current = orbVersion

    if (resolvingDieIndex === null) return
    const die = playedDice[resolvingDieIndex]
    if (!die?.currentFace) return

    const dieEl = document.querySelector(`[data-die-id="${die.id}"]`)
    if (!dieEl) return
    const dr = dieEl.getBoundingClientRect()

    const faceType = die.currentFace.type
    if (faceType === 'choose_next' || faceType === 'wildcard' || faceType === 'blank' || faceType === 'purified_skull') return
    const targetRef = faceType === 'damage'    ? damageRef
                    : faceType === 'shield_bash' ? damageRef
                    : faceType === 'lifesteal' ? damageRef
                    : faceType === 'heal'      ? healRef
                    : faceType === 'shield'    ? shieldRef
                    : faceType === 'souls'     ? soulsRef
                    : faceType === 'poison'    ? poisonRef
                    : skullRef
    const tr = targetRef.current?.getBoundingClientRect()
    if (!tr) return

    const orb: Orb = {
      id: Date.now(),
      color: faceColor[faceType],
      shadow: faceShadow[faceType],
      sx: dr.left + dr.width  / 2,
      sy: dr.top  + dr.height / 2,
      ex: tr.left + tr.width  / 2,
      ey: tr.top  + tr.height / 2,
    }
    setOrbs([orb])
    setTimeout(() => setOrbs([]), 300)
  }, [orbVersion])

  const S = 10
  return (
    <AnimatePresence>
      {orbs.map((o) => (
        <motion.div
          key={o.id}
          style={{
            position: 'fixed',
            width: S, height: S,
            background: o.color,
            border: '2px solid #000',
            boxShadow: `2px 2px 0 ${o.shadow}`,
            pointerEvents: 'none',
          }}
          initial={{ left: o.sx - S / 2, top: o.sy - S / 2, scale: 1 }}
          animate={{ left: o.ex - S / 2, top: o.ey - S / 2, scale: 0.5 }}
          transition={{ duration: 0.21, ease: 'easeIn' }}
        />
      ))}
    </AnimatePresence>
  )
}

// ── Enemy attack orb ─────────────────────────────────────────────────────────
function EnemyOrbLayer({ enemyAttackVersion, enemyEl, playerHpRef }: {
  enemyAttackVersion: number
  enemyEl: HTMLElement | null
  playerHpRef: React.RefObject<HTMLDivElement | null>
}) {
  const [orb, setOrb] = useState<Orb | null>(null)
  const prevVersion = useRef(enemyAttackVersion)

  useEffect(() => {
    if (enemyAttackVersion === prevVersion.current) return
    prevVersion.current = enemyAttackVersion

    const sr = enemyEl?.getBoundingClientRect()
    const tr = playerHpRef.current?.getBoundingClientRect()
    if (!sr || !tr) return

    setOrb({
      id: Date.now(),
      color: '#dc2626', shadow: '#7f1d1d',
      sx: sr.left + sr.width  / 2,
      sy: sr.top  + sr.height / 2,
      ex: tr.left + tr.width  / 2,
      ey: tr.top  + tr.height / 2,
    })
    setTimeout(() => setOrb(null), 300)
  }, [enemyAttackVersion])

  const S = 10
  return (
    <AnimatePresence>
      {orb && (
        <motion.div
          key={orb.id}
          style={{
            position: 'fixed',
            width: S, height: S,
            background: orb.color,
            border: '2px solid #000',
            boxShadow: `2px 2px 0 ${orb.shadow}`,
            pointerEvents: 'none',
            zIndex: 100,
          }}
          initial={{ left: orb.sx - S / 2, top: orb.sy - S / 2, scale: 1 }}
          animate={{ left: orb.ex - S / 2, top: orb.ey - S / 2, scale: 0.5 }}
          transition={{ duration: 0.21, ease: 'easeIn' }}
        />
      )}
    </AnimatePresence>
  )
}

// ── Intent badge ──────────────────────────────────────────────────────────────
function IntentBadge({ intent, recoil = 0, enemyShield = 0 }: { intent: EnemyIntent; recoil?: number; enemyShield?: number }) {
  const [showPierceInfo, setShowPierceInfo] = useState(false)
  const [showSlamInfo, setShowSlamInfo] = useState(false)

  if (intent.type === 'shield') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Shield size={18} color="#38bdf8" strokeWidth={2.5} />
        <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#38bdf8', textShadow: '1px 1px 0 #000' }}>
          +{intent.value}
        </span>
      </div>
    )
  }
  if (intent.type === 'thorns_activate') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Swords size={18} color="#f97316" strokeWidth={2.5} />
        <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#f97316', textShadow: '1px 1px 0 #000' }}>
          {recoil > 0 ? `+${recoil}` : '0'}
        </span>
      </div>
    )
  }
  if (intent.type === 'corrosive_strike') {
    return (
      <div
        style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4, cursor: 'help' }}
        onMouseEnter={() => setShowPierceInfo(true)}
        onMouseLeave={() => setShowPierceInfo(false)}
        onClick={() => setShowPierceInfo(!showPierceInfo)}
      >
        <ShieldOff size={18} color="#a3e635" strokeWidth={2.5} />
        <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#a3e635', textShadow: '1px 1px 0 #000' }}>
          {intent.value}
        </span>
        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#a3e635', letterSpacing: '0.06em' }}>
          PIERCE
        </span>
        {showPierceInfo && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 5px)', right: 0,
            background: '#111a05', border: '2px solid #65a30d',
            padding: '6px 8px', width: 190, zIndex: 70,
            fontSize: '0.62rem', color: '#d9f99d', lineHeight: 1.35,
            pointerEvents: 'none', textAlign: 'left',
          }}>
            Pierce damage ignores your Shield and hits HP directly.
          </div>
        )}
      </div>
    )
  }
  if (intent.type === 'wound') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Heart size={18} color="#fb7185" strokeWidth={2.8} />
        <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fb7185', textShadow: '1px 1px 0 #000' }}>
          WOUND {intent.value}
        </span>
      </div>
    )
  }
  if (intent.type === 'shield_slam') {
    const shieldBonus = enemyShield
    const slamDamage = intent.value + shieldBonus
    return (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          cursor: 'help',
          background: '#10182d',
          border: '2px solid #2563eb',
          padding: '2px 5px',
          boxShadow: '2px 2px 0 #000',
        }}
        onMouseEnter={() => setShowSlamInfo(true)}
        onMouseLeave={() => setShowSlamInfo(false)}
        onClick={() => setShowSlamInfo(!showSlamInfo)}
      >
        <Swords size={15} color="#f87171" strokeWidth={2.5} />
        <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fca5a5', textShadow: '1px 1px 0 #000' }}>
          {intent.value}
        </span>
        <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#93c5fd' }}>+</span>
        <Shield size={14} color="#38bdf8" strokeWidth={2.5} />
        <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#7dd3fc', textShadow: '1px 1px 0 #000' }}>
          {shieldBonus}
        </span>
        <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#e5e7eb' }}>=</span>
        <span style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', textShadow: '1px 1px 0 #000' }}>
          {slamDamage}
        </span>
        {showSlamInfo && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 5px)', right: 0,
            background: '#08111f', border: '2px solid #2563eb',
            padding: '7px 8px', width: 210, zIndex: 70,
            fontSize: '0.64rem', color: '#dbeafe', lineHeight: 1.35,
            pointerEvents: 'none', textAlign: 'left',
          }}>
            Shield Slam adds all current enemy Shield to its attack, then spends all enemy Shield.
          </div>
        )}
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <Swords size={22} color="#f87171" strokeWidth={2.5} />
      <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f87171', textShadow: '1px 1px 0 #000' }}>
        {intent.value}
      </span>
      {recoil > 0 && (
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f97316', textShadow: '1px 1px 0 #000' }}>
          (+{recoil})
        </span>
      )}
    </div>
  )
}

// ── Floating effect popups ───────────────────────────────────────────────────
type FloatItem = { id: number; label: string; color: string; shadow: string; offset: number }

function FloatingEffects({ heal, shield, souls, hot, version }: { heal: number; shield: number; souls: number; hot?: { amount: number; turnsRemaining: number } | null; version: number }) {
  const [items, setItems] = useState<FloatItem[]>([])
  const prevVersion = useRef(version)

  useEffect(() => {
    if (version === prevVersion.current) return
    prevVersion.current = version

    const now = Date.now()
    const next: FloatItem[] = []
    if (heal > 0)   next.push({ id: now,     label: `♥ +${heal}`,   color: '#4ade80', shadow: '#15803d', offset: -36 })
    if (shield > 0) next.push({ id: now + 1, label: `⬡ +${shield}`, color: '#38bdf8', shadow: '#1e3a8a', offset:   0 })
    if (souls > 0)  next.push({ id: now + 2, label: `✦ +${souls} Souls`, color: '#a855f7', shadow: '#6d28d9', offset: 36 })
    if (hot)        next.push({ id: now + 3, label: `+${hot.amount} HP / ${hot.turnsRemaining}T`, color: '#86efac', shadow: '#15803d', offset: 0 })
    if (!next.length) return

    setItems((prev) => [...prev, ...next])
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => !next.find((n) => n.id === i.id)))
    }, 1150)
  }, [version, heal, shield, souls, hot])

  return (
    <AnimatePresence>
      {items.map((item) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -44 }}
          transition={{ duration: 1.0, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            left: `calc(50% + ${item.offset}px)`,
            top: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            color: item.color,
            fontWeight: 700,
            fontSize: '1.15rem',
            textShadow: `2px 2px 0 ${item.shadow}`,
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          {item.label}
        </motion.div>
      ))}
    </AnimatePresence>
  )
}

// ── Hit animation hook ────────────────────────────────────────────────────────
function useHitAnimation(hitVersion: number, flashColor: string) {
  const [scope, animateEl] = useAnimate()
  const prevVersion = useRef(hitVersion)

  useEffect(() => {
    if (hitVersion === prevVersion.current) return
    prevVersion.current = hitVersion
    animateEl(scope.current, {
      x: [0, -10, 10, -7, 7, -4, 0],
      backgroundColor: [flashColor, 'transparent'],
    }, { duration: 0.45, ease: 'easeOut' })
  }, [hitVersion])

  return scope
}

// ── Jackpot overlay ──────────────────────────────────────────────────────────
function JackpotOverlay({ version }: { version: number }) {
  const [key, setKey] = useState(0)
  const [visible, setVisible] = useState(false)
  const prevVersion = useRef(version)

  useEffect(() => {
    if (version === prevVersion.current) return
    prevVersion.current = version
    setKey((k) => k + 1)
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 1200)
    return () => clearTimeout(t)
  }, [version])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={key}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
            maxWidth: 384, margin: '0 auto',
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.0, ease: 'easeOut' }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(251,191,36,0.22)' }} />
          <motion.span
            style={{
              position: 'relative',
              fontSize: '3rem', fontWeight: 900, color: '#fbbf24',
              textShadow: '3px 3px 0 #78350f, 0 0 30px #fbbf24, 0 0 60px rgba(251,191,36,0.5)',
              letterSpacing: '0.1em',
            }}
            initial={{ scale: 0.3, y: 0 }}
            animate={{ scale: 1.8, y: -50 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            JACKPOT!
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Lifesteal blood particle ──────────────────────────────────────────────────
function LifestealOrbLayer({ version, enemyEl, playerHpRef }: {
  version: number
  enemyEl: HTMLElement | null
  playerHpRef: React.RefObject<HTMLDivElement | null>
}) {
  const [orb, setOrb] = useState<Orb | null>(null)
  const prevVersion = useRef(version)

  useEffect(() => {
    if (version === prevVersion.current) return
    prevVersion.current = version
    const sr = enemyEl?.getBoundingClientRect()
    const tr = playerHpRef.current?.getBoundingClientRect()
    if (!sr || !tr) return
    setOrb({
      id: Date.now(),
      color: '#e879f9', shadow: '#701a75',
      sx: sr.left + sr.width / 2,
      sy: sr.top  + sr.height / 2,
      ex: tr.left + tr.width / 2,
      ey: tr.top  + tr.height / 2,
    })
    setTimeout(() => setOrb(null), 400)
  }, [version])

  const S = 12
  return (
    <AnimatePresence>
      {orb && (
        <motion.div
          key={orb.id}
          style={{
            position: 'fixed',
            width: S, height: S,
            background: orb.color,
            border: '2px solid #000',
            boxShadow: `2px 2px 0 ${orb.shadow}, 0 0 8px ${orb.color}`,
            pointerEvents: 'none',
            zIndex: 100,
          }}
          initial={{ left: orb.sx - S / 2, top: orb.sy - S / 2, scale: 1.5 }}
          animate={{ left: orb.ex - S / 2, top: orb.ey - S / 2, scale: 0.5 }}
          transition={{ duration: 0.35, ease: 'easeIn' }}
        />
      )}
    </AnimatePresence>
  )
}

// ── Fortune Teller modal ─────────────────────────────────────────────────────
function FortuneTellerModal({ drawPile, onMinimize }: {
  drawPile: import('../store/gameStore').Die[]
  onMinimize: () => void
}) {
  const drawSpecificDie               = useGameStore((s) => s.drawSpecificDie)
  const fortuneTellerPicksRemaining   = useGameStore((s) => s.fortuneTellerPicksRemaining)

  const picksLabel = fortuneTellerPicksRemaining === 1
    ? 'Choose Your Next Die'
    : `Choose ${fortuneTellerPicksRemaining} Dice (${fortuneTellerPicksRemaining} left)`

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        maxWidth: 384, margin: '0 auto',
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div
        style={{
          marginTop: 'auto',
          background: '#0a0a14',
          borderTop: '3px solid #4338ca',
          maxHeight: '75dvh',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{
          background: '#1e1b4b', padding: '10px 16px',
          borderBottom: '3px solid #000',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#c7d2fe', letterSpacing: '0.12em' }}>
            ✦ FORTUNE TELLER — {picksLabel}
          </span>
          <button
            onClick={onMinimize}
            title="Minimize — choice stays pending"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, fontSize: '1.1rem', lineHeight: 1 }}
          >
            ─
          </button>
        </div>
        <div style={{ overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {drawPile.length === 0 ? (
            <span style={{ color: '#6b7280', fontSize: '0.8rem', textAlign: 'center', padding: '12px 0' }}>
              Bag is empty
            </span>
          ) : (
            drawPile.map((die) => {
              const s = dieTypeStyle[die.dieType]
              return (
                <button
                  key={die.id}
                  onClick={() => drawSpecificDie(die.id)}
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
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: s.bg, flex: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {die.name}
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
                        color: (face.type === 'skull' || face.type === 'purified_skull') ? faceColor.skull : s.text,
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
            })
          )}
        </div>
      </div>
    </div>
  )
}

// ── Scout modal ──────────────────────────────────────────────────────────────
function ScoutModal({ drawPile, onClose }: { drawPile: Die[]; onClose: () => void }) {
  const [inspectedDie, setInspectedDie] = useState<Die | null>(null)

  return (
    <>
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        maxWidth: 384, margin: '0 auto',
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          marginTop: 'auto',
          background: '#0a0a14',
          borderTop: '3px solid #4c1d95',
          maxHeight: '70dvh',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{
          background: '#1a1a2e', padding: '10px 16px',
          borderBottom: '3px solid #000',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#c4b5fd', letterSpacing: '0.15em' }}>
            BAG CONTENTS ({drawPile.length} left)
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}
          >
            ✕
          </button>
        </div>
        <div style={{ overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {drawPile.length === 0 ? (
            <span style={{ color: '#6b7280', fontSize: '0.8rem', textAlign: 'center', padding: '12px 0' }}>
              Bag is empty
            </span>
          ) : (
            drawPile.map((die) => {
              const s = dieTypeStyle[die.dieType]
              return (
                <button key={die.id} onClick={() => setInspectedDie(die)} style={{
                  background: '#12121f', border: '2px solid #000',
                  boxShadow: `3px 3px 0 ${s.shadow}`,
                  padding: '8px 10px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                }}>
                  <div style={{
                    width: 14, height: 14, flexShrink: 0,
                    background: s.bg, border: '2px solid #000',
                    boxShadow: `1px 1px 0 ${s.shadow}`,
                  }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: s.bg, flex: 1, letterSpacing: '0.05em' }}>
                    {die.name}
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
                        color: (face.type === 'skull' || face.type === 'purified_skull') ? faceColor.skull : s.text,
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
            })
          )}
        </div>
      </div>
    </div>
    {inspectedDie && (
      <DiceInspectorModal
        types={[inspectedDie.dieType]}
        faces={inspectedDie.faces}
        mergeLevel={inspectedDie.mergeLevel}
        onClose={() => setInspectedDie(null)}
      />
    )}
    </>
  )
}

// ── Main screen ──────────────────────────────────────────────────────────────
export function CombatScreen() {
  // Actions — stable refs, never cause re-renders
  const drawAndRoll   = useGameStore(s => s.drawAndRoll)
  const bankAndAttack = useGameStore(s => s.bankAndAttack)
  const abandonRun    = useGameStore(s => s.abandonRun)

  // Dice lists
  const { drawPile, playedDice } = useGameStore(
    useShallow(s => ({ drawPile: s.drawPile, playedDice: s.playedDice }))
  )

  // Resolving animation state
  const { resolvingDieIndex, resolvingPhase } = useGameStore(
    useShallow(s => ({ resolvingDieIndex: s.resolvingDieIndex, resolvingPhase: s.resolvingPhase }))
  )

  // Version counters
  const {
    rollStartVersion, counterVersion, skullRolledVersion, enemyHitVersion,
    playerHitVersion, playerEffectVersion, orbVersion, enemyAttackVersion,
    multiplierFiredVersion,
  } = useGameStore(
    useShallow(s => ({
      rollStartVersion:       s.rollStartVersion,
      counterVersion:         s.counterVersion,
      skullRolledVersion:     s.skullRolledVersion,
      enemyHitVersion:        s.enemyHitVersion,
      playerHitVersion:       s.playerHitVersion,
      playerEffectVersion:    s.playerEffectVersion,
      orbVersion:             s.orbVersion,
      enemyAttackVersion:     s.enemyAttackVersion,
      multiplierFiredVersion: s.multiplierFiredVersion,
    }))
  )

  // Totals
  const { totalDamage, totalHeal, totalShield, totalSouls, totalPoison } = useGameStore(
    useShallow(s => ({
      totalDamage: s.totalDamage,
      totalHeal:   s.totalHeal,
      totalShield: s.totalShield,
      totalSouls:  s.totalSouls,
      totalPoison: s.totalPoison,
    }))
  )

  // Core combat state
  const {
    player, enemy, skullCount, turnPhase, playerAttackAnimTier, lastEffects,
    secondWindTriggered, isChoosingNextDie, activeMultiplier,
    unlockedNodes, currentFloor, runSouls, fortuneTellerPicksRemaining,
    activeRelics, lastRelicTrigger,
  } = useGameStore(
    useShallow(s => ({
      player:                      s.player,
      enemy:                       s.enemy,
      skullCount:                  s.skullCount,
      turnPhase:                   s.turnPhase,
      playerAttackAnimTier:        s.playerAttackAnimTier,
      lastEffects:                 s.lastEffects,
      secondWindTriggered:         s.secondWindTriggered,
      isChoosingNextDie:           s.isChoosingNextDie,
      activeMultiplier:            s.activeMultiplier,
      unlockedNodes:               s.unlockedNodes,
      currentFloor:                s.currentFloor,
      runSouls:                    s.runSouls,
      fortuneTellerPicksRemaining: s.fortuneTellerPicksRemaining,
      activeRelics:                s.activeRelics,
      lastRelicTrigger:            s.lastRelicTrigger,
    }))
  )

  const bankedSouls           = useGameStore(s => s.bankedSouls)
  const isAutoBankDevMode     = useGameStore(s => s.isAutoBankDevMode)
  const toggleAutoBankDevMode = useGameStore(s => s.toggleAutoBankDevMode)

  // Fortune Teller minimize state — effect stays active while minimized
  const [isFtMinimized, setIsFtMinimized] = useState(false)
  useEffect(() => {
    if (isChoosingNextDie) setIsFtMinimized(false)
  }, [isChoosingNextDie])

  const venomLimit   = getVenomLimit(currentFloor)
  const venomPenalty = getVenomPenalty(currentFloor)
  const venomWarn    = venomLimit !== null && playedDice.length >= venomLimit

  const enemyScope  = useHitAnimation(enemyHitVersion,  'rgba(220,38,38,0.45)')
  const playerScope = useHitAnimation(playerHitVersion, 'rgba(220,38,38,0.45)')

  const [lungeScope, animateLunge] = useAnimate()
  const prevAttackVersion = useRef(enemyAttackVersion)
  useEffect(() => {
    if (enemyAttackVersion === prevAttackVersion.current) return
    prevAttackVersion.current = enemyAttackVersion
    animateLunge(lungeScope.current, { y: [0, 22, 0] }, { duration: 0.35, ease: 'easeOut' })
  }, [enemyAttackVersion])

  const [zoneBScope, animateZoneB] = useAnimate()

  useEffect(() => {
    if (playerAttackAnimTier === null || !zoneBScope.current) return
    const doAnim = async () => {
      if (playerAttackAnimTier === 1) {
        const anim = animateZoneB(zoneBScope.current, { y: [0, -30, 0] }, { duration: 0.2, ease: 'easeInOut' })
        await sleep(100)
        useGameStore.setState((s) => ({ enemyHitVersion: s.enemyHitVersion + 1 }))
        await anim
      } else if (playerAttackAnimTier === 2) {
        const anim = animateZoneB(zoneBScope.current, { y: [0, 15, -60, 0] }, { duration: 0.35, ease: 'easeInOut' })
        await sleep(233)
        useGameStore.setState((s) => ({ enemyHitVersion: s.enemyHitVersion + 1 }))
        await anim
      } else {
        await animateZoneB(zoneBScope.current, { x: [-5, 5, -5, 5, -5, 5, 0] }, { duration: 0.2, ease: 'easeOut' })
        const anim = animateZoneB(zoneBScope.current, {
          y: [0, 20, -100, 0],
          boxShadow: ['0px 0px 0px rgba(220,38,38,0)', '0px 0px 40px rgba(220,38,38,0.8)', '0px 0px 0px rgba(220,38,38,0)'],
        }, { duration: 0.3, ease: 'easeInOut' })
        await sleep(150)
        useGameStore.setState((s) => ({ enemyHitVersion: s.enemyHitVersion + 1 }))
        await anim
      }
      animateZoneB(zoneBScope.current, { y: 0, x: 0 }, { duration: 0 })
    }
    doAnim()
  }, [playerAttackAnimTier])

  const damageRef   = useRef<HTMLDivElement>(null)
  const healRef     = useRef<HTMLDivElement>(null)
  const shieldRef   = useRef<HTMLDivElement>(null)
  const skullRef    = useRef<HTMLDivElement>(null)
  const soulsRef    = useRef<HTMLDivElement>(null)
  const poisonRef   = useRef<HTMLDivElement>(null)
  const playerHpRef = useRef<HTMLDivElement>(null)

  // Screen shake on every die slam
  const [shakeRef, animateShake] = useAnimate()
  const prevPhase = useRef<ResolvingPhase>(null)
  useEffect(() => {
    if (resolvingPhase === 'landed' && prevPhase.current === 'spinning') {
      animateShake(shakeRef.current, { x: [0, -6, 6, -4, 4, -2, 0] }, { duration: 0.28, ease: 'easeOut' })
    }
    prevPhase.current = resolvingPhase
  }, [resolvingPhase])

  const prevResPhase = useRef<ResolvingPhase>(null)
  useEffect(() => {
    if (resolvingPhase === 'landed' && prevResPhase.current === 'spinning' && resolvingDieIndex !== null) {
      const die = playedDice[resolvingDieIndex]
      if (die?.currentFace) {
        if (die.dieType === 'jackpot' && die.currentFace.type === 'damage' && die.currentFace.value === 30) {
          setJackpotVersion((v) => v + 1)
        }
        if (die.currentFace.type === 'lifesteal') {
          setLifesteelOrbVersion((v) => v + 1)
        }
      }
    }
    prevResPhase.current = resolvingPhase
  }, [resolvingPhase])

  const isIdle = turnPhase === 'idle'
  const canDraw = isIdle && drawPile.length > 0 && !isChoosingNextDie
  const canBank = isIdle && playedDice.length > 0

  const [boardInspectorDieId, setBoardInspectorDieId] = useState<string | null>(null)
  const [jackpotVersion, setJackpotVersion] = useState(0)
  const [lifesteelOrbVersion, setLifesteelOrbVersion] = useState(0)
  const [showScout, setShowScout] = useState(false)
  const [isAutoRolling, setIsAutoRolling] = useState(false)
  const autoRollRef = useRef(false)
  const [floatingSouls, setFloatingSouls] = useState(0)
  const [hoveredBadge, setHoveredBadge] = useState<null | 'thorns' | 'venom' | 'wound'>(null)

  useEffect(() => {
    if (!secondWindTriggered) return
    const t = setTimeout(() => useGameStore.setState({ secondWindTriggered: false }), 2200)
    return () => clearTimeout(t)
  }, [secondWindTriggered])

  const handleAttack = () => {
    const g = useGameStore.getState().totalSouls
    if (g > 0) {
      setFloatingSouls(g)
      setTimeout(() => setFloatingSouls(0), 1500)
    }
    bankAndAttack()
  }

  const hasScouting = unlockedNodes.includes('zmumocry')
  const hasAutoRoll = unlockedNodes.includes('w6bsuulh')
  const hasUtilityButtons = hasAutoRoll || hasScouting

  const actRelativeFloor = ((currentFloor - 1) % 15) + 1
  const enemyLevel       = Math.min(3, Math.ceil(actRelativeFloor / 5))
  const carefulRhythmReady = activeRelics.includes('careful_rhythm') && playedDice.length === 4
  const carefulRhythmDamageBonus = carefulRhythmReady ? 5 : 0
  const carefulRhythmShieldBonus = carefulRhythmReady ? 5 : 0
  const shieldAfterAttack = player.shield + totalShield + carefulRhythmShieldBonus
  const enemyIntentDamage = enemy.intent.value + (enemy.intent.type === 'shield_slam' ? (enemy.shield ?? 0) : 0)
  const retaliationPreviewDamage = activeRelics.includes('retaliation_plate') &&
    (enemy.intent.type === 'attack' || enemy.intent.type === 'shield_slam') &&
    !enemy.corrosive && enemyIntentDamage > 0 && shieldAfterAttack >= enemyIntentDamage
      ? Math.ceil(enemyIntentDamage * 0.5)
      : 0
  const committedShieldForBadge = player.shield > 0 && (turnPhase === 'idle' || totalShield === 0) ? player.shield : 0
  const expectedThorns   = Math.floor((totalDamage + carefulRhythmDamageBonus) * (enemy?.thorns ?? 0))
  const expectedRecoil   = expectedThorns

  const startAutoRoll = async () => {
    autoRollRef.current = true
    setIsAutoRolling(true)
    while (autoRollRef.current) {
      const s = useGameStore.getState()
      if (s.drawPile.length === 0 || s.turnPhase !== 'idle' || s.isChoosingNextDie) break
      if (s.skullCount >= 2) {
        if (s.isAutoBankDevMode) {
          await bankAndAttack()
          await new Promise<void>((r) => setTimeout(r, 300))
          continue
        } else {
          break
        }
      }
      await drawAndRoll()
      await new Promise<void>((r) => setTimeout(r, 100))
    }
    autoRollRef.current = false
    setIsAutoRolling(false)
  }

  const stopAutoRoll = () => { autoRollRef.current = false }


  const drawButtonLabel =
    turnPhase === 'drawing'         ? '⟳ DRAWING...'
    : turnPhase === 'player_attack' ? '⚔ ATTACKING!'
    : turnPhase === 'enemy_attack'  ? '☠ ENEMY TURN...'
    : venomWarn                     ? `☠ DRAW +${venomPenalty} VENOM`
    : `DRAW (${drawPile.length} left)`

  return (
    <div style={{
      maxWidth: 384, margin: '0 auto', height: '100dvh',
      display: 'flex', flexDirection: 'column',
      background: '#0f0f1a', color: '#fff', overflow: 'hidden',
    }}>

      {/* Meta HUD */}
      <div style={{
        background: '#12121f',
        borderBottom: '2px solid #000',
        padding: '4px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Flame size={15} color="#a855f7" strokeWidth={2.5} />
        <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#a855f7', lineHeight: 1 }}>
          {runSouls}
        </span>
        <span style={{ fontSize: '0.6rem', color: '#7c3aed', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Souls
        </span>
        <span style={{ color: '#374151', fontSize: '0.7rem', margin: '0 2px' }}>|</span>
        <Flame size={15} color="#6d28d9" strokeWidth={2.5} />
        <motion.span
          key={bankedSouls}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 0.3 }}
          style={{ fontSize: '1.1rem', fontWeight: 900, color: '#6d28d9', lineHeight: 1 }}
        >
          {bankedSouls}
        </motion.span>
        <span style={{ fontSize: '0.6rem', color: '#4c1d95', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Banked
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {([
            { label: 'END RUN',   action: abandonRun },
            { label: 'CLEAR SAVE', action: () => { localStorage.clear(); window.location.reload() } },
          ] as const).map(({ label, action }) => (
            <button
              key={label}
              onClick={action}
              style={{
                fontSize: '0.55rem', letterSpacing: '0.05em',
                color: '#f87171', border: '1px solid #7f1d1d',
                background: 'none', padding: '2px 6px',
                cursor: 'pointer', fontFamily: 'inherit',
                opacity: 0.35, transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.35')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Shake container wraps Zones A–C */}
      <div ref={shakeRef} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      {/* Zone A — Enemy */}
      <div
        ref={enemyScope}
        style={{
          position: 'relative',
          background: enemy.isBoss ? '#1a0505' : '#1a1a2e',
          padding: '6px 16px 8px',
          borderBottom: `3px solid ${enemy.isBoss ? '#7f1d1d' : '#000'}`,
          flex: '0 0 auto',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <RetaliationFloat trigger={lastRelicTrigger} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <Label>Floor {currentFloor}</Label>
          {enemy.isBoss
            ? <span style={{ fontSize: '0.6rem', color: '#ef4444', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>⚠ BOSS</span>
            : <Label>Enemy</Label>
          }
        </div>

        <motion.div ref={lungeScope} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: enemy.isBoss ? 125 : 110, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EnemySprite
              enemyName={enemy.name}
              size={enemy.isBoss ? 6 : 5}
              hp={enemy.hp}
              enemyHitVersion={enemyHitVersion}
              enemyAttackVersion={enemyAttackVersion}
            />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: '1.3rem', fontWeight: 700,
                color: enemy.isBoss ? '#fca5a5' : '#f87171',
                textShadow: enemy.isBoss ? '2px 2px 0 #7f1d1d' : '2px 2px 0 #000',
              }}>
                {enemy.name}
              </span>
              <IntentBadge intent={enemy.intent} recoil={expectedRecoil} enemyShield={enemy.shield ?? 0} />
              {enemy.poison > 0 && (
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 4px rgba(74,222,128,0.5)',
                      '0 0 12px rgba(74,222,128,0.9)',
                      '0 0 4px rgba(74,222,128,0.5)',
                    ],
                  }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 3,
                    background: '#052e16', border: '2px solid #15803d',
                    padding: '2px 6px',
                  }}
                >
                  <Biohazard size={12} color="#4ade80" strokeWidth={2.5} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4ade80' }}>{enemy.poison}</span>
                </motion.div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#d1d5db' }}>{enemy.hp} / {enemy.maxHp} HP</span>
              <span style={{
                fontSize: '0.58rem',
                fontWeight: 900,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: enemy.isBoss ? '#fecaca' : '#fca5a5',
                background: enemy.isBoss ? '#450a0a' : '#1f1218',
                border: `2px solid ${enemy.isBoss ? '#dc2626' : '#7f1d1d'}`,
                padding: '2px 6px',
                boxShadow: '2px 2px 0 #000',
                lineHeight: 1,
              }}>
                LVL {enemyLevel}
              </span>
            </div>
            <HpBar hp={enemy.hp} maxHp={enemy.maxHp} color={enemy.isBoss ? '#b91c1c' : '#ef4444'} />

            {/* Enemy shield bar */}
            {(enemy.shield ?? 0) > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <Shield size={11} color="#38bdf8" strokeWidth={2.5} />
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#7dd3fc' }}>{enemy.shield}</span>
                <div className="pixel-bar-track" style={{ flex: 1 }}>
                  <div className="pixel-bar-fill" style={{ width: `${Math.min(100, ((enemy.shield ?? 0) / enemy.maxHp) * 100)}%`, background: '#38bdf8' }} />
                </div>
              </div>
            )}

            {/* Passive ability badges */}
            {(enemy.thorns ?? 0) > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
                <div
                  style={{ position: 'relative', display: 'inline-flex' }}
                  onMouseEnter={() => setHoveredBadge('thorns')}
                  onMouseLeave={() => setHoveredBadge(null)}
                  onClick={() => setHoveredBadge(hoveredBadge === 'thorns' ? null : 'thorns')}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 3,
                    background: '#431407', border: '2px solid #c2410c', padding: '1px 5px',
                    cursor: 'help',
                  }}>
                    <Swords size={9} color="#f97316" strokeWidth={2.5} />
                    <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#f97316', letterSpacing: '0.08em' }}>
                      THORNS RECOIL {Math.round((enemy.thorns ?? 0) * 100)}%
                    </span>
                  </div>
                  {hoveredBadge === 'thorns' && (
                    <div style={{
                      position: 'absolute', bottom: 'calc(100% + 4px)', left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#1c0a00', border: '2px solid #c2410c',
                      padding: '5px 8px', width: 180, zIndex: 50,
                      fontSize: '0.65rem', color: '#fed7aa', lineHeight: 1.4,
                      pointerEvents: 'none',
                    }}>
                      Active recoil on your attack, not the boss's next intent. Reflects <strong style={{ color: '#f97316' }}>{Math.round((enemy.thorns ?? 0) * 100)}%</strong> of damage you deal, then drops after the boss acts.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </motion.div>
      </div>

      {/* Zone B — Player / Total Damage */}
      <motion.div ref={zoneBScope}>
      <div
        ref={playerScope}
        style={{
          position: 'relative',
          background: '#0f0f1a', padding: '8px 16px',
          borderBottom: '3px solid #000',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}
      >
        <FloatingEffects
          heal={lastEffects.heal}
          shield={lastEffects.shield}
          souls={lastEffects.souls}
          hot={lastEffects.hot}
          version={playerEffectVersion}
        />

        {/* 3-col grid: HP | TOTAL DAMAGE | Skulls */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center', marginBottom: 2,
        }}>
          <div ref={playerHpRef} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Heart size={18} color="#f472b6" strokeWidth={2.5} />
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f9a8d4', textShadow: '1px 1px 0 #000' }}>{player.hp}</span>
            <span style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: 600 }}>/ {player.maxHp}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Swords size={12} color="#6b7280" />
            <Label>Total Damage</Label>
          </div>
          <div ref={skullRef} style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <SkullTracker skullCount={skullCount} />
          </div>
        </div>

        {/* HoT buff badge — shown below HP row when active */}
        {player.hot !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5,
            background: '#052e16', border: '2px solid #15803d',
            padding: '3px 10px', alignSelf: 'flex-start',
          }}>
            <Plus size={11} color="#4ade80" strokeWidth={3} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#86efac' }}>
              +{player.hot.amount} HP / {player.hot.turnsRemaining} turns
            </span>
          </div>
        )}

        {/* Wound debuff badge */}
        {player.woundTurns > 0 && (
          <div
            style={{ position: 'relative', alignSelf: 'flex-start', marginTop: 2 }}
            onMouseEnter={() => setHoveredBadge('wound')}
            onMouseLeave={() => setHoveredBadge(null)}
            onClick={() => setHoveredBadge(hoveredBadge === 'wound' ? null : 'wound')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5,
              background: '#2a0b13', border: '2px solid #be123c',
              padding: '3px 10px', cursor: 'help',
            }}>
              <Heart size={11} color="#fb7185" strokeWidth={3} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fda4af' }}>
                WOUND {player.woundTurns}
              </span>
            </div>
            {hoveredBadge === 'wound' && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 5px)', left: 0,
                background: '#19070d', border: '2px solid #be123c',
                padding: '6px 8px', width: 205, zIndex: 60,
                fontSize: '0.65rem', color: '#ffe4e6', lineHeight: 1.4,
                pointerEvents: 'none',
              }}>
                Wound reduces <strong style={{ color: '#fda4af' }}>all healing by 50%</strong>, including HoT. It decays after you bank a turn.
              </div>
            )}
          </div>
        )}

        {/* Venom poison badge */}
        {player.poison > 0 && (
          <div
            style={{ position: 'relative', alignSelf: 'flex-start', marginTop: 2 }}
            onMouseEnter={() => setHoveredBadge('venom')}
            onMouseLeave={() => setHoveredBadge(null)}
            onClick={() => setHoveredBadge(hoveredBadge === 'venom' ? null : 'venom')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5,
              background: '#1a0a2e', border: '2px solid #7c3aed',
              padding: '3px 10px', cursor: 'help',
            }}>
              <Biohazard size={11} color="#a78bfa" strokeWidth={2.5} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#c4b5fd' }}>
                {player.poison} VENOM
              </span>
            </div>
            {hoveredBadge === 'venom' && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 5px)', left: 0,
                background: '#140626', border: '2px solid #7c3aed',
                padding: '6px 8px', width: 205, zIndex: 60,
                fontSize: '0.65rem', color: '#ddd6fe', lineHeight: 1.4,
                pointerEvents: 'none',
              }}>
                Venom deals <strong style={{ color: '#c4b5fd' }}>unblockable HP damage</strong> after the enemy acts, then decays by 1.
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div ref={damageRef}>
            <DamageCounter
              target={totalDamage}
              rollStartVersion={rollStartVersion}
              counterVersion={counterVersion}
              attackTier={playerAttackAnimTier}
            />
          </div>
          <AnimatePresence>
            {carefulRhythmReady && <CarefulRhythmPreview />}
            {retaliationPreviewDamage > 0 && <RetaliationPlatePreview damage={retaliationPreviewDamage} />}
          </AnimatePresence>

          {/* Stat badges — always reserve space to prevent layout shift */}
          <div style={{
            display: 'flex', gap: 8, marginTop: 4, minHeight: 30,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <div ref={healRef}>
              <StatBadge
                target={totalHeal}
                color="#4ade80" shadow="#15803d"
                icon={<Heart size={14} color="#4ade80" strokeWidth={2.5} />}
                rollStartVersion={rollStartVersion}
                counterVersion={counterVersion}
              />
            </div>
            <div ref={shieldRef}>
              <StatBadge
                target={totalShield + committedShieldForBadge}
                color="#38bdf8" shadow="#1e3a8a"
                icon={<Shield size={14} color="#38bdf8" strokeWidth={2.5} />}
                rollStartVersion={rollStartVersion}
                counterVersion={counterVersion}
              />
            </div>
            <div ref={soulsRef}>
              <StatBadge
                target={totalSouls}
                color="#a855f7" shadow="#6d28d9"
                icon={<Flame size={14} color="#a855f7" strokeWidth={2.5} />}
                rollStartVersion={rollStartVersion}
                counterVersion={counterVersion}
              />
            </div>
            <div ref={poisonRef}>
              <StatBadge
                target={totalPoison}
                color="#4ade80" shadow="#15803d"
                icon={<FlaskConical size={14} color="#4ade80" strokeWidth={2.5} />}
                rollStartVersion={rollStartVersion}
                counterVersion={counterVersion}
              />
            </div>
          </div>
        </div>
      </div>
      </motion.div>

      {/* Enemy attack orb overlay */}
      <EnemyOrbLayer
        enemyAttackVersion={enemyAttackVersion}
        enemyEl={enemyScope.current}
        playerHpRef={playerHpRef}
      />

      {/* Player orb overlay — fixed, spans full viewport */}
      <OrbLayer
        playedDice={playedDice}
        orbVersion={orbVersion}
        resolvingDieIndex={resolvingDieIndex}
        damageRef={damageRef}
        healRef={healRef}
        shieldRef={shieldRef}
        skullRef={skullRef}
        soulsRef={soulsRef}
        poisonRef={poisonRef}
      />

      <RelicHud />

      {/* Zone C — Played Dice Tray */}
      <div style={{
        flex: 1, minHeight: 175,
        position: 'relative',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start',
        gap: 8, padding: '10px 16px', background: '#12121f',
        overflowY: 'auto',
      }}>
        <span style={{ fontSize: '0.55rem', color: '#374151', letterSpacing: '0.3em', textTransform: 'uppercase', flexShrink: 0 }}>played dice</span>
        {playedDice.length === 0 ? (
          <span style={{ color: '#374151', fontSize: '0.75rem' }}>Draw a die to start!</span>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'flex-start', gap: 8 }}>
            {playedDice.map((die, i) => (
              <DieCard
                key={die.id}
                die={die}
                isResolving={i === resolvingDieIndex}
                resolvingPhase={resolvingPhase}
                onClick={i !== resolvingDieIndex ? () => setBoardInspectorDieId(die.id) : undefined}
              />
            ))}
          </div>
        )}
        <AnimatePresence>
          {floatingSouls > 0 && (
            <motion.div
              key={floatingSouls}
              style={{
                position: 'absolute', left: '50%', top: '40%',
                transform: 'translateX(-50%)',
                pointerEvents: 'none', zIndex: 50,
                color: '#a855f7', fontWeight: 700, fontSize: '1.1rem',
                textShadow: '1px 1px 0 #000, 0 0 8px #a855f7',
                whiteSpace: 'nowrap',
              }}
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: -70, opacity: 0 }}
              exit={{}}
              transition={{ duration: 1.4, ease: 'easeOut' }}
            >
              +{floatingSouls} Souls
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      </div>{/* end shake container */}

      {/* Zone D — Actions */}
      <div style={{
        background: '#1a1a2e', padding: '10px 16px 14px', borderTop: '3px solid #000',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {/* Venom draw counter — Act 2 only */}
        {isVenomActive(currentFloor) && (
          <div style={{
            position: 'relative',
            alignSelf: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '4px 10px',
            background: venomWarn ? '#2a0b16' : '#111827',
            border: `2px solid ${venomWarn ? '#ef4444' : '#4c1d95'}`,
            boxShadow: `2px 2px 0 ${venomWarn ? '#7f1d1d' : '#000'}`,
            fontSize: '0.82rem', fontWeight: 900,
            color: venomWarn ? '#fca5a5' : '#c4b5fd',
            letterSpacing: '0.04em',
            cursor: 'help',
            marginBottom: hasUtilityButtons ? 0 : 4,
          }}
            onMouseEnter={() => setHoveredBadge('venom')}
            onMouseLeave={() => setHoveredBadge(null)}
            onClick={() => setHoveredBadge(hoveredBadge === 'venom' ? null : 'venom')}
          >
            <Biohazard size={15} color={venomWarn ? '#f87171' : '#a78bfa'} strokeWidth={2.5} />
            <span>
              {playedDice.length} / {venomLimit} draws
              {venomWarn ? ` - +${venomPenalty} VENOM next` : ''}
            </span>
            {hoveredBadge === 'venom' && (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%',
                transform: 'translateX(-50%)',
                background: '#140626', border: '2px solid #7c3aed',
                padding: '6px 8px', width: 230, zIndex: 60,
                fontSize: '0.65rem', color: '#ddd6fe', lineHeight: 1.4,
                pointerEvents: 'none', textAlign: 'left', letterSpacing: 0,
              }}>
                Act 2 Venom punishes overdraws. Drawing beyond the safe limit adds player Venom, which deals unblockable HP damage after the enemy acts and then decays by 1.
              </div>
            )}
          </div>
        )}

        {/* Top row — utility buttons (only shown if any are available) */}
        {hasUtilityButtons && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {hasAutoRoll && (
              <button
                onClick={isAutoRolling ? stopAutoRoll : startAutoRoll}
                disabled={!isAutoRolling && !canDraw}
                className="pixel-btn"
                style={{
                  height: 38, padding: '0 18px',
                  background: isAutoRolling ? '#7f1d1d' : canDraw ? '#4338ca' : '#374151',
                  opacity: (!isAutoRolling && !canDraw) ? 0.5 : 1,
                  cursor: isAutoRolling || canDraw ? 'pointer' : 'not-allowed',
                  fontSize: '0.75rem',
                }}
              >
                {isAutoRolling ? '■ STOP' : '⚡ AUTO'}
              </button>
            )}
            {hasAutoRoll && (
              <button
                onClick={toggleAutoBankDevMode}
                className="pixel-btn"
                style={{
                  height: 38, padding: '0 12px',
                  background: isAutoBankDevMode ? '#ea580c' : '#1c1917',
                  border: `2px solid ${isAutoBankDevMode ? '#fed7aa' : '#ea580c'}`,
                  color: isAutoBankDevMode ? '#fff' : '#fb923c',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                {isAutoBankDevMode ? 'AFK ON' : 'AFK'}
              </button>
            )}
            {hasScouting && (
              <button
                onClick={() => setShowScout(true)}
                className="pixel-btn"
                style={{
                  width: 48, height: 38,
                  background: '#1e293b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 0, fontSize: '1.1rem',
                }}
              >
                🔎
              </button>
            )}
          </div>
        )}

        {/* Multiplier active badge */}
        {activeMultiplier > 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              alignSelf: 'center',
              background: '#1a2e0a',
              border: '2px solid #a3e635',
              boxShadow: '0 0 10px rgba(163,230,53,0.6)',
              padding: '4px 12px',
              fontSize: '0.8rem', fontWeight: 900,
              color: '#a3e635', letterSpacing: '0.1em',
            }}
          >
            ×{activeMultiplier} NEXT
          </motion.div>
        )}

        {/* Fortune Teller minimized — reopen banner */}
        {isChoosingNextDie && isFtMinimized && (
          <button
            onClick={() => setIsFtMinimized(false)}
            className="pixel-btn"
            style={{
              alignSelf: 'stretch',
              background: '#1e1b4b',
              border: '2px solid #4338ca',
              padding: '6px 12px',
              fontSize: '0.78rem', fontWeight: 900,
              color: '#c7d2fe', letterSpacing: '0.1em',
              cursor: 'pointer', textAlign: 'center',
            }}
          >
            ✦ FORTUNE TELLER — {fortuneTellerPicksRemaining} pick{fortuneTellerPicksRemaining !== 1 ? 's' : ''} pending — TAP TO CHOOSE
          </button>
        )}


        {/* Bottom row — primary action buttons */}
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <button
            onClick={drawAndRoll}
            disabled={!canDraw || isAutoRolling}
            className="pixel-btn"
            style={{
              flex: 1, height: 60, fontSize: '1rem', fontWeight: 700,
              background: venomWarn && canDraw ? '#7f1d1d' : canDraw ? '#4f46e5' : '#374151',
              opacity: !isIdle || isAutoRolling ? 0.75 : canDraw ? 1 : 0.5,
              cursor: canDraw && !isAutoRolling ? 'pointer' : 'not-allowed',
            }}
          >
            {drawButtonLabel}
          </button>
          <button
            onClick={handleAttack}
            disabled={!canBank}
            className="pixel-btn"
            style={{
              flex: 1, height: 60, fontSize: '1rem', fontWeight: 700,
              background: canBank ? '#b45309' : '#374151',
              opacity: canBank ? 1 : 0.5,
              cursor: canBank ? 'pointer' : 'not-allowed',
            }}
          >
            ATTACK!
          </button>
        </div>
      </div>

      {isChoosingNextDie && !isFtMinimized && (
        <FortuneTellerModal drawPile={drawPile} onMinimize={() => setIsFtMinimized(true)} />
      )}
      {showScout && (
        <ScoutModal drawPile={drawPile} onClose={() => setShowScout(false)} />
      )}

      <SkullJumpscareOverlay skullRolledVersion={skullRolledVersion} />
      <MultiplierFiredOverlay multiplierFiredVersion={multiplierFiredVersion} />
      <JackpotOverlay version={jackpotVersion} />
      <LifestealOrbLayer
        version={lifesteelOrbVersion}
        enemyEl={enemyScope.current}
        playerHpRef={playerHpRef}
      />

      <AnimatePresence>
        {secondWindTriggered && (
          <motion.div
            key="second-wind"
            style={{
              position: 'fixed', inset: 0, zIndex: 300,
              maxWidth: 384, margin: '0 auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              style={{
                position: 'absolute', inset: 0,
                border: '6px solid #fbbf24',
                boxShadow: 'inset 0 0 40px rgba(251,191,36,0.35), 0 0 40px rgba(34,197,94,0.4)',
                pointerEvents: 'none',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.6, 0] }}
              transition={{ duration: 2, times: [0, 0.1, 0.5, 1] }}
            />
            <motion.div
              style={{
                fontSize: '2rem', fontWeight: 700, letterSpacing: '0.15em',
                color: '#fef08a', textShadow: '3px 3px 0 #000, 0 0 20px #fbbf24, 0 0 40px #22c55e',
                textAlign: 'center',
              }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.15, 1], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2, times: [0, 0.15, 0.6, 1] }}
            >
              SECOND WIND!
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {boardInspectorDieId && (() => {
        const die = playedDice.find((d) => d.id === boardInspectorDieId)
        if (!die) return null
        return (
          <DiceInspectorModal
            types={[die.dieType]}
            mergeLevel={die.mergeLevel}
            faces={die.faces}
            onClose={() => setBoardInspectorDieId(null)}
          />
        )
      })()}
    </div>
  )
}
