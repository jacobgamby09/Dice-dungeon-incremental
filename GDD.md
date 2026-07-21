# Dice Dungeon — Game Design Document

## 1. Core Vision

**Dice Dungeon** is a mobile-first **Extraction Runner Bag-Builder**. The player assembles a bag of dice at the Hub, then descends into a procedural dungeon to fight enemies and accumulate **Run Souls**. After each floor they face a critical decision: push deeper for greater rewards, or **Flee the Depths** to safely bank what they've earned. Each Act introduces new enemy mechanics that demand strategic adaptation — not just raw power.

### Core Loop

```
Hub / Base
  ↓
Build Loadout (equip dice from personal collection)
  ↓
Enter Dungeon
  ↓
  ┌─ Combat (Push-Your-Luck — draw, roll, bank)
  │    ↓ Victory
  ├─ Draft (choose a new die to add to the bag)
  │    ↓
  └─ The Forge (merge / craft / purify — spend Run Souls)
       ↓
  *** CRUCIAL DECISION ***
  ├─ [FLEE THE DEPTHS] → Safely bank Run Souls → Return to Hub
  └─ [PUSH DEEPER]     → Next floor (greater rewards, greater risk)
```

### Risk & Reward

| Outcome | Effect |
|---------|--------|
| **Flee the Depths** | All Run Souls gathered this delve are converted to **Banked Souls** |
| **Die in combat** | **100% of Run Souls** gathered this delve are lost |
| **Complete a boss floor** | Significant Run Soul bonus; forced Cursed die added to bag |

The extraction decision is the spine of the game. Knowing when to leave is as important as knowing how to fight.

---

## 2. Economy — Souls

There is a single unified currency: **Souls**.

| Type | Description | How Earned | How Spent |
|------|-------------|------------|-----------|
| **Run Souls** | Risk currency; held in-run, lost on death | Defeating enemies, souls die faces, boss bonuses | The Forge (merge, craft, purify, heal) |
| **Banked Souls** | Safe currency; stored at the Hub permanently | Surviving a delve (Flee the Depths) | Hub meta-progression Skill Tree |

Run Souls become Banked Souls only when the player successfully extracts. Dying forfeits all Run Souls accrued during that delve.

---

## 3. The Loadout & Bag-Building System

### Philosophy: Classless by Design

There are no starter classes. Build identity comes entirely from the dice in the bag. Two players on Floor 1 can have completely different strategies.

### Loadout Screen (Hub)

Before descending, the player selects their **Start Bag** on the Loadout screen.

- **Bag Capacity:** `maxEquippedDice` dice (default: 10) for the Start Bag.
- **Infinite Base Pool:** The player always has access to the three base dice types:
  - **The Basic** (white) — pure damage
  - **The Guard** (blue) — shield + light damage
  - **The Mender** (green) — heal + light damage
- **Personal Collection:** Dice acquired or upgraded in previous runs appear in a reserve zone and can be swapped into the bag.
- **Cursed Dice:** Cannot be unequipped. Permanent fixtures for the duration of a run.

### In-Run Bag Growth

Once combat begins, the bag is uncapped:

- **Draft rewards** after non-boss encounters add one new die directly to the active bag.
- **Boss rewards** force a Cursed die into the bag.
- **Forge purchases** enter the bag immediately.

---

## 4. Combat Mechanics

### Turn Sequence

1. **Shuffle:** All equipped dice are shuffled into a `drawPile`.
2. **Draw & Roll:** The player draws and rolls one die at a time. Results (Damage, Shield, Heal, Souls, Poison, or special) accumulate in the turn pool.
3. **The Bust Mechanic:** Rolling **3 Skulls** in a single turn causes a **BUST**:
   - Accumulated Damage and Heal reset to 0 (Shield and Poison stack persist).
   - The enemy immediately attacks.
4. **Bank & Attack:** The player stops drawing. All accumulated stats are applied and the turn passes to the enemy.
5. **Enemy Phase:** The enemy performs its displayed Intent. Damage is applied against the player's current Shield, then HP. Then all active Poison ticks (see §5.2).

### Face Types

