# Dice Dungeon — Current Design State

*Last updated: 2026-05-12. Read this before making design or balance changes.*

---

## Current Focus

- Act 2 balance pass (fixed Venom limit, boss rotation feel, Forge economy)
- The Warden / Seal mechanic balance (how often Seal is useful vs. dead)
- The Bulwark / Shield Bash combo feel and visibility
- The Vessel as a Forge substrate — draft frequency and crafting identity
- Enemy sprite polish and animation anchoring (especially Goblin/Orc)
- Talent tree demo: validate 4-track structure and decide which demo nodes to implement
- Rejuvenator retune (3 HoT faces, Shield 2, 2 Blanks; merge scales HoT amount only, not duration)
- Relic MVP: run-only relic rewards, 3-slot cap, and skull-mitigation relic balance
- Mirror dead-first-draw problem (still unaddressed)

---

## Core Design Pillars

- Push-your-luck must matter every turn — drawing one extra die should always feel like a real risk.
- The extraction decision is the spine of the game; knowing when to flee is as important as knowing how to fight.
- Dice identity should matter more than raw stat scaling — each die should feel mechanically distinct.
- Act modifiers must force strategic adaptation, not just increase difficulty numbers.
- Souls-only economy: Run Souls are at-risk in-run, Banked Souls are permanent at the Hub.
- Mobile-first portrait UI (384 px max-width), pixel-art aesthetic, no border-radius.
- Double-KO / simultaneous death: player death always takes priority over victory.

---

## Implemented State

### Acts & Flow
- Act 1 (Floors 1–15): no modifier, full draft loop, boss on Floor 15.
- Act 1 Boss → The Culling: auto-banks Run Souls, player picks 7 dice from inventory (`InterActScreen.tsx`), 3 Cursed dice forced in.
- Act 2 (Floors 16–30): primary modifier is Venom (overdraw punishment). Normal enemies (Slime Crawler, Marrow Bat, Toxic Creep) are plain attackers — no thorns/barbs/corrosive. The Act 2 boss (Spiked Behemoth) runs a 4-step intent cycle: shield → attack → thorns_activate → corrosive_strike, all floor-scaled from Floor 20.
- **Act 2 intro modal:** Shown after The Culling, before Floor 16. Introduces Venom, the boss rotation, and the new Act 2 dice pool. (`showActIntroModal` flag; dismissed via `claimActIntro()`.)
- **The Culling:** Cursed dice are excluded from the selectable list (`cullableDice = inventory.filter(d => d.dieType !== 'cursed')`). 7 non-Cursed dice are chosen, then 3 new Cursed dice are added automatically.
- **Venom (Act 2):** Safe draw limit is 5 on all Act 2 floors. Each die over the limit adds player poison (+1 on floors 16–25; +2 on floors 26–30). Poison ticks after enemy physical attack, decrements by 1 per turn. Draw button turns red with warning label. Counter shown above action buttons on all Act 2 floors.
- Flee the Depths: banks Run Souls → returns to Hub.
- Death: all Run Souls lost.
- **Relics:** Run-only passive modifiers. Player chooses 1 relic before the first combat after descending, then can earn another relic after boss reward flow (after Cursed die modal, before Forge). Max 3 active relics, no duplicates; if slots are full, choosing a new relic requires replacing an active one or skipping. Relics are not persisted.

### Economy
- `runSouls` — at-risk in-run currency (spent at Forge, lost on death).
- `bankedSouls` — permanent meta-currency (spent on Skill Tree at Hub).
- Persisted state: `bankedSouls` + `unlockedNodes` only.

### Forge Actions
- Merge (two same-type + same-mergeLevel dice → one higher-level die).
- Craft (overwrite a specific face; marks `isCustomized`).
- Purify (skull → purified_skull; max 3 uses per Forge visit).
- Heal (spend Run Souls for HP).

### Dice Pool (as of this session)

**Base (Loadout only — not in any draft pool):**

