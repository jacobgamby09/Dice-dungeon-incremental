import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Shield, Swords, Skull, Flame, FlaskConical, ArrowLeft, Droplets, Star, Shuffle, Clock, RefreshCw } from 'lucide-react'
import { useGameStore, UNIQUE_DIE_TYPES, NON_MERGEABLE_DIE_TYPES, CRAFTABLE_FACES } from '../store/gameStore'
import { dieTypeStyle, faceColor } from './DieCard'
import type { Die, DieFace } from '../store/gameStore'
import { DiePresentationModal } from './DiePresentationModal'

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
  if (type === 'mirror')      return <RefreshCw size={size} color="#334155" strokeWidth={2.5} />
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

// ── Shop action type ──────────────────────────────────────────────────────────

type ShopAction = 'purify' | 'craft' | 'merge' | null

// ── Craft option generator ────────────────────────────────────────────────────

const SCALING_CRAFT_FACE_TYPES = new Set<DieFace['type']>([
  'damage', 'shield', 'heal', 'lifesteal', 'poison', 'souls', 'hot',
])

const FIXED_CRAFT_FACES: Partial<Record<DieFace['type'], DieFace>> = {
  choose_next:  { type: 'choose_next', value: 1 },
  multiplier:   { type: 'multiplier', value: 3 },
  mirror:       { type: 'mirror', value: 0 },
  seal:         { type: 'seal', value: 1 },
  shield_bash:  { type: 'shield_bash', value: 1 },
}

const VALUELESS_FACE_TYPES = new Set<DieFace['type']>([
  'choose_next', 'wildcard', 'mirror', 'seal', 'shield_bash',
])

function generateCraftOptions(mergeLevel: number): DieFace[] {
  const multiplier = Math.pow(3, mergeLevel)
  const shuffled = [...CRAFTABLE_FACES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3).map((type): DieFace => {
    const fixedFace = FIXED_CRAFT_FACES[type]
    if (fixedFace) return fixedFace
    if (type === 'hot') {
      return { type, value: (Math.floor(Math.random() * 3) + 1) * multiplier, duration: Math.floor(Math.random() * 3) + 1 }
    }
    const value = Math.floor(Math.random() * 6) + 1
    return { type, value: SCALING_CRAFT_FACE_TYPES.has(type) ? value * multiplier : value }
  })
}

function isCraftEligibleFace(die: Die, face: DieFace) {
  if (face.type === 'blank' || face.type === 'purified_skull') return true
  return die.dieType === 'vessel' && face.craftLevel !== undefined
}

const FACE_LABELS: Partial<Record<DieFace['type'], string>> = {
  damage:      'Damage',
  shield:      'Shield',
  heal:        'Heal',
  lifesteal:   'Lifesteal',
  poison:      'Poison',
  souls:       'Souls',
  choose_next: 'Fortune',
  hot:         'HoT',
  multiplier:  'Multiplier',
  mirror:      'Mirror',
  seal:        'Seal',
  shield_bash: 'Shield Bash',
}

// ── Action card ───────────────────────────────────────────────────────────────

function ActionCard({
  label, cost, description, disabled, accentColor, onSelect, buttonLabel,
}: {
  label: string; cost: number; description: string
  disabled: boolean; accentColor: string; onSelect: () => void
  buttonLabel?: string
}) {
  return (
    <div style={{
      background: '#1a1a2e',
      border: `3px solid ${disabled ? '#374151' : '#000'}`,
      boxShadow: disabled ? 'none' : '4px 4px 0 #000',
      padding: '14px',
      display: 'flex', flexDirection: 'column', gap: 10,
      opacity: disabled ? 0.5 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: '1rem', color: accentColor }}>
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Flame size={13} color="#a855f7" strokeWidth={2.5} />
          <span style={{ color: '#a855f7', fontWeight: 700, fontSize: '0.85rem' }}>{cost}</span>
        </div>
      </div>
      <span style={{ fontSize: '0.7rem', color: '#9ca3af', lineHeight: 1.5 }}>
        {description}
      </span>
      <button
        disabled={disabled}
        onClick={onSelect}
        className="pixel-btn"
        style={{
          background: disabled ? '#374151' : accentColor,
          color: '#fff', fontSize: '0.9rem', padding: '10px 0',
        }}
      >
        {buttonLabel ?? label}
      </button>
    </div>
  )
}