| Face | Effect |
|------|--------|
| Damage | Added to attack power for the turn |
| Shield | Absorbs incoming enemy damage this turn |
| Heal | Restores player HP (up to max) |
| Souls | Adds Run Souls immediately |
| Skull | Increments the bust counter (3 = BUST) |
| Purified Skull | Inert — a Skull neutralised at the Forge |
| Blank | No combat effect. A prime Forge target — can be crafted into any face type |
| Lifesteal | Deals damage AND heals the player for the same amount |
| Poison | Adds to the `totalPoison` accumulator; applied to the enemy at bank |
| HoT | Applies Healing over Time: heals `amount` HP at the start of each enemy phase for `duration` turns. Multiple HoT rolls combine into a single decaying stack (amount and duration both sum) |
| Choose Next | Opens a picker — player manually selects the next die drawn from the bag |
| Mirror ★ | Re-executes the face of the previously-played die (scaled by current `activeMultiplier`). Does nothing as the first die drawn this turn |
| Multiplier ★ | Multiplicatively increases `activeMultiplier` (base ×2; stacks ×2 → ×4 → ×8). The next die rolled applies its effect × that value. Resets at bank |
| Seal | Retroactively removes up to N skull-faced dice from the already-played pile this turn, shuffling them back into the draw pile without a resolved face. Does nothing if no skulls have been played yet. Scales with `activeMultiplier`. A `triggered` flag records whether any skulls were present to remove. Cannot be crafted |
| Shield Bash | Adds damage equal to current Shield plus Shield accumulated this turn. Does not spend Shield. Scales with `activeMultiplier`. Cannot be crafted |

> **Note on Wildcard:** The Joker die has `wildcard` faces, but this face type has **no combat resolution** — The Joker is exclusively a **Forge catalyst** (universal merge material). Drawing it in combat produces no effect.

### The Multiplier ★ — Special Rules

- `activeMultiplier` resets to 1 at the start of each `bankAndAttack`. A Multiplier die played as the last die in a turn is discarded — it does not carry over.
- During Auto-Roll, the auto-roller stops automatically when The Multiplier is drawn, forcing a manual decision.
- Multiplier stacking is **multiplicative**: ×2 → ×2 → ×4 (rolling the face a second time doubles again, not adds).

---

## 5. Acts & Enemy Modifiers

The dungeon is divided into Acts. Each Act introduces mechanics that punish naive strategies and demand adaptation.

### Act 1 — The Brute Tunnels (Floors 1–15)

**Modifier:** None  
**Length:** 15 floors. **Floor 15 is the Act Boss.**

The baseline Act. Any strategy is viable. Players learn push-your-luck tension and draft fundamentals without special pressure.

### Act 1 → Act 2 Transition: The Culling

Beating the Act 1 Boss triggers a forced extraction — the player's `runSouls` are automatically banked. There is **no shop** and **no opportunity to buy new dice** during this transition. What follows is a pure culling ritual:

| Step | Rule |
|------|------|
| **Extraction** | All Run Souls from the Act 1 run are safely converted to Banked Souls. |
| **Cull your bag** | The player typically has ~15 dice from Act 1. They must choose exactly **7 non-Cursed dice** to carry into Act 2. Existing Cursed dice are automatically excluded and cannot be selected. The rest are discarded permanently for this run. |
| **The Curses** | Three new Cursed dice (Skull × 6) are **forcefully added** to the bag — no choice, no opt-out. |
| **Act 2 Start** | The player enters Floor 16 with exactly **10 dice** (7 chosen + 3 Cursed). An **Act 2 intro modal** is shown before the first floor, introducing Venom, the boss rotation, and the new dice pool. |

The culling forces the player to commit to an identity built in Act 1. Hedging every strategy is no longer possible.

### Act 2 — The Spiked Depths (Floors 16–30)

**Modifier:** Venom + Boss Mechanics

#### Act 2 Intro Modal

After The Culling and before Floor 16, the game displays an **Act 2 Intro Modal** introducing Venom, the new dice pool, and the boss's four-phase rotation.

#### Venom — Primary Act 2 Modifier

Drawing too many dice in a single turn stacks Poison on the player. The safe draw limit is **5 draws on all Act 2 floors**. Each die drawn beyond the limit adds **+1 player poison** (floors 16–25) or **+2 player poison** (floors 26–30). Player poison ticks once per turn after the enemy's physical attack resolves, then decrements by 1. The draw button turns red and shows a warning label (`☠ DRAW +N VENOM`) when the next draw will trigger Venom. A styled draw counter (`X / Y draws`) is shown above the action buttons on all Act 2 floors with a hover tooltip.

