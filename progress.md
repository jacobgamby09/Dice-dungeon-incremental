# Dice Dungeon Incremental — Progress Log

Status: aktiv, fælles projektlog.
Senest opdateret: 2026-07-28.

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
- En samlet MVP-slice findes med Hub, Talent Shrine, Loadout Rack, Workshop, dungeonvalg, combat, kompakt Victory/Boss Victory og descent-resumé ved Defeat.
- Spilleren starter med én permanent Attack Die. Shield og Heal er senere progression.
- XP Talent Tree er nu et næsten sort, skærmfyldende spatial canvas med frit pan, 65–140% pinch/knap/Ctrl-wheel-zoom, faste nodekoordinater, die-sized talent-noder, SVG-forbindelser, stort modal-overlay, tydelige `Owned/Max/Buy/Open/Locked`-states, fog-silhuetter og chain-reaction reveals.
- Battle-Hardened har tre ranks á +2 Max HP for maksimalt +6; rank 1 åbner slot 2 og Striker-vejen, mens rank 2 og 3 er valgfrie.
- Talentforløbet giver derefter slot 2 og en unik Striker Die. Auto Combat åbner direkte efter Twin Arsenal; senere følger Shield, tre samtidige grene, Heal, fire slots og Quick Draw.
- Nye dice er unikke permanente objekter, auto-equippes ikke og vælges aktivt inden for spillerens slot-cap.
- Hubben har en diskret dev-reset med et separat bekræftelsestrin, som kan genskabe hele fresh-save-tilstanden uden manuel localStorage-rydning.
- Hubben har en separat fresh QoL-teststart med 88 uspente XP — præcis nok til den direkte vej gennem Battle-Hardened I, Twin Arsenal, Auto Combat, Shieldcraft og Quick Draw.
- Hubben kan desuden indlæse en totrins-bekræftet post-Dungeon-1-dev-profil med realistisk talent spend, tidligt Auto Combat-unlock, fire opgraderede permanente dice og Dungeon 2 klar til systematisk playtest.
- Hvert besejret mob giver sit faste XP- og Soul-drop permanent med det samme; Defeat nulstiller kun dungeon-positionen.
- `The First Descent` genbruger Slime, Slime Crawler, Goblin og Skeleton som Level 1/2-varianter, har en Skeleton Elite på floor 9 og Demon-boss på floor 10. Alle har kun én Attack Die.
- `The Iron Descent` er Dungeon 2 med Shieldbearer, Cultist, Orc og Blood Orc som Level 1/2-varianter. Normale mobs har Attack + Shield, mens Spiked Behemoth-bossen har Attack + Shield + Heal.
- Alle udstyrede dice trækkes fra en blandet draw-pile uden replacement; der findes ingen faste type-slots.
- Hver enemy har nu 1–3 data-drevne seks-sidede dice. Alle resultater fastlåses og persisteres før reveal-animationen, hvorefter spilleren får de præcise Attack-, Shield- og Heal-værdier at reagere på.
- Enemy-intent bruger separate render-identiteter til den roterende 3D-cube og den flade resultat-face. Landed, active og cancelled nulstiller altid X/Y-rotation, så ingen enemy-die kan arve en spejlvendt roll-transform på tværs af faces, runder eller mobs.
- Combat resolver player først. En dræbt enemy udfører ikke sit intent.
- Roll-resultater afsløres først ved landing og flyver derefter op i den relevante round total.
- Combat viser Slime Crawler og Marrow Bat med deres egne animation-sheets, enemy-navne i en ren sans-serif samt næsten-sorte enemy- og roll-flader uden murværk, runer, tomme piedestaler eller idle-instruktioner. Slime Crawler har særskilt større skalering, og floor-10 Demon bruger den store røde hornede boss-art.
- Hub, Workshop, Combat og Victory følger nu den fysiske 3D-pixel-scene-retning.
- Workshop har nu to atomiske Soul-forges: billig Chaos Forge med controlled RNG og faldende rabat samt dyr Precision Forge til en valgt face. Attack-faces vækkes fra værdi 3 og udvikles permanent til Power, Momentum eller Rend.
- Power giver 5 direkte Attack, Momentum flytter +2 til næste face med Attack-fallback, og Rend giver 2 Attack + 2 forsinket Bleed gennem Shield. Effekterne deles af manuel combat, Auto Combat, background fast-forward og simulatoren.
- Normal Victory viser kun encounter-reward, totals, HP og dungeon-progress; næste-enemy-data er fjernet. Manuel mode bruger én Continue-knap, mens Auto Combat viser en kort reward-pulse og fortsætter til næste floor med en synlig Pause-handling.
- Auto Combat automatiserer player-rolls, Resolve Round, næste round og normale floor-transitions. Det stopper ved Defeat og Boss Victory og har endnu ingen Auto Retry.
- Et aktivt Auto Combat-run kan fast-forwardes efter browser-suspension via et persisteret checkpoint, tidsbudget og deterministisk random-seed. Resume viser et modal recap og pauser live automation, indtil spilleren lukker rapporten.
- Combat-headeren har en diskret Run Menu før floor-informationen. Menuen pauser live- og background-Auto Combat; et totrinsbekræftet leave returnerer til Hub med XP, Souls og permanent progression intakt.
- Save-formatet er version 11 og persisterer canonical talent-ranks, collection-, loadout-, dungeon-, encounter-, enemy-roll-, run-summary-, Forge- og automation-progress sammen med aktive runs. Version-10 Attack-faces over 3 migreres til Power uden tab af styrke.
- En deterministisk simulator og 114 automatiserede tests beskytter begge balancekurver, per-floor round-målinger, permanent Soul-loot, controlled Forge, evolutioner/Bleed/Momentum, outcome-flow, ranked talents, spatial layout-/zoom-/viewport-matematik, Talent Tree-modal og node-states, full reset, begge dev-profiler, Auto Combat/background-resume, Run Menu/leave-flow, progressive multi-dice intents, sprite-mapping, migrationer og atomiske transitions.
- `NEW_GAME_GDD.md` er gameplay-kilden, og `DESIGN.md` er den gældende visuelle reference.
- Seneste gameplay-merge i produktion: [#33 — Redesign Talent Tree interactions](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/33), squash merge `f98ee86`.

## Næste anbefalede skridt

1. Verificér Talent Tree-pinch, modalens læsbarhed og state-kontrast på en fysisk iPhone ved både 320 px og 384 px.
2. Fresh-save-playtest hvor ofte Chaos Forge opleves spændende frem for tilfældig, og om Precision-premium er en reel safety valve frem for et ikke-valg.
3. Sammenlign rene Power-dice mod blandede Power/Momentum/Rend-builds i Dungeon 2; retune evolution-output, hvis all-Power bliver den dominerende løsning.
4. Sammenlign et helt Dungeon 2-run med Auto Combat On/Off på en fysisk mobil og mål faktisk tid per round, encounter og descent.
5. Tune enemy HP, Shield og Heal mod målet om typisk 2–4 rounds for relevante normale mobs, 4–6 for elites og 6–9 for bosses; one-round kills skal primært opstå efter overleveling.
6. Brainstorm Expedition Board videre uden at implementere det, og afvent stadig nye dice families.

## Åbne spørgsmål og kendte risici

- Det nye multi-dice-layout, Spiked Behemoth og face-inspector er lokalt browser-verificeret ved 320 px og 384 px uden overlap eller horisontal overflow. Den fulde Dungeon 2-progression skal stadig gennemspilles på en fysisk mobil.
- Simuleringen bekræfter den matematiske dybde- og reward-kurve, men modellerer ikke spillerens face-køb eller oplevet combat-tempo.
- Mixed-evolution regressionen går materielt længere end flade værdi-3 Attack Dice, men økonomien er endnu ikke simuleret som en fuld sekvens af konkrete Chaos/Precision-køb. Særligt 80-Soul-awakening og faldende Chaos-rabat skal playtestes mod faktiske rewards.
- Flere faces må foreløbig vælge samme evolution. Det er bevidst for første playtest, men all-Power kan blive en ny løst strategi og skal sammenlignes mod Momentum/Rend, før systemet betragtes som balanceret.
- Det skal playtestes, hvor ofte spillere prioriterer de valgfrie HP-ranks frem for anden die, og om 8/16/32-XP-kurven opleves som et reelt valg frem for en fælde.
- Enemy intent-rækken er dimensioneret til 1–3 dice; flere end tre kræver en ny kompakt præsentation eller sekventiel paging.
- Dungeon 2-tal er en simuleret første tuning. Det skal måles, om floor 4, floor 5 og boss-væggen opleves lige så glidende i faktiske runs som i den matematiske model.
- Background-fast-forward bruger et bevidst estimeret tidsbudget per intent, die og resolution. Det skal kalibreres mod målt live-combat, så AFK-progress hverken bliver hurtigere eller langsommere end synlig automation.
- Browserens `pagehide`, `pageshow` og `visibilitychange` er dækket af samme idempotente checkpoint-flow, men fysisk mobil kan suspendere eller dræbe processen uden alle events; sidste persisterede checkpoint begrænser datatabet.
- Dev-profilets 337 XP og 255 Souls er et fast playtest-snapshot; hvis Dungeon 1-rewards, talentpriser eller face-priser tunes, skal preset og dets afledte økonomitest opdateres sammen.
- Legacy-kode findes stadig i repository og må ikke blandes ind i den nye production-state.

## Bindende beslutninger

- Spillet er incremental-first; et kill giver permanent fremgang, og Defeat koster kun dungeon-position.
- Normal Victory er en kort reward-pulse uden information om næste enemy; Combat introducerer først enemy-data på det nye floor.
- Boss Victory og Defeat viser descentens `enemiesDefeated`, `xpEarned` og `soulsEarned`; player-facing hedder valutaerne kun `XP` og `Souls`, aldrig `Permanent`, `Kept` eller `Secured` på outcome-skærmene.
- XP giver permanent adgang og kapacitet; Souls forbedrer konkrete permanente dice/faces.
- Soul Forge har to komplementære metoder: Chaos forbedrer en tilfældig eligible face billigere, mens Precision vælger den konkrete face til 2× basisprisen. Chaos-rabatten falder med antallet af eligible faces og er nul ved én mulighed.
- Attack-faces stopper ved værdi 3, vækkes via Forge og vælger derefter gratis Power, Momentum eller Rend permanent. Power er 5 direkte Attack; Momentum er 3 Attack +2 til næste face med Attack-fallback; Rend er 2 Attack +2 forsinket Bleed.
- Nyt Bleed skader først fra næste player resolution, ignorerer enemy Shield, falder med 1 efter hvert tick og annullerer enemy intent ved lethal damage.
- Kun permanent `bankedSouls` (player-facing `Souls`) og `xp` findes som valuta/progression; `runSouls` findes kun som version-6 migrationsfelt.
- Spilleren starter med én Attack Die.
- Et dice-unlock giver én navngiven permanent die, aldrig uendelige kopier; spilleren equipper den selv.
- Battle-Hardened har tre ranks til 8/16/32 XP og giver +2 Max HP per rank, maksimalt +6.
- Battle-Hardened rank 1 er eneste HP-krav for Twin Arsenal; rank 2 og 3 er valgfrie og må ikke blokere videre progression.
- Twin Arsenal koster 16 XP efter rank 1, så terning nummer to stadig kan nås efter højst tre floor-1 clears via den direkte vej.
- Shieldcraft åbner Survival, Arsenal og Control samtidigt uden branch lockout.
- Talent Tree er et næsten sort, edge-to-edge spatial canvas med minimal fast HUD; det må ikke præsenteres som shrine, kort, kolonner eller en almindelig scroll-side.
- Talent-noder beholder fast die-størrelse og afstand og udforskes med frit pan i begge akser. Træet komprimeres ikke til mobilbredden, og en recenter-knap returnerer kameraet til den aktuelle frontier.
- Talent Tree zoomer fra 65% til 140% med pinch, `− / +` og Ctrl/Cmd + wheel. Nodeknapper og SVG-forbindelser ligger i samme transformerede DOM-world, mens zoom/recenter/HUD forbliver skærmfaste, så skarphed, semantic buttons og keyboardfokus bevares.
- Talent Tree viser kun den aktuelle frontier fuldt og ét kommende lag som en navnløs, ikke-interaktiv fog-silhuet.
- Talent-køb ruller noden på stedet, tænder forbindelsen og afslører nye nodes som en kort chain reaction; Shieldcraft splitter effekten i tre.
- Dev-reset er tilgængelig nederst på Hubben og må først udføres efter et eksplicit andet bekræftelsestryk; den nulstiller både permanent progression, dungeon-progress og et eventuelt aktivt run.
- Auto Combat koster 12 XP direkte efter Twin Arsenal og er én spillerstyret toggle for draw, resolve, næste round og normale floor-transitions. Den stopper ved Defeat og Boss Victory; Auto Retry er senere progression.
- Auto Combat må fast-forwarde et aktivt run efter browser-suspension, men kun proportionalt med reel fraværstid og aldrig forbi Defeat eller Boss Victory. Rewards skal forblive idempotente ved gentagne reload/resume-events.
- Run Menu pauser både live Auto Combat og background-fast-forward uden at ændre spillerens Auto Combat-præference. `Leave Dungeon` kræver bekræftelse, tæller ikke som Defeat og nulstiller kun det aktive runs floor-, HP-, enemy- og round-state.
- MVP-dungeonen har 10 floors; floor 10 er boss og giver sin permanente reward præcis én gang ved sejr.
- Dungeon 1 genbruger fire basale archetypes som Level 1/2, har én Elite og er attack-only. Demon er boss og har heller ingen Shield.
- Dungeon 2 genbruger fire nye archetypes som Level 1/2. Alle normale mobs har én Attack Die og én midlertidig Shield Die; Spiked Behemoth har desuden én Heal Die.
- Healing Arts forbliver tilgængelig sent i Dungeon 1, så player lærer Heal før enemies. Second Descent kræver første Dungeon 1-clear og 60 XP.
- Alle udstyrede dice skal trækkes hver runde i tilfældig rækkefølge.
- Hver enemy har 1–3 data-driven dice med seks stabile faces; alle resultater fastlåses ved rundestart og gemmes før animationen.
- Enemy Shield erstattes ved hver rundestart, absorberer player Attack og udløber efter enemy-fasen. Enemy Heal udføres før Attack, men kun hvis enemy overlever player-fasen.
- Enemy intent vises som den præcise landede værdi efter et kort reveal. Spilleren kan inspicere alle seks faces, men kan ikke rulle egne dice, mens intent ruller.
- Dice og totals vises først, når deres roll/resultat er afsløret.
- Player resolution sker før enemy resolution.
- En død enemy angriber aldrig.
- Player death har prioritet ved reel samtidig død.
- Visuel retning er et fysisk dark-fantasy 3D-pixel-diorama, ikke en samling web-cards.
- Combat-roll-fladen bruger næsten-sort negativ plads uden runer, tom piedestal eller idle-copy; kun et aktivt roll må dominere området.
- Enemy-navne bruger en ren sans-serif uden display-shadow, og stabile compact content-navne skal mappe direkte til deres egne sprite-sheets uden den gamle hardcodede placeholder.
- Enemy-stage bruger samme næsten-sorte negative plads som roll-fladen uden murværk, bue eller piedestal; sprite, intent og HP er de eneste højkontrastelementer.
- Floor-10 Demon bruger den store røde hornede boss-art fra `Demon-GeneratedSource-v2.png` og fire 100 px-høje horisontale animation-sheets.

## Historik

### 2026-07-28 — Zoom og stort Talent Tree-overlay

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Talent Tree kan zoomes 65–140% med pinch, knapper eller Ctrl/Cmd + wheel. Nodevalg åbner nu et stort, tilgængeligt modal-overlay med væsentligt større tekst, tydelig status, rank, effekter og købshandling. Canvas-nodes skelner eksplicit mellem `Owned`, `Max`, `Buy`, `Open` og låst.
- Beslutninger: Zoom bevarer et stabilt anker og recenter respekterer den aktuelle skala. Købte nodes bruger massiv cyan-fyldning og checkmark; købsklare nodes bruger lys outline/pulse; åbne men for dyre nodes må ikke ligne prerequisite-låste nodes. Talent Tree nulstiller body-scroll ved indgang.
- Berørte områder: Talent Tree canvas, zoom-/viewport-matematik, node-præsentation, detail-overlay, mobile styles, tests, GDD, DESIGN, README og progress-log.
- Validering: `npx tsc --noEmit`, 21 testfiler med 114 tests, ESLint, production-build og `git diff --check` består. Lokal 384 px game-shell-browsertest verificerer 100→85% zoom, stabil recenter ved skala, scroll-reset, stort modal-overlay, disabled baggrundskontroller, større copy/effects/købsknap samt synlige `Owned`, `Max` og `Buy`-states gennem et rigtigt talentkøb og reveal.
- Kendte mangler: Native pinch skal stadig godkendes på en fysisk iPhone; browserkontrollen verificerer zoomknapper og anker-matematik, men kan ikke konstruere native `PointerEvent` i den tilsluttede runtime.
- Git: `9cfcb1a` — `Redesign Talent Tree interactions`; PR [#33](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/33) er squash-merget til `main` som `f98ee86`. Vercel production-deployment `dpl_3xikchDQagpzAhbAU2EyRo6xkq22` er `READY`; den offentlige URL er browser-verificeret med fresh 88-XP-save, 100→85% zoom, Battle-Hardened-modal og disabled baggrundskontroller, og deploymentets error-scan er rent.

### 2026-07-28 — Fresh QoL-teststart med 88 XP

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Hubben har en ny totrinsbekræftet `DEV · Fresh QoL test · 88 XP`. Den erstatter det aktuelle save med den normale starttilstand og 88 uspente XP, så spilleren selv kan købe hele vejen til både Auto Combat og Quick Draw.
- Beslutninger: Den kanoniske `DEV · Reset game` forbliver 0-XP fresh save. Testpuljen beregnes data-driven fra de fem aktuelle talentpriser og er præcis 0 efter Battle-Hardened I, Twin Arsenal, Auto Combat, Shieldcraft og Quick Draw; ingen talents er forudkøbt.
- Berørte områder: Nyt early-QoL dev-preset, Zustand-action, Hub developer tools, tests, README og progress-log.
- Validering: `npx tsc --noEmit`, 20 testfiler med 110 tests, ESLint, production-build og `git diff --check` består. Lokal browsertest verificerer totrinsbekræftelsen, canonical fresh-save med 88 XP/0 Souls/én Worn Blade Die samt første 8-XP-køb og det efterfølgende Twin Arsenal-reveal.
- Kendte mangler: Dev-starten er et testværktøj og må ikke bruges som reference for den rigtige fresh-save XP-balance.
- Git: `2cdfb9d` — `Add early QoL test start`; PR [#31](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/31) er squash-merget til `main` som `eaf698c`. Vercel production-deployment `dpl_FLfR9SZPNbvjHyPEqBF62Qjwa1pz` er `READY`; den offentlige Hub er browser-verificeret med den nye 88-XP-trigger, og error-scannet for deploymentet er rent.

### 2026-07-28 — Controlled Soul Forge og Attack-evolutioner

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Workshop er ombygget til Chaos Forge og Precision Forge. Attack-faces vækkes ved værdi 3 og får efter bekræftelse én permanent identitet: Power, Momentum eller Rend. Evolutioner vises på Workshop-faces, dice summaries, landede combat-dice og Bleed-status.
- Beslutninger: Chaos ruller kun blandt eligible faces, får op til 35% rabat og mister rabatten, når puljen krymper; én eligible face koster det samme som Precision. Precision koster 2× den oprindelige numeriske pris. Evolution-valget er gratis efter awakening og irreversibelt i denne version. Nyt Bleed starter næste round, går gennem Shield og falder med 1 efter hvert tick.
- Berørte områder: Nyt pure Forge-domæne, dice/combat/dungeon/progression-typer, save v11 og migration, manuel/automatisk/background combat, simulator, Workshop/Combat/dice UI, styles, GDD, README og testpakke.
- Validering: `npx tsc --noEmit`, 19 testfiler med 108 tests, ESLint, production-build og `git diff --check` består. Lokal browser verificerer Soul Forge, 4-dice/all-3-profilet, 52-Soul Chaos-awakening, Evolution Ready-reveal, permanent Rend-confirmation og faldende eligible pool i den 384 px brede game-shell uden error-overlay.
- Kendte mangler: Den fulde købskurve og all-Power kontra mixed builds skal subjektivt playtestes; ingen respec findes endnu. Expedition Board og nye dice families er bevidst ikke implementeret.
- Git: `8999168` — `Add controlled Forge and face evolutions`; PR [#29](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/29) er squash-merget til `main` som `c63d7ad`. Vercel production-deployment `dpl_FcjUMDK9ikw43uNhpShmCpJLLp2g` er `READY`, og den offentlige URL er browser-verificeret med save-v11 migration samt Soul Forge/Chaos/Precision UI.

### 2026-07-28 — Beskyttet Run Menu og mid-run leave

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Combat-headeren har fået en diskret dørknap, som åbner en mobil bottom sheet med Resume Run og en totrinsbeskyttet Leave Dungeon-handling. Menuen pauser live Auto Combat og AFK-fast-forward; et bekræftet leave returnerer atomisk til Hub.
- Beslutninger: Leave tæller ikke som Defeat og giver ingen ekstra rewards. Allerede optjent XP/Souls samt talents, dice og øvrig permanent progression bevares, mens aktiv floor, HP, enemy, round og draw-state nulstilles. Auto Combat-præferencen bevares til næste run.
- Berørte områder: Combat-header, ny Run Menu-komponent, Auto Combat lifecycle, Zustand-store, tests, mobile styles, GDD, README og progress-log.
- Validering: Begge TypeScript-checks, 18 testfiler med 96 tests, ESLint, production-build og `git diff --check` består. Browseren verificerer hele flowet ved 384 px uden overflow, error-overlay eller console errors: åbning/fokus, Resume, første leave-trin, advarsel, Confirm Leave, Hub-retur med uændrede Souls samt Auto Combat-pause efter det igangværende atomiske roll og korrekt fortsættelse efter Resume.
- Kendte mangler: Ingen kendte inden for det implementerede scope.
- Git: `d8f791b` — `Add protected mid-run menu`; PR [#27](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/27) er squash-merget til `main` som `28f02ac`. Vercel preview `dpl_6VJkf77dDJZYCG5eSWTLo9vp3Zrf` og production-deployment `dpl_7hWamfVLJ9bdwKk3K7cBVm9oEMG5` er `READY`; den friske production-artifact er browser-verificeret ved 384 px med dørknap, fokuseret Resume Run og korrekt pause-dialog uden console errors eller overflow.

### 2026-07-27 — Tidlig Auto Combat og AFK-resume

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Auto Roll er erstattet af en tidlig Auto Combat-node direkte efter Twin Arsenal. Den fælles toggle automatiserer alle player-rolls, Resolve Round, næste round, normale Victory-pulses og næste floor, men stopper ved Defeat eller Boss Victory. Et suspenderet run fast-forwardes deterministisk ved resume og viser et modal recap med tid, floor, kills, XP og Souls.
- Beslutninger: Auto Combat koster 12 XP, har ingen Auto Retry og pauser efter et AFK-recap, indtil spilleren lukker rapporten. Quick Draw forbliver separat hastighedsprogression. Encounter-stats ændres ikke i samme pass; simulatoren måler nu rounds per floor, så automationens effekt kan playtestes før balancekurven tunes.
- Berørte områder: Talent-content/layout, progressionstyper, save-version 10 og migration, pure Auto Combat-engine, combat-/post-combat-orkestrering, App lifecycle, AFK-recap UI, dev-profilet, simulator, tests, GDD og README.
- Validering: Begge TypeScript-checks, 17 testfiler med 93 tests, ESLint, production-build og `git diff --check` består. Browseren verificerer 384 px shell uden overflow eller error-overlay, tidlig Auto Combat-node i dev-profilet, live draw/resolve, sikker manuel pause, automatisk floor-transition, 20/45/60-sekunders background-resume, recap-dismiss og terminalt stop på Defeat uden Auto Retry.
- Kendte mangler: Fysisk iOS/Android-suspension og fuld Spiked Behemoth-run skal fortsat playtestes. Background-tidsbudgettet er en første kalibrering mod de nuværende animationstider.
- Git: `fbb896c` — `Add early Auto Combat and AFK resume`; PR [#25](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/25) er squash-merget til `main` som `79c3429`. Vercel preview `dpl_EyZMXfbNQbeBWKrs87aKauCfkSJa` og production-deployment `dpl_5sWWPUtE8ivsWowdA8d1AkvLAgCZ` er `READY`; den friske production-artifact er browser-verificeret med købt Auto Combat-node og synlig `Auto Combat Off`-toggle i Dungeon 2.

### 2026-07-27 — Post-Dungeon-1 dev-profil

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Hub-startskærmen har fået en beskyttet `DEV · Load Dungeon 2 profile`-handling. Efter bekræftelse erstattes save atomisk med én Dungeon 1-clear, 15 Max HP, fire slots, Worn Blade/Striker/Iron Guard/Vitality udstyret, alle faces på mindst 3 og The Iron Descent ulåst men urørt.
- Beslutninger: Preset’et repræsenterer 325 brugt XP og 255 brugte Souls fra et realistisk repeat-run-forløb frem til første boss-clear. Quick Draw og Auto Roll købes ikke, så Dungeon 2’s manuelle grundtempo kan vurderes. Profilen lander i Hubben frem for direkte combat, så Talent Tree, Workshop og loadout kan inspiceres først.
- Berørte områder: Nyt pure dev-profile-modul, atomisk Zustand-action, Hub developer tools og confirmation-UI, responsive/focus-styles, tests, README og progress-log. Save-format og gameplayøkonomi ændres ikke.
- Validering: Begge TypeScript-checks, 16 testfiler med 84 tests, ESLint, production-build og `git diff --check` består. Hele UI-flowet er browser-verificeret i den 384 px brede game-shell uden overflow: gammel profil → confirmation → indlæst 4/4-loadout → Talent Tree → Workshop → Dungeon Select → Shieldbearer på Dungeon 2 floor 1 med 15 HP og fire dice i baggen. Vercel production-deployment `dpl_BpwVEKNkfWEirbt5ChBey5jFbwRs` er `READY`, og samme flow er verificeret direkte på den offentlige production-URL.
- Kendte mangler: Ingen kendte implementeringsmangler inden for preset-scope; balanceantagelserne skal holdes synkroniseret med fremtidig tuning af Dungeon 1.
- Git: `c496a11` — `Add post-Dungeon-1 dev profile`; PR [#23](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/23) er squash-merget til `main` som `71a18d6` og deployet til production.

### 2026-07-27 — Enemy-dice orientering rettet globalt

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Den fælles enemy-die renderer nulstiller nu altid 3D-rotationen, når et Attack-, Shield- eller Heal-resultat går fra rolling til landed, active eller cancelled. Rettelsen gælder alle seks faces, alle enemy-typer, alle runder og både single- og multi-dice intents.
- Beslutninger: Den animerede 3D-cube og den flade resultat-face har separate React-identiteter. Den flade face deklarerer samtidig eksplicit `rotateX: 0`, `rotateY: 0` og `y: 0`, så en fremtidig animation ikke kan efterlade en gammel inline-transform.
- Berørte områder: Fælles `EnemyIntentDie`, combat-browserflow og progress-log. Der er ingen ændring af combat-regler, balance, rewards eller saves.
- Validering: Begge TypeScript-checks, alle 80 tests, ESLint, production-build og `git diff --check` består. Browseren reproducerede den gamle production-fejl som en arvet `rotateY(630deg)`/3D-matrix. Rettelsen er verificeret på flere mobs og gentagne runder; landed og cancelled ender på `transform: none`, mens active kun bruger positiv, ikke-spejlet skalering. Vercel preview og production-deployment `dpl_EQKnykpjDjVShSJLBN4LEHN1BrnH` er `READY`, og den offentlige production-URL er browser-verificeret med en flad, korrekt orienteret enemy-face.
- Kendte mangler: Ingen kendte mangler inden for rettelsens scope.
- Git: `74d32ba` — `Fix all enemy die orientations`; PR [#21](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/21) er squash-merget til `main` som `e4e12ce` og deployet til production.

### 2026-07-27 — Dungeon 2 og multi-dice enemies

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Dungeon 1 er blevet en ren attack-only introduktion med genbrugte Level 1/2-enemies. Dungeon 2, The Iron Descent, tilføjer Attack + Shield på normale mobs og Attack + Shield + Heal på Spiked Behemoth. Enemy-intent kan vise og inspicere 1–3 mini-dice, og Talent Tree har fået den clear-gatede Second Descent-node.
- Beslutninger: Heal forbliver en sen Dungeon 1-player-unlock for at bevare den godkendte MVP-pace og lære mechanicen før enemies. Enemy Shield er midlertidigt; en overlevende enemy healer før Attack. Dungeon 2-balancen bruger individuelle face-køb som synlige progressionstrin.
- Berørte områder: Dungeon-, encounter- og enemy-dice-content, pure combat-resolution, Zustand-store/save v9, Talent Tree, Combat UI, Spiked Behemoth-sprite, simulator, tests, GDD, designreference og README.
- Validering: `npx tsc --noEmit`, `npx tsc -p tsconfig.app.json --noEmit`, alle 80 tests, ESLint, production-build og `git diff --check` består. D1 med én die, D2 med to dice og Spiked Behemoth med tre dice samt face-inspector er lokalt browser-verificeret ved 320/384 px uden console errors, error overlay, overlap eller horisontal overflow. Vercel markerede production-deployment `dpl_D4hTvk9AdKjnM2rnrsYKgT5npF2A` som `READY`; den offentlige app, JavaScript-/CSS-bundles og alle fire Spiked Behemoth-sheets svarer HTTP 200, og produktionen er browser-verificeret ved 384 px uden console-fejl.
- Kendte mangler: Dungeon 2 kræver stadig subjektiv mobil-playtest; rewards og timing er første simulerede tuning.
- Git: `f05a69a` — `Build multi-dice enemy progression`; PR [#19](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/19) er squash-merget til `main` som `2affd9e` og deployet til production.

### 2026-07-26 — Clean enemy-stage og korrekt Demon-boss

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Enemy-stage matcher nu den rene roll-flade uden murværk, bue eller piedestal. Slime Crawler er skaleret cirka 24 % op, og floor-10 Demon er udskiftet fra den forkerte lille humanoide sprite til en stor rød hornet boss med Idle, Attack, Hurt og Death.
- Beslutninger: Intent, navn og HP bevares som gameplay-information på den næsten-sorte flade. Slime Crawler har creature-specifik skalering. Demonens eksisterende røde source-art er fastholdt som identitet og ombygget til den canonical 100×100-cell pipeline.
- Berørte områder: Combat-komposition og CSS, enemy-sprite-konfiguration og mappingtest, fire Demon-animation-sheets, ny versioneret Demon-source, visuel designreference og progress-log.
- Validering: `npx tsc --noEmit`, alle 67 tests, ESLint, production-build og `git diff --check` består. Demon-sheets er visuelt inspiceret og verificeret som 600×100 Idle/Attack samt 400×100 Hurt/Death med transparente hjørner og ingen resterende grønne chroma-pixels. De ændrede React-komponenter er gennemgået mod React-kvalitetsreglerne uden fund. Vercel markerede production-deploymentet `READY` for `65f846c`; den offentlige HTML-, JavaScript- og CSS-bundle samt alle fire Demon-sheets svarede HTTP 200, bundlet bruger den versionerede Demon-v2-path uden de fjernede arch-/pedestal-klasser, og der var ingen runtime-fejl i den seneste time.
- Kendte mangler: Browserruntime er fortsat utilgængelig, så den samlede sprite-størrelse, baseline, chroma-edges og negative plads skal vurderes subjektivt ved 320 px og 384 px efter deployment.
- Git: `0b5df21` — `Clean enemy stage and replace demon boss`; PR [#17](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/17) er squash-merget til `main` som `65f846c`.

### 2026-07-26 — Combat UI og early-enemy-sprites poleret

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Enemy-navnet er gjort renere og mere læsbart, Slime Crawler og Marrow Bat bruger nu hver deres korrekte animation-sheets, og roll-fladen er ryddet for murstensbaggrund, runer, tom piedestal og overflødig idle-copy.
- Beslutninger: Sprite-rendereren normaliserer stabile compact content-navne som `SlimeCrawler`, `MarrowBat` og `BloodOrc`; den gamle hardcodede Slime Crawler-fallback er fjernet. Den tomme roll-flade bruger bevidst negativ plads, mens draw-header og primær knap kommunikerer state.
- Berørte områder: Fælles enemy-sprite-renderer og regressionstest, Combat-komposition, combat-CSS, visuel designreference og progress-log.
- Validering: `npx tsc --noEmit`, alle 66 tests, ESLint, production-build og `git diff --check` består. De ændrede React-komponenter er gennemgået mod React-kvalitetsreglerne uden fund, den lokale Vite-root svarede HTTP 200, og begge enemy-sæt følger 100 px høje horisontale sheets med det forventede frame-antal. Vercel markerede production-deploymentet `READY` for `57872fc`; den offentlige HTML-, JavaScript- og CSS-bundle svarede HTTP 200, indeholdt begge korrekte sheet-paths uden den fjernede idle-copy eller rune-styles, og der var ingen runtime-fejl i den seneste time.
- Kendte mangler: Browserruntime havde ingen tilgængelig browser, så sprite-størrelse, baseline, typografi og den ryddede roll-flade skal stadig vurderes subjektivt ved 320 px og 384 px.
- Git: `30f9c75` — `Polish combat presentation`; PR [#15](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/15) er squash-merget til `main` som `57872fc`.

### 2026-07-26 — Incremental Victory- og Defeat-flow

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Normal Victory er reduceret til en hurtig XP/Souls reward-pulse med HP, floor-progress og én Continue-knap. Boss Victory opsummerer hele descenten, og Defeat viser floor reached, enemies defeated samt optjent XP/Souls.
- Beslutninger: Next-floor enemy-info vises ikke længere efter Victory. Outcome-skærme bruger kun player-facing `XP` og `Souls`; teknisk `bankedSouls` bevares for save-kompatibilitet. Descent-statistik er kun opsummering og introducerer ingen ny valuta eller risiko.
- Berørte områder: Run-typer og version-8 migration, reward-transition, fælles outcome-reward-komponent, Victory/Boss Victory/Defeat, responsive styles, SSR/store-tests, GDD, designreference, README og implementationplan.
- Validering: `npx tsc --noEmit`, alle 63 tests, ESLint, production-build og `git diff --check` består. De ændrede TSX-filer er gennemgået mod React-kvalitetsreglerne uden fund. Vercel markerede production-deploymentet `READY` for `1c06584`; den offentlige URL og JavaScript-bundlet svarede HTTP 200, bundlet indeholdt den nye outcome-copy uden `Permanent Souls` eller `Souls kept`, og der var ingen runtime-fejl i den seneste time.
- Kendte mangler: Browser-CLI’en er ikke installeret i runtime, så den nye komposition og animationstiming skal fortsat vurderes subjektivt ved 320 px og 384 px.
- Git: `45699ed` — `Redesign victory and defeat outcomes`; PR [#13](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/13) er squash-merget til `main` som `1c06584`.

### 2026-07-26 — Permanent Soul-loot uden extraction

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Hvert besejret mob giver nu sit faste Soul-drop direkte til spillerens permanente beholdning sammen med permanent XP. Victory har én vej videre, og Defeat fjerner hverken XP eller Souls.
- Beslutninger: Extraction, `At Risk`, Soul Gates, `runSouls` og Soul-tab ved død er fjernet fra det nye spil. XP åbner fortsat adgang og kapacitet; Souls bruges fortsat kun på konkrete permanente dice/faces.
- Berørte områder: Reward- og run-state, version-7 migration, Victory/Combat/Defeat/Hub/Workshop UI, simulator, tests, GDD, visuel reference, README, implementationplan og guardrails.
- Validering: `npx tsc --noEmit`, alle 60 tests, ESLint, production-build og `git diff --check` består. Victory- og Defeat-skærmene er dækket af SSR-komponenttests. Vercel markerede production-deploymentet `READY` for `4302736`; den offentlige URL svarede HTTP 200, og bundlet indeholdt de nye permanente Soul-tekster uden `At risk` eller extraction-copy.
- Kendte mangler: De eksisterende Soul-rewards og face-priser er endnu ikke retunet efter fjernelsen af currency-tab og skal måles i fresh-save-playtest.
- Git: `6329325` — `Make every Soul reward permanent`; PR [#11](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/11) er squash-merget til `main` som `4302736`.

### 2026-07-23 — Sikker dev-reset på Hub

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Hubben har nu en diskret `DEV · Reset game`-knap. Først efter et separat rødt advarselstrin kan spilleren slette al progression og starte igen med det canonical fresh save.
- Beslutninger: Reset bruger den eksisterende atomiske `resetProgress()` frem for direkte localStorage-manipulation. Handlingen nulstiller XP, Souls, talents, dice og face-upgrades, loadout, dungeon-progress, aktivt run og combat-state samlet.
- Berørte områder: `HubScreen.tsx`, Hub-styles, Hub SSR-test og store-reset-test.
- Validering: `npx tsc --noEmit`, alle 55 tests, ESLint og production-build bestod. Vercel markerede production-deploymentet READY for `0b0ee31`; den offentlige URL svarede HTTP 200, og produktionsbundlet indeholdt både reset-triggeren og bekræftelseshandlingen.
- Kendte mangler: En interaktiv browser var ikke tilgængelig, så confirmation-layoutet mangler fortsat subjektiv visuel 320/384 px-kontrol.
- Git: `b90c36c` — `Add safe game reset control`; PR [#9](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/9) er squash-merget til `main` som `0b0ee31`.

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
