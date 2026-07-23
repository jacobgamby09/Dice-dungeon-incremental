# Dice Dungeon Incremental — Progress Log

Status: aktiv, fælles projektlog.
Senest opdateret: 2026-07-23.

Dette dokument er den hurtige overlevering mellem alle, der arbejder på projektet. `NEW_GAME_GDD.md` beskriver spillet, `DESIGN.md` beskriver den visuelle retning, og denne fil beskriver **hvad der faktisk er sket, hvad der sker nu, og hvad næste skridt er**.

## Sådan bruges loggen

Alle arbejdsforløb, der ændrer kode, assets, design, dokumentation eller projektets beslutninger, skal opdatere denne fil inden afslutning.

Regler:

1. Tilføj en ny post øverst under `Historik` — overskriv ikke tidligere poster.
2. Brug dato, kort titel og status: `Planlagt`, `I gang`, `Færdig` eller `Blokeret`.
3. Beskriv resultatet, ikke kun hvilke filer der blev rørt.
4. Notér vigtige design- eller gameplaybeslutninger.
5. Notér udført validering og eventuelle kendte mangler.
6. Tilføj commit-hash og PR-link, når arbejdet er committed/pushet.
7. Opdatér `Aktuel status` og `Næste anbefalede skridt`, hvis projektets situation har ændret sig.
8. Skriv aldrig secrets, tokens, persondata eller lokale credentials i loggen.

Brug denne skabelon:

```md
### YYYY-MM-DD — Kort titel

**Status:** Færdig | I gang | Planlagt | Blokeret
**Ansvarlig:** Navn, Codex-task eller agent

- Resultat: Hvad er nu anderledes for spilleren eller projektet?
- Beslutninger: Hvilke valg blev bindende?
- Berørte områder: Relevante filer/systemer.
- Validering: TypeScript, tests, lint, build og/eller browsertest.
- Kendte mangler: Hvad er bevidst ikke løst?
- Git: Commit, branch og PR — eller `Ikke committed`.
```

## Aktuel status

