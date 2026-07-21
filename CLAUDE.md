# Claude Code Skills & Project Guardrails for 'Dice Dungeon'

Always follow these rules when editing the Dice Dungeon codebase:

## 1. The Build Guard (TypeScript Strictness)
**Trigger:** Whenever you add a new die, new face type, or change `gameStore.ts`.
**Action:** You MUST ensure that all UI color maps and icon maps (e.g., in `DiceInspectorModal.tsx`, `DieLibrary.tsx`, `FaceIcon` logic) are updated to include the new types.
**Validation:** Run `npx tsc --noEmit` locally to ensure no mapped types are missing before presenting the solution to the user. Never leave the build broken.

## 2. The 'New Die' Pipeline
**Trigger:** Whenever the user asks to create a new die.
**Action:** You must execute these 3 steps:
1. Add the template to `DIE_TEMPLATES` in `gameStore.ts`. Do NOT hardcode names based on types (e.g., `unique` does not mean 'The Multiplier'). Always rely on `die.name`.
2. If it introduces a new mechanic, update the `DieFace` union type and the `resolveRoll` logic.
3. Add the corresponding visual icon and color rendering in the UI components (like `DieCard.tsx` / `FaceIcon`).

## 3. UI State & Death Guards
**Trigger:** Whenever adding new buttons, modals, or post-combat transitions (like Draft Screen or Flee).
**Action:** Always check for player death! Before rendering victory UI or moving `turnPhase` to `'draft'`, you must verify `state.player.hp > 0`. If the player and enemy die simultaneously (Double K.O. / Thorns), Player Death ALWAYS takes priority and must trigger the 'Defeat' state.

## 4. The Economy Dictionary
**Trigger:** Whenever modifying rewards, shops, or the Forge.
**Action:** The game is an Extraction Runner. There is NO 'Gold' and NO 'Materials'. 
- Use ONLY `runSouls` (lost on death, spent in-run).
- Use ONLY `bankedSouls` (kept across runs, spent in Hub).
- If you see lingering references or icons for 'gold' or 'coins', proactively flag or replace them with 'souls'.

## 5. Enemy Sprite Asset Pipeline
**Trigger:** Whenever adding or replacing animated enemy sprites.
**Action:** Put sprite sheets under `public/sprites/enemies/<enemy>/` and update `EnemySprite.tsx`.
- Expected sheets: `<Enemy>-Idle.png`, `<Enemy>-Attack01.png`, `<Enemy>-Hurt.png`, `<Enemy>-Death.png`.
- Frames should be 100x100 cells on horizontal PNG sheets.
- Remove magenta/chroma-key fringe before shipping.
- Keep the enemy's feet/baseline and visual center stable across frames. Do not let idle or attack frames drift out of the enemy zone.
- If generated frames drift too much, prefer a stable single-frame idle until a cleaner sheet is available.
**Validation:** Run `npm run build`, then visually check idle, attack, hurt, and death in the local browser.
