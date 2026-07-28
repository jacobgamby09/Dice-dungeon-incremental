# Dice Dungeon Incremental

Et mobile-first incremental combat-spil om permanente terninger. Hver besejret fjende giver permanent XP og permanente Souls; XP åbner nye muligheder, mens Souls former konkrete dice gennem en billig tilfældig Chaos Forge eller en dyr præcis Forge.

Den nuværende milepæl rummer to fulde incremental dungeons: Hub → dungeon → kamp → XP/Souls reward-pulse → næste floor eller descent-resumé ved Defeat → permanent face-upgrade → nyt run. Dungeon 1 lærer det basale Attack-loop; Dungeon 2 introducerer enemies med Attack + Shield og en Spiked Behemoth-boss med Attack + Shield + Heal.

## Kør projektet

```bash
npm install
npm run dev
npm test
npx tsc --noEmit
npm run lint
npm run build
```

## Ny produktionsarkitektur

```text
src/
  game/
    combat/          # Rene, testbare roll- og resolution-funktioner
    automation/      # Deterministisk Auto Combat og background fast-forward
    content/         # Dice, enemies, dungeons og upgrade-priser
    types/           # Permanent profile, run, combat og dice instances
  components/newgame # Delte UI-primitives og central face-visualisering
  screens/           # Hub, dungeonvalg, kamp, post-combat, defeat, Workshop
  store/newGameStore.ts
  App.tsx
```

Det nye save-key er `new-dice-dungeon-save`; det gamle spils save kan derfor ikke påvirke prototypen.

## Developer-profiler

Hubben har to bevidst totrins-beskyttede developer-handlinger:

- `DEV · Load Dungeon 2 profile` erstatter det aktuelle save med den kanoniske post-Dungeon-1-profil: én clear, 15 Max HP, fire slots, fire udstyrede permanente dice, alle faces på mindst 3 og The Iron Descent ulåst. Profilen repræsenterer 337 brugt XP og 255 brugte Souls. Auto Combat er købt men starter slået fra; Quick Draw er fortsat ukøbt.
- `DEV · Reset game` genskaber den almindelige fresh-save-start.

Preset’et lander i Hubben, så Talent Tree, Workshop og loadout kan inspiceres, før Dungeon 2 startes.

## Fastlåste designregler

- Spilleren starter kun med én permanent Attack Die; Shield og Heal unlockes senere.
- Terninger og deres seks individuelle faces er permanente og har stabile IDs.
- Alle udstyrede terninger trækkes tilfældigt uden replacement hver runde.
- Auto Combat unlockes tidligt efter Twin Arsenal og automatiserer draw, resolve, normale Victory-pulses og næste floor, men stopper ved Defeat eller Boss Victory.
- Et aktivt Auto Combat-run kan fast-forwardes deterministisk efter browser-suspension uden at duplikere rewards.
- Combat-headerens beskyttede Run Menu kan pause eller afslutte et aktivt run; et bekræftet leave nulstiller kun dungeon-positionen og bevarer allerede optjent XP/Souls.
- Boardet viser kun faktisk trukne terninger i draw-rækkefølge og har ingen faste dice-slots.
- Combat viser ingen tomme typebokse; totals og ikoner opstår først, når en face-type bliver rullet.
- Spillede dice genkendes på face-farve og ikon frem for ydre typekort.
- XP er permanent og mistes aldrig.
- Hvert mob giver et fast permanent Soul-drop; Souls mistes aldrig og bruges i Workshop.
- Workshop tilbyder controlled RNG: Chaos Forge forbedrer en tilfældig eligible face billigere, mens Precision Forge vælger den konkrete face til en premium.
- Attack-faces kan udvikles fra værdi 3 til Power, Momentum eller Rend; evolutionens identitet følger face-ID'et permanent og virker i manuel, automatisk og suspenderet combat.
- Der findes ingen Gold, Coins eller Materials.
- HP fortsætter mellem encounters i samme run.
- Shield gælder kun den aktuelle rundes resolution.
- Heal sker før Attack og kan ikke overstige max HP.
- Hvis spillerens Attack dræber fjenden, angriber fjenden ikke.
- Enemy Shield er midlertidigt og erstattes af næste rundes Shield-roll.
- En overlevende enemy bruger Heal før Attack; en dræbt enemy får begge dele annulleret.
- Ved en reel Double K.O. fra recoil, Thorns eller selvskade har Player Death prioritet.

## Dokumentation

- [NEW_GAME_GDD.md](NEW_GAME_GDD.md) — det gældende design for det nye spil.
- [NEW_DICE_DUNGEON_IMPLEMENTATION_PLAN.md](NEW_DICE_DUNGEON_IMPLEMENTATION_PLAN.md) — den komplette faseplan og playtest-gates.
- [AGENTS.md](AGENTS.md) — tekniske guardrails for videre udvikling.
- [GDD.md](GDD.md) og [DESIGN_STATE.md](DESIGN_STATE.md) — legacy-reference for det gamle bag-builder-spil; ikke gældende produktkrav.

## Legacy som donor

Den gamle kode er bevidst bevaret midlertidigt i `src/components` og `src/store/gameStore.ts`. Den er reference, ikke den nye gameplay-arkitektur. Følgende må genbruges selektivt:

- enemy sprite sheets og `EnemySprite.tsx`;
- visuel pixel-art-retning, typografi og farvesprog;
- React/Vite/Zustand-værktøjskæden.

Gamle draw/bust-, draft-, Forge-, relic-, act- og bag-builder-systemer må ikke kobles ind i `newGameStore.ts`.
