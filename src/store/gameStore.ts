import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MAX_RELICS, RELIC_POOL, type RelicId } from '../relics'

// ── Core types ───────────────────────────────────────────────────────────────

export interface DieFace {
  type: 'damage' | 'shield' | 'heal' | 'skull' | 'souls' | 'lifesteal' | 'choose_next' | 'wildcard' | 'blank' | 'purified_skull' | 'multiplier' | 'poison' | 'hot' | 'mirror'
    | 'seal' | 'shield_bash'
  value: number
  duration?: number
  triggered?: boolean
  craftLevel?: number
}

// Forge craft pool. Penalty/inert faces stay out; utility faces are allowed but
// keep their fixed behavior instead of scaling with merge level.
export const CRAFTABLE_FACES: Array<DieFace['type']> = [
  'damage', 'shield', 'heal', 'lifesteal', 'poison', 'souls', 'choose_next', 'hot',
  'multiplier', 'mirror', 'seal', 'shield_bash',
]

const MERGE_SCALING_FACE_TYPES = new Set<DieFace['type']>([
  'damage', 'shield', 'heal', 'souls', 'lifesteal', 'poison', 'hot',
])

function scaleFaceForMerge(face: DieFace): DieFace {
  if (!MERGE_SCALING_FACE_TYPES.has(face.type)) return face
  return { ...face, value: face.value * 3 }
}

function chooseNextPickCount(face: DieFace, multiplier: number): number {
  const basePicks = face.type === 'choose_next' && face.value > 0 ? face.value : 1
  return basePicks * multiplier
}

export type DieType = 'white' | 'blue' | 'green' | 'cursed'
                    | 'heavy' | 'paladin' | 'gambler' | 'scavenger' | 'wall'
                    | 'jackpot' | 'vampire' | 'priest' | 'fortune_teller'
                    | 'joker' | 'unique' | 'blight' | 'rejuvenator' | 'mirror'
                    | 'vessel' | 'warden' | 'bulwark'

export interface Die {
  id: string
  dieType: DieType
  name: string
  sides: number
  faces: DieFace[]
  currentFace?: DieFace
  isMerged?: boolean
  mergeLevel?: number
  isCustomized?: boolean
  isEquipped?: boolean
}

export const UNIQUE_DIE_TYPES = new Set<DieType>(['unique', 'mirror'])
export const NON_MERGEABLE_DIE_TYPES = new Set<DieType>(['vessel'])

export const DIE_NAMES: Record<DieType, string> = {
  white:          'The Basic',
  blue:           'The Guard',
  green:          'The Mender',
  cursed:         'The Cursed',
  heavy:          'The Heavy',
  paladin:        'The Paladin',
  gambler:        'The Gambler',
  scavenger:      'The Scavenger',
  wall:           'The Wall',
  jackpot:        'The Jackpot',
  vampire:        'The Vampire',
  priest:         'The Priest',
  fortune_teller: 'The Fortune Teller',
  joker:          'The Joker',
  unique:         'The Multiplier',
  blight:         'The Blight',
  rejuvenator:    'The Rejuvenator',
  mirror:         'The Mirror',
  vessel:         'The Vessel',
  warden:         'The Warden',
  bulwark:        'The Bulwark',
}

export interface SkillNode {
  id: string
  name: string
  description: string
  cost: number
  x: number
  y: number
  requires: string[]
  track?: 'root' | 'extraction' | 'forge' | 'survival' | 'control'
}

export type ActModifier = 'none' | 'thorns' | 'damage_cap'

export interface Act {
  id: number
  name: string
  description: string
  modifier: ActModifier
  startFloor: number
  endFloor: number
}

export type TurnPhase = 'loadout' | 'idle' | 'drawing' | 'player_attack' | 'enemy_attack' | 'draft' | 'shop' | 'inter_act_cull'
export type ResolvingPhase = 'spinning' | 'landed' | null

// ── Die factory ──────────────────────────────────────────────────────────────

export const DIE_TEMPLATES: Record<DieType, { sides: number; faces: DieFace[] }> = {
  white: {
    sides: 6,
    faces: [
      { type: 'damage', value: 1 },
      { type: 'damage', value: 2 },
      { type: 'damage', value: 3 },
      { type: 'damage', value: 4 },
      { type: 'damage', value: 5 },
      { type: 'damage', value: 6 },
    ],
  },
  blue: {
    sides: 6,
    faces: [
      { type: 'shield', value: 1 },
      { type: 'shield', value: 2 },
      { type: 'shield', value: 3 },
      { type: 'shield', value: 4 },
      { type: 'damage', value: 1 },
      { type: 'damage', value: 2 },
    ],
  },
  green: {
    sides: 6,
    faces: [
      { type: 'heal', value: 1 },
      { type: 'heal', value: 2 },
      { type: 'heal', value: 3 },
      { type: 'damage', value: 1 },
      { type: 'damage', value: 2 },
      { type: 'damage', value: 3 },
    ],
  },
  cursed: {
    sides: 6,
    faces: [
      { type: 'skull', value: 1 },
      { type: 'skull', value: 1 },
      { type: 'skull', value: 1 },
      { type: 'skull', value: 1 },
      { type: 'skull', value: 1 },
      { type: 'skull', value: 1 },
    ],
  },
  heavy: {
    sides: 6,
    faces: [
      { type: 'damage', value: 4 },
      { type: 'damage', value: 6 },
      { type: 'damage', value: 7 },
      { type: 'damage', value: 9 },
      { type: 'skull',  value: 1 },
      { type: 'skull',  value: 1 },
    ],
  },
  paladin: {
    sides: 6,
    faces: [
      { type: 'shield', value: 1 },
      { type: 'shield', value: 1 },
      { type: 'shield', value: 2 },
      { type: 'heal',   value: 1 },
      { type: 'heal',   value: 2 },
      { type: 'heal',   value: 2 },
    ],
  },
  gambler: {
    sides: 6,
    faces: [
      { type: 'damage', value: 12 },
      { type: 'damage', value: 12 },
      { type: 'blank',  value: 0  },
      { type: 'blank',  value: 0  },
      { type: 'skull',  value: 1  },
      { type: 'skull',  value: 1  },
    ],
  },
  scavenger: {
    sides: 6,
    faces: [
      { type: 'souls',   value: 3 },
      { type: 'souls',   value: 4 },
      { type: 'shield', value: 1 },
      { type: 'shield', value: 2 },
      { type: 'shield', value: 3 },
      { type: 'skull',  value: 1 },
    ],
  },
  wall: {
    sides: 6,
    faces: [
      { type: 'shield', value: 2 },
      { type: 'shield', value: 3 },
      { type: 'shield', value: 4 },
      { type: 'shield', value: 4 },
      { type: 'shield', value: 5 },
      { type: 'shield', value: 6 },
    ],
  },

  jackpot: {
    sides: 6,
    faces: [
      { type: 'damage', value: 30 },
      { type: 'skull',  value: 1  },
      { type: 'skull',  value: 1  },
      { type: 'skull',  value: 1  },
      { type: 'blank',  value: 0  },
      { type: 'blank',  value: 0  },
    ],
  },
  vampire: {
    sides: 6,
    faces: [
      { type: 'lifesteal', value: 1 },
      { type: 'lifesteal', value: 2 },
      { type: 'lifesteal', value: 2 },
      { type: 'lifesteal', value: 3 },
      { type: 'lifesteal', value: 4 },
      { type: 'skull',     value: 1 },
    ],
  },
  priest: {
    sides: 6,
    faces: [
      { type: 'heal', value: 1 },
      { type: 'heal', value: 2 },
      { type: 'heal', value: 2 },
      { type: 'heal', value: 3 },
      { type: 'heal', value: 3 },
      { type: 'heal', value: 4 },
    ],
  },
  fortune_teller: {
    sides: 6,
    faces: [
      { type: 'choose_next', value: 0 },
      { type: 'choose_next', value: 0 },
      { type: 'choose_next', value: 0 },
      { type: 'choose_next', value: 0 },
      { type: 'skull',       value: 1 },
      { type: 'skull',       value: 1 },
    ],
  },
  joker: {
    sides: 6,
    faces: [
      { type: 'wildcard', value: 0 },
      { type: 'wildcard', value: 0 },
      { type: 'wildcard', value: 0 },
      { type: 'wildcard', value: 0 },
      { type: 'wildcard', value: 0 },
      { type: 'wildcard', value: 0 },
    ],
  },
  unique: {
    sides: 6,
    faces: [
      { type: 'multiplier', value: 3 },
      { type: 'multiplier', value: 3 },
      { type: 'multiplier', value: 3 },
      { type: 'multiplier', value: 3 },
      { type: 'multiplier', value: 3 },
      { type: 'multiplier', value: 3 },
    ],
  },
  blight: {
    sides: 6,
    faces: [
      { type: 'poison', value: 1 },
      { type: 'poison', value: 2 },
      { type: 'poison', value: 2 },
      { type: 'shield', value: 2 },
      { type: 'skull',  value: 1 },
      { type: 'skull',  value: 1 },
    ],
  },
  rejuvenator: {
    sides: 6,
    faces: [
      { type: 'hot', value: 1, duration: 2 },
      { type: 'hot', value: 1, duration: 2 },
      { type: 'hot', value: 2, duration: 1 },
      { type: 'shield', value: 2 },
      { type: 'blank', value: 0 },
      { type: 'blank', value: 0 },
    ],
  },
  mirror: {
    sides: 6,
    faces: Array.from({ length: 6 }, () => ({ type: 'mirror' as const, value: 0 })),
  },
  vessel: {
    sides: 6,
    faces: Array.from({ length: 6 }, () => ({ type: 'blank' as const, value: 0 })),
  },
  warden: {
    sides: 6,
    faces: [
      { type: 'seal', value: 1 },
      { type: 'seal', value: 1 },
      { type: 'shield', value: 2 },
      { type: 'shield', value: 3 },
      { type: 'damage', value: 1 },
      { type: 'skull', value: 1 },
    ],
  },
  bulwark: {
    sides: 6,
    faces: [
      { type: 'shield',      value: 2 },
      { type: 'shield',      value: 3 },
      { type: 'shield_bash', value: 1 },
      { type: 'shield_bash', value: 1 },
      { type: 'shield_bash', value: 1 },
      { type: 'skull',       value: 1 },
    ],
  },
}

function createDie(type: DieType, id: string): Die {
  const t = DIE_TEMPLATES[type]
  return { id, dieType: type, name: DIE_NAMES[type], sides: t.sides, faces: t.faces }
}