// ── Die picker row ────────────────────────────────────────────────────────────

function DiePickerRow({
  die, isHighlighted, isHost, allowCursed, onClick,
}: {
  die: Die; isHighlighted?: boolean; isHost?: boolean; allowCursed?: boolean; onClick: () => void
}) {
  const s        = dieTypeStyle[die.dieType]
  const name     = `${die.name}${UNIQUE_DIE_TYPES.has(die.dieType) ? ' ★' : ''}`
  const level    = die.mergeLevel ?? 0
  const isCursed = die.dieType === 'cursed'
  const disabled = isCursed && !allowCursed

  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        background: '#1a1a2e',
        border: `3px solid ${isHighlighted ? '#d97706' : '#000'}`,
        boxShadow: isHighlighted ? '4px 4px 0 #d97706' : '4px 4px 0 #000',
        padding: '10px 14px', width: '100%', color: '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
      }}
    >
      <div style={{
        width: 18, height: 18, flexShrink: 0,
        background: s.bg, border: '2px solid #000', boxShadow: `2px 2px 0 ${s.shadow}`,
      }} />
      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: s.bg }}>
        {name}
        {level > 0 && (
          <span style={{ color: '#f59e0b', fontWeight: 900, marginLeft: 4 }}>+{level}</span>
        )}
      </span>
      {die.isCustomized && (
        <span style={{
          fontSize: '0.55rem', fontWeight: 700, color: '#fbbf24',
          border: '1px solid #fbbf24', padding: '1px 5px',
          letterSpacing: '0.15em', textTransform: 'uppercase',
          lineHeight: 1, flexShrink: 0,
        }}>
          CRAFTED
        </span>
      )}
      {disabled
        ? <span style={{ marginLeft: 'auto', fontSize: '0.6rem', color: '#ef4444', letterSpacing: '0.1em' }}>CANNOT MERGE</span>
        : isHost
          ? <span style={{ marginLeft: 'auto', fontSize: '0.6rem', color: '#d97706', letterSpacing: '0.1em', fontWeight: 700 }}>HOST ✓</span>
          : <span style={{ marginLeft: 'auto', fontSize: '0.6rem', color: '#6b7280', letterSpacing: '0.1em' }}>SELECT</span>
      }
    </button>
  )
}

// ── Face picker grid ──────────────────────────────────────────────────────────

