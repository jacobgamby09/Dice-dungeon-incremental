# Dice Dungeon Incremental

Et mobile-first extraction-spil om permanente terninger. Spilleren kæmper gennem korte dungeons, optjener permanent XP og risikerer midlertidige Run Souls. Extraction flytter Run Souls til Banked Souls, som bruges til at opgradere én konkret face på én konkret terning.

Den nuværende milepæl er den første vertikale prototype: Hub → dungeon → kamp → Extract/Continue → permanent face-upgrade → nyt run.

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
    content/         # Dice, enemies, dungeons og upgrade-priser
    types/           # Permanent profile, run, combat og dice instances
  components/newgame # Delte UI-primitives og central face-visualisering
  screens/           # Hub, dungeonvalg, kamp, post-combat, defeat, Workshop
  store/newGameStore.ts
  App.tsx
```

Det nye save-key er `new-dice-dungeon-save`; det gamle spils save kan derfor ikke påvirke prototypen.

## Fastlåste designregler

- Spilleren starter kun med én permanent Attack Die; Shield og Heal unlockes senere.
- Terninger og deres seks individuelle faces er permanente og har stabile IDs.
- Alle udstyrede terninger trækkes tilfældigt uden replacement hver runde.
- Boardet viser kun faktisk trukne terninger i draw-rækkefølge og har ingen faste dice-slots.
- Combat viser ingen tomme typebokse; totals og ikoner opstår først, når en face-type bliver rullet.
- Spillede dice genkendes på face-farve og ikon frem for ydre typekort.
- XP er permanent og mistes aldrig.
- Run Souls mistes ved død; Banked Souls overlever og bruges i Workshop.
- Der findes ingen Gold, Coins eller Materials.
- HP fortsætter mellem encounters i samme run.
- Shield gælder kun den aktuelle rundes resolution.
- Heal sker før Attack og kan ikke overstige max HP.
- Hvis spillerens Attack dræber fjenden, angriber fjenden ikke.
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