function rollFace(die: Die): DieFace {
  return die.faces[Math.floor(Math.random() * die.faces.length)]
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Store ────────────────────────────────────────────────────────────────────

export interface EnemyIntent { type: 'attack' | 'shield' | 'shield_slam' | 'thorns_activate' | 'corrosive_strike' | 'wound'; value: number }
export interface Enemy {
  hp: number; maxHp: number; name: string; intent: EnemyIntent; isBoss: boolean; poison: number
  thorns?: number; barbs?: number; corrosive?: boolean; shield?: number; intentPhase?: number
}

type HotBuff = { amount: number; turnsRemaining: number }
export type RelicRewardContext = 'start' | 'boss' | null
export type RelicTurnFlags = {
  blackCandleUsed: boolean
  banishUsed: boolean
  emptyPromiseUsed: boolean
}
export type RelicTriggerKind = 'damage' | 'shield' | 'poison' | 'control'
export type RelicTrigger = {
  id: RelicId
  label: string
  version: number
  value?: number
  kind?: RelicTriggerKind
} | null

interface GameState {
  player: { hp: number; maxHp: number; shield: number; hot: HotBuff | null; poison: number; woundTurns: number }
  enemy: Enemy
  inventory: Die[]
  drawPile: Die[]
  playedDice: Die[]
  skullCount: number
  totalDamage: number
  totalHeal: number
  totalShield: number
  totalSouls: number
  totalPoison: number
  pendingHot: HotBuff | null
  lastEffects: { heal: number; shield: number; souls: number; hot?: HotBuff | null }
  turnPhase: TurnPhase
  enemyHitVersion: number
  playerHitVersion: number
  playerEffectVersion: number
  orbVersion: number
  counterVersion: number
  rollStartVersion: number
  resolvingDieIndex: number | null
  resolvingPhase: ResolvingPhase
  enemyAttackVersion: number
  skullRolledVersion: number
  currentFloor: number
  runSouls: number
  draftChoices: Die[]
  lockedDraftDice: Die[]
  lastSoulsEarned: number
  bankedSouls: number
  unlockedNodes: string[]
  showGameOver: boolean
  showActIntroModal: boolean
  playerAttackAnimTier: 1 | 2 | 3 | null
  isChoosingNextDie: boolean
  fortuneTellerPicksRemaining: number
  usedSecondWind: boolean
  firstAttackThisEncounter: boolean
  rerollCost: number
  justDefeatedBoss: boolean
  secondWindTriggered: boolean
  showBossRewardModal: boolean
  showRelicRewardModal: boolean
  relicRewardContext: RelicRewardContext
  activeRelics: RelicId[]
  relicChoices: RelicId[]
  relicTurnFlags: RelicTurnFlags
  lastRelicTrigger: RelicTrigger
  purifyUsesThisShop: number
  activeMultiplier: number
  multiplierFiredVersion: number
  maxEquippedDice: number
  claimBossReward: () => void
  claimRelic: (relicId: RelicId, replaceId?: RelicId) => void
  skipRelicReward: () => void
  claimActIntro: () => void
  toggleEquipDie: (dieUid: string) => void
  resetLoadout: () => void
  equipBaseDie: (dieType: DieType) => void
  startCombat: () => void
  drawAndRoll: () => Promise<void>
  drawSpecificDie: (dieId: string) => Promise<void>
  bankAndAttack: () => Promise<void>
  selectDraftDie: (dieId: string, lockedOtherIds: string[]) => void
  skipDraft: () => void
  rerollDraft: (lockedDieIds: string[]) => void
  shopHeal: (cost: number, amount: number) => void
  shopModifyFace: (dieId: string, faceIndex: number, newFace: DieFace, cost: number) => void
  shopMergeDice: (die1Id: string, die2Id: string, cost: number) => void
  shopCraftFace: (dieId: string, faceIndex: number, newFace: DieFace, cost: number) => void
  shopPurifyFace: (dieId: string, faceIndex: number, cost: number) => void
  shopStabilizeSkull: (cost: number) => void
  unlockNode: (nodeId: string) => void
  leaveShop: () => void
  extractToBase: () => void
  cullInventory: (selectedIds: string[]) => void
  abandonRun: () => void
  devJumpToForge: () => void
  isAutoBankDevMode: boolean
  toggleAutoBankDevMode: () => void
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const equippedOnly = (dice: Die[]) => dice.filter((d) => d.isEquipped !== false)
const addHot = (base: HotBuff | null, amount: number, turnsRemaining: number): HotBuff => (
  base
    ? { amount: base.amount + amount, turnsRemaining: base.turnsRemaining + turnsRemaining }
    : { amount, turnsRemaining }
)
const applyWoundToHeal = (amount: number, woundTurns: number) => (
  amount > 0 && woundTurns > 0 ? Math.max(1, Math.ceil(amount * 0.5)) : amount
)
const freshRelicTurnFlags = (): RelicTurnFlags => ({
  blackCandleUsed: false,
  banishUsed: false,
  emptyPromiseUsed: false,
})
const hasRelic = (st: Pick<GameState, 'activeRelics'>, id: RelicId) => st.activeRelics.includes(id)
const relicTrigger = (
  st: GameState,
  id: RelicId,
  label: string,
  details?: { value?: number; kind?: RelicTriggerKind }
): RelicTrigger => ({
  id,
  label,
  version: (st.lastRelicTrigger?.version ?? 0) + 1,
  ...details,
})
const chooseRelics = (activeRelics: RelicId[]) => (
  shuffleArray(RELIC_POOL.filter((id) => !activeRelics.includes(id))).slice(0, 3)
)
const carryShieldAfterTurn = (shield: number, activeRelics: RelicId[], enabled = true) => (
  enabled && activeRelics.includes('iron_memory') ? Math.floor(shield * 0.5) : 0
)
const clearRelicRunState = {
  activeRelics: [] as RelicId[],
  relicChoices: [] as RelicId[],
  showRelicRewardModal: false,
  relicRewardContext: null as RelicRewardContext,
  lastRelicTrigger: null as RelicTrigger,
  relicTurnFlags: freshRelicTurnFlags(),
}

function temperVesselAfterCraft(die: Die): Die {
  if (die.dieType !== 'vessel') return die
  const currentLevel = die.mergeLevel ?? 0
  if (currentLevel >= 3) return die
  const isFullyCraftedAtCurrentLevel = die.faces.every((face) =>
    face.craftLevel !== undefined && face.craftLevel >= currentLevel
  )
  if (!isFullyCraftedAtCurrentLevel) return die
  return { ...die, isMerged: true, mergeLevel: currentLevel + 1 }
}

function sealSkullsFromTurn(st: GameState, amount: number) {
  let remaining = Math.max(0, Math.floor(amount))
  if (remaining <= 0) {
    return { playedDice: st.playedDice, drawPile: st.drawPile, skullCount: st.skullCount, sealed: 0 }
  }

  const nextPlayed = [...st.playedDice]
  const sealedDice: Die[] = []
  for (let i = nextPlayed.length - 1; i >= 0 && remaining > 0; i--) {
    if (nextPlayed[i].currentFace?.type === 'skull') {
      sealedDice.push({ ...nextPlayed[i], currentFace: undefined })
      nextPlayed.splice(i, 1)
      remaining--
    }
  }

  return {
    playedDice: nextPlayed,
    drawPile: sealedDice.length > 0 ? shuffleArray([...st.drawPile, ...sealedDice]) : st.drawPile,
    skullCount: Math.max(0, st.skullCount - sealedDice.length),
    sealed: sealedDice.length,
  }
}

async function resolveSkullRelics(face: DieFace, multiplier: number): Promise<boolean> {
  if (face.type !== 'skull') return false

  const snap = useGameStore.getState()
  if (hasRelic(snap, 'black_candle') && !snap.relicTurnFlags.blackCandleUsed) {
    useGameStore.setState((st) => ({
      enemy: { ...st.enemy, poison: st.enemy.poison + 1 },
      enemyHitVersion: st.enemyHitVersion + 1,
      relicTurnFlags: { ...st.relicTurnFlags, blackCandleUsed: true },
      lastRelicTrigger: relicTrigger(st, 'black_candle', '+1 Poison'),
    }))
    await sleep(90)
  }

  const afterCandle = useGameStore.getState()
  if (hasRelic(afterCandle, 'banish') && !afterCandle.relicTurnFlags.banishUsed) {
    useGameStore.setState((st) => {
      const sealed = sealSkullsFromTurn(st, 1)
      return {
        playedDice: sealed.playedDice,
        drawPile: sealed.drawPile,
        skullCount: st.skullCount,
        activeMultiplier: 1,
        counterVersion: st.counterVersion + 1,
        relicTurnFlags: { ...st.relicTurnFlags, banishUsed: true },
        lastRelicTrigger: relicTrigger(st, 'banish', 'Skull Banished'),
        ...(multiplier > 1 ? { multiplierFiredVersion: st.multiplierFiredVersion + 1 } : {}),
      }
    })
    await sleep(120)
    return true
  }

  return false
}

// ── Bestiary ─────────────────────────────────────────────────────────────────

interface EnemyTemplate {
  name: string; baseHp: number
  intentMin: number; intentMax: number; isBoss: boolean
  thorns?: number; barbs?: number; corrosive?: boolean
  intentCycle?: Array<{ type: EnemyIntent['type']; value: number }>
  intentCycleStartFloor?: number
}

export const SKILL_TREE_NODES: SkillNode[] = [
  { id: 'sflz4yv3', name: 'The Awakening', description: 'Your journey begins.', cost: 0, x: 0, y: 0, requires: [], track: 'root' },

  // Extraction: make the flee/push decision richer without only adding raw combat power.
  { id: 'tqo6xv7r', name: 'Pocket Change', description: 'Start each run with 10 Run Souls.', cost: 100, x: 190, y: -300, requires: ['sflz4yv3'], track: 'extraction' },
  { id: 'r9v5wdgh', name: 'Bounty Hunter', description: 'Bosses drop 10 extra Run Souls.', cost: 200, x: 390, y: -300, requires: ['tqo6xv7r'], track: 'extraction' },
  { id: 'demo_soul_stash', name: 'Soul Stash', description: 'Demo: keep 10% of Run Souls when you die.', cost: 650, x: 590, y: -300, requires: ['r9v5wdgh'], track: 'extraction' },
  { id: 'demo_deep_pockets', name: 'Deep Pockets', description: 'Demo: floors after a boss award +15% Souls.', cost: 1100, x: 790, y: -300, requires: ['demo_soul_stash'], track: 'extraction' },

  // Forge: make crafting feel like a meta-progression identity, not only a shop option.
  { id: '7jutuf9h', name: 'Haggler', description: 'Heal at the Forge costs 5 Souls instead of 10.', cost: 300, x: 190, y: -100, requires: ['sflz4yv3'], track: 'forge' },
  { id: 'm1hjf9ac', name: 'Forge Master', description: 'Merge costs 25 Souls instead of 40.', cost: 1000, x: 390, y: -100, requires: ['7jutuf9h'], track: 'forge' },
  { id: 'demo_blank_canvas', name: 'Blank Canvas', description: 'Demo: The Vessel appears more often in drafts.', cost: 500, x: 590, y: -100, requires: ['m1hjf9ac'], track: 'forge' },
  { id: 'demo_first_craft', name: 'First Craft', description: 'Demo: first craft each Forge visit is discounted.', cost: 900, x: 790, y: -100, requires: ['demo_blank_canvas'], track: 'forge' },

  // Survival: enough resilience to push deeper, but not a complete solution.
  { id: 'fyuwvmzq', name: 'Vitality I', description: '+10 Max HP.', cost: 100, x: 190, y: 100, requires: ['sflz4yv3'], track: 'survival' },
  { id: 'aw2b29dw', name: 'Thick Skin', description: 'Heal 15% of max HP after defeating a boss.', cost: 150, x: 390, y: 100, requires: ['fyuwvmzq'], track: 'survival' },
  { id: 'co2xusrh', name: 'Vitality II', description: '+15 Max HP.', cost: 300, x: 590, y: 100, requires: ['aw2b29dw'], track: 'survival' },
  { id: '7nescabs', name: 'Second Wind', description: 'Once per run, revive with 20 HP instead of dying.', cost: 1000, x: 790, y: 100, requires: ['co2xusrh'], track: 'survival' },

  // Control: information and rerolls are real power in a push-your-luck game.
  { id: 'zmumocry', name: 'Scouting', description: 'You can always see what dice are left in your bag.', cost: 500, x: 190, y: 300, requires: ['sflz4yv3'], track: 'control' },
  { id: 'w6bsuulh', name: 'Auto Roll', description: 'Auto-draws dice until you reach 2 skulls.', cost: 500, x: 390, y: 300, requires: ['zmumocry'], track: 'control' },
  { id: 'demo_draft_lock', name: 'Draft Lock+', description: 'Demo: lock one extra draft option between rewards.', cost: 700, x: 590, y: 300, requires: ['w6bsuulh'], track: 'control' },
  { id: 'demo_reroll_insight', name: 'Reroll Insight', description: 'Demo: draft rerolls show one guaranteed die type.', cost: 1000, x: 790, y: 300, requires: ['demo_draft_lock'], track: 'control' },

  // Dice unlocks: kept as side branches for build-defining dice, not the whole tree.
  { id: 'g1atjka6', name: 'First Blood', description: 'First attack each encounter gives +1 damage.', cost: 100, x: -210, y: 180, requires: ['sflz4yv3'], track: 'survival' },
  { id: 'hnwdjqof', name: 'Sharpened Edges', description: 'White dice: 1-damage faces become 2-damage.', cost: 500, x: -410, y: 180, requires: ['g1atjka6'], track: 'survival' },
  { id: 'dx6jq5y5', name: 'The Priest', description: 'Adds The Priest to the dice loot pool.', cost: 700, x: -210, y: -210, requires: ['sflz4yv3'], track: 'control' },
  { id: '60vc1fvg', name: 'The Vampire', description: 'Adds The Vampire to the dice loot pool.', cost: 700, x: -410, y: -210, requires: ['dx6jq5y5'], track: 'survival' },
  { id: 'kec9ybn2', name: 'The Jackpot', description: 'Adds The Jackpot to the dice loot pool.', cost: 700, x: -210, y: -360, requires: ['sflz4yv3'], track: 'extraction' },
  { id: 'qevchxm7', name: 'Fortune Teller', description: 'Adds The Fortune Teller to the dice loot pool.', cost: 700, x: -410, y: -360, requires: ['kec9ybn2'], track: 'control' },
]

const STARTING_UNLOCKED_NODE_IDS = [
  'sflz4yv3', // The Awakening
  'kec9ybn2', // New Dice: The Jackpot
  '60vc1fvg', // New Dice: The Vampire
  'dx6jq5y5', // New Dice: The Priest
  'qevchxm7', // New Dice: The Fortune Teller
  'zmumocry', // Scouting enabled by default until the talent tree pass
  'w6bsuulh', // Auto Roll enabled by default until the talent tree pass
]


const ACT_1_BESTIARY: EnemyTemplate[] = [
  { name: 'Slime',    baseHp: 24,  intentMin: 2,  intentMax: 4,  isBoss: false },
  { name: 'Goblin',   baseHp: 38,  intentMin: 4,  intentMax: 6,  isBoss: false },
  { name: 'Skeleton', baseHp: 44,  intentMin: 3,  intentMax: 7,  isBoss: false },
  { name: 'Orc',      baseHp: 54,  intentMin: 6,  intentMax: 9,  isBoss: false },
  {
    name: 'Cultist', baseHp: 42, intentMin: 3, intentMax: 5, isBoss: false,
    intentCycleStartFloor: 6,
    intentCycle: [
      { type: 'attack', value: 4 },
      { type: 'attack', value: 5 },
      { type: 'wound',  value: 1 },
    ],
  },
  {
    name: 'Shieldbearer', baseHp: 50, intentMin: 4, intentMax: 6, isBoss: false,
    intentCycleStartFloor: 6,
    intentCycle: [
      { type: 'shield',      value: 7 },
      { type: 'shield_slam', value: 4 },
      { type: 'attack',      value: 6 },
    ],
  },
  {
    name: 'Blood Orc', baseHp: 70, intentMin: 4, intentMax: 7, isBoss: true,
    intentCycle: [
      { type: 'attack', value: 7 },
      { type: 'wound',  value: 2 },
      { type: 'attack', value: 10 },
      { type: 'attack', value: 14 },
    ],
  },
]

const ACT_2_BESTIARY: EnemyTemplate[] = [
  { name: 'Slime Crawler', baseHp: 40, intentMin: 4, intentMax: 6, isBoss: false },
  {
    name: 'Marrow Bat', baseHp: 35, intentMin: 3, intentMax: 5, isBoss: false,
    intentCycleStartFloor: 21,
    intentCycle: [
      { type: 'attack', value: 4 },
      { type: 'attack', value: 5 },
      { type: 'wound',  value: 1 },
      { type: 'attack', value: 6 },
    ],
  },
  { name: 'Toxic Creep',   baseHp: 60, intentMin: 4, intentMax: 7, isBoss: false },
  {
    name: 'Spiked Behemoth', baseHp: 120, intentMin: 14, intentMax: 18, isBoss: true, thorns: 0,
    intentCycle: [
      { type: 'shield',           value: 5    },
      { type: 'attack',           value: 14   },
      { type: 'thorns_activate',  value: 0.30 },
      { type: 'corrosive_strike', value: 7    },
    ],
  },
]

function rollIntent(template: EnemyTemplate, floor: number, intentPhase = 0): EnemyIntent {
  const actId = getCurrentAct(floor).id
  const floorScaling = actId >= 2
    ? Math.floor((floor - 16) * 0.45)
    : Math.floor((floor - 1) * 0.5)
  const activeIntentCycle = template.intentCycle && template.intentCycle.length > 0 &&
    (template.intentCycleStartFloor === undefined || floor >= template.intentCycleStartFloor)
      ? template.intentCycle
      : null
  if (activeIntentCycle) {
    const def = activeIntentCycle[intentPhase % activeIntentCycle.length]
    if (def.type === 'attack' || def.type === 'shield_slam' || def.type === 'corrosive_strike') {
      return { type: def.type, value: def.value + floorScaling }
    }
    if (template.isBoss && def.type === 'shield') {
      const delta = Math.max(0, floor - 20)
      return { type: 'shield', value: Math.round(def.value + delta * 0.5) }
    }
    if (template.isBoss && def.type === 'thorns_activate') {
      const delta = Math.max(0, floor - 20)
      return { type: 'thorns_activate', value: Math.min(0.90, def.value + delta * 0.04) }
    }
    return { type: def.type, value: def.value }
  }
  const base = template.intentMin + Math.floor(Math.random() * (template.intentMax - template.intentMin + 1))
  return { type: 'attack', value: base + floorScaling }
}

function spawnEnemy(floor: number): Enemy {
  const isBossFloor = floor % 5 === 0
  const act         = getCurrentAct(floor)
  const bestiary    = act.id >= 2 ? ACT_2_BESTIARY : ACT_1_BESTIARY
  const bossT       = bestiary.find(t => t.isBoss)!
  const nonBoss     = bestiary.filter(t => !t.isBoss)
  const act1Early   = nonBoss.filter(t => !['Cultist', 'Shieldbearer'].includes(t.name))
  const act1Mid     = [
    nonBoss.find(t => t.name === 'Cultist'),
    nonBoss.find(t => t.name === 'Shieldbearer'),
    ...act1Early,
  ].filter((t): t is EnemyTemplate => Boolean(t))
  const activePool  = act.id === 1 && floor >= 6 ? act1Mid : act.id === 1 ? act1Early : nonBoss
  const template    = isBossFloor ? bossT : activePool[(act.id === 1 && floor >= 6 ? floor - 6 : floor - 1) % activePool.length]
  const hp          = act.id >= 2
    ? template.baseHp + (floor - 16) * 4
    : template.baseHp + (floor - 1) * 2
  return {
    hp, maxHp: hp,
    name:        template.name,
    intent:      rollIntent(template, floor, 0),
    isBoss:      template.isBoss,
    poison:      0,
    thorns:      template.thorns,
    barbs:       template.barbs,
    corrosive:   template.corrosive,
    shield:      0,
    intentPhase: 0,
  }
}

const INITIAL_INVENTORY: Die[] = [
  createDie('white',  'w1'), createDie('white',  'w2'), createDie('white',  'w3'),
  createDie('white',  'w4'),
  createDie('blue',   'b1'), createDie('blue',   'b2'),
  createDie('green',  'g1'),
  createDie('cursed', 'c1'), createDie('cursed', 'c2'), createDie('cursed', 'c3'),
]

export const GAME_ACTS: Act[] = [
  { id: 1, name: 'The Brute Tunnels', description: 'Crude warriors armed with raw power.',   modifier: 'none',       startFloor: 1,  endFloor: 15 },
  { id: 2, name: 'The Spiked Depths', description: 'Draw carefully — venom stacks with every overdraw.', modifier: 'thorns', startFloor: 16, endFloor: 30 },
  { id: 3, name: 'The Iron Fortress', description: 'Damage is capped. Outlast or perish.',   modifier: 'damage_cap', startFloor: 31, endFloor: 45 },
]

export function getCurrentAct(floor: number): Act {
  return GAME_ACTS.find((a) => floor >= a.startFloor && floor <= a.endFloor) ?? GAME_ACTS[GAME_ACTS.length - 1]
}

export function isVenomActive(floor: number): boolean {
  return floor >= 16 && floor <= 30
}
export function getVenomLimit(floor: number): number | null {
  if (!isVenomActive(floor)) return null
  return 5
}
export function getVenomPenalty(floor: number): number {
  return floor >= 26 ? 2 : 1
}

const GLOBAL_DICE_POOL: DieType[] = ['heavy', 'scavenger', 'wall', 'gambler', 'joker', 'vessel', 'warden', 'bulwark']
const ACT_1_DICE_POOL: DieType[] = ['paladin', 'vampire', 'rejuvenator', 'mirror']
const ACT_2_DICE_POOL: DieType[] = ['blight', 'fortune_teller', 'priest', 'unique', 'jackpot']

export function getDiePoolLabel(type: DieType): string {
  if (type === 'white' || type === 'blue' || type === 'green') return 'Base'
  if (type === 'cursed') return 'Cursed'
  if (GLOBAL_DICE_POOL.includes(type)) return 'Global'
  if (ACT_1_DICE_POOL.includes(type)) return 'Act 1'
  if (ACT_2_DICE_POOL.includes(type)) return 'Act 2'
  return 'Unknown'
}

function getDiceLootPool(floor: number): DieType[] {
  const actId = getCurrentAct(floor).id
  if (actId === 1) return [...GLOBAL_DICE_POOL, ...ACT_1_DICE_POOL]
  if (actId === 2) return [...GLOBAL_DICE_POOL, ...ACT_2_DICE_POOL]
  return [...GLOBAL_DICE_POOL]
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
  player: { hp: 100, maxHp: 100, shield: 0, hot: null, poison: 0, woundTurns: 0 },
  enemy: spawnEnemy(1),
  inventory: INITIAL_INVENTORY.map((d) => ({ ...d })),
  drawPile: [],
  playedDice: [],
  skullCount: 0,
  totalDamage: 0,
  totalHeal: 0,
  totalShield: 0,
  totalSouls: 0,
  totalPoison: 0,
  pendingHot: null,
  lastEffects: { heal: 0, shield: 0, souls: 0, hot: null },
  turnPhase: 'loadout',
  enemyHitVersion: 0,
  playerHitVersion: 0,
  playerEffectVersion: 0,
  orbVersion: 0,
  counterVersion: 0,
  rollStartVersion: 0,
  resolvingDieIndex: null,
  resolvingPhase: null,
  enemyAttackVersion: 0,
  skullRolledVersion: 0,
  currentFloor: 1,
  runSouls: 0,
  draftChoices: [],
  lockedDraftDice: [],
  lastSoulsEarned: 0,
  bankedSouls: 0,
  unlockedNodes: STARTING_UNLOCKED_NODE_IDS,
  playerAttackAnimTier: null,
  isChoosingNextDie: false,
  fortuneTellerPicksRemaining: 0,
  usedSecondWind: false,
  firstAttackThisEncounter: true,
  rerollCost: 5,
  justDefeatedBoss: false,
  secondWindTriggered: false,
  showBossRewardModal: false,
  showRelicRewardModal: false,
  relicRewardContext: null,
  activeRelics: [],
  relicChoices: [],
  relicTurnFlags: freshRelicTurnFlags(),
  lastRelicTrigger: null,
  showActIntroModal: false,
  showGameOver: false,
  purifyUsesThisShop: 0,
  activeMultiplier: 1,
  isAutoBankDevMode: false,
  multiplierFiredVersion: 0,
  maxEquippedDice: 10,

  toggleEquipDie: (dieUid) => {
    set((s) => {
      const die = s.inventory.find((d) => d.id === dieUid)
      if (!die) return {}
      if (die.dieType === 'cursed') return {}
      const isCurrentlyEquipped = die.isEquipped !== false
      if (isCurrentlyEquipped) {
        const isUnmodifiedBase = (['white', 'blue', 'green'] as DieType[]).includes(die.dieType)
          && !die.mergeLevel && !die.isCustomized
        if (isUnmodifiedBase) {
          return { inventory: s.inventory.filter((d) => d.id !== dieUid) }
        }
        return { inventory: s.inventory.map((d) => d.id === dieUid ? { ...d, isEquipped: false } : d) }
      } else {
        if (equippedOnly(s.inventory).length >= s.maxEquippedDice) {
          console.warn(`Loadout full (${s.maxEquippedDice}/${s.maxEquippedDice})`)
          return {}
        }
        return { inventory: s.inventory.map((d) => d.id === dieUid ? { ...d, isEquipped: true } : d) }
      }
    })
  },

  resetLoadout: () => {
    set((s) => ({
      inventory: s.inventory
        .filter((d) => {
          const isUnmodifiedBase = (['white', 'blue', 'green'] as DieType[]).includes(d.dieType)
            && !d.mergeLevel && !d.isCustomized
          return !isUnmodifiedBase
        })
        .map((d) => ({ ...d, isEquipped: d.dieType === 'cursed' ? true : false })),
    }))
  },

  equipBaseDie: (dieType) => {
    set((s) => {
      if (equippedOnly(s.inventory).length >= s.maxEquippedDice) return {}
      return { inventory: [...s.inventory, { ...createDie(dieType, uid()), isEquipped: true }] }
    })
  },

  startCombat: () => {
    const { unlockedNodes, inventory } = get()

    const vitI  = unlockedNodes.includes('fyuwvmzq') ? 10 : 0
    const vitII = unlockedNodes.includes('co2xusrh') ? 15 : 0
    const baseHp    = 100 + vitI + vitII
    const startSouls = unlockedNodes.includes('tqo6xv7r') ? 10 : 0

    const startInventory = unlockedNodes.includes('hnwdjqof')
      ? inventory.map((d) =>
          d.dieType !== 'white' ? d : {
            ...d,
            faces: d.faces.map((f) =>
              f.type === 'damage' && f.value === 1 ? { ...f, value: 2 } : f
            ),
          }
        )
      : inventory

    set((s) => ({
      turnPhase:    'idle',
      player:       { hp: baseHp, maxHp: baseHp, shield: 0, hot: null, poison: 0, woundTurns: 0 },
      inventory:    startInventory,
      runSouls:     startSouls,
      currentFloor: 1,
      enemy:        spawnEnemy(1),
      drawPile:     shuffleArray(equippedOnly(startInventory)),
      playedDice:   [],
      skullCount:   0,
      totalDamage: 0, totalHeal: 0, totalShield: 0, totalSouls: 0, totalPoison: 0, pendingHot: null,
      lastEffects:  { heal: 0, shield: 0, souls: 0 },
      rollStartVersion: s.rollStartVersion + 1,
      resolvingDieIndex: null, resolvingPhase: null,
      draftChoices: [], lockedDraftDice: [], lastSoulsEarned: 0,
      isChoosingNextDie: false,
      fortuneTellerPicksRemaining: 0,
      activeMultiplier: 1,
      usedSecondWind: false,
      firstAttackThisEncounter: true,
      rerollCost: 5,
      justDefeatedBoss: false,
      secondWindTriggered: false,
      showBossRewardModal: false,
      showRelicRewardModal: true,
      relicRewardContext: 'start',
      activeRelics: [],
      relicChoices: chooseRelics([]),
      relicTurnFlags: freshRelicTurnFlags(),
      lastRelicTrigger: null,
      showActIntroModal: false,
      purifyUsesThisShop: 0,
    }))
  },

  drawAndRoll: async () => {
    const s = get()
    if (s.turnPhase !== 'idle' || s.drawPile.length === 0) return

    // Pick a random die and roll its face
    const randIdx   = Math.floor(Math.random() * s.drawPile.length)
    const drawn     = s.drawPile[randIdx]
    const face      = rollFace(drawn)
    const revealedFace = face.type === 'seal' ? { ...face, triggered: s.skullCount > 0 } : face
    const nextIndex = s.playedDice.length

    // Remove from draw pile, enter drawing phase
    set((st) => ({
      turnPhase: 'drawing',
      drawPile: st.drawPile.filter((_, i) => i !== randIdx),
      resolvingDieIndex: nextIndex,
      resolvingPhase: null,
    }))
    await sleep(40)

    // Stage 1 — Spin
    set((st) => ({
      playedDice: [...st.playedDice, { ...drawn, currentFace: undefined }],
      resolvingPhase: 'spinning',
    }))
    await sleep(300)

    // Stage 2 — Land: reveal face
    set((st) => ({
      playedDice: st.playedDice.map((d, i) =>
        i === nextIndex ? { ...d, currentFace: revealedFace } : d
      ),
      resolvingPhase: 'landed',
    }))
    await sleep(100)

    // Stage 3 — Orb fly
    set((st) => ({ orbVersion: st.orbVersion + 1 }))
    await sleep(150)

    // Stage 4 — Tally
    const mult          = s.activeMultiplier
    let   newSkullCount = s.skullCount
    const skullWasBanished = await resolveSkullRelics(face, mult)
    if (skullWasBanished) {
      set({ resolvingDieIndex: null, resolvingPhase: null, turnPhase: 'idle' })
      return
    }

    if (face.type === 'multiplier') {
      set((st) => ({ activeMultiplier: st.activeMultiplier * face.value, counterVersion: st.counterVersion + 1 }))
      await sleep(75)
    } else if (face.type === 'hot') {
      const dur = face.duration ?? 1
      set((st) => ({
        pendingHot: addHot(st.pendingHot, face.value * mult, dur * mult),
        activeMultiplier: 1, counterVersion: st.counterVersion + 1,
        ...(mult > 1 ? { multiplierFiredVersion: st.multiplierFiredVersion + 1 } : {}),
      }))
      await sleep(75)
    } else if (face.type === 'seal') {
      set((st) => {
        const sealed = sealSkullsFromTurn(st, face.value * mult)
        return {
          playedDice: sealed.playedDice,
          drawPile: sealed.drawPile,
          skullCount: sealed.skullCount,
          activeMultiplier: 1,
          counterVersion: st.counterVersion + 1,
          ...(mult > 1 ? { multiplierFiredVersion: st.multiplierFiredVersion + 1 } : {}),
        }
      })
      newSkullCount = get().skullCount
      await sleep(75)
    } else if (face.type === 'mirror') {
      const prevDie  = get().playedDice[nextIndex - 1]
      const prevFace = prevDie?.currentFace
      if (prevFace && nextIndex > 0) {
        if (prevFace.type === 'multiplier') {
          set((st) => ({ activeMultiplier: st.activeMultiplier * prevFace.value, counterVersion: st.counterVersion + 1 }))
        } else if (prevFace.type === 'hot') {
          const dur = prevFace.duration ?? 1
          set((st) => ({
            pendingHot: addHot(st.pendingHot, prevFace.value * mult, dur * mult),
            activeMultiplier: 1, counterVersion: st.counterVersion + 1,
            ...(mult > 1 ? { multiplierFiredVersion: st.multiplierFiredVersion + 1 } : {}),
          }))
        } else if (prevFace.type === 'seal') {
          set((st) => {
            const sealed = sealSkullsFromTurn(st, prevFace.value * mult)
            return {
              playedDice: sealed.playedDice,
              drawPile: sealed.drawPile,
              skullCount: sealed.skullCount,
              activeMultiplier: 1,
              counterVersion: st.counterVersion + 1,
              ...(mult > 1 ? { multiplierFiredVersion: st.multiplierFiredVersion + 1 } : {}),
            }
          })
          newSkullCount = get().skullCount
        } else {
          const isSkull2 = prevFace.type === 'skull'
          newSkullCount  = s.skullCount + (isSkull2 ? mult : 0)
          const ls2 = prevFace.type === 'lifesteal' ? prevFace.value * mult : 0
          const rawH2 = prevFace.type === 'heal'    ? prevFace.value * mult : ls2
          const h2  = applyWoundToHeal(rawH2, get().player.woundTurns)
          const sh2 = prevFace.type === 'shield'    ? prevFace.value * mult : 0
          const bash2 = prevFace.type === 'shield_bash' ? (get().player.shield + get().totalShield) * mult : 0
          const d2  = (prevFace.type === 'damage' || prevFace.type === 'lifesteal') ? prevFace.value * mult : bash2
          const s2  = prevFace.type === 'souls'     ? prevFace.value * mult : 0
          const p2  = prevFace.type === 'poison'    ? prevFace.value * mult : 0
          set((st) => ({
            totalDamage: st.totalDamage + d2, totalHeal: st.totalHeal + h2,
            totalShield: st.totalShield + sh2, totalSouls: st.totalSouls + s2,
            totalPoison: st.totalPoison + p2, skullCount: newSkullCount,
            activeMultiplier: 1, counterVersion: st.counterVersion + 1,
            lastEffects: { heal: h2, shield: sh2, souls: s2, hot: null },
            ...(mult > 1 ? { multiplierFiredVersion: st.multiplierFiredVersion + 1 } : {}),
            ...(isSkull2 ? { skullRolledVersion: st.skullRolledVersion + 1 } : {}),
            ...(h2 > 0 || sh2 > 0 || s2 > 0 ? { playerEffectVersion: st.playerEffectVersion + 1 } : {}),
          }))
        }
      } else {
        set({ activeMultiplier: 1 })
      }
      await sleep(75)
    } else {
      const isSkull       = face.type === 'skull'
      newSkullCount       = s.skullCount + (isSkull ? mult : 0)
      const lifestealGain = face.type === 'lifesteal' ? face.value * mult : 0
      const rawHealGain   = face.type === 'heal'      ? face.value * mult : lifestealGain
      const healGain      = applyWoundToHeal(rawHealGain, get().player.woundTurns)
      const emptyPromiseUsed = face.type === 'blank' && hasRelic(get(), 'empty_promise') && !get().relicTurnFlags.emptyPromiseUsed
      const shieldGain    = (face.type === 'shield' ? face.value * mult : 0) + (emptyPromiseUsed ? 6 : 0)
      const bashGain      = face.type === 'shield_bash' ? (get().player.shield + get().totalShield) * mult : 0
      const damageGain    = (face.type === 'damage' || face.type === 'lifesteal') ? face.value * mult : bashGain
      const soulsGain      = face.type === 'souls'     ? face.value * mult : 0
      const poisonGain    = face.type === 'poison'    ? face.value * mult : 0
      const multiplierFired = mult > 1

      set((st) => ({
        totalDamage: st.totalDamage + damageGain,
        totalHeal:   st.totalHeal   + healGain,
        totalShield: st.totalShield + shieldGain,
        totalSouls:   st.totalSouls   + soulsGain,
        totalPoison: st.totalPoison + poisonGain,
        skullCount:  newSkullCount,
        activeMultiplier: 1,
        counterVersion: st.counterVersion + 1,
        lastEffects: { heal: healGain, shield: shieldGain, souls: soulsGain, hot: null },
        ...(emptyPromiseUsed ? {
          relicTurnFlags: { ...st.relicTurnFlags, emptyPromiseUsed: true },
          lastRelicTrigger: relicTrigger(st, 'empty_promise', '+6 Shield'),
        } : {}),
        ...(multiplierFired ? { multiplierFiredVersion: st.multiplierFiredVersion + 1 } : {}),
        ...(isSkull ? { skullRolledVersion: st.skullRolledVersion + 1 } : {}),
        ...(healGain > 0 || shieldGain > 0 || soulsGain > 0
          ? { playerEffectVersion: st.playerEffectVersion + 1 }
          : {}),
      }))
      await sleep(75)
    }

    set({ resolvingDieIndex: null, resolvingPhase: null })

    // ── Venom check (Act 2) ──────────────────────────────────────────────
    const _venomLimit = getVenomLimit(get().currentFloor)
    if (_venomLimit !== null && get().playedDice.length > _venomLimit) {
      const _penalty = getVenomPenalty(get().currentFloor)
      set((st) => ({
        player: { ...st.player, poison: st.player.poison + _penalty },
        playerHitVersion: st.playerHitVersion + 1,
      }))
      await sleep(150)
    }

    // ── Bust check ──────────────────────────────────────────────────────
    if (newSkullCount >= 3) {
      // Animate damage/heal/souls counters to 0
      set((st) => ({
        totalDamage: 0,
        totalHeal:   0,
        totalSouls:   0,
        totalPoison: 0,
        pendingHot: null,
        counterVersion: st.counterVersion + 1,
      }))
      await sleep(300)

      // Brief player_attack phase: 0 damage, but keep accumulated shield
      const bustShield = get().totalShield
      const boneLedgerShield = hasRelic(get(), 'bone_ledger') ? 6 : 0
      set((st) => ({
        turnPhase: 'player_attack',
        totalShield: 0,
        player: { ...st.player, shield: st.player.shield + bustShield + boneLedgerShield },
        ...(boneLedgerShield > 0 ? {
          lastRelicTrigger: relicTrigger(st, 'bone_ledger', '+6 Shield', { value: 6, kind: 'shield' }),
          lastEffects: { heal: 0, shield: boneLedgerShield, souls: 0, hot: null },
          playerEffectVersion: st.playerEffectVersion + 1,
        } : {}),
      }))
      await sleep(400)

      const bustDied1 = await applyBustPoisonTick()
      if (bustDied1) { await handleBustEnemyVictory() } else { await runEnemyPhase({ allowIronMemory: false }) }
      return
    }

    // Fortune Teller: open the choose-next modal if draw pile has dice remaining
    if (face.type === 'choose_next' && get().drawPile.length > 0) {
      const picks   = Math.min(chooseNextPickCount(face, mult), get().drawPile.length)
      set({ turnPhase: 'idle', isChoosingNextDie: true, fortuneTellerPicksRemaining: picks, activeMultiplier: 1 })
    } else {
      set({ turnPhase: 'idle' })
    }
  },

  drawSpecificDie: async (dieId: string) => {
    const s = get()
    if (s.turnPhase !== 'idle') return

    const dieIdx = s.drawPile.findIndex((d) => d.id === dieId)
    if (dieIdx === -1) return

    const drawn     = s.drawPile[dieIdx]
    const face      = rollFace(drawn)
    const revealedFace = face.type === 'seal' ? { ...face, triggered: s.skullCount > 0 } : face
    const nextIndex = s.playedDice.length

    set((st) => ({
      isChoosingNextDie: false,
      turnPhase: 'drawing',
      drawPile: st.drawPile.filter((_, i) => i !== dieIdx),
      resolvingDieIndex: nextIndex,
      resolvingPhase: null,
    }))
    await sleep(40)

    set((st) => ({
      playedDice: [...st.playedDice, { ...drawn, currentFace: undefined }],
      resolvingPhase: 'spinning',
    }))
    await sleep(300)

    set((st) => ({
      playedDice: st.playedDice.map((d, i) =>
        i === nextIndex ? { ...d, currentFace: revealedFace } : d
      ),
      resolvingPhase: 'landed',
    }))
    await sleep(100)

    set((st) => ({ orbVersion: st.orbVersion + 1 }))
    await sleep(150)

    const mult2          = s.activeMultiplier
    let   newSkullCount  = s.skullCount
    const skullWasBanished = await resolveSkullRelics(face, mult2)
    if (skullWasBanished) {
      set({ resolvingDieIndex: null, resolvingPhase: null })
      const picksLeft = get().fortuneTellerPicksRemaining
      if (picksLeft > 1 && get().drawPile.length > 0) {
        set({ turnPhase: 'idle', isChoosingNextDie: true, fortuneTellerPicksRemaining: picksLeft - 1 })
      } else {
        set({ turnPhase: 'idle', fortuneTellerPicksRemaining: 0 })
      }
      return
    }

    if (face.type === 'multiplier') {
      set((st) => ({ activeMultiplier: st.activeMultiplier * face.value, counterVersion: st.counterVersion + 1 }))
      await sleep(75)
    } else if (face.type === 'hot') {
      const dur = face.duration ?? 1
      set((st) => ({
        pendingHot: addHot(st.pendingHot, face.value * mult2, dur * mult2),
        activeMultiplier: 1, counterVersion: st.counterVersion + 1,
        ...(mult2 > 1 ? { multiplierFiredVersion: st.multiplierFiredVersion + 1 } : {}),
      }))
      await sleep(75)
    } else if (face.type === 'seal') {
      set((st) => {
        const sealed = sealSkullsFromTurn(st, face.value * mult2)
        return {
          playedDice: sealed.playedDice,
          drawPile: sealed.drawPile,
          skullCount: sealed.skullCount,
          activeMultiplier: 1,
          counterVersion: st.counterVersion + 1,
          ...(mult2 > 1 ? { multiplierFiredVersion: st.multiplierFiredVersion + 1 } : {}),
        }
      })
      newSkullCount = get().skullCount
      await sleep(75)
    } else if (face.type === 'mirror') {
      const prevDie  = get().playedDice[nextIndex - 1]
      const prevFace = prevDie?.currentFace
      if (prevFace && nextIndex > 0) {
        if (prevFace.type === 'multiplier') {
          set((st) => ({ activeMultiplier: st.activeMultiplier * prevFace.value, counterVersion: st.counterVersion + 1 }))
        } else if (prevFace.type === 'hot') {
          const dur = prevFace.duration ?? 1
          set((st) => ({
            pendingHot: addHot(st.pendingHot, prevFace.value * mult2, dur * mult2),
            activeMultiplier: 1, counterVersion: st.counterVersion + 1,
            ...(mult2 > 1 ? { multiplierFiredVersion: st.multiplierFiredVersion + 1 } : {}),
          }))
        } else if (prevFace.type === 'seal') {
          set((st) => {
            const sealed = sealSkullsFromTurn(st, prevFace.value * mult2)
            return {
              playedDice: sealed.playedDice,
              drawPile: sealed.drawPile,
              skullCount: sealed.skullCount,
              activeMultiplier: 1,
              counterVersion: st.counterVersion + 1,
              ...(mult2 > 1 ? { multiplierFiredVersion: st.multiplierFiredVersion + 1 } : {}),
            }
          })
          newSkullCount = get().skullCount
        } else {
          const isSkull2 = prevFace.type === 'skull'
          newSkullCount  = s.skullCount + (isSkull2 ? mult2 : 0)
          const ls2 = prevFace.type === 'lifesteal' ? prevFace.value * mult2 : 0
          const rawH2 = prevFace.type === 'heal'    ? prevFace.value * mult2 : ls2
          const h2  = applyWoundToHeal(rawH2, get().player.woundTurns)
          const sh2 = prevFace.type === 'shield'    ? prevFace.value * mult2 : 0
          const bash2 = prevFace.type === 'shield_bash' ? (get().player.shield + get().totalShield) * mult2 : 0
          const d2  = (prevFace.type === 'damage' || prevFace.type === 'lifesteal') ? prevFace.value * mult2 : bash2
          const s2  = prevFace.type === 'souls'     ? prevFace.value * mult2 : 0
          const p2  = prevFace.type === 'poison'    ? prevFace.value * mult2 : 0
          set((st) => ({
            totalDamage: st.totalDamage + d2, totalHeal: st.totalHeal + h2,
            totalShield: st.totalShield + sh2, totalSouls: st.totalSouls + s2,
            totalPoison: st.totalPoison + p2, skullCount: newSkullCount,
            activeMultiplier: 1, counterVersion: st.counterVersion + 1,
            lastEffects: { heal: h2, shield: sh2, souls: s2, hot: null },
            ...(mult2 > 1 ? { multiplierFiredVersion: st.multiplierFiredVersion + 1 } : {}),
            ...(isSkull2 ? { skullRolledVersion: st.skullRolledVersion + 1 } : {}),
            ...(h2 > 0 || sh2 > 0 || s2 > 0 ? { playerEffectVersion: st.playerEffectVersion + 1 } : {}),
          }))
        }
      } else {
        set({ activeMultiplier: 1 })
      }
      await sleep(75)
    } else {
      const isSkull       = face.type === 'skull'
      newSkullCount       = s.skullCount + (isSkull ? mult2 : 0)
      const lifestealGain = face.type === 'lifesteal' ? face.value * mult2 : 0
      const rawHealGain   = face.type === 'heal'      ? face.value * mult2 : lifestealGain
      const healGain      = applyWoundToHeal(rawHealGain, get().player.woundTurns)
      const emptyPromiseUsed = face.type === 'blank' && hasRelic(get(), 'empty_promise') && !get().relicTurnFlags.emptyPromiseUsed
      const shieldGain    = (face.type === 'shield' ? face.value * mult2 : 0) + (emptyPromiseUsed ? 6 : 0)
      const bashGain      = face.type === 'shield_bash' ? (get().player.shield + get().totalShield) * mult2 : 0
      const damageGain    = (face.type === 'damage' || face.type === 'lifesteal') ? face.value * mult2 : bashGain
      const soulsGain      = face.type === 'souls'     ? face.value * mult2 : 0
      const poisonGain    = face.type === 'poison'    ? face.value * mult2 : 0
      const multiplierFired = mult2 > 1

      set((st) => ({
        totalDamage: st.totalDamage + damageGain,
        totalHeal:   st.totalHeal   + healGain,
        totalShield: st.totalShield + shieldGain,
        totalSouls:   st.totalSouls   + soulsGain,
        totalPoison: st.totalPoison + poisonGain,
        skullCount:  newSkullCount,
        activeMultiplier: 1,
        counterVersion: st.counterVersion + 1,
        lastEffects: { heal: healGain, shield: shieldGain, souls: soulsGain, hot: null },
        ...(emptyPromiseUsed ? {
          relicTurnFlags: { ...st.relicTurnFlags, emptyPromiseUsed: true },
          lastRelicTrigger: relicTrigger(st, 'empty_promise', '+6 Shield'),
        } : {}),
        ...(multiplierFired ? { multiplierFiredVersion: st.multiplierFiredVersion + 1 } : {}),
        ...(isSkull ? { skullRolledVersion: st.skullRolledVersion + 1 } : {}),
        ...(healGain > 0 || shieldGain > 0 || soulsGain > 0
          ? { playerEffectVersion: st.playerEffectVersion + 1 }
          : {}),
      }))
      await sleep(75)
    }

    set({ resolvingDieIndex: null, resolvingPhase: null })

    // ── Venom check (Act 2) ──────────────────────────────────────────────
    const _venomLimit2 = getVenomLimit(get().currentFloor)
    if (_venomLimit2 !== null && get().playedDice.length > _venomLimit2) {
      const _penalty2 = getVenomPenalty(get().currentFloor)
      set((st) => ({
        player: { ...st.player, poison: st.player.poison + _penalty2 },
        playerHitVersion: st.playerHitVersion + 1,
      }))
      await sleep(150)
    }

    if (newSkullCount >= 3) {
      set((st) => ({
        totalDamage: 0, totalHeal: 0, totalSouls: 0, totalPoison: 0,
        pendingHot: null,
        counterVersion: st.counterVersion + 1,
      }))
      await sleep(300)

      const bustShield = get().totalShield
      const boneLedgerShield = hasRelic(get(), 'bone_ledger') ? 6 : 0
      set((st) => ({
        turnPhase: 'player_attack',
        totalShield: 0,
        player: { ...st.player, shield: st.player.shield + bustShield + boneLedgerShield },
        ...(boneLedgerShield > 0 ? {
          lastRelicTrigger: relicTrigger(st, 'bone_ledger', '+6 Shield', { value: 6, kind: 'shield' }),
          lastEffects: { heal: 0, shield: boneLedgerShield, souls: 0, hot: null },
          playerEffectVersion: st.playerEffectVersion + 1,
        } : {}),
      }))
      await sleep(400)

      const bustDied2 = await applyBustPoisonTick()
      if (bustDied2) { await handleBustEnemyVictory() } else { await runEnemyPhase({ allowIronMemory: false }) }
      return
    }

    // Chained Fortune Teller: drawn die itself is a choose_next — start a fresh sequence
    if (face.type === 'choose_next' && get().drawPile.length > 0) {
      const picks   = Math.min(chooseNextPickCount(face, mult2), get().drawPile.length)
      set({ turnPhase: 'idle', isChoosingNextDie: true, fortuneTellerPicksRemaining: picks, activeMultiplier: 1 })
      return
    }

    const picksLeft = get().fortuneTellerPicksRemaining
    if (picksLeft > 1 && get().drawPile.length > 0) {
      set({ turnPhase: 'idle', isChoosingNextDie: true, fortuneTellerPicksRemaining: picksLeft - 1 })
    } else {
      set({ turnPhase: 'idle', fortuneTellerPicksRemaining: 0 })
    }
  },

  bankAndAttack: async () => {
    if (get().turnPhase !== 'idle') return

    // Discard any dangling multiplier — it only applies within the same turn
    set({ activeMultiplier: 1 })

    const { totalDamage, totalHeal, totalShield, totalSouls, totalPoison, pendingHot, enemy, player,
            currentFloor, inventory, unlockedNodes, firstAttackThisEncounter, playedDice, activeRelics } = get()

    // First Blood: +1 damage on first bank of each encounter
    const firstBloodBonus = (unlockedNodes.includes('g1atjka6') && firstAttackThisEncounter) ? 1 : 0
    const carefulRhythmActive = activeRelics.includes('careful_rhythm') && playedDice.length === 4
    const carefulRhythmDamage = carefulRhythmActive ? 5 : 0
    const carefulRhythmShield = carefulRhythmActive ? 5 : 0
    const effectiveDamage = totalDamage + firstBloodBonus + carefulRhythmDamage
    if (firstAttackThisEncounter) set({ firstAttackThisEncounter: false })

    // Calculate max potential damage for animation tier
    let maxPotentialDamage = 0
    for (const die of inventory) {
      const maxDmg = die.faces
        .filter((f) => f.type === 'damage' || f.type === 'lifesteal')
        .reduce((m, f) => Math.max(m, f.value), 0)
      maxPotentialDamage += maxDmg
    }
    let tier: 1 | 2 | 3 = 1
    if (maxPotentialDamage > 0) {
      const pct = (effectiveDamage / maxPotentialDamage) * 100
      if (pct > 70) tier = 3
      else if (pct > 30) tier = 2
    }

    // Start attack animation phase — damage is NOT applied yet
    set({ turnPhase: 'player_attack', playerAttackAnimTier: tier, isChoosingNextDie: false })
    await sleep(800)

    // Apply damage after animation window (enemy shield absorbs first)
    const enemyShieldAbsorb = Math.min(enemy.shield ?? 0, effectiveDamage)
    let newEnemyHp    = Math.max(0, enemy.hp - (effectiveDamage - enemyShieldAbsorb))
    let newEnemyShield = Math.max(0, (enemy.shield ?? 0) - enemyShieldAbsorb)
    let newPlayerHp   = Math.min(player.maxHp, player.hp + totalHeal)
    let newShield     = player.shield + totalShield + carefulRhythmShield
    const committedHot = pendingHot ? addHot(player.hot, pendingHot.amount, pendingHot.turnsRemaining) : player.hot

    set((st) => ({
      playerAttackAnimTier: null,
      enemy:  { ...st.enemy,  hp: newEnemyHp, shield: newEnemyShield },
      player: {
        ...st.player,
        hp: newPlayerHp,
        shield: newShield,
        hot: committedHot,
      },
      lastEffects: { heal: totalHeal, shield: totalShield + carefulRhythmShield, souls: totalSouls, hot: pendingHot ? committedHot : null },
      playerEffectVersion: st.playerEffectVersion + 1,
      ...(carefulRhythmActive ? { lastRelicTrigger: relicTrigger(st, 'careful_rhythm', '+5 Damage / +5 Shield') } : {}),
    }))

    // Thorns / Barbs recoil — only when enemy survived the hit, poison exempt
    if (newEnemyHp > 0) {
      const dmgFaces     = playedDice.filter(d => d.currentFace?.type === 'damage').length
      const thornsRecoil = Math.floor(effectiveDamage * (enemy.thorns ?? 0))
      const barbsRecoil  = dmgFaces * (enemy.barbs ?? 0)
      const totalRecoil  = thornsRecoil + barbsRecoil
      if (totalRecoil > 0) {
        const shieldAbsorb = Math.min(newShield, totalRecoil)
        newShield   = newShield - shieldAbsorb
        newPlayerHp = Math.max(0, newPlayerHp - (totalRecoil - shieldAbsorb))
        set((st) => ({
          player: { ...st.player, hp: newPlayerHp, shield: newShield },
          playerHitVersion: st.playerHitVersion + 1,
        }))
        await sleep(300)
        if (newPlayerHp <= 0) {
          const snap = get()
          if (snap.unlockedNodes.includes('7nescabs') && !snap.usedSecondWind) {
            const allB = [...ACT_1_BESTIARY, ...ACT_2_BESTIARY]
            const tmpl = allB.find(t => t.name === snap.enemy.name) ?? ACT_1_BESTIARY[1]
            const nxPh = (snap.enemy.intentPhase ?? 0) + 1
            const nxIn = rollIntent(tmpl, currentFloor, nxPh)
            set((st) => ({
              player: { ...st.player, hp: 20, shield: 0 },
              usedSecondWind: true, secondWindTriggered: true,
              turnPhase: 'idle',
              totalDamage: 0, totalHeal: 0, totalShield: 0, totalSouls: 0, totalPoison: 0, pendingHot: null,
              skullCount: 0,
              drawPile: shuffleArray(equippedOnly(st.inventory)),
              playedDice: [], lastEffects: { heal: 0, shield: 0, souls: 0 },
              resolvingDieIndex: null, resolvingPhase: null,
              rollStartVersion: st.rollStartVersion + 1,
              isChoosingNextDie: false, firstAttackThisEncounter: true,
              relicTurnFlags: freshRelicTurnFlags(),
              enemy: { ...st.enemy, intent: nxIn, intentPhase: nxPh, thorns: tmpl.thorns ?? 0 },
            }))
          } else {
            set({
              ...clearRelicRunState,
              showGameOver: true, runSouls: 0,
              player: { hp: 100, maxHp: 100, shield: 0, hot: null, poison: 0, woundTurns: 0 },
              enemy: spawnEnemy(1), currentFloor: 1,
              totalDamage: 0, totalHeal: 0, totalShield: 0, totalSouls: 0, totalPoison: 0, pendingHot: null,
              skullCount: 0,
              inventory: INITIAL_INVENTORY.map(d => ({ ...d })),
              drawPile: [], playedDice: [],
              lastEffects: { heal: 0, shield: 0, souls: 0 },
              resolvingDieIndex: null, resolvingPhase: null,
              draftChoices: [], lastSoulsEarned: 0,
              isChoosingNextDie: false, turnPhase: 'loadout',
            })
          }
          return
        }
      }
    }

    if (newEnemyHp <= 0) {
      await sleep(450)

      // Double K.O.: player also at 0 — defeat takes priority over victory
      if (newPlayerHp <= 0) {
        set({
          ...clearRelicRunState,
          showGameOver: true,
          runSouls: 0,
          player: { hp: 100, maxHp: 100, shield: 0, hot: null, poison: 0, woundTurns: 0 },
          enemy: spawnEnemy(1),
          currentFloor: 1,
          totalDamage: 0, totalHeal: 0, totalShield: 0, totalSouls: 0, totalPoison: 0, pendingHot: null,
          skullCount: 0,
          inventory: INITIAL_INVENTORY.map((d) => ({ ...d })),
          drawPile: [], playedDice: [],
          lastEffects: { heal: 0, shield: 0, souls: 0 },
          resolvingDieIndex: null, resolvingPhase: null,
          draftChoices: [], lastSoulsEarned: 0,
          isChoosingNextDie: false,
          turnPhase: 'loadout',
        })
        return
      }

      const isBossFloor = currentFloor % 5 === 0
      const bountyBonus = (unlockedNodes.includes('r9v5wdgh') && isBossFloor) ? 10 : 0
      const actFloor    = currentFloor > 15 ? currentFloor - 15 : currentFloor
      const earned      = actFloor + 12 + totalSouls + bountyBonus

      // Thick Skin: heal 15% of max HP after defeating a boss
      const thickSkinHeal = (isBossFloor && unlockedNodes.includes('aw2b29dw'))
        ? Math.floor(player.maxHp * 0.15) : 0

      if (isBossFloor && currentFloor === 15) {
        // Act 1 → Act 2 transition: bank all souls, enter culling phase
        set((st) => ({
          bankedSouls: st.bankedSouls + st.runSouls + earned,
          runSouls: 0,
          lastSoulsEarned: earned,
          turnPhase: 'inter_act_cull',
          player: { ...st.player, hp: Math.min(st.player.maxHp, st.player.hp + thickSkinHeal), shield: 0, hot: null, woundTurns: 0 },
          totalDamage: 0, totalHeal: 0, totalShield: 0, totalSouls: 0, totalPoison: 0, pendingHot: null,
          skullCount: 0,
          drawPile: [], playedDice: [],
          lastEffects: { heal: 0, shield: 0, souls: 0 },
          resolvingDieIndex: null, resolvingPhase: null,
          justDefeatedBoss: false,
        }))
      } else if (isBossFloor) {
        const curseId = uid()
        set((st) => ({
          inventory: [...st.inventory, { ...createDie('cursed', curseId), isEquipped: true as const }],
          runSouls: st.runSouls + earned,
          lastSoulsEarned: earned,
          turnPhase: 'shop',
          justDefeatedBoss: true,
          showBossRewardModal: true,
          showRelicRewardModal: false,
          relicRewardContext: 'boss',
          relicChoices: chooseRelics(st.activeRelics),
          purifyUsesThisShop: 0,
          player: { ...st.player, hp: Math.min(st.player.maxHp, st.player.hp + thickSkinHeal), hot: null, woundTurns: 0 },
          totalDamage: 0, totalHeal: 0, totalShield: 0, totalSouls: 0, totalPoison: 0, pendingHot: null,
          skullCount: 0,
          drawPile: [], playedDice: [],
          lastEffects: { heal: 0, shield: 0, souls: 0 },
          resolvingDieIndex: null, resolvingPhase: null,
        }))
      } else {
        const { lockedDraftDice, inventory } = get()
        const lockedTypes   = new Set(lockedDraftDice.map((d) => d.dieType))
        const ownedUniques  = new Set(inventory.filter((d) => UNIQUE_DIE_TYPES.has(d.dieType)).map((d) => d.dieType))
        const slotsToFill = 3 - lockedDraftDice.length
        const pool    = getDiceLootPool(currentFloor).filter((t) => !lockedTypes.has(t) && !ownedUniques.has(t))
        const newDice = shuffleArray([...pool])
                          .slice(0, slotsToFill)
                          .map((t) => createDie(t, uid()))
        const choices = [...lockedDraftDice, ...newDice]
        set((st) => ({
          runSouls: st.runSouls + earned,
          lastSoulsEarned: earned,
          draftChoices: choices,
          lockedDraftDice: [],
          rerollCost: 5,
          turnPhase: 'draft',
          player: { ...st.player, hot: null, woundTurns: 0 },
          totalDamage: 0, totalHeal: 0, totalShield: 0, totalSouls: 0, totalPoison: 0, pendingHot: null,
          skullCount: 0,
          drawPile: [], playedDice: [],
          lastEffects: { heal: 0, shield: 0, souls: 0 },
          resolvingDieIndex: null, resolvingPhase: null,
        }))
      }
      return
    }

    // ── Poison tick (before enemy attacks) ──────────────────────────────
    const stackedPoison = enemy.poison + totalPoison
    set((st) => ({ enemy: { ...st.enemy, poison: stackedPoison } }))

    if (stackedPoison > 0) {
      const postPoisonHp = Math.max(0, newEnemyHp - stackedPoison)
      set((st) => ({
        enemy: { ...st.enemy, hp: postPoisonHp },
        enemyHitVersion: st.enemyHitVersion + 1,
      }))
      await sleep(350)

      if (postPoisonHp <= 0) {
        await sleep(100)

        // Double K.O.: player also at 0 — defeat takes priority
        if (newPlayerHp <= 0) {
          set({
            ...clearRelicRunState,
            showGameOver: true,
            runSouls: 0,
            player: { hp: 100, maxHp: 100, shield: 0, hot: null, poison: 0, woundTurns: 0 },
            enemy: spawnEnemy(1),
            currentFloor: 1,
            totalDamage: 0, totalHeal: 0, totalShield: 0, totalSouls: 0, totalPoison: 0, pendingHot: null,
            skullCount: 0,
            inventory: INITIAL_INVENTORY.map((d) => ({ ...d })),
            drawPile: [], playedDice: [],
            lastEffects: { heal: 0, shield: 0, souls: 0 },
            resolvingDieIndex: null, resolvingPhase: null,
            draftChoices: [], lastSoulsEarned: 0,
            isChoosingNextDie: false,
            turnPhase: 'loadout',
          })
          return
        }

        const isBossFloorP = currentFloor % 5 === 0
        const bountyBonusP = (unlockedNodes.includes('r9v5wdgh') && isBossFloorP) ? 10 : 0
        const actFloorP    = currentFloor > 15 ? currentFloor - 15 : currentFloor
        const earnedP      = actFloorP + 12 + totalSouls + bountyBonusP
        const thickSkinP   = (isBossFloorP && unlockedNodes.includes('aw2b29dw'))
          ? Math.floor(player.maxHp * 0.15) : 0

        if (isBossFloorP && currentFloor === 15) {
          // Act 1 → Act 2 transition: bank all souls, enter culling phase
          set((st) => ({
            bankedSouls: st.bankedSouls + st.runSouls + earnedP,
            runSouls: 0,
            lastSoulsEarned: earnedP,
            turnPhase: 'inter_act_cull',
            player: { ...st.player, hp: Math.min(st.player.maxHp, st.player.hp + thickSkinP), shield: 0, hot: null, woundTurns: 0 },
            totalDamage: 0, totalHeal: 0, totalShield: 0, totalSouls: 0, totalPoison: 0, pendingHot: null,
            skullCount: 0,
            drawPile: [], playedDice: [],
            lastEffects: { heal: 0, shield: 0, souls: 0 },
            resolvingDieIndex: null, resolvingPhase: null,
            justDefeatedBoss: false,
          }))
        } else if (isBossFloorP) {
          const curseId = uid()
          set((st) => ({
            inventory: [...st.inventory, { ...createDie('cursed', curseId), isEquipped: true as const }],
            runSouls: st.runSouls + earnedP,
            lastSoulsEarned: earnedP,
            turnPhase: 'shop',
            justDefeatedBoss: true,
            showBossRewardModal: true,
            showRelicRewardModal: false,
            relicRewardContext: 'boss',
            relicChoices: chooseRelics(st.activeRelics),
            purifyUsesThisShop: 0,
            player: { ...st.player, hp: Math.min(st.player.maxHp, st.player.hp + thickSkinP), hot: null, woundTurns: 0 },
            totalDamage: 0, totalHeal: 0, totalShield: 0, totalSouls: 0, totalPoison: 0, pendingHot: null,
            skullCount: 0,
            drawPile: [], playedDice: [],
            lastEffects: { heal: 0, shield: 0, souls: 0 },
            resolvingDieIndex: null, resolvingPhase: null,
          }))
        } else {
          const { lockedDraftDice, inventory: inv } = get()
          const lockedTypesP  = new Set(lockedDraftDice.map((d) => d.dieType))
          const ownedUniquesP = new Set(inv.filter((d) => UNIQUE_DIE_TYPES.has(d.dieType)).map((d) => d.dieType))
          const slotsP  = 3 - lockedDraftDice.length
          const poolP   = getDiceLootPool(currentFloor).filter((t) => !lockedTypesP.has(t) && !ownedUniquesP.has(t))
          const newDiceP = shuffleArray([...poolP]).slice(0, slotsP).map((t) => createDie(t, uid()))
          set((st) => ({
            runSouls: st.runSouls + earnedP,
            lastSoulsEarned: earnedP,
            draftChoices: [...lockedDraftDice, ...newDiceP],
            lockedDraftDice: [],
            rerollCost: 5,
            turnPhase: 'draft',
            player: { ...st.player, hot: null, woundTurns: 0 },
            totalDamage: 0, totalHeal: 0, totalShield: 0, totalSouls: 0, totalPoison: 0, pendingHot: null,
            skullCount: 0,
            drawPile: [], playedDice: [],
            lastEffects: { heal: 0, shield: 0, souls: 0 },
            resolvingDieIndex: null, resolvingPhase: null,
          }))
        }
        return
      }

      // Decay: reduce stack by 1
      set((st) => ({ enemy: { ...st.enemy, poison: Math.max(0, stackedPoison - 1) } }))
    }

    // Credit accumulated souls before runEnemyPhase clears it
    if (totalSouls > 0) {
      set((st) => ({ runSouls: st.runSouls + totalSouls }))
    }

    await sleep(400)
    await runEnemyPhase()
  },

  selectDraftDie: (dieId, lockedOtherIds) => {
    const { draftChoices, inventory, currentFloor } = get()
    const chosen = draftChoices.find((d) => d.id === dieId)
    if (!chosen) return
    const lockedUnselected = draftChoices.filter((d) => d.id !== dieId && lockedOtherIds.includes(d.id))
    const nextFloor = currentFloor + 1
    const newEnemy  = spawnEnemy(nextFloor)
    const chosenWithEquip = { ...chosen, isEquipped: true as const }
    const newInv    = [...inventory, chosenWithEquip]
    set((s) => ({
      inventory:    newInv,
      currentFloor: nextFloor,
      enemy:        newEnemy,
      player:       { ...s.player, shield: 0, hot: null, woundTurns: 0 },
      draftChoices: [],
      lockedDraftDice: lockedUnselected,
      drawPile:     shuffleArray(equippedOnly(newInv)),
      playedDice:   [],
      skullCount:   0,
      totalDamage: 0, totalHeal: 0, totalShield: 0, totalSouls: 0, totalPoison: 0, pendingHot: null,
      lastEffects:  { heal: 0, shield: 0, souls: 0 },
      resolvingDieIndex: null, resolvingPhase: null,
      rollStartVersion: s.rollStartVersion + 1,
      isChoosingNextDie: false,
      firstAttackThisEncounter: true,
      relicTurnFlags: freshRelicTurnFlags(),
      turnPhase:    'idle',
    }))
  },

  claimBossReward: () => {
    const choices = get().relicChoices
    set({
      showBossRewardModal: false,
      showRelicRewardModal: choices.length > 0,
      relicRewardContext: choices.length > 0 ? 'boss' : null,
    })
  },

  claimRelic: (relicId, replaceId) => {
    if (!RELIC_POOL.includes(relicId)) return
    set((s) => {
      if (s.activeRelics.includes(relicId)) {
        return { showRelicRewardModal: false, relicChoices: [], relicRewardContext: null }
      }
      let nextRelics = s.activeRelics
      if (replaceId && s.activeRelics.includes(replaceId)) {
        nextRelics = s.activeRelics.map((id) => id === replaceId ? relicId : id)
      } else if (s.activeRelics.length < MAX_RELICS) {
        nextRelics = [...s.activeRelics, relicId]
      } else {
        return {}
      }
      return {
        activeRelics: nextRelics,
        showRelicRewardModal: false,
        relicChoices: [],
        relicRewardContext: null,
      }
    })
  },

  skipRelicReward: () => {
    set({ showRelicRewardModal: false, relicChoices: [], relicRewardContext: null })
  },

  claimActIntro: () => { set({ showActIntroModal: false }) },

  rerollDraft: (lockedDieIds) => {
    const { runSouls, rerollCost, draftChoices, inventory, currentFloor } = get()
    if (runSouls < rerollCost) return
    const lockedDice   = draftChoices.filter((d) => lockedDieIds.includes(d.id))
    const lockedTypes  = new Set(lockedDice.map((d) => d.dieType))
    const ownedUniques = new Set(inventory.filter((d) => UNIQUE_DIE_TYPES.has(d.dieType)).map((d) => d.dieType))
    const slotsToFill = 3 - lockedDice.length
    const pool    = getDiceLootPool(currentFloor).filter((t) => !lockedTypes.has(t) && !ownedUniques.has(t))
    const newDice = shuffleArray([...pool]).slice(0, slotsToFill).map((t) => createDie(t, uid()))
    set((s) => ({
      runSouls: s.runSouls - rerollCost,
      rerollCost: s.rerollCost + 5,
      draftChoices: [...lockedDice, ...newDice],
    }))
  },

  skipDraft: () => {
    const { inventory, currentFloor } = get()
    const nextFloor = currentFloor + 1
    const newEnemy  = spawnEnemy(nextFloor)
    set((s) => ({
      runSouls:     s.runSouls + 3,
      currentFloor: nextFloor,
      enemy:        newEnemy,
      player:       { ...s.player, shield: 0, hot: null, woundTurns: 0 },
      draftChoices: [],
      drawPile:     shuffleArray(equippedOnly(inventory)),
      playedDice:   [],
      skullCount:   0,
      totalDamage: 0, totalHeal: 0, totalShield: 0, totalSouls: 0, totalPoison: 0, pendingHot: null,
      lastEffects:  { heal: 0, shield: 0, souls: 0 },
      resolvingDieIndex: null, resolvingPhase: null,
      rollStartVersion: s.rollStartVersion + 1,
      isChoosingNextDie: false,
      firstAttackThisEncounter: true,
      relicTurnFlags: freshRelicTurnFlags(),
      turnPhase:    'idle',
    }))
  },

  shopHeal: (cost, amount) => {
    set((s) => {
      if (s.runSouls < cost || s.player.hp >= s.player.maxHp) return {}
      return {
        runSouls: s.runSouls - cost,
        player: { ...s.player, hp: Math.min(s.player.maxHp, s.player.hp + amount) },
      }
    })
  },

  shopModifyFace: (dieId, faceIndex, newFace, cost) => {
    set((s) => {
      if (s.runSouls < cost) return {}
      const isPurify = cost === 20
      if (isPurify && s.purifyUsesThisShop >= 3) return {}
      const newInventory = s.inventory.map((d) => {
        if (d.id !== dieId) return d
        return { ...d, faces: d.faces.map((f, i) => (i === faceIndex ? newFace : f)) }
      })
      return {
        runSouls: s.runSouls - cost,
        inventory: newInventory,
        ...(isPurify ? { purifyUsesThisShop: s.purifyUsesThisShop + 1 } : {}),
      }
    })
  },

  shopMergeDice: (die1Id, die2Id, cost) => {
    set((s) => {
      if (s.runSouls < cost) return {}
      const die1 = s.inventory.find((d) => d.id === die1Id)
      const die2 = s.inventory.find((d) => d.id === die2Id)
      if (!die1 || !die2) return {}
      if (die1.dieType === 'cursed' || die2.dieType === 'cursed') return {}
      if (NON_MERGEABLE_DIE_TYPES.has(die1.dieType) || NON_MERGEABLE_DIE_TYPES.has(die2.dieType)) return {}
      if (UNIQUE_DIE_TYPES.has(die1.dieType) || UNIQUE_DIE_TYPES.has(die2.dieType)) return {}
      const level1 = die1.mergeLevel ?? 0
      const level2 = die2.mergeLevel ?? 0
      if (level1 !== level2) return {}
      const bothJokers = die1.dieType === 'joker' && die2.dieType === 'joker'
      const jokerMerge = die1.dieType === 'joker' || die2.dieType === 'joker'
      if (!jokerMerge && die1.dieType !== die2.dieType) return {}
      if (bothJokers) {
        const newInventory = s.inventory
          .filter((d) => d.id !== die2Id)
          .map((d) => d.id !== die1Id ? d : { ...d, isMerged: true, mergeLevel: level1 + 1 })
        return { runSouls: s.runSouls - cost, inventory: newInventory }
      }
      // die1Id is always the first die the player selected — that is the Host.
      // Exception: if die1 is a Joker, the non-Joker is the Host (Joker is always material).
      const hostId     = die1.dieType === 'joker' ? die2Id : die1Id
      const materialId = die1.dieType === 'joker' ? die1Id : die2Id
      const newInventory = s.inventory
        .filter((d) => d.id !== materialId)
        .map((d) => {
          if (d.id !== hostId) return d
          return {
            ...d,
            isMerged: true,
            mergeLevel: level1 + 1,
            faces: d.faces.map(scaleFaceForMerge),
          }
        })
      return { runSouls: s.runSouls - cost, inventory: newInventory }
    })
  },

  shopCraftFace: (dieId, faceIndex, newFace, cost) => {
    set((s) => {
      if (s.runSouls < cost) return {}
      const newInventory = s.inventory.map((d) => {
        if (d.id !== dieId) return d
        const craftedFace = d.dieType === 'vessel'
          ? { ...newFace, craftLevel: d.mergeLevel ?? 0 }
          : newFace
        const craftedDie = {
          ...d,
          isCustomized: true,
          faces: d.faces.map((f, i) => (i === faceIndex ? craftedFace : f)),
        }
        return temperVesselAfterCraft(craftedDie)
      })
      return { runSouls: s.runSouls - cost, inventory: newInventory }
    })
  },

  shopPurifyFace: (dieId, faceIndex, cost) => {
    set((s) => {
      if (s.runSouls < cost || s.purifyUsesThisShop >= 3) return {}
      const newInventory = s.inventory.map((d) => {
        if (d.id !== dieId) return d
        return {
          ...d,
          isCustomized: true,
          faces: d.faces.map((f, i) => {
            if (i !== faceIndex) return f
            return f.type === 'skull'
              ? { type: 'purified_skull' as const, value: 0 }
              : { type: 'blank' as const, value: 0 }
          }),
        }
      })
      return { runSouls: s.runSouls - cost, inventory: newInventory, purifyUsesThisShop: s.purifyUsesThisShop + 1 }
    })
  },

  shopStabilizeSkull: (cost) => {
    set((s) => {
      if (s.runSouls < cost) return {}
      const targets = s.inventory.flatMap((die) =>
        die.dieType === 'cursed'
          ? []
          : die.faces
              .map((face, faceIndex) => face.type === 'skull' ? { dieId: die.id, faceIndex } : null)
              .filter((target): target is { dieId: string; faceIndex: number } => target !== null)
      )
      if (targets.length === 0) return {}
      const target = targets[Math.floor(Math.random() * targets.length)]
      return {
        runSouls: s.runSouls - cost,
        inventory: s.inventory.map((die) => {
          if (die.id !== target.dieId) return die
          return {
            ...die,
            isCustomized: true,
            faces: die.faces.map((face, index) =>
              index === target.faceIndex ? { type: 'blank' as const, value: 0 } : face
            ),
          }
        }),
      }
    })
  },

  extractToBase: () => {
    const { runSouls } = get()
    set((s) => ({
      bankedSouls: s.bankedSouls + runSouls,
      runSouls: 0,
      player: { hp: 100, maxHp: 100, shield: 0, hot: null, poison: 0, woundTurns: 0 },
      enemy: spawnEnemy(1),
      currentFloor: 1,
      drawPile: [], playedDice: [],
      skullCount: 0,
      totalDamage: 0, totalHeal: 0, totalShield: 0, totalSouls: 0, totalPoison: 0, pendingHot: null,
      lastEffects: { heal: 0, shield: 0, souls: 0 },
      resolvingDieIndex: null, resolvingPhase: null,
      draftChoices: [], lockedDraftDice: [], lastSoulsEarned: 0,
      isChoosingNextDie: false,
      usedSecondWind: false,
      firstAttackThisEncounter: true,
      rerollCost: 5,
      justDefeatedBoss: false,
      secondWindTriggered: false,
      showBossRewardModal: false,
      ...clearRelicRunState,
      showActIntroModal: false,
      purifyUsesThisShop: 0,
      turnPhase: 'loadout',
    }))
  },

  cullInventory: (selectedIds: string[]) => {
    const { inventory, player, rollStartVersion } = get()
    const selected = selectedIds
      .map((id) => inventory.find((d) => d.id === id))
      .filter((d): d is Die => d !== undefined)
      .map((d) => ({ ...d, isEquipped: true as const }))
    const curses = Array.from({ length: 3 }, () => ({
      ...createDie('cursed', uid()),
      isEquipped: true as const,
    }))
    const newInventory = [...selected, ...curses]
    set({
      inventory: newInventory,
      currentFloor: 16,
      turnPhase: 'idle',
      enemy: spawnEnemy(16),
      player: { ...player, shield: 0, hot: null, woundTurns: 0 },
      drawPile: shuffleArray(newInventory),
      playedDice: [],
      skullCount: 0,
      totalDamage: 0, totalHeal: 0, totalShield: 0, totalSouls: 0, totalPoison: 0, pendingHot: null,
      lastEffects: { heal: 0, shield: 0, souls: 0 },
      resolvingDieIndex: null, resolvingPhase: null,
      draftChoices: [], lockedDraftDice: [], lastSoulsEarned: 0,
      isChoosingNextDie: false,
      fortuneTellerPicksRemaining: 0,
      activeMultiplier: 1,
      firstAttackThisEncounter: true,
      relicTurnFlags: freshRelicTurnFlags(),
      justDefeatedBoss: false,
      showActIntroModal: true,
      rollStartVersion: rollStartVersion + 1,
    })
  },

  abandonRun: () => {
    set({
      player: { hp: 100, maxHp: 100, shield: 0, hot: null, poison: 0, woundTurns: 0 },
      enemy: spawnEnemy(1),
      currentFloor: 1,
      totalDamage: 0, totalHeal: 0, totalShield: 0, totalSouls: 0, totalPoison: 0, pendingHot: null,
      skullCount: 0,
      inventory: INITIAL_INVENTORY.map((d) => ({ ...d })),
      drawPile: [], playedDice: [],
      lastEffects: { heal: 0, shield: 0, souls: 0 },
      resolvingDieIndex: null, resolvingPhase: null,
      draftChoices: [], lastSoulsEarned: 0,
      runSouls: 0,
      isChoosingNextDie: false,
      usedSecondWind: false,
      firstAttackThisEncounter: true,
      playerAttackAnimTier: null,
      ...clearRelicRunState,
      showActIntroModal: false,
      turnPhase: 'loadout',
    })
  },

  devJumpToForge: () => {
    const { unlockedNodes } = get()
    const vitI   = unlockedNodes.includes('fyuwvmzq') ? 10 : 0
    const vitII  = unlockedNodes.includes('co2xusrh') ? 15 : 0
    const baseHp = 100 + vitI + vitII

    const randomPool = shuffleArray([...GLOBAL_DICE_POOL, ...ACT_1_DICE_POOL]).slice(0, 3)
    const baseTypes: DieType[] = ['white', 'blue', 'green', 'white']
    const regularDice: Die[] = [...baseTypes, ...randomPool].map((type) => ({
      ...createDie(type, uid()),
      isEquipped: true as const,
    }))
    const cursedDice: Die[] = Array.from({ length: 3 }, () => ({
      ...createDie('cursed', uid()),
      isEquipped: true as const,
    }))
    const inventory: Die[] = [...cursedDice, ...regularDice]

    set((s) => ({
      turnPhase:    'idle',
      player:       { hp: baseHp, maxHp: baseHp, shield: 0, hot: null, poison: 0, woundTurns: 0 },
      inventory,
      runSouls:     25,
      currentFloor: 7,
      enemy:        spawnEnemy(7),
      drawPile:     shuffleArray(inventory),
      playedDice:   [],
      skullCount:   0,
      totalDamage: 0, totalHeal: 0, totalShield: 0, totalSouls: 0, totalPoison: 0, pendingHot: null,
      lastEffects:  { heal: 0, shield: 0, souls: 0 },
      rollStartVersion: s.rollStartVersion + 1,
      resolvingDieIndex: null, resolvingPhase: null,
      draftChoices: [], lockedDraftDice: [], lastSoulsEarned: 0,
      isChoosingNextDie: false,
      usedSecondWind: false,
      firstAttackThisEncounter: true,
      rerollCost: 5,
      justDefeatedBoss: false,
      secondWindTriggered: false,
      showBossRewardModal: false,
      ...clearRelicRunState,
      showActIntroModal: false,
      purifyUsesThisShop: 0,
      activeMultiplier: 1,
    }))
  },

  unlockNode: (nodeId) => {
    const { bankedSouls, unlockedNodes } = get()
    const node = SKILL_TREE_NODES.find((n) => n.id === nodeId)
    if (!node || bankedSouls < node.cost || unlockedNodes.includes(nodeId)) return
    set((s) => ({
      bankedSouls:     s.bankedSouls - node.cost,
      unlockedNodes: [...s.unlockedNodes, nodeId],
    }))
  },

  leaveShop: () => {
    const { currentFloor } = get()
    const nextFloor = currentFloor + 1
    const newEnemy  = spawnEnemy(nextFloor)
    set((s) => ({
      currentFloor: nextFloor,
      enemy:        newEnemy,
      player:       { ...s.player, shield: 0, hot: null, woundTurns: 0 },
      drawPile:     shuffleArray(equippedOnly(s.inventory)),
      playedDice:   [],
      skullCount:   0,
      totalDamage: 0, totalHeal: 0, totalShield: 0, totalSouls: 0, totalPoison: 0, pendingHot: null,
      lastEffects:  { heal: 0, shield: 0, souls: 0 },
      resolvingDieIndex: null, resolvingPhase: null,
      rollStartVersion: s.rollStartVersion + 1,
      isChoosingNextDie: false,
      firstAttackThisEncounter: true,
      relicTurnFlags: freshRelicTurnFlags(),
      turnPhase:    'idle',
    }))
  },

  toggleAutoBankDevMode: () => set(s => ({ isAutoBankDevMode: !s.isAutoBankDevMode })),
    }),
    {
      name: 'dice-dungeon-save',
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<GameState> | undefined
        const mergedUnlocks = Array.from(new Set([
          ...STARTING_UNLOCKED_NODE_IDS,
          ...(persisted?.unlockedNodes ?? []),
        ]))
        return {
          ...currentState,
          bankedSouls: persisted?.bankedSouls ?? currentState.bankedSouls,
          unlockedNodes: mergedUnlocks,
        }
      },
      partialize: (state) => ({ bankedSouls: state.bankedSouls, unlockedNodes: state.unlockedNodes }),
    }
  )
)