function FacePickerGrid({
  die, activeAction, onFaceSelect,
}: {
  die: Die; activeAction: 'purify' | 'craft'
  onFaceSelect: (faceIndex: number, face: DieFace) => void
}) {
  const s = dieTypeStyle[die.dieType]

  function isEligible(face: DieFace) {
    if (activeAction === 'purify') return face.type !== 'blank'
    if (activeAction === 'craft')  return isCraftEligibleFace(die, face)
    return false
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
      {die.faces.map((face, i) => {
        const eligible = isEligible(face)
        return (
          <button
            key={i}
            disabled={!eligible}
            onClick={() => onFaceSelect(i, face)}
            style={{
              background: eligible ? s.bg : '#1a1a2e',
              border: `2px solid ${eligible ? '#000' : '#374151'}`,
              boxShadow: eligible ? `3px 3px 0 ${s.shadow}` : 'none',
              padding: '14px 4px',
              cursor: eligible ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              opacity: eligible ? 1 : 0.3,
              position: 'relative',
            }}
          >
            {die.dieType === 'vessel' && face.craftLevel !== undefined && (
              <span style={{
                position: 'absolute', top: 2, left: 3,
                fontSize: '0.48rem', fontWeight: 900, color: eligible ? s.text : '#6b7280',
                background: 'rgba(255,255,255,0.55)', padding: '1px 3px',
                border: '1px solid rgba(0,0,0,0.35)', lineHeight: 1,
              }}>
                T+{face.craftLevel}
              </span>
            )}
            {face.type === 'blank' ? (
              <span style={{ fontSize: '0.6rem', color: eligible ? s.text : '#4b5563', letterSpacing: '0.1em' }}>BLANK</span>
            ) : face.type === 'purified_skull' ? (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Skull size={22} color="#ffffff" strokeWidth={2.5} />
                <svg style={{ position: 'absolute', pointerEvents: 'none', zIndex: 10 }} width="28" height="28" viewBox="0 0 28 28">
                  <line x1="2" y1="2" x2="26" y2="26" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
                  <line x1="26" y1="2" x2="2" y2="26" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </div>
            ) : face.type === 'seal' ? (
              <MaelstromIcon size={22} color={faceColor.seal} />
            ) : face.type === 'shield_bash' ? (
              <ShieldBashIcon size={22} color={faceColor.shield_bash} />
            ) : face.type === 'skull' ? (
              <Skull size={22} color={faceColor.skull} strokeWidth={2.5} />
            ) : face.type === 'mirror' ? (
              <RefreshCw size={22} color="#334155" strokeWidth={2.5} />
            ) : face.type === 'hot' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: '#064e3b', lineHeight: 1 }}>+{face.value}</span>
                  <Heart size={12} color="#064e3b" strokeWidth={2.5} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#064e3b', lineHeight: 1 }}>+{face.duration ?? 1}</span>
                  <Clock size={10} color="#064e3b" strokeWidth={2.5} />
                </div>
              </div>
            ) : (
              <>
                <span style={{
                  fontSize: '1.2rem', fontWeight: 700, lineHeight: 1,
                  color: eligible ? s.text : '#6b7280',
                }}>
                  {face.value}
                </span>
                <FaceIcon type={face.type} size={14} />
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Shop screen ───────────────────────────────────────────────────────────────

export function ShopScreen() {
  const player           = useGameStore(s => s.player)
  const runSouls         = useGameStore(s => s.runSouls)
  const inventory        = useGameStore(s => s.inventory)
  const shopHeal         = useGameStore(s => s.shopHeal)
  const shopMergeDice    = useGameStore(s => s.shopMergeDice)
  const shopCraftFace    = useGameStore(s => s.shopCraftFace)
  const shopPurifyFace   = useGameStore(s => s.shopPurifyFace)
  const shopStabilizeSkull = useGameStore(s => s.shopStabilizeSkull)
  const leaveShop        = useGameStore(s => s.leaveShop)
  const purifyUsesThisShop = useGameStore(s => s.purifyUsesThisShop)
  const unlockedNodes = useGameStore((s) => s.unlockedNodes)
  const currentFloor = useGameStore((s) => s.currentFloor)
  const isAct2Forge = currentFloor >= 16 && currentFloor <= 30
  const healCost    = unlockedNodes.includes('7jutuf9h') ? 5 : 10
  const purifyCost  = 10
  const craftCost   = 20
  const mergeCost   = unlockedNodes.includes('m1hjf9ac') ? 25 : 40
  const stabilizeCost = 25

  const [activeAction, setActiveAction]   = useState<ShopAction>(null)
  const [selectedDieId, setSelectedDieId] = useState<string | null>(null)
  const [firstMergeId, setFirstMergeId]   = useState<string | null>(null)
  const [mergeError, setMergeError]       = useState<string | false>(false)
  const [craftOptions, setCraftOptions]   = useState<DieFace[] | null>(null)
  const [craftFaceIndex, setCraftFaceIndex] = useState<number | null>(null)
  const [committedCraft, setCommittedCraft] = useState<{ dieId: string; faceIndex: number; faces: DieFace[] } | null>(null)
  const [presentDieId, setPresentDieId]   = useState<string | null>(null)
  const [presentAction, setPresentAction] = useState<'merge' | 'craft' | null>(null)
  const [showPresent, setShowPresent]     = useState(false)
  const [flashVisible, setFlashVisible]   = useState(false)

  const selectedDie = selectedDieId
    ? inventory.find((d) => d.id === selectedDieId) ?? null
    : null

  function handleFaceSelect(faceIndex: number, _face: DieFace) {
    if (!selectedDieId) return
    if (activeAction === 'purify') {
      shopPurifyFace(selectedDieId, faceIndex, purifyCost)
      setActiveAction(null)
      setSelectedDieId(null)
    } else if (activeAction === 'craft') {
      // Reuse committed options for the same die+face to prevent free rerolls
      const reuse = committedCraft?.dieId === selectedDieId && committedCraft?.faceIndex === faceIndex
      const faces = reuse ? committedCraft!.faces : generateCraftOptions(selectedDie?.mergeLevel ?? 0)
      if (!reuse) setCommittedCraft({ dieId: selectedDieId, faceIndex, faces })
      setCraftFaceIndex(faceIndex)
      setCraftOptions(faces)
    }
  }

  function triggerPresentation(dieId: string, action: 'merge' | 'craft') {
    setPresentDieId(dieId)
    setPresentAction(action)
    setShowPresent(false)
    setFlashVisible(true)
    setTimeout(() => { setFlashVisible(false); setShowPresent(true) }, 500)
  }

  function handleCraftOptionSelect(face: DieFace) {
    if (!selectedDieId || craftFaceIndex === null) return
    shopCraftFace(selectedDieId, craftFaceIndex, face, craftCost)
    const id = selectedDieId
    setActiveAction(null)
    setSelectedDieId(null)
    setCraftOptions(null)
    setCraftFaceIndex(null)
    setCommittedCraft(null)
    triggerPresentation(id, 'craft')
  }

  function handleMergeSelect(dieId: string) {
    if (firstMergeId === null) {
      setFirstMergeId(dieId)
      setMergeError(false)
      return
    }
    if (dieId === firstMergeId) {
      setFirstMergeId(null)
      return
    }
    const die1 = inventory.find((d) => d.id === firstMergeId)
    const die2 = inventory.find((d) => d.id === dieId)
    if (!die1 || !die2) return
    if (die1.dieType === 'cursed' || die2.dieType === 'cursed') {
      setMergeError('The Cursed cannot be merged')
      setTimeout(() => setMergeError(false), 1500)
      return
    }
    if (NON_MERGEABLE_DIE_TYPES.has(die1.dieType) || NON_MERGEABLE_DIE_TYPES.has(die2.dieType)) {
      setMergeError(`${NON_MERGEABLE_DIE_TYPES.has(die1.dieType) ? die1.name : die2.name} cannot be merged`)
      setTimeout(() => setMergeError(false), 1500)
      return
    }
    if (UNIQUE_DIE_TYPES.has(die1.dieType) || UNIQUE_DIE_TYPES.has(die2.dieType)) {
      setMergeError('Unique dice cannot be merged')
      setTimeout(() => setMergeError(false), 1500)
      return
    }
    const level1 = die1.mergeLevel ?? 0
    const level2 = die2.mergeLevel ?? 0
    if (level1 !== level2) {
      setMergeError('Dice must be at the same merge level')
      setTimeout(() => setMergeError(false), 1500)
      return
    }
    const jokerMerge = die1.dieType === 'joker' || die2.dieType === 'joker'
    if (!jokerMerge && die1.dieType !== die2.dieType) {
      setMergeError('Dice must be of the same type to merge')
      setTimeout(() => setMergeError(false), 1500)
      return
    }
    const hostId = firstMergeId
    shopMergeDice(firstMergeId, dieId, mergeCost)
    setActiveAction(null)
    setFirstMergeId(null)
    setMergeError(false)
    triggerPresentation(hostId, 'merge')
  }

  function handleBack() {
    if (activeAction === 'craft' && craftOptions !== null) {
      setCraftOptions(null); setCraftFaceIndex(null)
    } else if (activeAction === 'merge' && firstMergeId !== null) {
      setFirstMergeId(null); setMergeError(false)
    } else if (selectedDieId !== null) {
      setSelectedDieId(null)
    } else {
      setActiveAction(null); setFirstMergeId(null)
      setCraftOptions(null); setCraftFaceIndex(null)
    }
  }

  const canMerge = runSouls >= mergeCost &&
    inventory.some((d, i) => inventory.some((d2, j) => {
      if (i >= j) return false
      if (d.dieType === 'cursed' || d2.dieType === 'cursed') return false
      if (NON_MERGEABLE_DIE_TYPES.has(d.dieType) || NON_MERGEABLE_DIE_TYPES.has(d2.dieType)) return false
      if (UNIQUE_DIE_TYPES.has(d.dieType) || UNIQUE_DIE_TYPES.has(d2.dieType)) return false
      const l1 = d.mergeLevel ?? 0
      const l2 = d2.mergeLevel ?? 0
      if (l1 !== l2) return false
      if (d.dieType === 'joker' && d2.dieType === 'joker') return true
      if (d.dieType === 'joker' || d2.dieType === 'joker') return true
      return d.dieType === d2.dieType
    }))

  const canCraft = runSouls >= craftCost &&
    inventory.some((d) => d.dieType !== 'cursed' && d.faces.some((f) => isCraftEligibleFace(d, f)))
  const canStabilize = isAct2Forge && runSouls >= stabilizeCost &&
    inventory.some((d) => d.dieType !== 'cursed' && d.faces.some((f) => f.type === 'skull'))

  const craftEligibleDice = inventory.filter((d) =>
    d.dieType !== 'cursed' &&
    d.faces.some((f) => isCraftEligibleFace(d, f))
  )
  const mergeEligibleDice = inventory.filter((d) =>
    d.dieType !== 'cursed' &&
    !NON_MERGEABLE_DIE_TYPES.has(d.dieType) &&
    !UNIQUE_DIE_TYPES.has(d.dieType)
  )

  const subheaderText =
    activeAction === null                                    ? 'Choose a service'               :
    activeAction === 'merge' && firstMergeId === null        ? 'Select first die to merge'      :
    activeAction === 'merge' && firstMergeId !== null        ? 'Select a die to merge with'     :
    activeAction === 'craft' && selectedDieId === null       ? 'Select a die to craft'          :
    activeAction === 'craft' && craftOptions !== null        ? 'Choose your new face'           :
    activeAction === 'craft' && selectedDieId !== null       ? 'Select a face to replace'       :
    selectedDieId === null                                   ? 'Select a die to purify'         :
                                                               'Select a skull face'

  return (
    <div style={{
      maxWidth: 384, margin: '0 auto', height: '100dvh',
      display: 'flex', flexDirection: 'column',
      background: '#0f0f1a', color: '#fff', overflow: 'hidden',
    }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{
        background: '#1a1a2e', padding: '12px 16px',
        borderBottom: '3px solid #000',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Flame size={16} color="#f97316" strokeWidth={2.5} />
            <span style={{
              fontSize: '1.1rem', fontWeight: 700,
              color: '#f97316', textShadow: '2px 2px 0 #7c2d12',
              letterSpacing: '0.1em',
            }}>
              THE FORGE
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Flame size={13} color="#a855f7" strokeWidth={2.5} />
              <span style={{ color: '#a855f7', fontWeight: 700, fontSize: '0.85rem' }}>{runSouls}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Heart size={13} color="#22c55e" strokeWidth={2.5} />
              <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.85rem' }}>
                {player.hp}/{player.maxHp}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Sub-header / breadcrumb ────────────────────────────────────────── */}
      <div style={{
        background: '#12121f', padding: '8px 16px',
        borderBottom: '2px solid #000',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {activeAction !== null && (
          <button
            onClick={handleBack}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 0, display: 'flex', alignItems: 'center',
            }}
          >
            <ArrowLeft size={14} color="#6b7280" strokeWidth={2.5} />
          </button>
        )}
        <span style={{
          fontSize: '0.6rem', color: '#9ca3af',
          letterSpacing: '0.3em', textTransform: 'uppercase',
        }}>
          {subheaderText}
        </span>
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>

        {/* Default view — action cards */}
        {activeAction === null && (
          <>
            <ActionCard
              label="REST"
              cost={healCost}
              description={`Recover 30 HP. You currently have ${player.hp}/${player.maxHp} HP.`}
              disabled={runSouls < healCost || player.hp >= player.maxHp}
              accentColor="#22c55e"
              onSelect={() => shopHeal(healCost, 30)}
            />
            <ActionCard
              label="PURIFY"
              cost={purifyCost}
              description={`Wipe any face clean, making it blank and available for crafting. ${3 - purifyUsesThisShop} use${3 - purifyUsesThisShop === 1 ? '' : 's'} remaining this visit.`}
              disabled={runSouls < purifyCost || purifyUsesThisShop >= 3}
              accentColor="#7c3aed"
              buttonLabel={`PURIFY (${3 - purifyUsesThisShop} left)`}
              onSelect={() => { setActiveAction('purify'); setSelectedDieId(null) }}
            />
            <ActionCard
              label="CRAFT"
              cost={craftCost}
              description="Transform a blank or purified face. The Vessel can recraft shaped faces directly and tempers when all six faces are shaped."
              disabled={!canCraft}
              accentColor="#dc2626"
              onSelect={() => { setActiveAction('craft'); setSelectedDieId(null) }}
            />
            <ActionCard
              label="MERGE"
              cost={mergeCost}
              description="Combine 2 identical dice into 1. All non-skull face values are ×3."
              disabled={!canMerge}
              accentColor="#d97706"
              onSelect={() => { setActiveAction('merge'); setFirstMergeId(null) }}
            />
            {isAct2Forge && (
              <ActionCard
                label="STABILIZE"
                cost={stabilizeCost}
                description="Remove one random Skull from a non-Cursed die, turning it into a blank face."
                disabled={!canStabilize}
                accentColor="#22d3ee"
                buttonLabel="STABILIZE"
                onSelect={() => shopStabilizeSkull(stabilizeCost)}
              />
            )}
          </>
        )}

        {/* Die selection — purify (cursed allowed) */}
        {activeAction === 'purify' && selectedDieId === null && inventory.map((die) => (
          <DiePickerRow key={die.id} die={die} allowCursed onClick={() => setSelectedDieId(die.id)} />
        ))}

        {/* Die selection — craft (only eligible dice, cursed not disabled here either if it has blank faces) */}
        {activeAction === 'craft' && selectedDieId === null && craftOptions === null && (
          <>
            {craftEligibleDice.length === 0
              ? <p style={{ fontSize: '0.65rem', color: '#6b7280', textAlign: 'center', margin: 0 }}>
                  No dice with blank or purified faces to craft
                </p>
              : craftEligibleDice.map((die) => (
                  <DiePickerRow key={die.id} die={die} allowCursed onClick={() => setSelectedDieId(die.id)} />
                ))
            }
          </>
        )}

        {/* Die selection — merge */}
        {activeAction === 'merge' && (
          <>
            {mergeEligibleDice.map((die) => (
              <DiePickerRow
                key={die.id}
                die={die}
                isHighlighted={die.id === firstMergeId}
                isHost={die.id === firstMergeId}
                onClick={() => handleMergeSelect(die.id)}
              />
            ))}
            {mergeError && (
              <p style={{
                fontSize: '0.65rem', color: '#ef4444',
                textAlign: 'center', margin: 0, letterSpacing: '0.05em',
              }}>
                {mergeError}
              </p>
            )}
          </>
        )}

        {/* Face selection — purify or craft (before options shown) */}
        {(activeAction === 'purify' || (activeAction === 'craft' && craftOptions === null)) && selectedDie !== null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px',
              background: '#1a1a2e', border: '2px solid #000',
            }}>
              <div style={{
                width: 16, height: 16, flexShrink: 0,
                background: dieTypeStyle[selectedDie.dieType].bg,
                border: '2px solid #000',
              }} />
              <span style={{
                fontWeight: 700, fontSize: '0.85rem',
                color: dieTypeStyle[selectedDie.dieType].bg,
              }}>
                {selectedDie.name}
              </span>
            </div>
            <FacePickerGrid
              die={selectedDie}
              activeAction={activeAction as 'purify' | 'craft'}
              onFaceSelect={handleFaceSelect}
            />
            <p style={{
              fontSize: '0.65rem', color: '#6b7280',
              textAlign: 'center', margin: 0, letterSpacing: '0.05em',
            }}>
              {activeAction === 'purify'
                ? 'Select any face to convert it to blank'
                : selectedDie.dieType === 'vessel'
                  ? `Select a blank face or shaped Vessel face. New crafts use Tempered +${selectedDie.mergeLevel ?? 0} quality.`
                  : 'Select a blank or purified face to overwrite'}
            </p>
          </div>
        )}

        {/* Craft option picker */}
        {activeAction === 'craft' && craftOptions !== null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{
              fontSize: '0.65rem', color: '#9ca3af',
              textAlign: 'center', margin: 0, letterSpacing: '0.05em',
            }}>
              Pick one face to permanently add to your die
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {craftOptions.map((face, i) => {
                const color = faceColor[face.type]
                return (
                  <button
                    key={i}
                    onClick={() => handleCraftOptionSelect(face)}
                    style={{
                      background: '#1a1a2e',
                      border: '3px solid #000',
                      boxShadow: '3px 3px 0 #000',
                      padding: '18px 8px 14px',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      transition: 'border-color 0.1s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = color)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#000')}
                  >
                    <FaceIcon type={face.type} size={26} />
                    {!VALUELESS_FACE_TYPES.has(face.type) && (
                      <span style={{ fontSize: '1.4rem', fontWeight: 900, color, lineHeight: 1 }}>
                        {face.value}
                      </span>
                    )}
                    <span style={{
                      fontSize: '0.5rem', color: '#6b7280',
                      textTransform: 'uppercase', letterSpacing: '0.15em',
                    }}>
                      {FACE_LABELS[face.type] ?? face.type}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Leave shop footer ──────────────────────────────────────────────── */}
      {activeAction === null && (
        <div style={{
          padding: '12px 16px', borderTop: '3px solid #000',
          background: '#1a1a2e',
        }}>
          <button
            onClick={leaveShop}
            className="pixel-btn"
            style={{ background: '#374151', color: '#d1d5db' }}
          >
            LEAVE THE FORGE
          </button>
        </div>
      )}

      {/* Flash overlay */}
      {flashVisible && (
        <motion.div
          style={{
            position: 'fixed', inset: 0, zIndex: 48,
            background: presentAction === 'merge' ? 'rgba(251,191,36,0.35)' : 'rgba(220,38,38,0.35)',
            maxWidth: 384, margin: '0 auto', pointerEvents: 'none',
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
        />
      )}

      {/* Presentation modal */}
      {showPresent && presentDieId !== null && (() => {
        const die = inventory.find((d) => d.id === presentDieId)
        if (!die || !presentAction) return null
        return (
          <DiePresentationModal
            die={die}
            action={presentAction}
            onClose={() => { setShowPresent(false); setPresentDieId(null); setPresentAction(null) }}
          />
        )
      })()}
    </div>
  )
}