**Strategic implication:** Reckless bag-emptying is punished. Players must find the sweet spot — draw enough to deal meaningful damage without stacking lethal Venom.

#### Normal Act 2 Enemies

Normal enemies (Slime Crawler, Marrow Bat, Toxic Creep) are plain attackers — **no Thorns, Barbs, or Corrosive**. Their pressure is delivered entirely through Venom (overdrawing) rather than combat traits.

#### The Spiked Behemoth (Act 2 Boss — Floors 20, 25, 30)

The boss follows a fixed **4-step intent cycle**, floor-scaled from Floor 20 as a base:

| Step | Intent | Base Value | Scaling |
|------|--------|------------|---------|
| 1 | Shield | 5 | +0.5 per floor above 20 (F25 ≈ 8, F30 ≈ 10) |
| 2 | Attack | 14 | Standard Act 2 floor scaling |
| 3 | Thorns Activate | 30% | +4% per floor above 20, cap 90% (F25 ≈ 50%, F30 ≈ 70%) |
| 4 | Corrosive Strike | 7 | Standard Act 2 floor scaling; bypasses Shield entirely |

- **Thorns Activate:** Sets the boss's Thorns % for the following player attack turn. Reflected damage bypasses the player's shield.
- **Corrosive Strike:** Damage hits both HP and Shield simultaneously — shield provides no protection.
- Thorns persists until the player's next bank-and-attack, then resets to 0.

---

## 5.2 Poison — Status Effect

Poison is a delayed-damage status that bypasses shields entirely.

| Property | Rule |
|----------|------|
| **Source** | Player: Poison die faces. Enemy: Venom overdraw (Act 2 — ticks after enemy attack). |
| **Application** | At `bankAndAttack`, the player's accumulated `totalPoison` is added to the enemy's `poison` stack (and vice versa for the player). |
| **Tick** | During the Enemy Phase, after the enemy's physical attack resolves, all active Poison stacks tick — dealing that many HP of unblockable damage. |
| **Decay** | After ticking, the Poison stack decreases by 1 each turn. It does not reset to 0. |
| **Death check** | If a Poison tick reduces HP to 0, it counts as a kill (full victory resolution applies). |

### The Blight — Player Counterplay Die

| Property | Value |
|----------|-------|
| Die type | `blight` |
| Bag colour | Toxic green (`#4d7c0f`) |
| Faces | Poison 1 / Poison 2 / Poison 2 / Shield 2 / Skull / Skull |
| Role | Slow but unblockable damage engine; bypasses even heavily shielded enemies |
| Synergies | Pairs with sustain dice (Paladin, Priest, Vampire) to outlast enemies while Poison stacks accumulate |

---

## 6. The Forge

After each boss floor, players visit **The Forge** — a shop where **Run Souls** are spent to upgrade and customise dice.

### Merge

Combine two dice of the same type and merge level into one more powerful die.

- Non-Skull/Blank/Purified faces scale by ×3 per merge level.
- Merge Level is displayed as **+1**, **+2**, **+3**.
- **The Joker** can merge with any die (Joker is consumed; the host die levels up).
- Cursed dice, Unique (★) dice, and **The Vessel** cannot be merged. The Vessel exists as a pure Forge crafting substrate — all 6 faces are Blank and intended to be Crafted. The Rejuvenator can be merged, but merge only scales HoT amount, not HoT duration.

### Craft

Pay to overwrite a specific face on any die with a chosen face type.

- Marks the die as `isCustomized = true`.
- Customised faces survive through subsequent merges.

### Purify

Pay to neutralise a Skull face, converting it to a Purified Skull (inert) or Blank.

- Capped at 3 Purify uses per Forge visit.
- Purified Skull renders as a struck-through skull icon.

### Heal

Spend Run Souls to restore HP (up to max).

---

## 7. Dice Catalogue

### Base Dice (Always Available — Not in Draft Pools)

These are available in infinite supply from the Loadout screen. They are never offered in draft rewards.

