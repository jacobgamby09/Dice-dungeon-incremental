# Dice Dungeon Incremental — Progress Log

Status: aktiv, fælles projektlog.
Senest opdateret: 2026-07-30.

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

- **Arcade Polish v1 er implementeret og pushed på `codex/arcade-foundation-v1`:** Combat har nu tydelige roll-states, familie-farvet landing, source/travel/arrival-scorefeedback, separate HP-overlays for damage/heal/block, eksplicit partial-block-feedback, resolution-toner samt en klar cyan Auto Combat/Pause-mode. Det store roll-felt forbliver rent sort i alle states; feedback er afgrænset til terning, transfer og destination. Typografi og funktionelle UI-ikoner er samtidig strammet op på tværs af Hub, Combat, Workshop, Talent Tree og outcomes uden ændringer i gameplay, rewards, economy eller save-format.
- **Pixel Arcade er valgt som spillets officielle visuelle retning:** `DESIGN.md` version 2.1 fastlåser ren sort canvas, funktionelle mættede farver, tre niveauer af hårde pixelrammer, fysiske 3D-terninger som hero-objekter og Arcade Polish-kontrakten for læsbar feedback. Den tidligere diorama-reference er arkiveret i `DESIGN_LEGACY_DIORAMA.md`.
- **Den canonical presentation layer er nu modulariseret på `codex/arcade-foundation-v1`:** det tidligere 1.100+ linjers test-override er flyttet fra `src/newGame.css` til tokens, shared, dice og screen-specifikke filer i `src/styles/arcade/`. Hubben viser ikke længere test/V2-copy, og Combat, Hub, Workshop, Talent Tree samt outcomes bruger et roligere sektion/handling-hierarki uden gameplay- eller saveændringer.
- **Classic Incremental V2 er nu en separat, spilbar eksperiment-branch:** `codex/classic-incremental-v2`. `main` og den nuværende production-version er bevidst urørte, indtil V2-pacingen er fysisk godkendt.
- V2 bruger save-version 14 og starter med én `Worn Blade Die` på præcis `1,1,1,1,1,1 Attack`. Version 13 migreres uden progressionstab; ældre production-saves nulstilles fortsat bevidst til en frisk V2-profil på denne branch.
- Første Slime har 3 HP og fast 2 Attack. Den friske spiller slår tre gange, vinder med 6/10 HP og får præcis 4 XP + 5 Souls; floor 2 er den første sikre væg.
- Workshoppen er nu et atomisk ritual i to synlige rul: spilleren vælger en permanent die, første rul vælger uniformt en eligible face, og andet rul bruger en separat Workshop Die til at afgøre `+1/+2/+3`. Souls trækkes og begge resultater persisteres før animationen, så reload mellem rullene fortsætter samme Forge uden dobbeltbetaling.
- Workshop Die starter `1–1–1–1–1–2`. West-talentet `Loaded Alloy` opgraderer fordelingen gennem `1–1–1–1–2–2`, `1–1–1–2–2–2` og `1–1–1–2–2–3`; et roll begrænses synligt af den valgte faces aktuelle cap-headroom.
- Workshop Die og player-dice i Combat deler nu samme fysiske cube-renderer, tumble-kurve og landed-state. Efter tumble vises det valgte face præcist frontvendt og bliver stående efter Forge-resultatet; den tidligere separate flade `+X`-overlay-face er fjernet.
- Workshop-jackpotgløden ligger i et separat dekorationslag bag cuben. `+2/+3` kan derfor ikke længere flade den bevarede 3D-kontekst ud eller få Workshop Die til at forsvinde under/efter gentagne Forge-rul.
- Pixel Arcade-Workshoppen holder target-face synlig under hele ritualet: den låste outline er transparent og dækker ikke længere face-værdi eller ikon. Det persisterede Workshop-resultat styrer fortsat den fysiske landing, men distribution-marker, jackpot-state og cap-note forbliver skjult gennem `target_locked` og `rolling_power` og afsløres først i `result`.
- Det nye Talent Tree er radialt omkring `Inner Spark`. Første rank koster 4 XP, giver +1 HP og åbner North/Arsenal, West/Workshop, South/Descent og East/Fate samtidigt. Alle fire første valg kan ses ved 100% zoom på 384 px.
- Talent Tree-clusteret er komprimeret, så alle direkte forbindelser højst er 185 world-pixels lange. Node-inspektøren viser nu kun navn, tydelig state/rank, store konkrete effekter, eventuelle seks die-faces og én købsknap; gentaget branch-label, beskrivelse, statusblok og preview-copy er fjernet.
- Auto Combat ligger direkte syd for centrum til 6 XP og inkluderer både roll, resolve, ny round og normal floor-transition. Twin Arsenal ligger nordpå til 32 XP og giver både slot 2 og den permanente Striker Die.
- Fatecraft er synlig som den låste østlige fremtidsgren efter centrum, men kræver første Dungeon 1-clear. Selve Charm/Fate Token-systemet er fortsat bevidst udskudt.
- Den nye journey-regression fastholder første random face-upgrade på run 1, Auto Combat på run 2–3, anden die på run 6–15 og første Dungeon 1-clear i en længere run 12–45-bue.
- Den fulde og bindende V2-GDD findes i `CLASSIC_INCREMENTAL_V2.md`. Den dokumenterer branchens vision, loop, økonomi, Workshop, komplette Talent Tree, dice-katalog, begge dungeons, pacing-rails, persistence samt implementeret/deferred scope. Nedenstående produktionsstatus beskriver fortsat den nuværende `main`-version som reference.
- Det nye permanente Dice Dungeon-spil er isoleret fra legacy bag-builder-systemet.
- En samlet MVP-slice findes med Hub, Talent Shrine, Loadout Rack, Workshop, dungeonvalg, combat, kompakt Victory/Boss Victory og descent-resumé ved Defeat.
- Spilleren starter med én permanent Attack Die. Shield og Heal er senere progression.
- XP Talent Tree er nu et næsten sort, skærmfyldende spatial canvas med frit pan, 65–140% pinch/knap/Ctrl-wheel-zoom, faste nodekoordinater, die-sized talent-noder, SVG-forbindelser, stort modal-overlay, tekstfri canvas-states gennem fyldning/checkmark/rank-pips/outline/puls/lås, fog-silhuetter og chain-reaction reveals.
- Battle-Hardened har tre ranks á +2 Max HP for maksimalt +6; rank 1 åbner slot 2 og Striker-vejen, mens rank 2 og 3 er valgfrie.
- Talentforløbet giver derefter slot 2 og en unik Striker Die. Auto Combat åbner direkte efter Twin Arsenal; senere følger Shield, tre samtidige grene, Heal, fire slots og Quick Draw.
- Second Descent åbner Executioner Doctrine og Tower Discipline samtidigt. De giver hver én unik post-Dungeon-1-sidegrade uden auto-equip: Executioner Die og Tower Die. Begge har fire normale familie-faces og to faste signaturfaces.
- Nye dice er unikke permanente objekter, auto-equippes ikke og vælges aktivt inden for spillerens slot-cap.
- Hubben har en diskret dev-reset med et separat bekræftelsestrin, som kan genskabe hele fresh-save-tilstanden uden manuel localStorage-rydning.
- Hubben har en separat fresh QoL-teststart med 88 uspente XP — præcis nok til den direkte vej gennem Battle-Hardened I, Twin Arsenal, Auto Combat, Shieldcraft og Quick Draw.
- Hubben kan desuden indlæse en totrins-bekræftet Build Diversity-profil med realistisk post-Dungeon-1-talent spend, seks opgraderede permanente dice, fire aktive slots, Power/Momentum/Rend på Executioner Die og Dungeon 2 klar til systematisk playtest.
- Hvert besejret mob giver sit faste XP- og Soul-drop permanent med det samme; Defeat nulstiller kun dungeon-positionen.
- `The First Descent` genbruger Slime, Slime Crawler, Goblin og Skeleton som Level 1/2-varianter, har en Skeleton Elite på floor 9 og Demon-boss på floor 10. Alle har kun én Attack Die.
- `The Iron Descent` er Dungeon 2 med Shieldbearer, Cultist, Orc og Blood Orc som Level 1/2-varianter. Normale mobs har Attack + Shield, mens Spiked Behemoth-bossen har Attack + Shield + Heal.
- Alle udstyrede dice trækkes fra en blandet draw-pile uden replacement; der findes ingen faste type-slots.
- Hver enemy har nu 1–3 data-drevne seks-sidede dice. Alle resultater fastlåses og persisteres før reveal-animationen, hvorefter spilleren får de præcise Attack-, Shield- og Heal-værdier at reagere på.
- Enemy-intent bruger separate render-identiteter til den roterende 3D-cube og den flade resultat-face. Landed, active og cancelled nulstiller altid X/Y-rotation, så ingen enemy-die kan arve en spejlvendt roll-transform på tværs af faces, runder eller mobs.
- Combat resolver player først. En dræbt enemy udfører ikke sit intent.
- Roll-resultater afsløres først ved landing og flyver derefter op i den relevante round total.
- Player-dice skjuler nu bagsiden af alle seks 3D-faces i både WebKit/iPhone og standard-rendereren. Power-rolls kan derfor ikke kort vise et spejlvendt rødt Attack-symbol, der ligner Rend, mens cuben tumbler.
- Combat fordeler nu den lodrette mobilplads responsivt: enemy-stage er komprimeret, den aktive die har en mindst 130 px høj hero zone med ekstra luft over facen, og det aktive evolution/signature-lag ligger foran roll-headeren. Under 760 px viewport-højde komprimeres sekundære paneler, så hero-effekter og draw-order-rack ikke klippes.
- Combat viser Slime Crawler og Marrow Bat med deres egne animation-sheets, enemy-navne i en ren sans-serif samt næsten-sorte enemy- og roll-flader uden murværk, runer, tomme piedestaler eller idle-instruktioner. Slime Crawler har særskilt større skalering, og floor-10 Demon bruger den store røde hornede boss-art.
- Hub, Workshop, Combat og Victory følger nu den fysiske 3D-pixel-scene-retning.
- Workshop har to atomiske Soul-forges: billig Chaos Forge med controlled RNG og faldende rabat samt dyr Precision Forge til en valgt face. Normale Attack-, Shield- og Heal-faces vækkes fra værdi 3 og udvikles permanent inden for deres familie.
- Attack udvikles til Power, Momentum eller Rend; Shield til Bastion, Reserve eller Spikes; Heal til Restoration, Regrowth eller Overflow. Alle ni effekter deles af manuel combat, Auto Combat, background fast-forward og simulatoren.
- Executioner Die bruger Execute på 2/6 faces: 3 Attack, eller 5 hvis enemy begyndte roll-sekvensen på højst 50% HP. Tower Die bruger Fortify på 2/6 faces: 3 Shield og +2 til næste Shield-face, med +2 Shield-fallback hvis intet Shield følger.
- Signaturfaces er faste identitetsfaces og kan ikke rammes af Chaos/Precision Forge i det nuværende progression-band. Senere Face Mastery skal åbne deres videre scaling uden at gøre dem til almindelige værdi-faces.
- Loadout Rack har et stort Die Details-overlay med præcis signaturfrekvens, face-effekter og alle tre familie-evolutioner. Talent-unlocks viser den konkrete terning og dens identitet før køb, og Workshop viser altid effekten på den valgte face.
- Evolution-faces har nu tre gennemgående hero-identiteter i Workshop, dice summaries, 3D-roll, settled draw order og score-transfer: Power bruger et hvidgyldent stjerne-burst, Momentum bruger cyan chevrons/fartstriber, og Rend bruger crimson flænsespor. Et landet evolution-roll får desuden en kort farvet impact med sit navn.
- Momentum viser nu en vedvarende `Next die +2`-charge mellem rolls og navngiver bonus på den modtagende score-transfer. Rend viser `+2 Bleed` under transferen og genstarter en kort puls på den aktive stack ved enemy HP/tick.
- Normal Victory viser kun encounter-reward, totals, HP og dungeon-progress; næste-enemy-data er fjernet. Manuel mode bruger én Continue-knap, mens Auto Combat viser en kort reward-pulse og fortsætter til næste floor med en synlig Pause-handling.
- Auto Combat automatiserer player-rolls, Resolve Round, næste round og normale floor-transitions. Det stopper ved Defeat og Boss Victory og har endnu ingen Auto Retry.
- Et aktivt Auto Combat-run kan fast-forwardes efter browser-suspension via et persisteret checkpoint, tidsbudget og deterministisk random-seed. Resume viser et modal recap og pauser live automation, indtil spilleren lukker rapporten.
- Combat-headeren har en diskret Run Menu før floor-informationen. Menuen pauser live- og background-Auto Combat; et totrinsbekræftet leave returnerer til Hub med XP, Souls og permanent progression intakt.
- Save-formatet er version 12 og persisterer canonical talent-ranks, collection-, loadout-, dungeon-, encounter-, enemy-roll-, run-summary-, Forge-, signatur- og automation-progress sammen med aktive runs. Version-11 Executioner/Tower migreres til de nye canonical signaturfaces uden tab af kompatible normale faces.
- Den deterministiske balance-suite modellerer nu både enkelte dungeons og en hel progression journey med XP-køb, Soul-forges, evolutioner, loadout-skift, gentagne runs og dungeon-clears. Regressionen holder første face-køb inden run 2, anden die/Auto Combat omkring run 2–5, første evolution omkring run 2–5, Dungeon 1-clear omkring run 7–12 og Dungeon 2-clear senest omkring run 18 for blandede samt rene Power/Momentum/Rend-strategier.
- `NEW_GAME_GDD.md` er gameplay-kilden, og `DESIGN.md` er den gældende visuelle reference.
- Seneste gameplay-merge i produktion: [#45 — Fix mirrored Power roll faces](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/45), squash merge `96db7bf`.

## Næste anbefalede skridt

1. Gennemfør en fysisk iPhone/Safari-pass af den pushed Arcade Foundation + Arcade Polish: Hub, manuel/automatisk Combat, Workshop, Talent-køb samt Victory/Defeat.
2. Stress seks samtidige player-dice fysisk under hurtig Auto Combat; DOM-regressioner dækker allerede seks player-dice og tre enemy-dice.
3. Fresh-save-playtest V2 på iPhone og mål realtid til første kill, første totrins-Forge, Auto Combat, floor 3 og Twin Arsenal.
4. Test Workshop-ritualet gennem mindst 15–25 upgrades og vurder target-flicker, varighed samt `+2/+3`-øjeblikket.
5. Rebalancér Dungeon 2 specifikt til den langsommere V2-kurve.
6. Bestil eller byg først custom font, permanent ikonpakke og nye enemy-sprites efter den fysiske polish- og pacinggodkendelse.

### Production-reference

1. Gennemspil Build Diversity-devprofilen på en fysisk 384 px-iPhone og bekræft, at Power/Executioner-tumblen aldrig viser en spejlvendt face under hurtig Auto Combat.
2. Mål om `2/6` Execute/Fortify føles hyppigt nok til at definere terningen uden at dominere de fire evolvable familie-faces.
3. Sammenlign Shield-valgene Bastion/Reserve/Spikes og Heal-valgene Restoration/Regrowth/Overflow i både manuelle og automatiske runs.
4. Fresh-save-playtest om journey-regressionens run 2–5-evolution føles som fornyelse eller kommer for tidligt, og om Chaos Forge opleves spændende frem for tilfældig.
5. Fastlæg først Face Mastery II, signatur-scaling og næste output-band efter fysisk playtest; nuværende output-budget topper bevidst omkring 5.
6. Brainstorm Expedition Board videre uden at implementere det, og afvent en ny terningfamilie indtil den nuværende familie/signatur-arkitektur er valideret.

## Åbne spørgsmål og kendte risici

- Arcade Polish v1 er browser-verificeret ved 320×700, 384×844 og 430×932 uden horisontal overflow eller console warnings/errors. Fysisk Safari-timing, touch-følelse og seks samtidige player-dice under hurtig automation er fortsat den vigtigste åbne visuelle risiko.
- Den canonical Pixel Arcade-layer er nu opdelt i screen- og tokenfiler, men `src/newGame.css` indeholder fortsat det ældre strukturelle layout under præsentationslaget. Nye arcade-regler skal blive i `src/styles/arcade/`; en senere strukturel konsolidering skal ske gradvist med visuelle regressionstests.
- De nuværende detaljerede enemy-sprites er bevaret som aftalt. Det skal vurderes på fysisk mobil, om deres billedsprog passer til den simplere sort/hvide arcade-shell, før der bestilles eller bygges ny sprite-art.
- V2-journey-simulatoren måler runs, XP, Souls, gennemsnitlig face-værdi og floor-wall, men ikke den oplevede realtid med animationer. De nuværende run 12–45-grænser skal derfor fysisk valideres.
- Workshop-ritualet er browser-verificeret ved 384 px, inklusive reload efter target-roll og før power-roll. Den subjektive varighed og gentagelsesværdi ved mange køb skal stadig afprøves på fysisk mobil.
- Et Workshop-roll kan vise mindre faktisk fremgang end sit rå resultat, når target-face ligger tæt på cap. UI'et viser den cap-begrænsede fordeling før rullet, men det skal playtestes, om spilleren stadig oplever dette som fair.
- V2's `Fatecraft` har en rigtig unlock-effekt i Talent Tree, men den efterfølgende Charm-skærm og Fate Token-valuta findes endnu ikke. Noden er placeret bag første Dungeon 1-clear, så den ikke kan blive et tidligt tomt køb.
- De dybere Dungeon 2-tal og de eksisterende signatur-dice stammer stadig fra production-kurven. De er bevaret som teknisk reference, men er ikke endeligt V2-balanceret.
- V2 nulstiller versions-12 saves på sin separate preview. Det er bevidst isolation og må ikke merges til production uden en eksplicit migrationsbeslutning.
- Det nye multi-dice-layout, Spiked Behemoth og face-inspector er lokalt browser-verificeret ved 320 px og 384 px uden overlap eller horisontal overflow. Den fulde Dungeon 2-progression skal stadig gennemspilles på en fysisk mobil.
- Journey-simulatoren modellerer konkrete XP-køb, Chaos/Precision-forges, evolutioner og loadout mellem runs, men dens automatiske købsstrategi kan ikke måle spillerens forståelse, tøven eller oplevede combat-tempo.
- Første evolution opstår i seedede journey-regressioner omkring run 2–5, tidligere end den første Dungeon 1-clear. Det giver tidlig variation, men skal fysisk fresh-save-playtestes, før timingen betragtes som endeligt balanceret.
- Flere normale faces må foreløbig vælge samme evolution. Det er bevidst for første playtest, men rene direct-output builds kan blive en ny løst strategi og skal sammenlignes mod utility-valgene, før systemet betragtes som balanceret.
- Output-budgettet på cirka 5 er nu ens på tværs af direkte output og betinget utility, men Execute, Fortify og de seks nye Shield/Heal-evolutioner er endnu ikke fysisk balanceret mod de rene standard-dice.
- Den seedede journey med den nye arkitektur kan nå Dungeon 2-clear omkring run 10. Det består det nuværende senest-run-18-regressionskrav, men kan være for hurtigt og skal vurderes som pacing frem for blot som bestået test.
- Power/Momentum/Rend er browser-verificeret som separate mønstre, silhuetter og farver i den 384 px brede game-shell. Power-landingen og score-transferen bruger korrekt gylden Power-identitet, og 3D-bagsider er skjult med både standard- og WebKit-reglen; den subjektive aflæsning under hurtigt Auto Combat skal stadig godkendes på en fysisk mobil.
- Det skal playtestes, hvor ofte spillere prioriterer de valgfrie HP-ranks frem for anden die, og om 8/16/32-XP-kurven opleves som et reelt valg frem for en fælde.
- Enemy intent-rækken er dimensioneret til 1–3 dice; flere end tre kræver en ny kompakt præsentation eller sekventiel paging.
- Dungeon 2-tal er en simuleret første tuning. Det skal måles, om floor 4, floor 5 og boss-væggen opleves lige så glidende i faktiske runs som i den matematiske model.
- Background-fast-forward bruger et bevidst estimeret tidsbudget per intent, die og resolution. Det skal kalibreres mod målt live-combat, så AFK-progress hverken bliver hurtigere eller langsommere end synlig automation.
- Browserens `pagehide`, `pageshow` og `visibilitychange` er dækket af samme idempotente checkpoint-flow, men fysisk mobil kan suspendere eller dræbe processen uden alle events; sidste persisterede checkpoint begrænser datatabet.
- Build Diversity-devprofilets 427 XP og 545 brugte Souls er et fast playtest-snapshot med seks dice og tre evolutioner; hvis Dungeon 1-rewards, talentpriser eller face-priser tunes, skal preset og dets afledte økonomitest opdateres sammen.
- Legacy-kode findes stadig i repository og må ikke blandes ind i den nye production-state.

## Bindende beslutninger

### Classic Incremental V2-branch

- V2 udvikles og deployes separat; production-regler ændres ikke automatisk af eksperimentet.
- Frisk V2-start er 10 HP og én Attack Die med seks 1-faces.
- Første kill skal garantere både første Inner Spark-rank og første random Workshop-køb.
- V2-Workshoppen er player-facing random-only på target: vælg die, ikke face. Første rul fastlåser target-face, andet rul bruger den permanente Workshop Die til upgrade-mængden, og hvert køb giver mindst +1.
- Workshop Die starter `1–1–1–1–1–2` og forbedres kun gennem Workshop-retningens `Loaded Alloy`. XP ændrer dens mulige udfald; Souls betaler den konkrete permanente face-opgradering.
- Forge-operationen er atomisk: Soul-pris, target-face og Workshop-resultat gemmes ved første trin. Reload må genoptage andet trin og aldrig trække Souls eller anvende opgraderingen mere end én gang.
- V2-Talent Tree er radialt: Arsenal mod nord, Workshop mod vest, Descent/Automation mod syd og Fate/Charms mod øst.
- Inner Spark har fem valgfrie +1 HP-ranks. Rank 1 alene åbner alle fire retninger.
- V2 Auto Combat koster 6 XP efter Inner Spark og automatiserer både roll, resolve, rounds og normale floor-transitions.
- V2 Twin Arsenal koster 32 XP og giver samtidig slot 2 og én unik Striker Die.
- Charms, Fate Tokens og random Charm-loot er en senere selvstændig systemgren og må ikke erstattes af skæve proc-talenter.

### Production-reference

- Spillet er incremental-first; et kill giver permanent fremgang, og Defeat koster kun dungeon-position.
- Normal Victory er en kort reward-pulse uden information om næste enemy; Combat introducerer først enemy-data på det nye floor.
- Boss Victory og Defeat viser descentens `enemiesDefeated`, `xpEarned` og `soulsEarned`; player-facing hedder valutaerne kun `XP` og `Souls`, aldrig `Permanent`, `Kept` eller `Secured` på outcome-skærmene.
- XP giver permanent adgang og kapacitet; Souls forbedrer konkrete permanente dice/faces.
- Soul Forge har to komplementære metoder: Chaos forbedrer en tilfældig eligible face billigere, mens Precision vælger den konkrete face til 2× basisprisen. Chaos-rabatten falder med antallet af eligible faces og er nul ved én mulighed.
- Normale familie-faces stopper ved værdi 3, vækkes via Forge og vælger derefter gratis én permanent evolution inden for deres familie.
- Attack-familien bruger Power (5 Attack), Momentum (3 Attack og +2 til næste face, ellers Attack-fallback) og Rend (2 Attack og 2 forsinket Bleed).
- Shield-familien bruger Bastion (5 Shield), Reserve (3 Shield og 2 Ward næste runde) og Spikes (3 Shield og 2 Attack nu).
- Heal-familien bruger Restoration (5 Heal), Regrowth (3 Heal og 2 Heal næste runde) og Overflow (3 Heal; op til 2 faktisk overheal bliver til Shield i samme runde).
- En standard-die har seks normale, evolvable familie-faces. En signatur-die har fire normale familie-faces og to faste signaturfaces.
- Executioners Execute giver 3 Attack eller 5, hvis enemy begyndte spillerens roll-sekvens på højst 50% HP. Towers Fortify giver 3 Shield og +2 til næste Shield-face; følger intet Shield, bliver bonussen til +2 Shield samme runde.
- Signaturfaces må ikke forbedres af den nuværende Forge. Senere Face Mastery må åbne signatur-scaling, men XP åbner kun adgangen, mens Souls betaler den konkrete forbedring.
- Evolved Attack-faces er hero faces: Power bruger stjerne-burst, Momentum bruger chevrons/fartstriber, og Rend bruger flænsespor. Identiteten skal være den samme i Workshop, summaries, combat, draw order og score-transfer og må aldrig bero på farve alene.
- Momentum-charge skal være synlig mellem rolls og på den modtagende face; Rend skal kunne følges fra roll til Bleed-total og videre til pulserende stack/tick ved enemy HP.
- Nyt Bleed skader først fra næste player resolution, ignorerer enemy Shield, falder med 1 efter hvert tick og annullerer enemy intent ved lethal damage.
- Kun permanent `bankedSouls` (player-facing `Souls`) og `xp` findes som valuta/progression; `runSouls` findes kun som version-6 migrationsfelt.
- Spilleren starter med én Attack Die.
- Et dice-unlock giver én navngiven permanent die, aldrig uendelige kopier; spilleren equipper den selv.
- Executioner Doctrine og Tower Discipline koster 45 XP hver, åbner samtidigt efter Second Descent og giver henholdsvis én Executioner Die og én Tower Die. De udelukker ikke hinanden og tilføjer ikke slots.
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
- Visuel retning er Pixel Arcade: ren sort canvas, funktionelle mættede farver, hårde frame-niveauer og fysiske 3D-terninger. Det tidligere dark-fantasy-diorama er kun arkiveret reference.
- Combat-roll-fladen bruger næsten-sort negativ plads uden runer, tom piedestal eller idle-copy; kun et aktivt roll må dominere området.
- Enemy-navne bruger en ren sans-serif uden display-shadow, og stabile compact content-navne skal mappe direkte til deres egne sprite-sheets uden den gamle hardcodede placeholder.
- Enemy-stage bruger samme næsten-sorte negative plads som roll-fladen uden murværk, bue eller piedestal; sprite, intent og HP er de eneste højkontrastelementer.
- Floor-10 Demon bruger den store røde hornede boss-art fra `Demon-GeneratedSource-v2.png` og fire 100 px-høje horisontale animation-sheets.

## Historik

### 2026-07-30 — Rene roll-felter uden state-striber

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: De nye helflade-gradients og lysstriber er fjernet fra Combat-rollfeltets `rolling`, `landed` og `scoring` states. Feltet er nu konsekvent rent sort, mens de afgrænsede landing-, score-transfer- og total-effekter bevares.
- Beslutninger: Roll-state må ikke visualiseres ved at dekorere hele det tomme felt; feedback skal følge den aktive terning og dens konkrete destination.
- Berørte områder: `src/styles/arcade/combat.css`, `DESIGN.md` og `progress.md`.
- Validering: Lokal browser ved 384×844 bekræftede `background-image: none` og sort baggrund under både `rolling` og `scoring`; visuel screenshot-pass viste et rent roll-felt uden striber.
- Kendte mangler: Ingen.
- Git: `3faad59` — `Remove combat roll field stripes` på `codex/arcade-foundation-v1`; pushed til `origin`.

### 2026-07-30 — Arcade Polish v1

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Combat-feedbacken er gjort mere fysisk og læsbar med fire roll-states, familie-farvede landinger, source/travel/arrival-scorefeedback, separate damage/heal/block-reaktioner på HP, tydelig full/partial block, resolution-toner og en eksplicit cyan Auto Combat/Pause-mode. Hub, Workshop, Talent Tree og outcomes har samtidig fået større, mere konsekvent tekst, numeriske styles, touch targets og funktionelle ikoner.
- Beslutninger: Polish-laget orkestrerer kun animation oven på allerede fastlåste resultater. Gameplay, combat-resolution, rewards, economy og save-format ændres ikke. Custom font, permanent ikonpakke, Charms og nye sprites er fortsat ude af denne leverance.
- Berørte områder: `DESIGN.md`, `progress.md`, Combat-skærmen, HP/roll/score/damage/totals-komponenterne, arcade tokens/shared/dice/combat samt Hub-, Workshop-, Talent Tree- og outcome-styles.
- Validering: Browserpass ved 320×700, 384×844 og 430×932 dækkede Dungeon 2 med player/enemy multi-dice, rolling/landed/scoring, Auto Combat, Workshop, Hub, Talent Tree, inspector-overlay, Loadout og Defeat uden horisontal overflow eller console warnings/errors. DOM-tests dækker seks settled player-dice og Spiked Behemoths tre enemy-dice. `npx tsc --noEmit`, 27 testfiler med 130 tests, ESLint, production-build og `git diff --check` består.
- Kendte mangler: Fysisk iPhone/Safari og den subjektive timing med seks samtidige player-dice mangler stadig. Victory blev ikke fastholdt manuelt i browserpasset, fordi aktiv Auto Combat fortsatte, men eksisterende outcome-regressioner og de delte outcome-styles dækker state/layout.
- Git: `81ee84d` — `Polish pixel arcade combat feedback` og `3b0ee89` — `Record arcade polish delivery` på `codex/arcade-foundation-v1`; branchen er pushed til `origin`.

### 2026-07-30 — Pixel Arcade foundation v1

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Pixel Arcade er gjort til spillets officielle visuelle foundation. Testmærkningen er fjernet fra Hubben, og det store arcade-override er flyttet ud af `src/newGame.css` til ni vedligeholdelige CSS-moduler med stabile importlag. Primære handlinger beholder en tung arcade-frame, mens gameplaysektioner og sekundære detaljer bruger roligere frame-vægte.
- Beslutninger: Den flade sorte UI-shell og de fysiske 3D-terninger er canonical. Gameplay, balance, saves, dice-logik og enemy-sprites ændres ikke. Den gamle diorama-designreference bevares kun i `DESIGN_LEGACY_DIORAMA.md`.
- Berørte områder: `DESIGN.md`, `PIXEL_ARCADE_VISUAL_TEST.md`, `DESIGN_LEGACY_DIORAMA.md`, Hub-copy/test, `src/App.tsx`, `src/newGame.css` og `src/styles/arcade/`.
- Validering: Browser ved 320, 384 og 430 px verificerede Hub, Dungeon Select, Dungeon 1 Combat, Dungeon 2 Combat med tre player-dice og Attack+Shield-intent, Workshop, Talent Tree, Talent-overlay og Run Menu uden horisontal overflow eller console warnings/errors. `npx tsc --noEmit`, 26 testfiler med 125 tests, ESLint og production-build består.
- Kendte mangler: Fysisk iPhone/Safari og seks samtidige player-dice under hurtig Auto Combat er stadig næste stress-test. Custom font, ikonbibliotek og nye enemy-sprites er bevidst udskudt.
- Git: `3ac9e5f` — `Adopt pixel arcade design foundation` på `codex/arcade-foundation-v1`; leveringsloggen færdiggøres og branchen pushes i dette arbejdsforløb.

### 2026-07-29 — Workshop target og skjult roll-resultat

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Den valgte permanente target-face bliver ikke længere sort eller ulæselig efter første rul. Workshop Die-fordelingen afslører heller ikke længere det fastlåste udfald, mens 3D-terningen stadig ruller; præcis én face markeres først efter landing.
- Beslutninger: Den atomiske Forge bevarer sit persisterede udfald før animationen, men alle resultatafhængige præsentationssignaler er samlet bag en eksplicit `result`-gate. Det gælder distribution-marker, jackpot-class, applied amount og cap-note. Den fysiske cube må fortsat kende face-id'et internt for at kunne lande deterministisk.
- Berørte områder: `WorkshopScreen.tsx`, Pixel Arcade-Workshop-styling i `src/newGame.css` samt den nye rene `workshopResultPresentation`-hjælper og regressionstest.
- Validering: Browser ved 384×844 verificerede transparent target-overlay, læsbar Attack-face, 0 markers/jackpot/cap-note under `rolling_power` og præcis 1 marker efter en landet `+2`-jackpot. Browserkonsollen var ren. `npx tsc --noEmit`, 26 testfiler med 125 tests, ESLint, production-build og `git diff --check` består.
- Kendte mangler: Ingen kendte fejl i det rettede flow; fysisk Safari/iPhone bør fortsat bruges til subjektiv animationstiming.
- Git: `1b61ad1` — `Hide Workshop results until landing` på `codex/pixel-arcade-visual-test`; branchen er pushet.

### 2026-07-29 — Pixel Arcade visual vertical slice

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Hub, Combat, Workshop, Talent Tree, Dungeon Select, Loadout, Victory, Defeat og centrale overlays har fået en sammenhængende alternativ arcade-præsentation med ren sort canvas, hårde hvide pixelrammer, mættede funktionsfarver og markant mindre visuel støj. De fysiske player-, enemy- og Workshop-terninger er bevaret og reskinnet som de primære hero-objekter.
- Beslutninger: Testen ændrer kun grafik og præsentationsklassifikation. Gameplay, økonomi, persistence og enemy-sprites er uændrede. Talent-forbindelser lyser kun hvidt, når target faktisk er åbent; dungeon-låste targets forbliver mørke. 3D-cubers egne transform-elementer må ikke modtage filter-animationer.
- Berørte områder: `src/index.css`, arcade-override i `src/newGame.css`, Hub-, Combat- og Workshop-præsentation, Talent Tree-forbindelser og `PIXEL_ARCADE_VISUAL_TEST.md`.
- Validering: Browser-verificeret ved 320×700, 384×844 og 430×932 på alle fire hovedskærme samt Dungeon Select, Loadout og Victory. Manuel Workshop-test gennemførte gentagne Forge-rul inklusive et frontvendt jackpot-`+2`; browserkonsollen havde ingen errors eller warnings. `npx tsc --noEmit`, 25 testfiler med 123 tests, ESLint, production-build og `git diff --check` består.
- Kendte mangler: Retningen er endnu ikke subjektivt sammenlignet med den eksisterende V2-stil på fysisk iPhone. Enemy-sprites er bevidst ikke ændret, og det store CSS-override bør først konsolideres, hvis retningen vælges.
- Git: `a4f7ff1` — `Build pixel arcade visual test` og `a99582a` — `Record pixel arcade visual delivery` på `codex/pixel-arcade-visual-test`; branchen er pushet.

### 2026-07-29 — Stabil Workshop-cube ved jackpot-rul

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Workshop Die forbliver nu en synlig 3D-cube under og efter `+2`- og senere `+3`-rul, også når flere Forge-køb udføres i samme session. Jackpotgløden bevares som feedback uden at ændre cube-renderingen.
- Beslutninger: CSS-filter må ikke anvendes direkte på et element med `transform-style: preserve-3d`, fordi filteret kan tvinge dets seks faces til en flad rendering. Jackpotgløden er derfor et separat, ikke-interaktivt sibling-lag bag cuben.
- Berørte områder: `WorkshopDie.tsx`, Workshop-præsentationstests og Workshop-styling i `src/newGame.css`.
- Validering: `npx tsc --noEmit`, 25 testfiler med 122 tests, ESLint, production-build og `git diff --check` består. Lokal browser gennemførte to `+2`-Forge-resultater i direkte rækkefølge; begge tumbles landede på en synlig, frontvendt cube med glow og uden forsvinding.
- Kendte mangler: Fysisk Safari/iPhone bør stadig bruges til den endelige subjektive kontrol af tumble-timing, men den konkrete browserstandard-fejl er fjernet strukturelt.
- Git: `5b00e28` — `Keep Workshop cube visible on jackpot rolls` på `codex/classic-incremental-v2`; branchen er pushet.

### 2026-07-29 — Frontvendt Workshop-resultat

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Workshop Die bruger fortsat den fysiske 3D-tumble, men slutter nu præcist frontvendt på den landede `+1/+2/+3`-side ligesom player-dice i Combat. Den står ikke længere i en ekstra skrå showcase-vinkel efter rullet.
- Beslutninger: Kun idle-terningen må stå i en let 3D-vinkel. Rolling, reduced-motion og landed-state bruger alle den eksakte face-rotation fra den fælles cube-renderer. Det separate Forge-resultatpanel kommunikerer fortsat den permanente opgradering.
- Berørte områder: `PhysicalDieCube.tsx`, `CLASSIC_INCREMENTAL_V2.md` og fælles progress-log.
- Validering: `npx tsc --noEmit`, 25 testfiler med 121 tests, ESLint, production-build og `git diff --check` består. Lokal browser ved 384×844 gennemførte begge Forge-rul og verificerede en vedvarende, helt frontvendt resultatflade uden den gamle flade overlay-face.
- Kendte mangler: Tumble-hastigheden og den subjektive fysiske fornemmelse skal fortsat vurderes på en rigtig iPhone; mekanik, økonomi og persistence er uændret.
- Git: `d721c70` — `Land Workshop die on exact face` på `codex/classic-incremental-v2`; branchen er pushet.

### 2026-07-29 — Fuld Classic Incremental V2 GDD

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Den korte V2 vertical-slice note er erstattet af en fuld branch-specifik GDD på dansk. Dokumentet samler high concept, designprincipper, fresh start, kerne-loop, XP/Soul-økonomi, permanente dice, totrins-Workshop, komplet radialt Talent Tree, combat, Auto Combat, dungeon-tabeller, pacing, UI/UX, persistence og scope i én autoritativ kilde.
- Beslutninger: `CLASSIC_INCREMENTAL_V2.md` har forrang over `NEW_GAME_GDD.md` på V2-branchen. Implementerede regler er adskilt fra foreløbig balance og eksplicit deferred content; Fatecraft beskrives ikke som et færdigt Charm-system.
- Berørte områder: `CLASSIC_INCREMENTAL_V2.md` og fælles progress-log.
- Validering: Talentpriser/prerequisites, dice-faces, Workshop-formel/distributioner, face caps, enemy HP/dice/rewards, save-version og journey-rails er krydstjekket mod branchens content-, progression-, Forge- og simulatorfiler. Markdown-struktur og `git diff --check` består.
- Kendte mangler: GDD’en dokumenterer aktuelle implementerede Dungeon 2-tal, men markerer dem fortsat som ikke endeligt V2-balancerede. Charm/Fate Token-loopet kræver et separat designforløb.
- Git: `58d0bde` — `Expand Classic Incremental V2 GDD` på `codex/classic-incremental-v2`; branchen er pushet.

### 2026-07-29 — Vedvarende 3D Workshop Die

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Workshop Die bevarer nu sin fysiske cube gennem idle, tumble og det afsluttede Forge-resultat. Det landede face står i en let vinkel med synlig top og side, og terningen bliver stående i power chamberet i stedet for at blive erstattet af en flad `+X`-plade.
- Beslutninger: Combat og Workshop bruger én fælles `PhysicalDieCube` til seks face-positioner, tumble, reduced-motion og landing. Det konkrete `+1/+2/+3` vises fortsat i det separate Forge-resultatpanel, så den fysiske terning ikke konkurrerer med en ekstra falsk face.
- Berørte områder: Ny fælles cube-komponent, `RollDieTile`, `WorkshopDie`, Workshop-regressionstest og oprydning af de gamle overlay-/cube-styles.
- Validering: `npx tsc --noEmit`, 25 testfiler med 121 tests, ESLint, production-build og `git diff --check` består. Lokal browser ved 384×844 verificerer en vedvarende landed 3D-cube med synlig top/side og uden det gamle flade overlay.
- Kendte mangler: Den subjektive tumble-hastighed skal fortsat mærkes på fysisk iPhone; mekanik, økonomi og persistence er uændret.
- Git: `5b97b20` — `Keep Workshop die physically three dimensional` og `a9cc98e` — `Record Workshop cube fix` på `codex/classic-incremental-v2`. Branchen er pushet, og Vercel Preview for leverancen er bekræftet `success`.

### 2026-07-29 — Workshop Die og totrins-Forge

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: V2-Workshoppen er redesignet som ét sammenhængende fysisk ritual. Spilleren vælger en permanent die, ser seks faces flicker frem til et fastlåst random target og ruller derefter en separat animeret Workshop Die for den konkrete permanente `+1/+2/+3`-forbedring. Skærmen har fået en ny kompakt die-rail, target chamber, anvil-forbindelse, stor 3D Workshop Die og et tydeligt impact-resultat.
- Beslutninger: Workshop Die starter `1–1–1–1–1–2`; `Loaded Alloy` har tre ranks med fordelingerne `1–1–1–1–2–2`, `1–1–1–2–2–2` og `1–1–1–2–2–3`. Face cap reducerer den viste mulige roll-værdi på forhånd, så der ikke opstår skjult spild. Precision Forge er fortsat engine-kompatibel, men V2-skærmens hovedflow er det nye random ritual.
- Berørte områder: Nye Workshop-typer/content, Forge-engine, talent-effekter, version-14 store/migration, journey-simulator, `WorkshopScreen`, ny `WorkshopDie`-komponent, V2-styling, tests og `CLASSIC_INCREMENTAL_V2.md`.
- Validering: `npx tsc --noEmit`, 25 testfiler med 121 tests, ESLint, production-build og `git diff --check` består. Lokal browser ved 384×844 gennemførte target-roll, verificerede Soul-fradrag, reloadede mellem rullene med target/resultat intakt og landede derefter `+2`, som permanent ændrede face 2 fra 4 til 6 uden dobbeltbetaling.
- Kendte mangler: Animationstempo og gentagelsesværdi ved 15–25 køb mangler fysisk iPhone-playtest. Fate/Charms og den dybere Dungeon 2-balance er fortsat uden for denne leverance.
- Git: `8f7166c` — `Build two-stage Workshop Die forge` og `dea5065` — `Record Workshop Die delivery` på `codex/classic-incremental-v2`. Branchen er pushet, og Vercel Preview for leverancen er bekræftet `success`.

### 2026-07-29 — Kompakt Talent Tree og strømlinet node-info

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Talent Tree-noderne ligger nu markant tættere i alle fire retninger, og infopanelet er omtrent halvt så højt med større titel-, effekt- og knaptekst. Twin Arsenal viser eksempelvis kun `Unlocked`, rank, `+1 Dice Slot`, `Striker Die`, de seks relevante faces og den aktuelle XP-handling.
- Beslutninger: Effektlisten er panelets primære forklaring. Talentbeskrivelsen, branch-overskriften, den separate statusbjælke, den separate rank-række samt gentaget preview-label/-beskrivelse er fjernet. En ny permanent die beholder sit seks-face-preview, fordi det er gameplay-information.
- Berørte områder: `TalentDetailPanel.tsx`, det radiale layout og dets tests samt Talent Tree-styling i `src/newGame.css`.
- Validering: TypeScript, 24 testfiler med 118 tests, ESLint og production-build består. Lokal browser ved 384×844 viser den kompakte first ring og det reducerede Twin Arsenal-panel uden overlap, warnings eller errors.
- Kendte mangler: De nye afstande er visuelt valideret på first ring; den fulde dybe gren skal fortsat mærkes gennem almindelig pan/zoom på fysisk mobil.
- Git: `3112ab1` — `Streamline V2 talent tree UI` og `7afbcf0` — `Record V2 talent tree polish` på `codex/classic-incremental-v2`. Branchen er pushet, og den isolerede Vercel Preview-deployment er bekræftet `success`.

### 2026-07-29 — Classic Incremental V2 vertical slice

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: En separat V2-branch har nu en fuld fresh-save incremental kerne: seks 1-Attack-faces, en første tre-slags Slime, permanent 4 XP/5 Souls efter første kill, random face-growth, Workshop criticals, tidlig fuld Auto Combat og et radialt fire-retningers Talent Tree.
- Beslutninger: Spilleren vælger die men ikke face; hvert Forge-køb lykkes. Inner Spark rank 1 åbner alle retninger. North er Arsenal, West er Workshop, South er Descent/Automation, East er senere Fate/Charms. Twin Arsenal giver både slot 2 og én unik Striker Die. Charm-systemet implementeres ikke i denne slice.
- Berørte områder: Dice- og encounter-content, Forge-engine/store, talenttyper/content/progression, radialt Talent Tree-layout/UI, Chaos Workshop, Hub, V2-devpresets, balance-simulatorer, tests, `CLASSIC_INCREMENTAL_V2.md` og denne log.
- Validering: TypeScript, 24 testfiler med 117 tests, ESLint og production-build består. Lokal browser gennemspillede fresh start til første Slime-kill, viste Victory med +4 XP/+5 Souls, forlod run med valuta intakt, købte én random permanent face fra 1 til 2 og købte Inner Spark, hvorefter alle fire første retningsnodes var synlige samtidigt på 384 px game-shell. Ingen browser-errors.
- Kendte mangler: Fate/Charms er kun en senere gated retning. Dungeon 2 og de eksisterende signatur-dice er endnu ikke V2-tunet. Fysisk iPhone-pacing mangler.
- Git: `d8659ed` — `Build Classic Incremental V2 slice` og `6e26a2b` — `Record Classic V2 delivery` på `codex/classic-incremental-v2`. Branchen er holdt separat fra `main`, er pushet til origin, og dens isolerede Vercel Preview-deployment er bekræftet `success`.

### 2026-07-29 — Retvendte Power-rolls

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Executioner/Power viser ikke længere en spejlvendt rød Attack-face lige før den gyldne Power-landing. Alle player- og enemy-cubes, som deler den centrale face-renderer, skjuler nu bagsiden korrekt under hele 3D-tumblen.
- Beslutninger: Power-mapping, gyldent landingsbanner og gylden score-transfer var allerede korrekte og ændres ikke. Fejlen løses i den fælles 3D-overflade med både standard- og WebKit-kompatibilitet i stedet for særlogik for Power.
- Berørte områder: `src/newGame.css`, evolution-præsentationstest og progress-log.
- Validering: `npx tsc --noEmit`, 24 testfiler med 144 tests, ESLint og production-build består. Lokal 384×844-browser reproducerede først den spejlvendte røde face under et tvunget Power-roll og verificerede derefter en retvendt Executioner-tumble, korrekt gylden `Power`-landing og korrekt gylden `+5 Power`-score-transfer. Regressionstesten dækker nu Power, Momentum og Rend separat og afviser lånte evolution-klasser.
- Kendte mangler: Den konkrete WebKit-rettelse skal stadig mærkes på brugerens fysiske iPhone/Safari, hvor den oprindelige fejl blev bemærket.
- Git: `f7f1e49` — `Fix mirrored Power roll faces` og `7b781db` — `Record Power roll visual fix`; PR [#45](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/45) er squash-merget til `main` som `96db7bf`. Vercel production-check `CLpuiqAfM5V3m9fXVqf51PzwjjRf` er `success`; den offentlige URL svarer HTTP 200 med `index-DztG8g7-.js` og `index-Cz7LJvLH.css`, og production-CSS indeholder de nye backface-/preserve-3D guards.

### 2026-07-29 — Mere plads til aktive combat-rolls

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Den aktive terning og dens evolution/signature-impact har nu en fast beskyttet hero zone. Enemy-stage bruger mindre tom højde, og korte browser-viewports komprimerer meta-, player-, draw- og action-zonerne, før roll-effekter eller draw-order-resultater beskæres.
- Beslutninger: Gameplay-information fjernes ikke for at skabe plads. Enemy intent, HP og sprite forbliver synlige; den aktive terning prioriteres over sekundær padding, og dens midlertidige impact-lag må ligge foran roll-headeren.
- Berørte områder: Combat-layout i `src/newGame.css`, visuel combat-retning i `DESIGN.md` og progress-log.
- Validering: `npx tsc --noEmit`, 24 testfiler med 142 tests, ESLint og production-build består. Lokal browser ved 384×844, 384×700 og 320×700 viser mindst 130 px roll-pedestal, ingen overlap mellem enemy intent og HP samt ingen horisontal overflow. Et faktisk Rend-roll er fanget med banner og partikler fuldt synlige ved 384×700.
- Kendte mangler: Safari safe-area og browser-chrome varierer mellem fysiske modeller; den nye kompakte breakpoint skal stadig mærkes i brugerens konkrete browser.
- Git: `1b71f5d` — `Protect combat roll effects` og `2894f54` — `Record combat layout validation`; PR [#43](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/43) er squash-merget til `main` som `8f98d84`. Vercel production-check `DnrQwzxWqrer54Kiw2TcDiKoju9D` er `success`; den offentlige URL svarer HTTP 200 med `index-CbUlPxji.js` og den nye layout-asset `index-DkkFfyJg.css`.

### 2026-07-28 — Dice Architecture v1

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Alle tre nuværende terningfamilier har nu deres eget sæt af tre evolutioner, mens Executioner og Tower er reelle signatur-dice med to faste identitetsfaces ud af seks. Carry-effekter, overheal, betinget Execute og sekventiel Fortify virker i manuel combat, Auto Combat, background fast-forward og simulatoren. Spilleren kan læse en terning gennem et stort Die Details-overlay, talent-preview og en vedvarende effect-readout i Workshop.
- Beslutninger: En standard-die består af seks normale familie-faces; en signatur-die af fire normale faces og to signaturfaces. Det første output-band topper omkring 5. Signaturfaces Forge-opgraderes ikke endnu; senere Face Mastery skal åbne adgang, mens Souls fortsat betaler konkrete face-forbedringer.
- Berørte områder: Dice-/combat-typer, centralt effect-catalog, permanent dice-content, Forge, resolution og automation, save-version 12/migration, simulator, devprofil, Loadout/Talent/Workshop/Combat UI, tests, README, GDD, DESIGN og progress-log.
- Validering: `npx tsc --noEmit`, 24 testfiler med 142 tests, ESLint og production-build består. Pure combat-, Forge-, migration-, automation-, balance- og UI-tests dækker de ni evolutioner samt Execute/Fortify. Lokal browser ved 384 px verificerer Executioners `2/6`-signatur, alle tre Attack-evolutioner og signatur-readout i Workshop; 320 px verificerer det scrollbare Die Details-overlay og ingen horisontal overflow.
- Kendte mangler: Den subjektive balance mellem direkte output, utility og 2/6-signaturfrekvens skal stadig gennemspilles på fysisk mobil. Face Mastery II og næste output-band er bevidst ikke implementeret.
- Git: `ad705e2` — `Build dice family architecture` og `066e821` — `Record dice architecture validation`; PR [#41](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/41) er squash-merget til `main` som `301783f`. Vercel production-check `BcUww8QJas6jDiuuXxENuUzjVh7S` er `success`; den offentlige URL svarer HTTP 200 med `index-DKtodUqm.js`, `index-B-UMOaGY.css`, 545-Souls-devprofilen og Executioners nye `2/6` Execute-preview.

### 2026-07-28 — Build Diversity v1

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Second Descent åbner nu Executioner Doctrine og Tower Discipline samtidigt. Spilleren kan eje seks permanente dice med kun fire slots og må aktivt vælge mellem Executioner/Striker samt Tower/Iron Guard. Combat viser Momentum-charge og modtaget bonus gennem score-transferen, mens Rend viser Bleed fra roll til aktiv stack/tick.
- Beslutninger: Første build-lag genbruger Attack/Shield/Heal frem for at introducere en ny face-type. Executioner Die er `1,1,1,3,3,3 Attack`; Tower Die er `1,1,1,1,3,4 Shield`; hvert unlock koster 45 XP efter Second Descent og auto-equipper aldrig.
- Berørte områder: Permanent dice-catalog, Talent Tree-data/layout/ikoner, pure roll-contribution feedback, Combat/Round Totals/Score Transfer, post-Dungeon-1-devprofil, progression journey-simulator, balance-/store-/UI-tests, README, GDD, DESIGN og progress-log.
- Validering: TypeScript, 23 testfiler med 129 tests, ESLint, production-build og `git diff --check` består. Lokal browser ved 384 px verificerer seks ejede dice, fire aktive slots, de to nye Talent Tree-noder, Power/Momentum/Rend i devprofilen, et faktisk Momentum-roll der løfter næste Heal fra 3 til 5 samt ingen horisontal overflow i Hub, Talent Tree, Loadout eller Combat.
- Kendte mangler: Den subjektive balance mellem de seks dice, første evolution omkring run 2–5 og de to 45-XP-priser skal stadig fysisk playtestes. Journey-simulatoren måler matematik og køb, ikke oplevet tid eller forståelse.
- Git: `f40d901` — `Build first diverse dice loadouts` og `7b29073` — `Record Build Diversity validation`; PR [#39](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/39) er squash-merget til `main` som `9faa30c`. Vercel production-deployment `dpl_FmMHSNos5CFjkuDEX2JtLYbGXpSb` er `READY`; den offentlige URL svarer HTTP 200 med `index-BodO7ffB.js`, Executioner/Tower-unlocks og Momentum-charge.

### 2026-07-28 — Rene tekstfri Talent Tree-noder

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: De små `Owned`, `Max`, `Buy` og `Open`-tags er fjernet helt fra Talent Tree-canvas. Købte nodes aflæses nu gennem cyan fyldning og checkmark, gentagelige talents gennem rank-pips, købsklare nodes gennem lys outline/puls, åbne men for dyre nodes gennem dæmpet outline og låste nodes gennem mørk flade/låseikon.
- Beslutninger: Canvas skal kommunikere state gennem form, kontrast og symboler, aldrig gennem mikrotekst. Den fulde tekststatus bevares i aria-labels og det store node-overlay.
- Berørte områder: TalentNode, spatial canvas-styles, præsentationstests, GDD, DESIGN, README og progress-log.
- Validering: Målrettet TypeScript, Talent Tree-præsentationstest, ESLint og `git diff --check` består. Lokal browser ved 100% zoom verificerer fresh 88-XP-state, fog-silhuet, købsklar node, stort status-overlay samt Battle-Hardened rank 1 med checkmark og 1/3 rank-pips i en 384 px bred game-shell uden horisontal overflow.
- Kendte mangler: Den endelige kontrast skal stadig godkendes på en fysisk iPhone ved 320 px og 384 px.
- Git: `3eadfff` — `Clean up Talent Tree node states`; PR [#37](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/37) er squash-merget til `main` som `6193f61`. Vercel production-deployment `dpl_C7boF2tHhkDasi87DzLKRVHoRW3m` er `READY`; den offentlige URL svarer HTTP 200, production-assets indeholder fortsat checkmark/rank-pips og indeholder ikke længere state-tag markup eller styles.

### 2026-07-28 — Tydelige evolution hero-faces

**Status:** Færdig
**Ansvarlig:** Codex

- Resultat: Power, Momentum og Rend kan nu identificeres øjeblikkeligt gennem hver sin SVG-silhuet, overflade, ramme og accent i Workshop, dice summaries, alle seks 3D-cube-sider, settled draw order og score-transfer. Et evolved face får ved landing en kort navngivet impact-puls uden at ændre combat-mekanikken.
- Beslutninger: Power er hvidgylden med eksplosivt stjerne-burst, Momentum er cyan med tre chevrons/fartstriber, og Rend er crimson med tre flænsespor. Farve står aldrig alene; silhuet og mønster er bindende og Attack-tilhørsforholdet bevares som sekundær information.
- Berørte områder: Central evolution-visual registry, egne SVG-ikoner, DieSummary, RollDieTile, ScoreTransfer, Workshop, mobile styles, præsentationstests, GDD, DESIGN, README og progress-log.
- Validering: `npx tsc --noEmit`, 22 testfiler med 117 tests, ESLint, production-build og `git diff --check` består. Lokal browser gennemfører et rigtigt post-Dungeon-1-forløb til 86 Souls, Chaos-awakening, Rend-valg og efterfølgende combat i en 384 px bred game-shell uden horisontal overflow; evolution-valgene og det permanente Rend-face er visuelt inspiceret.
- Kendte mangler: Hurtig aflæsning af alle tre landingseffekter skal stadig playtestes på en fysisk mobil; gameplay-tal og evolution-mekanik er bevidst urørte.
- Git: `2e8efbe` — `Make evolution faces unmistakable`; PR [#35](https://github.com/jacobgamby09/Dice-dungeon-incremental/pull/35) er squash-merget til `main` som `18f2938`. Vercel production-deployment `dpl_uGx83msLjszoR5jDGwB2kt5g1DyX` er `READY`; den offentlige URL er browser-verificeret med HTTP 200, og production-assets indeholder alle tre evolution-overflader samt landingseffekten.

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