| Die | Type |
|-----|------|
| The Basic | white |
| The Guard | blue |
| The Mender | green |
| The Cursed | cursed — forced on boss floors / The Culling |

**Global draft pool (both acts):**

| Die | Type | Notes |
|-----|------|-------|
| The Heavy | heavy | |
| The Scavenger | scavenger | |
| The Wall | wall | |
| The Gambler | gambler | |
| The Joker | joker | Forge catalyst only; Wildcard faces do nothing in combat |
| The Vessel | vessel | 6 × Blank — pure Forge substrate; cannot be merged |
| The Warden | warden | Seal ×2, Shield 2, Shield 3, Damage 1, Skull ×1 |
| The Bulwark | bulwark | Shield 2, Shield 3, Shield Bash ×3, Skull ×1 |

**Act 1 draft pool (floors 1–15):**

| Die | Type | Notes |
|-----|------|-------|
| The Paladin | paladin | |
| The Vampire | vampire | |
| The Rejuvenator | rejuvenator | HoT 1/2, HoT 1/2, HoT 2/1, Shield 2, Blank, Blank; merge scales HoT amount only |
| The Mirror ★ | mirror | Unique (one per run) |

**Act 2 draft pool (floors 16–30):**

| Die | Type | Notes |
|-----|------|-------|
| The Blight | blight | |
| The Fortune Teller | fortune_teller | |
| The Priest | priest | |
| The Multiplier ★ | unique | Unique (one per run) |
| The Jackpot | jackpot | |

`UNIQUE_DIE_TYPES` = `{ unique, mirror }` — enforced in all 4 draft generation sites.

Skill tree "New Dice" nodes (Priest, Jackpot, Vampire, Fortune Teller) still exist in the tree UI but **do not gate their dice** — act pools are the sole gate.

### New Mechanics (recent)
- **HoT (Healing over Time):** `player.hot: { amount, turnsRemaining } | null` — a single combined stack. Applied via `hot` face type. Ticks at the start of `runEnemyPhase` before enemy acts, then decrements amount and turnsRemaining by 1 and expires when either reaches 0. **HoT now scales with `activeMultiplier`** (`face.value * mult`). **HoT rolled during a busted turn does NOT persist** — HoT is buffered in `pendingHot: HotBuff | null` during the turn and only merged into `player.hot` at `bankAndAttack`. A bust clears `pendingHot` to `null`.
- **Mirror:** Copies the preceding played die's `currentFace` and re-executes it with the current `activeMultiplier`. Does nothing as the first die drawn.
- **Multiplier stacking:** Multiplicative (`st.activeMultiplier * face.value`). Enables Multiplier → Mirror = ×9.
- **Seal:** Retroactively removes up to N skull-faced dice from the already-played pile this turn, shuffling them back into the draw pile (without a face). Reduces `skullCount` accordingly. Does not cancel the current turn — it undoes past skulls. A `triggered: boolean` flag is set on the revealed Seal face to indicate whether any skulls were present to remove. Scales with `activeMultiplier`. Can be mirrored.
- **Shield Bash:** Adds damage equal to current Shield plus Shield accumulated this turn. It does not spend Shield. Scales with `activeMultiplier`. The Bulwark is the first die using this face type.
- **HoT craftable:** `hot` is in `CRAFTABLE_FACES`; `mirror`, `seal`, and `shield_bash` are not.
- **Relics MVP:** Implemented via `src/relics.ts`, `RelicRewardModal.tsx`, `RelicHud.tsx`, and run-state fields in `gameStore.ts`. Current relics: Bone Ledger (bust -> +6 Shield), Black Candle (first Skull each turn -> +1 enemy Poison), Banish (first Skull each turn returns to bag and does not count toward bust), Iron Memory (keep 50% unused Shield), Verdant Pulse (HoT actual healing also grants Shield), Retaliation Plate (full block counters for 50% enemy attack), Empty Promise (first Blank -> +6 Shield), Careful Rhythm (Attack with exactly 4 dice -> +5 Damage/+5 Shield).