- Det nye permanente Dice Dungeon-spil er isoleret fra legacy bag-builder-systemet.
- En samlet MVP-slice findes med Hub, Talent Shrine, Loadout Rack, Workshop, dungeonvalg, combat, post-combat, extraction og defeat.
- Spilleren starter med én permanent Attack Die. Shield og Heal er senere progression.
- XP Talent Tree er nu et næsten sort, skærmfyldende spatial canvas med frit pan, faste nodekoordinater, die-sized talent-noder, SVG-forbindelser, kompakt bund-inspector, fog-silhuetter og chain-reaction reveals.
- Battle-Hardened har tre ranks á +2 Max HP for maksimalt +6; rank 1 åbner slot 2 og Striker-vejen, mens rank 2 og 3 er valgfrie.
- Talentforløbet giver derefter slot 2 og en unik Striker Die; senere følger Shield, tre samtidige grene, Heal, fire slots, Quick Draw og Auto Roll.
- Nye dice er unikke permanente objekter, auto-equippes ikke og vælges aktivt inden for spillerens slot-cap.
- `The First Descent` har nu 10 floors med Demon-boss på floor 10; boss victory banker hele runnets Soul-pulje automatisk.
- Alle udstyrede dice trækkes fra en blandet draw-pile uden replacement; der findes ingen faste type-slots.
- Hver enemy har nu sin egen seks-sidede Attack Die. Resultatet fastlåses og persisteres før reveal-animationen, hvorefter spilleren får den præcise værdi at reagere på.
- Combat resolver player først. En dræbt enemy udfører ikke sit intent.
- Roll-resultater afsløres først ved landing og flyver derefter op i den relevante round total.
- Hub, Workshop, Combat og Victory følger nu den fysiske 3D-pixel-scene-retning.
- Save-formatet er version 6 og persisterer canonical talent-ranks, collection-, loadout-, dungeon- og enemy-roll-progress sammen med aktive runs; version-5 talent-ID'er migreres til rank 1, og inkompatible legacy combat-shapes sendes sikkert til Hub.
- En deterministisk simulator og 53 automatiserede tests beskytter den første balancekurve, ranked talents, spatial layout-/viewport-matematik, progressive reveals, enemy dice og de atomiske transitions.
- `NEW_GAME_GDD.md` er gameplay-kilden, og `DESIGN.md` er den gældende visuelle reference.
- Seneste produktionsmerge: [#7 — Build spatial Talent Tree canvas](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/7), merge `3ab8b2f`.

## Næste anbefalede skridt

1. Gennemspil spatial-canvas Talent Tree-previewet ved 320 px og 384 px og kontrollér især startcentrering, drag kontra tap, sideværts pan, recenter, bund-inspector, fog-læsbarhed og Shieldcrafts trevejs chain reaction.
2. Mål i rigtig playtest, om Battle-Hardened rank 1 købes efter run 1, og om spillere forstår valget mellem rank 2/3 og Twin Arsenal.
3. Tune extraction-cadence, enemy scaling, XP rewards og face-priser samlet ud fra faktisk spilleradfærd; simulatoren er kun baseline.
4. Vurdér om floor-10-væggen fra face-værdi 2 til 3 føles motiverende eller for abrupt.

## Åbne spørgsmål og kendte risici

- Browserlaget havde ingen tilgængelig browser i spatial-canvas-sessionen. Vite-root, SSR, viewport-matematik og production-build er verificeret, men det nye pan, nodeplacering, inspector og købsceremoni mangler stadig den obligatoriske subjektive 320/384 px-browserkontrol.
- Simuleringen bekræfter den matematiske dybdekurve, men modellerer ikke extraction-valg, købsmønstre eller oplevet combat-tempo.
- Det skal playtestes, hvor ofte spillere prioriterer de valgfrie HP-ranks frem for anden die, og om 8/16/32-XP-kurven opleves som et reelt valg frem for en fælde.
- Flere face-typer skal kunne opstå dynamisk i combat uden nye faste UI-slots.
- Auto Roll er verificeret på state- og buildniveau, men tempoet med større manuelle loadouts skal vurderes visuelt.
- Legacy-kode findes stadig i repository og må ikke blandes ind i den nye production-state.

## Bindende beslutninger

- Spillet er incremental-first med extraction som risikolag.
- XP giver permanent adgang og kapacitet; Souls forbedrer konkrete permanente dice/faces.
- Kun `runSouls`, `bankedSouls` og `xp` findes som valuta/progression.
- Spilleren starter med én Attack Die.
- Et dice-unlock giver én navngiven permanent die, aldrig uendelige kopier; spilleren equipper den selv.
- Battle-Hardened har tre ranks til 8/16/32 XP og giver +2 Max HP per rank, maksimalt +6.
- Battle-Hardened rank 1 er eneste HP-krav for Twin Arsenal; rank 2 og 3 er valgfrie og må ikke blokere videre progression.
- Twin Arsenal koster 16 XP efter rank 1, så terning nummer to stadig kan nås efter højst tre floor-1 clears via den direkte vej.
- Shieldcraft åbner Survival, Arsenal og Control samtidigt uden branch lockout.
- Talent Tree er et næsten sort, edge-to-edge spatial canvas med minimal fast HUD; det må ikke præsenteres som shrine, kort, kolonner eller en almindelig scroll-side.
- Talent-noder beholder fast die-størrelse og afstand og udforskes med frit pan i begge akser. Træet komprimeres ikke til mobilbredden, og en recenter-knap returnerer kameraet til den aktuelle frontier.
- Første canvas-version bruger fast zoom. Nodeknapper og SVG-forbindelser ligger i samme transformerede DOM-world, så skarphed, semantic buttons og keyboardfokus bevares.
- Talent Tree viser kun den aktuelle frontier fuldt og ét kommende lag som en navnløs, ikke-interaktiv fog-silhuet.
- Talent-køb ruller noden på stedet, tænder forbindelsen og afslører nye nodes som en kort chain reaction; Shieldcraft splitter effekten i tre.
- Auto Roll er en spillerstyret toggle med 300 ms pause efter et færdigscoret roll og udfører ikke Auto Resolve.
- MVP-dungeonen har 10 floors; floor 10 er boss og banker automatisk alle Run Souls ved sejr.
- Alle udstyrede dice skal trækkes hver runde i tilfældig rækkefølge.
- Hver enemy har præcis én data-driven Attack Die med seks stabile faces; dens resultat fastlåses ved rundestart og gemmes før animationen.
- Enemy intent vises som den præcise landede værdi efter et kort reveal. Spilleren kan inspicere alle seks faces, men kan ikke rulle egne dice, mens intent ruller.
- Dice og totals vises først, når deres roll/resultat er afsløret.
- Player resolution sker før enemy resolution.
- En død enemy angriber aldrig.
- Player death har prioritet ved reel samtidig død.
- Visuel retning er et fysisk dark-fantasy 3D-pixel-diorama, ikke en samling web-cards.

## Historik

### 2026-07-23 — Spatial Talent Tree canvas

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Det indrammede vertikale Talent Tree er erstattet af et næsten sort full-viewport progression-void. Battle-Hardened starter i centrum, nodes beholder fysisk die-størrelse, træet kan trækkes frit i begge akser, forbindelser ligger som SVG i samme world, og en recenter-knap finder den aktuelle frontier.
- Beslutninger: Der vises kun ikon og rank-pips på canvaset; navn, effekt og pris ligger i et bundforankret inspector-panel. Layoutet komprimeres aldrig til mobilbredden, sidegrene må fortsætte ud i mørket, og første version har fast zoom. Eksisterende priser, prerequisites, store-transitions og save-format er uændrede.
- Berørte områder: Ny `TalentTreeCanvas`, koordinat-/viewport-layout og tests; omskrevet Talent Tree-skærm, node og inspector; spatial CSS, GDD og visuel designreference.
- Validering: `npx tsc --noEmit`, 53 tests, lint, production-build og `git diff --check` bestod. Lokal Vite-root svarede HTTP 200, og de ændrede React-komponenter blev gennemgået mod projektets React-kvalitetsregler.
- Kendte mangler: Den forbundne browserruntime eksponerede ingen browser, så touch-følelse, visuel balance og animationstiming ved 320/384 px skal godkendes i Vercel-previewet.
- Git: `9b96f44` — `Build spatial Talent Tree canvas`; merged til `main` via [PR #7](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/7) som `3ab8b2f` og verificeret på production.

### 2026-07-23 — Ranked incremental Talent Tree

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Talent Shrine er erstattet af et klassisk mobile-first talent tree med fysiske dice-nodes, unikke ikoner, tre-rank Battle-Hardened, navnløse fog-silhuetter, kompakt købspanel og en trinvis roll/connector/reveal-ceremoni.
- Beslutninger: Battle-Hardened giver +2 HP per rank til rank 3 og koster foreløbigt 8/16/32 XP; Twin Arsenal kræver kun rank 1; Shieldcraft forbliver junction før de tre samtidige grene; kun ét fremtidigt lag anes som silhuet.
- Berørte områder: Talent content/types/progression, v6-storemigration og køb, Talent Tree-skærm og komponenter, responsive styles, tests, GDD, DESIGN og implementationplan.
- Validering: `npx tsc --noEmit`, frisk app-typecheck, 49 tests, lint og production-build bestod. React-komponenterne er gennemgået mod projektets React-kvalitetsregler.
- Kendte mangler: Browserruntime havde ingen tilgængelig browser, så visuel og interaktiv verifikation ved 320/384 px samt subjektiv animationstiming mangler.
- Git: `298dedd` — `Rebuild ranked talent tree`; merged til `main` via [PR #5](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/5) som `cc05ef0` og deployet til production.

### 2026-07-22 — Enemy die-transform nulstilles efter alle rolls

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Enemy-resultatfladen kan ikke længere stå spejlvendt efter et roll, uanset runde, mob eller landet cube-side.
- Beslutninger: Den roterende 3D-cube og den flade resultatvisning har nu forskellige React keys, og resultatvisningen nulstiller eksplicit X/Y-rotation og vertikal position.
- Berørte områder: `EnemyIntentDie.tsx` og progress-log.
- Validering: `npx tsc --noEmit`, 42 tests, lint og production-build bestod.
- Kendte mangler: Production-resultatet skal fortsat verificeres visuelt på brugerens mobile Safari efter deployment.
- Git: `76bfe95` — `Fix enemy die transform reset`; merged til `main` via [PR #3](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/3) som `3fe3784` og deployet til production.

### 2026-07-22 — Production blank-screen migration hotfix

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Production kan nu åbne gamle saves fra det oprindelige version-1-build uden en tom React-root. Et aktivt run med en combat-shape uden `drawPileDieIds` afsluttes sikkert til Hub, mens permanent profilprogression bevares.
- Beslutninger: Save-formatet hæves til version 5; aktive runs bevares kun, når enemy og combat-state begge består strukturel kompatibilitetskontrol.
- Berørte områder: `newGameStore.ts`, migrationstests, GDD, implementationplan og progress-log.
- Validering: `npx tsc --noEmit`, 42 tests, lint og produktionsbuild bestod; production HTML og assets svarede allerede HTTP 200, hvilket isolerede fejlen til client bootstrap/persistence.
- Kendte mangler: Et inkompatibelt aktivt legacy-run nulstilles til Hub; dets ubankede Run Souls kan ikke rekonstrueres sikkert, men permanent XP, Banked Souls og dice bevares.
- Git: `c1884e1` — `Fix production save migration` på `agent/fix-production-save-migration`; hotfix-PR oprettes mod `main`.

### 2026-07-22 — Enemy face-rækkefølge dækket på alle rolls

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Både den animerede 3D-cubes seks faces og det statiske landed-face bruger nu samme eksplicitte `værdi → Attack-ikon`-komponent. Rettelsen gælder dermed alle efterfølgende runder og samtlige 10 mobs, ikke kun første landed-state.
- Beslutninger: Enemy face-indhold har én fælles renderer, og både cube- og landed-layout låses til LTR-grid med faste value/icon-kolonner.
- Berørte områder: `EnemyIntentDie.tsx` og enemy cube/face CSS i `newGame.css`.
- Validering: `npx tsc --noEmit`, 41 tests, lint og produktionsbuild bestod; content-registry-testen beskytter fortsat, at alle 10 mobs har præcis seks faces.
- Kendte mangler: Den samlede fresh-save-gennemgang ved både 320 px og 384 px mangler fortsat.
- Git: `604f8ba` — `Fix every enemy die face` på `agent/random-draw-bag`; samme eksisterende draft PR [#1](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/1).

### 2026-07-22 — Enemy die landed-face orientering rettet

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Enemy Attack Die viser nu konsekvent tallet før Attack-ikonet efter roll, så landed-face matcher spillerens dice-retning på mobil.
- Beslutninger: Den visuelle rækkefølge er gjort eksplicit med separate value/icon-elementer og faste grid-kolonner i stedet for at afhænge af implicit flex-rækkefølge.
- Berørte områder: `EnemyIntentDie.tsx` og enemy-intent CSS i `newGame.css`.
- Validering: Brugerens runtime-screenshot identificerede fejlen; `npx tsc --noEmit`, 41 tests, lint og produktionsbuild bestod.
- Kendte mangler: Den samlede fresh-save-gennemgang ved både 320 px og 384 px mangler fortsat.
- Git: `32bb366` — `Fix enemy die face order` på `agent/random-draw-bag`; samme eksisterende draft PR [#1](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/1).

### 2026-07-22 — Enemy Attack Dice og intent reveal

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Alle 10 enemies angriber nu med hver sin permanente seks-sidede Attack Die. Combat starter hver runde med et kompakt enemy-roll, viser derefter det præcise intent og animerer værdien mod spillerens HP ved resolution. Spilleren kan åbne terningen og se alle faces, spænd og gennemsnit.
- Beslutninger: Enemy-roll-resultatet fastlåses og persisteres før animationen; player-draw er låst under reveal; lethal player attack annullerer fortsat fjendens intent; enemy-die-faces er data-driven med stabile IDs og indgår i den samme deterministiske balance-simulator som player dice.
- Berørte områder: Nye enemy-dice types/content/combat helper, enemy definitions, pure resolution-integration, save-migration v4, Combat/Victory UI, responsive CSS, simulator, tests, `NEW_GAME_GDD.md` og implementationplanen.
- Validering: `npx tsc --noEmit`, 41 tests, lint og produktionsbuild bestod. Dev-serveren startede på port 4173. In-app browser-runtime havde ingen tilgængelig browserinstans, så den visuelle 320/384 px-gennemgang kunne ikke udføres.
- Kendte mangler: Det kompakte die, inspect-panelet, roll-timing og damage-transfer skal stadig godkendes visuelt på både 320 px og 384 px.
- Git: `43c8cec` — `Add enemy attack dice` på `agent/random-draw-bag`; samme eksisterende draft PR [#1](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/1).

### 2026-07-22 — Fysisk Talent Shrine og købsceremoni

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Talent Tree er ombygget fra stablede upgrade-kort til en fysisk cyan-oplyst runetavle med onboarding-stamme, forgreningsmekanisme, Survival/Arsenal/Control-spor, progressive reveals og tydelige states for skjult, prerequisite-låst, for dyr, købsklar, aktiv og nyåbnet.
- Beslutninger: XP forbliver cyan på tværs af alle grene; nodes undersøges før køb; en ny permanent die vises som én konkret navngiven genstand med alle seks faces og tilbydes aldrig silent auto-equip. Collection, equipped slots og Max HP vises ved shrinet.
- Berørte områder: `TalentTreeScreen.tsx`, nye `TalentNode.tsx` og `TalentDialog.tsx`, talent reveal-logik og tests, `newGame.css` samt `DESIGN.md` version 1.2.
- Validering: `npx tsc --noEmit`, 36 tests, lint, produktionsbuild og `git diff --check` bestod. React-komponenterne blev gennemgået mod projektets React-kvalitetsregler.
- Kendte mangler: Browserbindingen var ikke tilgængelig, så den obligatoriske runtime-gennemgang ved 320/384 px mangler fortsat.
- Git: `01a7f15` — `Build physical talent shrine` på `agent/random-draw-bag`; samme eksisterende draft PR [#1](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/1).

### 2026-07-22 — 10-floor MVP-progression implementeret

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Spillet har nu et fungerende XP Talent Tree, permanent unique-dice collection, aktivt loadout, talentafledt HP/slot-cap, Quick Draw, Auto Roll og en fuld 10-floor dungeon med Demon-boss.
- Beslutninger: Første kill finansierer Battle-Hardened I; Twin Arsenal giver slot 2 og én Striker Die uden auto-equip; Shieldcraft åbner tre ikke-eksklusive spor; boss victory banker hele Soul-puljen automatisk.
- Berørte områder: `src/game/content`, `src/game/progression`, `src/game/balance`, `src/store/newGameStore.ts`, nye Talent/Loadout-skærme, combat/victory/dungeon UI, save-migration v3, `NEW_GAME_GDD.md` og implementationplanen.
- Validering: `npx tsc --noEmit`, 33 tests, lint og produktionsbuild bestod. Demon-sheets blev verificeret som 600×100/400×100. Dev-serveren startede korrekt; visuel browsertest kunne ikke køres, fordi sessionen ikke havde en tilgængelig browserbinding.
- Kendte mangler: Fresh-save-playtest ved 384 px og visuel kontrol af de nye skærme/Demon-animationer mangler; balanceværdierne er første simulatorbaserede tuning.
- Git: `933fbec` — `Add ten-floor MVP progression`; draft PR [#1](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/1).

### 2026-07-22 — Fælles progress-log etableret

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Projektet har nu én append-only overleveringslog med aktuel status, næste skridt, åbne risici, beslutninger og fast entrieskabelon.
- Beslutninger: Alle fremtidige materielle ændringer skal registreres her inden et arbejdsforløb afsluttes.
- Berørte områder: `progress.md`, `AGENTS.md`.
- Validering: Markdown og Git-diff kontrolleret.
- Kendte mangler: Denne post er endnu ikke committed ved oprettelsen.
- Git: Ikke committed.

### 2026-07-21 — Combat effect rail og dice roll forbedret

**Status:** Færdig
**Ansvarlig:** Tidligere Codex-forløb

- Resultat: Combat-feedback og terningens roll-præsentation blev yderligere poleret.
- Validering: Fuldført i det oprindelige arbejdsforløb.
- Git: `023f8fd` — `Improve effect rail and dice roll`.

### 2026-07-21 — Combat-scene og art direction poleret

**Status:** Færdig
**Ansvarlig:** Tidligere Codex-forløb

- Resultat: Combat fik en mere helstøbt pixel-scene, og den fælles visuelle retning blev defineret.
- Berørte områder: Combat-præsentation og `DESIGN.md`.
- Validering: Fuldført i det oprindelige arbejdsforløb.
- Git: `1db9a8d` — `Polish combat scene and define art direction`.

### 2026-07-21 — Incremental progression præciseret

**Status:** Færdig
**Ansvarlig:** Tidligere Codex-forløb

- Resultat: GDD'et blev opdateret med et tydeligt incremental-first hierarki og adskilte roller for XP og Souls.
- Berørte områder: `NEW_GAME_GDD.md`.
- Git: `958dc95` — `Clarify incremental progression design`.

### 2026-07-21 — Hub og Workshop redesignet

**Status:** Færdig
**Ansvarlig:** Tidligere Codex-forløb

- Resultat: Hub blev en fysisk dungeon gate, og Workshop blev en forge-scene med dice rack, face bench, anvil-preview og upgrade-impact.
- Validering: TypeScript, 20 tests, lint, build samt browsertest ved 320 px og 384 px bestod.
- Git: `5b41ad3` — `Polish hub and workshop scenes`.

### 2026-07-21 — Dice score collection animeret

**Status:** Færdig
**Ansvarlig:** Tidligere Codex-forløb

- Resultat: Et landet face-resultat flyver til round totalen, som først derefter opdateres.
- Git: `5c54a08` — `Animate dice score collection`.

### 2026-07-21 — Combat-rækkefølge og Victory poleret

**Status:** Færdig
**Ansvarlig:** Tidligere Codex-forløb

- Resultat: Player resolver før enemy; lethal player damage annullerer enemy intent. Victory blev ombygget til en fysisk pixel-stage med loot og path choices.
- Git: `05b5f7c` — `Sequence combat turns and polish victory`.

### 2026-07-21 — Combat dice presentation ryddet op

**Status:** Færdig
**Ansvarlig:** Tidligere Codex-forløb

- Resultat: Tomme Attack/Shield/Heal-placeholders og ydre typebokse blev fjernet. Dice aflæses nu via face-farve og ikon.
- Git: `ba2b13d` — `Clean up combat dice presentation`.

### 2026-07-21 — Random all-dice draw bag implementeret

**Status:** Færdig
**Ansvarlig:** Tidligere Codex-forløb

- Resultat: Alle udstyrede dice trækkes i en blandet rækkefølge uden faste board-slots.
- Git: `53dffe9` — `Add random all-dice draw bag`.

### 2026-07-21 — Permanent dice extraction prototype bygget

**Status:** Færdig
**Ansvarlig:** Tidligere Codex-forløb

- Resultat: Første vertikale slice af det nye permanente Dice Dungeon blev bygget isoleret fra legacy-spillet.
- Git: `b19fdc5` — `Build permanent dice extraction prototype`.
