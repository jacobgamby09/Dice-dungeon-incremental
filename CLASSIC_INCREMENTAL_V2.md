# Dice Dungeon — Classic Incremental V2

Status: playable vertical slice on `codex/classic-incremental-v2`.

This document describes the experimental Classic Incremental version. The current
production game on `main` remains intact and is the reference implementation for
combat presentation, enemy dice, automation and mobile UI.

## Design hypothesis

The player should fail early, return with permanent currency, buy one small
unpredictable increase and immediately try the same wall again.

The motivating question is:

> How much farther will this exact collection of personally grown dice get on the
> next attempt?

Player input is not expanded to solve pacing. The incremental rhythm is created by
short early attempts, reliable permanent rewards, random face growth, early full
automation and longer-term system unlocks.

## Fresh start

- 10 Max HP.
- One equipped `Worn Blade Die`.
- Six stable Attack faces: `1, 1, 1, 1, 1, 1`.
- No Auto Combat.
- No other dice.
- No XP or Souls.

The first Slime has 3 HP and a deterministic 2-Attack die. The untouched player:

1. rolls exactly three times;
2. defeats the Slime with 6 HP remaining;
3. receives 4 XP and 5 Souls permanently;
4. cannot defeat floor 2 without additional growth.

This makes the first completed encounter fund both progression layers:

- 4 XP buys `Inner Spark` rank 1.
- 5 Souls buys the first random Workshop improvement.

## Permanent economy

### XP

XP buys capability and access in the directional Talent Tree:

- Max HP.
- Auto Combat and speed.
- Dice slots and named permanent dice.
- Workshop Die faces and player-die face caps.
- New dungeons.
- Later: the Charm system.

XP never upgrades an individual face.

### Souls

Souls buy a random upgrade on a player-selected die:

1. The player chooses the die.
2. The Workshop visibly rolls uniformly among eligible target faces.
3. The selected target remains locked.
4. The player rolls the separate Workshop Die to determine the upgrade amount.
5. The selected face permanently gains the visible result.

Every upgrade succeeds and is permanent. Randomness decides where the growth lands
and which positive value the current Workshop Die grants, not whether the player
receives growth.

The base Workshop Die is `1, 1, 1, 1, 1, 2`. Target and power results are generated
and persisted when the operation begins, so reload cannot reroll either result.
Souls are deducted once at operation start, and the target face changes once after
the Workshop Die lands.

If the chosen face has less headroom than the rolled Workshop value, the visible
Workshop Die is capped to the available headroom for that operation. No hidden
upgrade point is presented and then discarded.

The initial random-Forge cost is grouped by total upgrades on that die:

| Total upgrades before purchase | Soul cost |
| --- | ---: |
| 0–2 | 5 |
| 3–5 | 7 |
| 6–8 | 9 |
| 9–11 | 11 |

The pattern continues by +2 Souls for every three improvements.

The initial normal face cap is 5. `Face Mastery` raises access to higher values.

## Directional Talent Tree

The central node is `Inner Spark`, with five optional ranks:

| Rank | Cost | Effect |
| --- | ---: | --- |
| 1 | 4 XP | +1 Max HP and reveal all four directions |
| 2 | 7 XP | +1 Max HP |
| 3 | 11 XP | +1 Max HP |
| 4 | 16 XP | +1 Max HP |
| 5 | 24 XP | +1 Max HP |

Only rank 1 is required to leave the center. The player decides whether more early
HP is worth delaying a directional purchase.

### North — Arsenal

- `Twin Arsenal`: 32 XP; gain slot 2 and the permanent Striker Die.
- `Shieldcraft`: gain the first Shield Die.
- `Third Grip`: gain slot 3.
- `Healing Arts`: gain the first Heal Die.
- Deeper named dice and slots continue outward.

### West — Workshop

- `Loaded Alloy`: three ranks that change the Workshop Die to
  `1-1-1-1-2-2`, then `1-1-1-2-2-2`, then `1-1-1-2-2-3`.
- `Face Mastery`: three ranks; +1 normal-face cap per rank.

### South — Descent

- `Auto Combat`: 6 XP directly after the center; automatically rolls, resolves,
  starts new rounds and advances normal floors.
- `Quick Draw`: three speed ranks.
- `Deep Reserves`: longer-run Max HP.
- `Second Descent`: opens Dungeon 2 after the first Dungeon 1 clear.

### East — Fate

`Fatecraft` is visible as a locked future direction after `Inner Spark`, but requires
the first Dungeon 1 clear. It represents the later Charm system. Charm effects, Fate
Tokens and loot-box generation are deliberately not part of this vertical slice.

## Measured early journey

The deterministic journey simulator buys the default talent path and spends every
affordable Soul upgrade between runs.

Regression boundaries:

- First random face improvement: run 1.
- Full Auto Combat: run 2–3.
- Second die: later than Auto Combat, normally run 6–15.
- Dungeon 1 clear: a longer arc, currently constrained to run 12–45 across the
  canonical seeded journey.

These are balance rails, not final release promises. Physical playtesting must
measure perceived time, not only simulated run numbers.

## Save and branch isolation

- V2 uses save version 14.
- The only save key remains `new-dice-dungeon-save`.
- Version-13 V2 profiles migrate without losing XP, Souls, dice or talents.
- Opening this isolated V2 build with a pre-V2 save still creates a fresh V2 profile.
- `main` and the existing production deployment are not changed by this branch.

## Explicitly deferred

- Charm inventory, Fate Tokens and random Charm loot.
- Precision Forge and face evolutions in the V2 player-facing Workshop.
- Final Dungeon 2 balance for the new slower curve.
- Final deeper Arsenal/Descent content.
- Production merge.