### Enemy Sprite Assets

- Animated enemy sprites are stored in `public/sprites/enemies/<enemy>/` as horizontal PNG sheets (`Idle`, `Attack01`, `Hurt`, `Death`).
- `EnemySprite.tsx` is the authoritative mapping from enemy names to sheet configs, crop, unit size, and frame timing.
- Current animated set: Slime, Goblin, Skeleton, Orc, Demon.
- Asset rules: 100x100 frame cells, `image-rendering: pixelated`, no magenta/chroma-key fringe, stable feet/baseline, and no frame drift outside the enemy zone.
- Current caveat: Orc idle uses a stable single-frame idle in `EnemySprite.tsx` because the generated idle strip drifts too much.

### Skill Tree (meta)
Nodes are now organised into **4 named tracks** (plus a root node), each with a distinct colour and lane in the UI (`SkillTree.tsx`):

| Track | Colour | Theme |
|-------|--------|-------|
| Extraction | Purple | Flee/push economy — Pocket Change, Bounty Hunter + demo nodes |
| Forge | Orange | Crafting identity — Haggler, Forge Master + demo nodes |
| Survival | Green | Resilience to push deeper — Vitality I/II, Thick Skin, Second Wind, First Blood, Sharpened Edges |
| Control | Blue | Information and draft manipulation — Scouting, Auto Roll + demo nodes |

**Fully functional nodes (Banked Souls cost, real effect):** Pocket Change, Bounty Hunter, Haggler, Forge Master, Vitality I/II, Thick Skin, Second Wind, First Blood, Sharpened Edges, Scouting, Auto Roll, The Priest/Jackpot/Vampire/Fortune Teller dice unlocks.

**Demo/conceptual nodes (UI visible, non-functional):** Soul Stash, Deep Pockets, Blank Canvas, First Craft, Draft Lock+, Reroll Insight. These have `id` prefixes of `demo_` and exist to explore the track structure — they do not implement their described effects.

**QoL policy:** Auto Roll and Scouting remain as talent unlocks (players earn them via Banked Souls). Pure QoL features — dice inspect, library view, face descriptions — are **never talent-gated**; they are always available.

---

## Known Mismatches (GDD vs. Code)

- **GDD colour palette (§11)** can lag code after visual experiments — actual `dieTypeStyle` values in `DieCard.tsx` are authoritative. Blight and Multiplier share the same colour in code (`#4d7c0f`) — may need visual disambiguation.
- **Skill tree "New Dice" nodes** (Priest, Jackpot, Vampire, Fortune Teller) exist but don't gate their dice — act-native pools are the sole gate. Open question: wire them or remove them.
- **`GAME_ACTS[1].modifier`** is stored as `'thorns'` — Venom is implemented separately via floor checks. The `ActModifier` type doesn't have a `'venom'` value.
- **Demo talent nodes** (`demo_soul_stash`, `demo_deep_pockets`, `demo_blank_canvas`, `demo_first_craft`, `demo_draft_lock`, `demo_reroll_insight`) are in the skill tree UI with costs and descriptions but their effects are not implemented. Players can see but not meaningfully unlock them.

---

## Current Balance Risks