| Die | Faces |
|-----|-------|
| The Basic (white) | 1 / 2 / 3 / 4 / 5 / 6 Damage |
| The Guard (blue) | 1 / 2 / 3 / 4 Shield, 1 / 2 Damage |
| The Mender (green) | 1 / 2 / 3 Heal, 1 / 2 / 3 Damage |
| The Cursed | Skull × 6 — forced into bag by boss floors and The Culling; cannot be removed or unequipped |

### Global Draft Pool (Both Acts)

| Die | Notable Faces | Role |
|-----|---------------|------|
| The Heavy | 4 / 6 / 7 / 9 Damage, Skull × 2 | Spike damage; high bust risk |
| The Scavenger | Souls × 2, Shield × 3, Skull | Economy + light defence |
| The Wall | Shield 2–6 × 6 | Turtle strategy; zero offence |
| The Gambler | 12 Damage × 2, Blank × 2, Skull × 2 | Boom-or-bust; dangerous during boss Thorns turns |
| The Joker | Wildcard × 6 | **Forge catalyst only** — universal merge material; Wildcard faces do nothing in combat |
| The Vessel | Blank × 6 | Pure Forge substrate — 6 craftable blank faces; cannot be merged |
| The Warden | Seal × 2, Shield 2, Shield 3, Damage 1, Skull × 1 | Retroactive skull control; Seal trades a face slot against the skulls already played this turn |
| The Bulwark | Shield 2, Shield 3, Shield Bash × 3, Skull × 1 | Shield combo die; Shield Bash adds damage equal to current Shield without spending that Shield |

### Act 1 Draft Pool (Floors 1–15 only)

| Die | Notable Faces | Role |
|-----|---------------|------|
| The Paladin | Shield + Heal only | Pure sustain; zero offence |
| The Vampire | Lifesteal 1–4 × 4, Skull × 1 | Sustain through offence |
| The Rejuvenator | HoT 1/2 × 2, HoT 2/1, Shield 2, Blank × 2 | Stacking Healing over Time with craftable blanks; merge scales HoT amount only |
| The Mirror ★ | Mirror × 6 | Re-executes previous die's face; powerful with Multiplier; useless as first draw |

### Act 2 Draft Pool (Floors 16–30 only)

| Die | Notable Faces | Role |
|-----|---------------|------|
| The Blight | Poison 1, Poison 2 × 2, Shield 2, Skull × 2 | Unblockable damage; bypasses shielded enemies |
| The Fortune Teller | Choose Next × 4, Skull × 2 | Full bag control — pick draws manually |
| The Priest | Heal 1–4 × 6 | Pure healing engine |
| The Multiplier ★ | ×2 × 6 | Multiplicatively scales the next die's output |
| The Jackpot | 30 Damage × 1, Skull × 3, Blank × 2 | Massive spike; dangerous during boss Thorns turns |

> **Unique (★) dice:** The Mirror and The Multiplier are unique — only one of each can exist in the bag at a time. Unique dice cannot be merged.

> **Blank faces:** No combat effect, but an ideal Forge crafting target. Gambler and Jackpot blanks are effectively "free customisation slots" waiting to be crafted into whatever the build needs.

---

## 8. Run Progression

### Floors & Enemies

Enemies appear sequentially per floor. Boss fights occur every 5 floors (Floors 5, 10, 15, 20, 25, 30…). Floor 15 is the Act 1 Boss and triggers the Act 1 → Act 2 transition. Stats scale with floor number.

| Enemy | Base HP | Intent |
|-------|---------|--------|
| Slime | 28 | 2–4 damage |
| Goblin | 42 | 4–6 damage |
| Skeleton | 50 | 3–7 damage |
| Orc | 60 | 6–9 damage |
| Demon (Boss) | Scales | Heavy damage; forces Cursed die into bag |

### Draft Rewards (Non-Boss)

- Three dice from the loot pool are offered.
- Player picks one; it joins the active bag immediately.
- Unwanted choices can be **locked** to carry forward to the next draft.
- **Re-roll** spends Run Souls (cost increases: +5 per reroll).

### Boss Rewards

- A Cursed die is forced into the bag.
- The player chooses one run-only Relic reward (or replaces/skips if all 3 slots are full).
- The player enters the Forge.
- The extraction decision follows.

---

## 9. Relics

Relics are run-only passive modifiers that sit between dice and meta-progression. They are meant to create run-defining wrinkles without permanently solving the game. Relics are **not persisted** between delves.