// Extracted enemy phase — shared by bankAndAttack and bust
async function runEnemyPhase({ allowIronMemory = true }: { allowIronMemory?: boolean } = {}) {
  // Tick HoT before enemy acts
  const curHot = useGameStore.getState().player.hot
  if (curHot !== null) {
    const pl     = useGameStore.getState().player
    const hotHeal = applyWoundToHeal(curHot.amount, pl.woundTurns)
    const newHp  = Math.min(pl.maxHp, pl.hp + hotHeal)
    const actualHeal = Math.max(0, newHp - pl.hp)
    const pulseShield = actualHeal > 0 && hasRelic(useGameStore.getState(), 'verdant_pulse') ? actualHeal : 0
    const newTurns = curHot.turnsRemaining - 1
    const newHot: { amount: number; turnsRemaining: number } | null = newTurns > 0
      ? { amount: curHot.amount, turnsRemaining: newTurns }
      : null
    useGameStore.setState((st) => ({
      player: { ...st.player, hp: newHp, hot: newHot, shield: st.player.shield + pulseShield },
      playerEffectVersion: st.playerEffectVersion + 1,
      ...(pulseShield > 0 ? { lastRelicTrigger: relicTrigger(st, 'verdant_pulse', `+${pulseShield} Shield`) } : {}),
    }))
    await sleep(200)
  }

  const { enemy, player, currentFloor, activeRelics } = useGameStore.getState()

  // ── Non-attack intents (shield buff, thorns activation) ──────────────────
  if (enemy.intent.type === 'shield' || enemy.intent.type === 'thorns_activate' || enemy.intent.type === 'wound') {
    useGameStore.setState((st) => {
      const updatedEnemy = enemy.intent.type === 'shield'
        ? { ...st.enemy, shield: (st.enemy.shield ?? 0) + enemy.intent.value }
        : enemy.intent.type === 'thorns_activate'
          ? { ...st.enemy, thorns: enemy.intent.value }
          : st.enemy
      const updatedPlayer = enemy.intent.type === 'wound'
        ? { ...st.player, woundTurns: Math.max(st.player.woundTurns, enemy.intent.value) }
        : st.player
      return {
        turnPhase: 'enemy_attack',
        enemyAttackVersion: st.enemyAttackVersion + 1,
        playerHitVersion: enemy.intent.type === 'wound' ? st.playerHitVersion + 1 : st.playerHitVersion,
        enemy: updatedEnemy,
        player: updatedPlayer,
      }
    })
    await sleep(450)
    useGameStore.setState((s) => {
      const allB = [...ACT_1_BESTIARY, ...ACT_2_BESTIARY]
      const tmpl = allB.find(t => t.name === s.enemy.name) ?? ACT_1_BESTIARY[1]
      const nxPh = (s.enemy.intentPhase ?? 0) + 1
      const nxIn = rollIntent(tmpl, currentFloor, nxPh)
      const carriedShield = carryShieldAfterTurn(s.player.shield, s.activeRelics, allowIronMemory)
      return {
        turnPhase: 'idle',
        totalDamage: 0, totalHeal: 0, totalShield: 0, totalSouls: 0, totalPoison: 0, pendingHot: null,
        skullCount: 0,
        drawPile: shuffleArray(equippedOnly(s.inventory)),
        playedDice: [],
        lastEffects: { heal: 0, shield: 0, souls: 0 },
        player: {
          ...s.player,
          shield: carriedShield,
          woundTurns: enemy.intent.type === 'wound' ? s.player.woundTurns : Math.max(0, s.player.woundTurns - 1),
        },
        enemy: { ...s.enemy, intent: nxIn, intentPhase: nxPh },
        rollStartVersion: s.rollStartVersion + 1,
        isChoosingNextDie: false,
        firstAttackThisEncounter: true,
        relicTurnFlags: freshRelicTurnFlags(),
        ...(carriedShield > 0 ? { lastRelicTrigger: relicTrigger(s, 'iron_memory', `${carriedShield} Shield kept`) } : {}),
        resolvingDieIndex: null, resolvingPhase: null,
      }
    })
    return
  }

  // ── Attack intent ────────────────────────────────────────────────────────
  const eShield   = player.shield
  const shieldSlamBonus = enemy.intent.type === 'shield_slam' ? (enemy.shield ?? 0) : 0
  const rawDamage = enemy.intent.value + shieldSlamBonus
  const retaliationDamage = activeRelics.includes('retaliation_plate') &&
    enemy.intent.type !== 'corrosive_strike' && !enemy.corrosive && rawDamage > 0 && eShield >= rawDamage
      ? Math.ceil(rawDamage * 0.5)
      : 0
  let postHp: number
  let postShield: number
  if (enemy.corrosive || enemy.intent.type === 'corrosive_strike') {
    // Corrosive: hits shield and HP simultaneously — shields provide no protection
    postHp    = Math.max(0, player.hp - rawDamage)
    postShield = Math.max(0, eShield - rawDamage)
  } else {
    const absorbed = Math.min(eShield, rawDamage)
    postHp    = Math.max(0, player.hp - (rawDamage - absorbed))
    postShield = eShield - absorbed
  }

  useGameStore.setState((st) => ({
    turnPhase: 'enemy_attack',
    enemyAttackVersion: st.enemyAttackVersion + 1,
  }))

  await sleep(240)

  useGameStore.setState((st) => ({
    player: { ...st.player, hp: postHp, shield: postShield },
    enemy: enemy.intent.type === 'shield_slam' ? { ...st.enemy, shield: 0 } : st.enemy,
    playerHitVersion: st.playerHitVersion + 1,
  }))

  await sleep(210)

  if (retaliationDamage > 0) {
    const postRetaliationHp = Math.max(0, useGameStore.getState().enemy.hp - retaliationDamage)
    useGameStore.setState((st) => ({
      enemy: { ...st.enemy, hp: postRetaliationHp },
      enemyHitVersion: st.enemyHitVersion + 1,
      lastRelicTrigger: relicTrigger(st, 'retaliation_plate', `${retaliationDamage} Counter`, {
        value: retaliationDamage,
        kind: 'damage',
      }),
    }))
    await sleep(260)
    if (postRetaliationHp <= 0) {
      await handleBustEnemyVictory()
      return
    }
  }

  // ── Tick player Venom poison (after physical damage, before death check) ──
  const _playerPoison = useGameStore.getState().player.poison
  if (_playerPoison > 0) {
    const _afterPoisonHp = Math.max(0, postHp - _playerPoison)
    useGameStore.setState((st) => ({
      player: { ...st.player, hp: _afterPoisonHp, poison: Math.max(0, st.player.poison - 1) },
      playerHitVersion: st.playerHitVersion + 1,
    }))
    await sleep(200)
    postHp = _afterPoisonHp
  }

  if (postHp <= 0) {
    const snap = useGameStore.getState()
    if (snap.unlockedNodes.includes('7nescabs') && !snap.usedSecondWind) {
      useGameStore.setState((st) => ({
        player: { ...st.player, hp: 20, shield: 0 },
        usedSecondWind: true,
        secondWindTriggered: true,
        turnPhase: 'idle',
        totalDamage: 0, totalHeal: 0, totalShield: 0, totalSouls: 0, totalPoison: 0, pendingHot: null,
        skullCount: 0,
        drawPile: shuffleArray(equippedOnly(st.inventory)),
        playedDice: [],
        lastEffects: { heal: 0, shield: 0, souls: 0 },
        resolvingDieIndex: null, resolvingPhase: null,
        rollStartVersion: st.rollStartVersion + 1,
        isChoosingNextDie: false,
        firstAttackThisEncounter: true,
        relicTurnFlags: freshRelicTurnFlags(),
        enemy: (() => {
          const allB = [...ACT_1_BESTIARY, ...ACT_2_BESTIARY]
          const tmpl = allB.find(t => t.name === st.enemy.name) ?? ACT_1_BESTIARY[1]
          const nxPh = (st.enemy.intentPhase ?? 0) + 1
          const nxIn = rollIntent(tmpl, st.currentFloor, nxPh)
          return { ...st.enemy, intent: nxIn, intentPhase: nxPh, thorns: tmpl.thorns ?? 0 }
        })(),
      }))
      return
    }
    useGameStore.setState({
      ...clearRelicRunState,
      showGameOver: true,
      runSouls: 0,
      player: { hp: 100, maxHp: 100, shield: 0, hot: null, poison: 0, woundTurns: 0 },
      enemy: spawnEnemy(1),
      currentFloor: 1,
      totalDamage: 0, totalHeal: 0, totalShield: 0, totalSouls: 0, totalPoison: 0, pendingHot: null,
      skullCount: 0,
      inventory: INITIAL_INVENTORY.map((d) => ({ ...d })),
      drawPile: [], playedDice: [],
      lastEffects: { heal: 0, shield: 0, souls: 0 },
      resolvingDieIndex: null, resolvingPhase: null,
      draftChoices: [], lastSoulsEarned: 0,
      isChoosingNextDie: false,
      turnPhase: 'loadout',
    })
  } else {
    useGameStore.setState((s) => ({
      turnPhase: 'idle',
      totalDamage: 0, totalHeal: 0, totalShield: 0, totalSouls: 0, totalPoison: 0, pendingHot: null,
      skullCount: 0,
      drawPile: shuffleArray(equippedOnly(s.inventory)),
      playedDice: [],
      lastEffects: { heal: 0, shield: 0, souls: 0 },
      player: { ...s.player, shield: carryShieldAfterTurn(s.player.shield, s.activeRelics, allowIronMemory), woundTurns: Math.max(0, s.player.woundTurns - 1) },
      enemy: (() => {
        const allB = [...ACT_1_BESTIARY, ...ACT_2_BESTIARY]
        const tmpl = allB.find(t => t.name === s.enemy.name) ?? ACT_1_BESTIARY[1]
        const nxPh = (s.enemy.intentPhase ?? 0) + 1
        const nxIn = rollIntent(tmpl, currentFloor, nxPh)
        return { ...s.enemy, intent: nxIn, intentPhase: nxPh, thorns: tmpl.thorns ?? 0 }
      })(),
      rollStartVersion: s.rollStartVersion + 1,
      isChoosingNextDie: false,
      firstAttackThisEncounter: true,
      relicTurnFlags: freshRelicTurnFlags(),
      ...(carryShieldAfterTurn(s.player.shield, s.activeRelics, allowIronMemory) > 0
        ? { lastRelicTrigger: relicTrigger(s, 'iron_memory', `${carryShieldAfterTurn(s.player.shield, s.activeRelics, allowIronMemory)} Shield kept`) }
        : {}),
      resolvingDieIndex: null, resolvingPhase: null,
    }))
  }
}