- **Rejuvenator safety retuned:** It no longer has 6 HoT faces. It can still be merged, but merge only scales HoT amount, not duration. It still provides early sustain, but now has blanks/Shield turns and needs Forge crafting to become a stronger long-term piece.
- **Mirror is dead weight as the first draw:** With no preceding die, it does nothing. High variance — either useless or extremely strong (especially Multiplier → Mirror = ×9 on first two draws).
- **Mirror + Multiplier combo** may be too swingy. Both dice are in their act pools and could co-exist in a bag.
- **Gambler in Act 2:** 12-damage spike hits boss Thorns hard on the turn after thorns_activate. Either the Gambler needs a UI warning or Thorns tuning is needed.
- **Venom tuning:** Limit is fixed at 5 for all Act 2 floors. +1 penalty may be too mild early, while +2 from Floor 26 may be the real pressure point. Pending playtesting data.
- **Warden / Seal:** Seal is only useful when skulls have already been rolled. On early draws (no skulls in played pile) it is blank. Could feel like a dead face. Balance question: should Seal have a secondary effect when no skulls are present?
- **Vessel draft value:** A 6-blank die is only valuable if the Forge is visited regularly and crafting resources exist. May feel like wasted draft slot in light-Forge runs.
- **Relic power ceiling:** Relics are intentionally strong because of the 3-slot cap, but Banish/Iron Memory/Retaliation Plate may dramatically reduce late-run danger when combined with defensive dice. Needs playtesting.
- **Demo talent nodes:** Players can see and attempt to unlock demo nodes — their cost is real but their effect is not. This may create confusion. Should these be hidden, grayed out, or labelled "Coming Soon" until implemented?

---

## Recent Design Decisions

- Dice Dungeon is an **Extraction Runner Bag-Builder**, not a standard roguelike — the flee decision defines the game.
- Fleeing banks Run Souls into Banked Souls permanently.
- Death loses 100% of Run Souls accumulated that delve.
- Beating Act 1 Boss forces automatic banking, then The Culling (keep 7 of ~15 dice).
- Three Cursed dice are forced into the bag at Act 2 start — no opt-out.
- No Gold / Materials / Coins — everything is Souls. All player-facing copy must reflect this.
- Act 2 enemy base stats were reduced and scaling is now floor-relative (`baseHp + (floor - 16) * 4`; attack scaling `(floor - 16) * 0.45`) so Floor 16 starts at bare base stats. Act 1 scaling is unchanged.
- Act 2 difficulty is Venom (primary, all floors) + boss 4-step rotation (Thorns + Corrosive Strike). Barbs and per-enemy Corrosive were removed from normal enemies.
- Venom safe draw limit is fixed at 5 for all Act 2 floors; penalty remains +1 through Floor 25 and +2 from Floor 26 onward.
- Act-native dice pools replace skill-tree gating: Global pool available both acts; Act 1 adds Paladin/Vampire/Rejuvenator/Mirror; Act 2 adds Blight/Fortune Teller/Priest/Multiplier/Jackpot.
- The Bulwark was added to the global pool as the first Shield Bash die. Shield Bash converts current Shield into damage without spending the Shield.
- The Mirror is a Unique die (one per run), same as The Multiplier.
- HoT scales with `activeMultiplier` (`face.value * mult`) — treated as an output stat, not a status application.
- HoT is buffered in `pendingHot` during the turn and only merged into `player.hot` at `bankAndAttack`; a bust clears `pendingHot` — HoT no longer persists on busted turns.
- Seal retroactively removes skull-faced dice from the played pile this turn, shuffling them (without a face) back into the draw pile. A `triggered: boolean` flag on the resolved face records whether any skulls were present to remove. Scales with `activeMultiplier`. Cannot be crafted.
- Warden visual identity is restored to dark iron/amber; Bulwark carries the more sophisticated blue gradient shield identity.
- Animated enemy sprite sheets have replaced generated in-code sprites for the current Act 1 enemy set: Slime, Goblin, Skeleton, Orc, and Demon. Goblin/Orc sheets were re-anchored to reduce frame drift.
- Talent tree reorganised into 4 named tracks: Extraction (purple), Forge (orange), Survival (green), Control (blue). Demo nodes (Soul Stash, Deep Pockets, Blank Canvas, First Craft, Draft Lock+, Reroll Insight) are visible with real costs but non-functional — they exist to explore the track structure.
- QoL policy: Auto Roll and Scouting remain talent unlocks (players earn them via Banked Souls). Dice inspect, library view, and face descriptions are never talent-gated — always available.
- Multiplier face now stacks multiplicatively on repeat rolls.
- Relic system MVP added: 3 active relic slots, start-of-run relic choice, boss relic rewards before Forge, replacement flow when full, compact combat HUD, and unique pixel assets in `public/sprites/relics/`.
- Relics are run-only and intentionally excluded from Zustand `persist` partialize; only `bankedSouls` and `unlockedNodes` persist.