### Acquisition

| Moment | Rule |
|--------|------|
| Start of run | After descending, choose 1 of 3 relics before the first combat turn. |
| Boss reward | After the Cursed die reward modal and before The Forge, choose 1 of 3 relics. |
| Slots full | Max 3 active relics. A new relic must replace an active relic or be skipped. |

### Current Relic Pool

| Relic | Effect |
|-------|--------|
| Bone Ledger | When you bust, gain +6 Shield before the enemy attacks. |
| Black Candle | The first Skull rolled each turn applies +1 Poison to the enemy. |
| Banish | The first Skull rolled each turn is returned to the bag and does not count toward bust. |
| Iron Memory | After the enemy acts, keep 50% of unused Shield for the next turn. |
| Verdant Pulse | Whenever HoT actually heals you, gain Shield equal to the HP healed. |
| Retaliation Plate | If Shield fully blocks an enemy attack, deal damage equal to 50% of that attack. |
| Empty Promise | The first Blank rolled each turn gives +6 Shield. |
| Careful Rhythm | If you Attack after drawing exactly 4 dice, gain +5 Damage and +5 Shield before resolving. |

---

## 10. Meta-Progression (Skill Tree)

Between delves, players spend **Banked Souls** on permanent passive upgrades. Nodes are organised into **4 named tracks** (plus a root node), each with a distinct colour and lane in the tree UI.

| Track | Colour | Theme |
|-------|--------|-------|
| Extraction | Purple | Flee/push economy |
| Forge | Orange | Crafting identity |
| Survival | Green | Resilience to push deeper |
| Control | Blue | Information and draft manipulation |

### Fully Functional Nodes

| Node | Track | Effect |
|------|-------|--------|
| Pocket Change | Extraction | Start each delve with bonus Run Souls |
| Bounty Hunter | Extraction | Bosses drop bonus Run Souls |
| Haggler | Forge | Heal at Forge costs fewer Souls |
| Forge Master | Forge | Merge costs fewer Souls |
| Vitality I | Survival | +10 Max HP |
| Vitality II | Survival | +15 Max HP |
| Thick Skin | Survival | Heal 15% Max HP after defeating a boss |
| Second Wind | Survival | Once per delve, revive with 20 HP instead of dying |
| First Blood | Survival | First attack each encounter deals +1 Damage |
| Sharpened Edges | Survival | White dice: 1-damage faces become 2-damage |
| Scouting | Control | Always see which dice remain in the bag |
| Auto Roll | Control | Auto-draws dice until 2 Skulls are rolled |

### Demo / Conceptual Nodes (Non-Functional)

The following nodes are **visible in the UI with real Banked Soul costs** but their described effects are not implemented. They exist to validate the 4-track structure and explore potential design space.

| Node | Track | Described Effect |
|------|-------|-----------------|
| Soul Stash | Extraction | Carry over a portion of unspent Run Souls between floors |
| Deep Pockets | Extraction | Increase Run Souls cap |
| Blank Canvas | Forge | Start each run with one extra blank-faced die |
| First Craft | Forge | First Forge craft each run is free |
| Draft Lock+ | Control | Carry forward 2 draft locks instead of 1 |
| Reroll Insight | Control | See what a rerolled draft would offer before committing |

### "New Dice" Nodes (Non-Functional)

Four nodes (New Dice: The Priest, The Jackpot, The Vampire, The Fortune Teller) exist in the skill tree UI but **do not gate their dice** — those dice appear in their respective act draft pools regardless of whether the node is unlocked. Wiring these to pool gating is an open design question (see §Open Design Questions).

### QoL Policy

Auto Roll and Scouting are talent unlocks — players earn them by spending Banked Souls. Pure QoL features (dice inspect, dice library, face descriptions) are **never talent-gated** and are always available to all players.

---

## 11. Technical Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite (TypeScript, strict mode) |
| State | Zustand 5 with `persist` middleware |
| Animations | Framer Motion |
| Icons | lucide-react |
| Styling | Inline styles (mobile-portrait, pixel-art aesthetic) |
| Platform | Mobile-first web app (384px max-width) |

### Persistence