// Applies the existing enemy poison stack during a bust turn. Returns true if the enemy died.
async function applyBustPoisonTick(): Promise<boolean> {
  const { enemy } = useGameStore.getState()
  if (enemy.poison <= 0) return false
  const postHp = Math.max(0, enemy.hp - enemy.poison)
  useGameStore.setState((st) => ({
    enemy: { ...st.enemy, hp: postHp },
    enemyHitVersion: st.enemyHitVersion + 1,
  }))
  await sleep(350)
  useGameStore.setState((st) => ({ enemy: { ...st.enemy, poison: Math.max(0, enemy.poison - 1) } }))
  return postHp <= 0
}

// Handles the victory state transition when enemy dies during a bust poison tick.
async function handleBustEnemyVictory() {
  const { currentFloor, unlockedNodes, inventory, player, lockedDraftDice } = useGameStore.getState()
  const isBossFloor  = currentFloor % 5 === 0
  const bountyBonus  = (unlockedNodes.includes('r9v5wdgh') && isBossFloor) ? 10 : 0
  const actFloor     = currentFloor > 15 ? currentFloor - 15 : currentFloor
  const earned       = actFloor + 12 + bountyBonus
  const thickSkin    = (isBossFloor && unlockedNodes.includes('aw2b29dw'))
    ? Math.floor(player.maxHp * 0.15) : 0
  const resetFields = {
    totalDamage: 0, totalHeal: 0, totalShield: 0, totalSouls: 0, totalPoison: 0, pendingHot: null,
    skullCount: 0, drawPile: [] as Die[], playedDice: [] as Die[],
    lastEffects: { heal: 0, shield: 0, souls: 0 },
    resolvingDieIndex: null as null, resolvingPhase: null as null,
  }

  if (isBossFloor && currentFloor === 15) {
    useGameStore.setState((st) => ({
      ...resetFields,
      bankedSouls: st.bankedSouls + st.runSouls + earned,
      runSouls: 0, lastSoulsEarned: earned,
      turnPhase: 'inter_act_cull',
      player: { ...st.player, hp: Math.min(st.player.maxHp, st.player.hp + thickSkin), shield: 0, hot: null, woundTurns: 0 },
      justDefeatedBoss: false,
    }))
  } else if (isBossFloor) {
    const curseId = uid()
    useGameStore.setState((st) => ({
      ...resetFields,
      inventory: [...st.inventory, { ...createDie('cursed', curseId), isEquipped: true as const }],
      runSouls: st.runSouls + earned, lastSoulsEarned: earned,
      turnPhase: 'shop', justDefeatedBoss: true, showBossRewardModal: true,
      showRelicRewardModal: false, relicRewardContext: 'boss', relicChoices: chooseRelics(st.activeRelics),
      purifyUsesThisShop: 0,
      player: { ...st.player, hp: Math.min(st.player.maxHp, st.player.hp + thickSkin), hot: null, woundTurns: 0 },
    }))
  } else {
    const lockedTypes   = new Set(lockedDraftDice.map((d) => d.dieType))
    const ownedUniques  = new Set(inventory.filter((d) => UNIQUE_DIE_TYPES.has(d.dieType)).map((d) => d.dieType))
    const slots         = 3 - lockedDraftDice.length
    const pool          = getDiceLootPool(currentFloor).filter((t) => !lockedTypes.has(t) && !ownedUniques.has(t))
    const newDice       = shuffleArray([...pool]).slice(0, slots).map((t) => createDie(t, uid()))
    useGameStore.setState((st) => ({
      ...resetFields,
      runSouls: st.runSouls + earned, lastSoulsEarned: earned,
      draftChoices: [...lockedDraftDice, ...newDice],
      lockedDraftDice: [], rerollCost: 5, turnPhase: 'draft',
      player: { ...st.player, hot: null, woundTurns: 0 },
    }))
  }
}
