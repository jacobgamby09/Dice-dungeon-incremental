# Codex Guardrails — Dice Dungeon Incremental

Disse regler gælder for det nye permanente Dice Dungeon-spil. `GDD.md`, `DESIGN_STATE.md`, `src/store/gameStore.ts` og de gamle skærme beskriver legacy bag-builder-spillet og er kun reference.

## 1. Produktionsgrænsen

- Ny gameplay-kode bygges i `src/game`, `src/screens`, `src/components/newgame` og `src/store/newGameStore.ts`.
- Legacy-systemer som draw/bust, draft, Forge, relics, acts og run-only dice må ikke importeres i den nye state eller combat-engine.
- Assets og isolerede præsentationskomponenter må genbruges, hvis de ikke trækker gamle gameplay-regler med ind.

## 2. TypeScript- og build guard

Når dice-, face-, combat- eller store-typer ændres:

- opdatér alle exhaustive registries, især `faceVisuals.ts` og `FaceIcon.tsx`;
- kør `npx tsc --noEmit`, `npm test`, `npm run lint` og `npm run build`;
- efterlad aldrig builden brudt.

## 3. Permanent die/face pipeline

En ny permanent terning skal:

1. oprettes data-driven i `src/game/content/dice.ts`;
2. have et stabilt `die.id` og præcis seks faces med hvert sit stabile `face.id`;
3. bruge `die.name` som navn — navne må ikke udledes af family/type;
4. få ny mechanic implementeret i types, pure combat-engine og tests;
5. få ikon/farve i den centrale face registry, hvis den introducerer en ny face type;
6. kunne snapshots ved run-start og persisteres uden tab af face-identitet.

## 4. Combat- og death guard

Resolution-rækkefølgen er:

1. Heal og max-HP cap.
2. Player Attack mod enemy Shield og HP.
3. Eventuel recoil/selvskade.
4. Player Death har prioritet ved reel samtidig død.
5. Hvis fjenden er død: Victory, intent annulleres, ingen attack-animation.
6. Hvis fjenden lever: intent udføres mod rundens Shield og derefter HP.
7. Midlertidigt Shield nulstilles.

Før victory/post-combat må vises, skal spillerens HP være over 0. Nye combat-regler skal ind i `resolveRound.ts` som rene funktioner og dækkes af tests.

## 5. Economy dictionary

Kun disse valutaer findes:

- `runSouls`: optjenes i et aktivt run, mistes ved død og bankes ved extraction.
- `bankedSouls`: permanent valuta til konkrete dice/face-upgrades i Hub.
- `xp`: permanent meta-progression til et senere talent tree.

Brug aldrig Gold, Coins eller Materials. XP må ikke bruges på dice faces, og Souls må ikke bruges på talent tree.

## 6. Persistence og atomiske transitions

- Brug kun save-key `new-dice-dungeon-save` og versionsstyr save-formatet.
- Persistér både profil, aktivt run, runde og allerede rullede face-resultater.
- Gem det valgte `face.id`-resultat før animationen starter.
- Rewards, extraction og face-køb skal være idempotente; reload eller dobbeltklik må ikke duplikere værdier.
- Equipped dice snapshots ved run-start, så Hub-opgraderinger ikke kan ændre et aktivt run.

## 7. UI og React

- Mobile-first ved 384 px; hard-edge pixel-art uden afrundede kort.
- Brug semantiske buttons, headings, labels, progressbars og synlig fokus-state.
- Subscribér til smalle Zustand-slices frem for hele store-objektet.
- Hold gameplay-beregninger ude af React-effects; UI-effects må kun orkestrere animation og transition.
- Alle tre totals og hvert roll-resultat skal kunne aflæses uden animationen.

## 8. Enemy sprite pipeline

Ved nye eller udskiftede sprites:

- læg sheets i `public/sprites/enemies/<enemy>/`;
- forvent `<Enemy>-Idle.png`, `<Enemy>-Attack01.png`, `<Enemy>-Hurt.png`, `<Enemy>-Death.png`;
- brug 100×100-celler på horisontale PNG-sheets;
- fjern magenta/chroma-key-fringe og hold fødder/center stabilt;
- opdatér `EnemySprite.tsx` og verificér idle, attack, hurt og death i lokal browser;
- kør `npm run build` efter ændringen.

## 9. Legacy lint-afgrænsning

Legacy-filer kan midlertidigt være eksplicit undtaget i `eslint.config.js`, men nye produktionsfiler må ikke tilføjes til undtagelsen. Når legacy-koden flyttes ud af `src`, fjernes undtagelserne.