---

## Next Recommended Design Work

1. **Relic balance test pass** — verify whether Banish, Iron Memory, and Retaliation Plate are too strong in 3-slot builds, especially with Shield-heavy bags.
2. **Skull mitigation pass** — current bags can accumulate too many Skulls late in acts; relics help, but dice/Forge mitigation still needs review.
3. **Tune Mirror** — consider giving 1–2 faces a fallback effect (e.g. small shield) for when it's drawn first.
4. **Tune Venom penalty curve** — limit is now fixed at 5 for all Act 2 floors; test whether +1/+2 poison is the right pressure curve.
5. **Wire "New Dice" skill tree nodes to pool gating** — currently non-functional. Decide whether to remove them from the tree, wire them, or formally replace with act gating.
6. **Review Run Souls reward curve** — check that Forge costs are achievable given expected income per floor.
7. **Review Forge costs vs. income** — Purify and Merge costs may need floor-scaling.
8. **Add a balance test checklist** for the Act 1 → Act 2 transition (target stats, expected bag size, soul balance).
9. **Disambiguate Blight/Multiplier colour** — both use `#4d7c0f`; may cause visual confusion in the dice tray.
10. **Implement demo talent nodes** — Soul Stash, Deep Pockets, Blank Canvas, First Craft, Draft Lock+, Reroll Insight are visible with real costs but no effect. Implement, hide, or label "Coming Soon".
11. **Decide Seal secondary effect** — Seal does nothing when no skulls are in the played pile (early draws). Consider a fallback effect (e.g. small shield) to reduce dead-face feel.
12. **Clarify Vessel draft value** — A 6-blank die only pays off with regular Forge visits. Confirm players understand its role or add in-draft tooltip.
13. **Sprite pass for Act 2 enemies** — create animated sheets for Slime Crawler, Marrow Bat, Toxic Creep, and Spiked Behemoth using the same stable-anchor pipeline.
14. **Finalize Orc idle sheet** — current implementation uses a single stable idle frame; regenerate a cleaner multi-frame idle only if the feet/anchor stay locked.

---

## Claude / Codex Working Rules

- Run `npx tsc --noEmit` after every code change. Zero errors required before presenting a solution.
- Adding a new die or face type: update `DIE_TEMPLATES`, `DIE_NAMES`, `dieTypeStyle`, `faceColor`, `faceShadow`, and all `FaceIcon` helpers across `DieCard.tsx`, `DiceLibrary.tsx`, `DiceInspectorModal.tsx`, `DraftScreen.tsx`, `LoadoutScreen.tsx`, `ShopScreen.tsx`, `diceDescriptions.ts`, `DiePresentationModal.tsx`, and (for Culling display) `InterActScreen.tsx`.
- Adding a unique die: add to `UNIQUE_DIE_TYPES` — all 4 draft sites filter via this set automatically.
- Adding a relic: update `src/relics.ts`, add a unique asset in `public/sprites/relics/`, wire any combat hook in `gameStore.ts`, and verify the reward modal + HUD.
- Adding or replacing enemy sprites: update `public/sprites/enemies/<enemy>/` and `EnemySprite.tsx`; keep 100x100 frame cells, remove magenta fringe, and verify stable feet/anchor in idle, attack, hurt, and death.
- Player death always takes priority over enemy death in simultaneous-kill scenarios (Thorns, Poison).
- Never rename `runSouls` / `bankedSouls` back to `gold` or any gold-adjacent term.
- For design review tasks, do not edit code unless explicitly asked.
- Keep changes scoped — do not refactor surrounding code while fixing a specific bug.
- `hot` face is in `CRAFTABLE_FACES`; `mirror`, `seal`, and `shield_bash` are not — do not add those special faces to Forge craft options.