Only `bankedSouls` and `unlockedNodes` are persisted between sessions. All run state (bag, floor, run souls, enemy, etc.) is ephemeral — lost on death, converted on extraction.

### Key Data Structures

```typescript
interface DieFace {
  type:
    | 'damage' | 'shield' | 'heal' | 'skull' | 'souls'
    | 'lifesteal' | 'choose_next' | 'wildcard'
    | 'blank' | 'purified_skull' | 'multiplier' | 'poison'
    | 'hot' | 'mirror' | 'seal' | 'shield_bash'
  value: number
  duration?: number        // HoT only: how many turns the heal ticks
  triggered?: boolean      // Seal only: true if at least one skull was removed
}

interface Die {
  id: string
  dieType: DieType
  name: string            // Display name — sourced from DIE_NAMES in gameStore
  sides: number
  faces: DieFace[]
  currentFace?: DieFace
  isMerged?: boolean
  mergeLevel?: number     // 0 = base, 1/2/3 = merged
  isCustomized?: boolean  // true if any face was Crafted
  isEquipped?: boolean    // undefined | true = in active bag; false = in reserve
}

interface EnemyIntent {
  type: 'attack' | 'shield' | 'thorns_activate' | 'corrosive_strike'
  value: number
}

interface Enemy {
  hp: number
  maxHp: number
  name: string
  intent: EnemyIntent
  isBoss: boolean
  poison: number          // Active poison stacks; ticks each enemy phase, decays by 1
  thorns?: number         // % of player damage reflected; set by thorns_activate intent
  shield?: number         // Enemy's current shield (boss only)
  intentPhase?: number    // Index into intentCycle for boss rotation
}

// 'thorns' is the stored modifier value; Venom is implemented separately via floor checks
type ActModifier = 'none' | 'thorns' | 'damage_cap'

interface GameState {
  // Combat
  player: {
    hp: number; maxHp: number; shield: number
    hot: { amount: number; turnsRemaining: number } | null  // HoT stack; ticks each enemy phase; scales with activeMultiplier
    poison: number                                           // Player Venom stacks
  }
  pendingHot: { amount: number; turnsRemaining: number } | null  // HoT buffered during turn; applied at bankAndAttack; bust clears it
  enemy: Enemy
  turnPhase: 'loadout' | 'idle' | 'drawing' | 'player_attack' | 'enemy_attack' | 'draft' | 'shop'

  // Bag
  inventory: Die[]         // All dice owned this run
  drawPile: Die[]          // Equipped dice remaining this turn
  playedDice: Die[]        // Dice drawn and resolved this turn
  maxEquippedDice: number  // Start-bag capacity (Loadout screen cap only)

  // Turn accumulators
  skullCount: number
  totalDamage: number
  totalShield: number
  totalHeal: number
  totalSouls: number       // Run Souls earned via die faces this turn
  totalPoison: number      // Poison stacked this turn; applied to enemy at bank
  activeMultiplier: number // Resets to 1 on bankAndAttack and each die resolution

  // Progression
  currentFloor: number
  runSouls: number         // Total Run Souls held this delve
  draftChoices: Die[]

  // Relics (run-only, not persisted)
  activeRelics: RelicId[]
  relicChoices: RelicId[]
  showRelicRewardModal: boolean
  relicRewardContext: 'start' | 'boss' | null

  // Meta (persisted)
  bankedSouls: number      // Safe, permanent — persisted between sessions
  unlockedNodes: string[]
}

interface SkillNode {
  id: string
  label: string
  description: string
  cost: number
  requires?: string        // id of prerequisite node
  track?: 'root' | 'extraction' | 'forge' | 'survival' | 'control'
}
```

---

## 12. Visual Style

### Aesthetic

Retro pixel-art with modern UI animation. Hard edges, no border-radius, chunky `box-shadow` offsets, dark colour palette.

### Die Type Colour Palette

| Die | Background | Accent |
|-----|-----------|--------|
| The Basic (white) | `#d1d5db` | `#6b7280` |
| The Guard (blue) | `#1e40af` | `#1e3a8a` |
| The Mender (green) | `#16a34a` | `#14532d` |
| The Cursed | `#6d28d9` | `#4c1d95` |
| The Heavy | `#b91c1c` | `#7f1d1d` |
| The Paladin | `#d97706` | `#92400e` |
| The Gambler | `#0891b2` | `#0e7490` |
| The Scavenger | `#b45309` | `#78350f` |
| The Wall | `#374151` | `#1f2937` |
| The Jackpot | `#ca8a04` | `#713f12` |
| The Vampire | `#9d174d` | `#831843` |
| The Priest | `#0284c7` | `#075985` |
| The Fortune Teller | `#7c3aed` | `#4c1d95` |
| The Joker | `#0f766e` | `#134e4a` |
| The Rejuvenator | `#065f46` | `#022c22` |
| The Mirror ★ | `#1e3a5f` | `#0f2239` |
| The Multiplier ★ | `#4d7c0f` | `#1a2e05` |
| The Blight | `#4d7c0f` | `#1a2e05` |
| The Vessel | `#f8fafc` | `#64748b` |
| The Warden | `#1f2937` | `#b45309` |
| The Bulwark | `linear-gradient(135deg, #0f2747 0%, #1e3a8a 52%, #38bdf8 100%)` | `#0f172a` |

### Layout (Portrait, 384px max-width)

```
┌─────────────────────────┐
│  [Run Souls]   [Banked] │  ← Header HUD
├─────────────────────────┤
│       ENEMY ZONE        │  ← HP bar, intent, poison badge, sprite
├─────────────────────────┤
│    PLAYER STATS ZONE    │  ← HP, shield, damage total, stat badges
│  [♥ heal] [⬡ shield]   │
│  [$ souls] [☠ poison]  │
├─────────────────────────┤
│       DICE TRAY         │  ← playedDice (flex-wrap)
├─────────────────────────┤
│  [DRAW (N left)]        │  ← Primary action
│  [ATTACK!]              │  ← Commit action
└─────────────────────────┘
```

### Pixel Art Guidelines

- `image-rendering: pixelated` globally
- All fonts: pixel/monospace family
- Backgrounds: `#0a0a14`, `#1a1a2e`
- Shadows: hard 2–5px offsets (`box-shadow: 4px 4px 0 #000`)
- Animations: Framer Motion spring/ease for UI feedback only; no CSS transitions on layout
- Animated enemy sprites live in `public/sprites/enemies/<enemy>/` as horizontal PNG sheets (`Idle`, `Attack01`, `Hurt`, `Death`)
- Sprite sheets should use 100x100 frame cells, no magenta/chroma-key fringe, and stable feet/anchor positions across frames
- `EnemySprite.tsx` is authoritative for sheet config, crop, unit size, frame timing, and enemy-name mapping
- Current animated enemy set: Slime, Goblin, Skeleton, Orc, Demon

---

## 13. Open Design Questions

These decisions are open for playtesting or future design sessions. **Do not treat the following as implemented.**

| Question | Context |
|----------|---------|
| Is The Rejuvenator still too safe? | Retuned from 6 HoT faces to 3 HoT faces, Shield 2, and 2 Blanks. It can merge, but merge scales HoT amount only, not duration. Watch whether multiple copies still stack too easily. |
| Is the Mirror dead-weight dead-draw probability acceptable? | Mirror does nothing as the first die drawn. High variance but potentially too frustrating in Act 1. |
| Should Venom penalties be tightened? | Limit is fixed at 5 for all Act 2 floors; +1 early penalty may be too mild to deter greedy draws, while +2 from Floor 26 may be enough. |
| Should The Blight and The Multiplier share a colour palette? | Both use `#4d7c0f` — currently the code is this way but may need visual disambiguation. |
| Should Seal have a secondary effect when no skulls are present? | On early draws (no skulls in the played pile) Seal does nothing — it may feel like a dead face. A fallback (e.g. small shield) could reduce that feel. |
| Is Vessel draft value worth a slot in light-Forge runs? | A 6-blank die only pays off with regular Forge visits and available Run Souls. May feel like a wasted slot if the Forge is skipped. |
| Should demo talent nodes be hidden, greyed out, or labelled "Coming Soon"? | Players can see them and pay their real Banked Soul cost, but the effects do nothing — this may cause confusion or frustration. |
| Should "New Dice" skill tree nodes gate their dice? | Currently Priest, Jackpot, Fortune Teller always appear in Act 2; Vampire always in Act 1 — regardless of node unlock. Options: wire them, remove them, or formally replace with act-native gating. |
