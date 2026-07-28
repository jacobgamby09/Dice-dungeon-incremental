# Dice Dungeon Incremental — Game Design Document

Status: gældende design for det nye spil. Version: MVP 0.7.

## High concept

Dice Dungeon Incremental er først og fremmest et mobile-first incremental combat-spil. Spilleren begynder med få muligheder og korte dungeon-runs, men opbygger permanent styrke, større systemadgang og gradvist mere automation. Dungeon-dybde er et resultat af spillerens langsigtede progression.

Spillerens terninger er permanente genstande. Hver terning har seks individuelle faces med stabile IDs. Spilleren mærker progressionen direkte ved at forbedre og udvikle konkrete faces og senere se netop de identiteter lande i kamp.

Hver besejret fjende giver både permanent XP og permanente Souls. Defeat afslutter det aktuelle dungeon-forsøg og nulstiller dybden, men fjerner aldrig allerede optjente rewards.

Det overordnede produktløfte er:

> Hvert run gør spilleren permanent mere kapabel, og de permanente forbedringer lader spilleren nå dybere, tjene hurtigere og gradvist automatisere tidligere manuelt arbejde.

Det centrale spørgsmål inde i et run er:

> Hvor dybt kan mine nuværende permanente dice bringe mig, før jeg må vende stærkere tilbage?

Det gamle Dice Dungeon spurgte, om spilleren turde trække én terning mere før bust. Det draw/bust-loop er ikke en del af det nye spil.

## Incremental-first designhierarki

Spillets systemer prioriteres i denne rækkefølge:

1. Permanent incremental fremgang.
2. Personlige, permanente terninger.
3. Klar og tilfredsstillende combat-feedback.
4. Et flydende dungeon-loop uden tab af allerede optjent progression.
5. Gradvis automation og større systemdybde.

Tidlige runs må gerne være korte. De er ikke selvstændige roguelike-builds, der skal kunne gennemføre alt fra starten. De leverer ressourcer til den permanente progression, som flytter spillerens forventede dungeon-dybde over tid.

Spilleren skal mærke hurtig fremgang fra begyndelsen. De første 2–3 runs skal give adgang til mærkbare XP-opgraderinger, og terning nummer to skal unlockes tidligt nok til, at combat-loopet hurtigt udvikler sig fra ét enkelt roll til opbygningen af en rigtig rundetotal.

## Kerne-loop

```text
Hub
→ vælg dungeon
→ træk alle permanente terninger i tilfældig rækkefølge
→ resolve Heal, Attack, Shield og enemy intent
→ vind permanent XP og permanente Souls fra hver enemy
→ fortsæt lineært til næste floor eller returnér efter Defeat/boss
→ brug XP på karakter-, system- og content-unlocks
→ brug Souls i Chaos Forge eller Precision Forge på én eksisterende terning
→ start et nyt run med større kapacitet og stærkere personlige dice
→ nå dybere, tjene hurtigere og unlock mere automation
```

## Ressourcer

| Ressource | Type | Optjenes | Bruges | Ved død |
|---|---|---|---|---|
| XP | Permanent | Ved enemy kill | Talent tree | Beholdes |
| Souls | Permanent | Ved enemy kill | Dice/face-upgrades | Beholdes |

Der findes ingen Gold, Coins eller Materials.

Spillet har to permanente progressionsakser med adskilte roller:

### XP — adgang og kapacitet

XP repræsenterer spillerens erfaring og optjenes ved enemy kills. XP mistes aldrig ved Defeat. Når XP bruges på en talent-node, trækkes prisen atomisk, og talentet er permanent.

XP svarer på:

> Hvad kan min karakter nu?

XP bruges på Talent Tree til eksempelvis:

- Mere Max HP.
- Flere dice slots.
- Unlock af Shield Dice og Heal Dice.
- Unlock af nye dice families.
- Auto Combat og hurtigere combat.
- Nye dungeons.
- Højere face caps.
- Adgang til face evolutions.
- Soul-relaterede talents, eksempelvis større loot-udbytte.

XP gør ikke eksisterende dice faces stærkere direkte. En XP-node kan give adgang til eller tildele en ny permanent die, men efterfølgende forbedringer af den konkrete die betales med Souls.

### Souls — konkret dice-styrke

Souls repræsenterer den permanente kraft, hver besejret fjende efterlader som loot.

- Hver enemy har et fast `soulReward` større end 0.
- Rewarden lægges atomisk direkte til spillerens permanente Soul-beholdning ved et gyldigt kill.
- Souls mistes aldrig ved Defeat.
- Souls bruges kun på konkrete permanente dice- og face-upgrades.

Souls svarer på:

> Hvor stærke er mine terninger blevet?

Souls må ikke købe Talent Tree-noder, Max HP, dice slots, automation eller dungeon-adgang. XP må omvendt ikke betale for en konkret face-upgrade.

### Samspillet mellem XP og Souls

XP unlocker muligheder; Souls forbedrer de konkrete muligheder:

```text
XP: Unlock Shield Dice
→ spilleren modtager sin første permanente Shield Die
→ Souls forbedrer individuelle faces på netop den terning

XP: Unlock Face Mastery
→ faces må udvikles over den nuværende cap
→ Souls betaler for den konkrete face-opgradering eller evolution
```

Denne opdeling er bindende. Talent Tree og Die Workshop må aldrig konkurrere om samme funktion.

## Permanente terninger

- En `DieInstance` har stabilt ID, navn, family og seks faces.
- En `FaceInstance` har stabilt ID, type, værdi og senere eventuel evolution.
- Faces med samme type og værdi er stadig forskellige objekter og kan opgraderes uafhængigt.
- Hver unlock giver præcis én navngiven permanent terning. Unlocks giver aldrig uendelige kopier.
- Spilleren vælger selv sit loadout i Hub og begrænses af sine unlockede dice slots.
- En ny terning auto-equippes ikke. Den skal aktivt vælges i Loadout Rack.
- Mindst én terning skal være equipped, og loadout kan ikke ændres under et aktivt run.
- Udstyrede terninger snapshots ved run-start. Et aktivt run ændres derfor ikke af senere Hub-data.

MVP-katalog:

- `attack-die-1`, Worn Blade Die: `1, 1, 2, 2, 2, 3 Attack`.
- `attack-die-2`, Striker Die: `1, 1, 1, 2, 3, 3 Attack`.
- `shield-die-1`, Iron Guard Die: `1, 1, 2, 2, 2, 3 Shield`.
- `heal-die-1`, Vitality Die: `1, 1, 1, 1, 2, 2 Heal`.

Spilleren starter kun med Worn Blade Die og ét dice slot. De øvrige konkrete terninger kommer fra XP-talenter.

## MVP Talent Tree

Talent Tree bruger kun XP. Alle specialiseringsgrene bliver tilgængelige efter `Shieldcraft` og udelukker ikke hinanden. Spilleren vælger købsrækkefølge, ikke en permanent låst klasse.

Den centrale `Battle-Hardened`-node har tre ranks. Hver rank giver +2 Max HP, så noden samlet kan give +6 Max HP. Rank 1 åbner vejen til `Twin Arsenal`; rank 2 og 3 er valgfrie og blokerer ikke videre progression.

| Talent | Pris | Krav | Permanent effekt |
|---|---:|---|---|
| Battle-Hardened rank 1/2/3 | 8 / 16 / 32 XP | Forrige rank | +2 Max HP per rank, maksimalt +6 |
| Twin Arsenal | 16 XP | Battle-Hardened rank 1 | +1 dice slot og én Striker Die |
| Auto Combat | 12 XP | Twin Arsenal | Spillerstyret automation af rolls, resolution, normale victories og næste floor |
| Shieldcraft | 32 XP | Twin Arsenal | Én Iron Guard Die og adgang til Shield-familien |
| Second Descent | 60 XP | Shieldcraft + første clear af The First Descent | Unlock The Iron Descent |
| Battle-Hardened II | 24 XP | Shieldcraft | +3 Max HP |
| Third Grip | 40 XP | Shieldcraft | +1 dice slot |
| Quick Draw | 20 XP | Shieldcraft | Roll- og score-animationer er 25% hurtigere |
| Healing Arts | 55 XP | Third Grip | Én Vitality Die og adgang til Heal-familien |
| Fourth Grip | 90 XP | Healing Arts | +1 dice slot |

Auto Combat er én spillerstyret toggle. Når den er aktiv, ruller den alle player dice, resolver runden, starter næste runde og fortsætter automatisk gennem normale Victory-pulses til næste floor. Den stopper altid ved Defeat og Boss Victory; Auto Retry findes ikke i denne fase. Spilleren kan slå automationen fra under combat, hvorefter det nuværende atomiske animations-/resolutionstrin færdiggøres, før manuel styring overtager.

Auto Combat kan også fortsætte et aktivt run, mens siden er suspenderet. Et tidsbudget, et deterministisk random-seed og det seneste checkpoint persisteres. Ved resume simuleres kun den progression, den faktiske fraværstid tillader, og resultatet committes atomisk. Simulationen stopper ved Defeat eller Boss Victory og viser et kort recap med floors, enemies, XP og Souls. Reload eller gentagne resume-events må aldrig duplikere rewards.

Combat-headeren har en diskret `Run Menu`-knap før floor-informationen. Menuen pauser både live Auto Combat og background-fast-forward uden at slå spillerens Auto Combat-præference fra. `Leave Dungeon` kræver et separat bekræftelsestryk og returnerer derefter direkte til Hub uden at registrere Defeat. Allerede optjent XP og Souls samt permanent progression bevares; kun det aktive runs floor, HP, enemy og round-state nulstilles.

Talent Tree viser kun det nuværende købslag fuldt. Én kommende node eller ét kommende branch-lag anes som en navnløs silhuet bag fog of war. Et køb aktiverer talent-terningen, sender energi gennem forbindelserne og afslører næste lag som en kort chain reaction. Alle talent-noder er terningeformede, har ét stabilt ikon og bruger cyan som fælles XP-identitet. Træet præsenteres på et næsten sort canvas med fri panorering samt pinch-, knap- og Ctrl-wheel-zoom; det må ikke komprimeres til kort, kolonner eller en almindelig scroll-side. Købte, åbne, købsklare og låste nodes skal have tydeligt forskellige states. Et nodeklik åbner et stort modal-overlay med navn, status, beskrivelse, rank, effekt og købshandling.

Den tidlige tilsigtede cadence er:

1. Første floor giver 8 XP og køber Battle-Hardened rank 1 efter første run.
2. Spilleren vælger derefter frit mellem flere HP-ranks og den direkte 16-XP-vej til Twin Arsenal.
3. Twin Arsenal kan stadig købes efter højst tre floor-1 clears, hvis spilleren prioriterer den direkte vej.
4. Den nye Striker Die findes derefter i collection, men spilleren skal selv equippe den i det nye slot.
5. Auto Combat bliver tilgængelig for 12 XP direkte efter Twin Arsenal og nås derfor typisk efter cirka 3–5 kills.
6. Shieldcraft åbner derefter Survival, Arsenal og den senere hastighedsprogression.
7. Healing Arts kan nås sent i Dungeon 1, så spilleren lærer Heal, før en enemy bruger mechanicen.
8. Første clear af The First Descent afslører adgangskravet til Second Descent; købet åbner Dungeon 2.

## Kamp

Spilleren ser altid enemy HP og det præcise næste intent før første draw. En enemy ejer 1–3 data-drevne, seks-sidede dice med stabile die- og face-ID'er. Hver die er Attack, Shield eller Heal og følger samme farve- og ikonsprog som player dice. Ved rundestart vælges og persisteres alle enemy-resultater først; derefter ruller de mindre fysiske enemy dice automatisk i rækkefølge og lander som det synlige samlede intent. Player Draw er låst under reveal-animationen. Resultaterne ændres aldrig bagefter.

Enemy Shield er midlertidigt. Det nye Shield-roll erstatter sidste rundes værdi, absorberer player Attack og udløber efter enemy-fasen. Enemy Heal udføres kun, hvis enemy overlever player-fasen, og ligger før dens Attack. En dræbt enemy får derfor både Heal og Attack annulleret.

Efter enemy reveal blandes alle udstyrede player dice i en persisteret draw-pile. `Draw` tager den næste tilfældige terning uden replacement, ruller den og føjer den dynamisk til rækken af spillede terninger. Boardet har ingen faste Attack-, Shield- eller Heal-slots. Hvert resultat gemmes som præcis `die.id`, `face.id`, type og værdi før animationen vises.

Alle udstyrede terninger skal trækkes præcis én gang. Først når posen er tom, kan runden resolves. I manuel mode aktiveres `Resolve Round`; Auto Combat udfører samme transition automatisk efter sidste færdigscorede roll. Der er intet stop- eller bust-valg.

### Resolution-rækkefølge

1. Heal spilleren op til max HP.
2. Attack reducerer først enemy Shield og derefter enemy HP.
3. Eventuel recoil, Thorns eller selvskade anvendes.
4. Hvis spilleren er død, er udfaldet Defeat — også ved reel Double K.O.
5. Hvis fjenden er død, er udfaldet Victory, og dens intent og attack-animation annulleres.
6. Hvis fjenden lever, udfører den sit viste Heal op til max HP.
7. Derefter udfører den sit viste Attack.
8. Rundens player Shield blokerer enemy damage; resten rammer HP.
9. Ved 0 HP er udfaldet Defeat.
10. Midlertidigt player- og enemy-Shield nulstilles, og næste runde forberedes.

Spilleren skal kunne føle sig overpowered. En fjende, der bliver dræbt af spillerens Attack, får derfor aldrig et sidste gratis angreb. Senere enemies skaleres i stedet op.

Resolutionen vises som op til tre faktiske state-trin: player impact, eventuel enemy Heal og til sidst enemy Attack. Player HP må ikke falde, før enemy Attack-trinnet begynder.

## Dungeon-flow og permanente rewards

Hver dungeon har ti floors, og floor 10 er boss. Genbrugte enemies får et synligt level, mens floor 9 er en Elite-variant. Nye mechanics introduceres én dungeon efter spilleren selv har fået adgang til dem.

### Dungeon 1 — The First Descent

Dungeon 1 er den basale læsedungeon. Alle enemies har præcis én Attack Die; ingen har Shield eller Heal. Fire archetypes gentages, så progressionen aflæses som stærkere levels frem for ti engangsmobs.

| Floor | Enemy | Level | HP | Dice | XP | Souls |
|---:|---|---:|---:|---|---:|---:|
| 1 | Slime | 1 | 5 | Attack | 8 | 5 |
| 2 | Slime Crawler | 1 | 7 | Attack | 10 | 7 |
| 3 | Goblin | 1 | 9 | Attack | 12 | 9 |
| 4 | Skeleton | 1 | 12 | Attack | 14 | 10 |
| 5 | Slime | 2 | 14 | Attack | 18 | 15 |
| 6 | Slime Crawler | 2 | 17 | Attack | 22 | 18 |
| 7 | Goblin | 2 | 20 | Attack | 26 | 22 |
| 8 | Skeleton | 2 | 24 | Attack | 32 | 28 |
| 9 | Skeleton Elite | 3 | 29 | Attack | 40 | 36 |
| 10 | Demon — Boss | Boss | 38 | Attack | 60 | 60 |

### Dungeon 2 — The Iron Descent

Dungeon 2 introducerer multi-dice enemies. Alle normale enemies har én Attack Die og én Shield Die. Spiked Behemoth tilføjer som boss en Heal Die, så spilleren møder den samme Heal-mechanic, som allerede kan være lært gennem Healing Arts.

| Floor | Enemy | Level | HP | Dice | XP | Souls |
|---:|---|---:|---:|---|---:|---:|
| 1 | Shieldbearer | 1 | 22 | Attack + Shield | 48 | 44 |
| 2 | Cultist | 1 | 26 | Attack + Shield | 52 | 48 |
| 3 | Orc | 1 | 30 | Attack + Shield | 58 | 54 |
| 4 | Blood Orc | 1 | 34 | Attack + Shield | 64 | 60 |
| 5 | Shieldbearer | 2 | 39 | Attack + Shield | 72 | 68 |
| 6 | Cultist | 2 | 44 | Attack + Shield | 80 | 76 |
| 7 | Orc | 2 | 50 | Attack + Shield | 90 | 86 |
| 8 | Blood Orc | 2 | 57 | Attack + Shield | 102 | 98 |
| 9 | Blood Orc Elite | 3 | 65 | Attack + Shield | 118 | 112 |
| 10 | Spiked Behemoth — Boss | Boss | 80 | Attack + Shield + Heal | 160 | 160 |

HP fortsætter mellem encounters. Efter hver sejr gives både XP og Souls permanent med det samme.

- `Victory`: vis `+XP`, `+Souls`, opdaterede totals, nuværende HP og dungeon-progress. Vis ingen information om næste enemy. Manuel mode bruger én Continue-knap; Auto Combat viser pulsen i cirka 1,25 sekunder og fortsætter, medmindre spilleren trykker Pause.
- `Defeat`: vis floor reached, enemies defeated og samlet XP/Souls optjent i descenten, før dungeon-dybden nulstilles ved retur til Hub.
- `Boss Victory`: markér dungeon-clear, vis hele descentens XP/Souls og antal besejrede enemies, og returnér derefter til Hub.
- `Leave Dungeon`: returnér direkte til Hub efter bekræftelse. Vis ingen Defeat-skærm og giv ingen ekstra rewards; allerede optjent XP/Souls forbliver permanente.

Et Defeat er derfor ikke et tabt run i incremental forstand. Spilleren mister kun positionen i dungeonen og den tid, der skal bruges på at nå samme dybde igen.

## Die Workshop

Spilleren vælger først én permanent terning og derefter en forge-metode:

- `Chaos Forge` ruller blandt alle eligible faces på den valgte die. Resultatet fastlåses før animationen, og prisen er lavere, mens flere mulige faces er tilbage. Rabatten falder gradvist; med kun én eligible face koster Chaos det samme som Precision.
- `Precision Forge` lader spilleren vælge præcis `face.id` og koster det dobbelte af den oprindelige numeriske face-pris. Det er den dyre sikkerhedsventil mod uønsket RNG.

| Precision upgrade | Souls |
|---|---:|
| 1 → 2 | 10 |
| 2 → 3 | 20 |
| Attack 3 → Evolution Ready | 80 |
| Shield/Heal 3 → 4 | 80 |
| Shield/Heal 4 → 5 | 200 |

En Chaos-operation beregnes ud fra den billigste nuværende Precision-opgradering på terningen og får op til 35% rabat ved seks eligible faces. Forge-køb bruger et persisteret operation-ID, så reload, retry eller gentaget event ikke kan betale samme køb to gange.

Attack-faces bliver ikke numerisk fladet ud over 3. Et Attack-face på 3 skal først vækkes til `Evolution Ready`, hvorefter spilleren vælger én gratis, permanent identitet med et separat bekræftelsestrin:

- `Power`: 5 Attack med det samme.
- `Momentum`: 3 Attack og +2 til den næste rullede face uanset type. Hvis Momentum rulles sidst, bliver bonus i stedet +2 Attack med det samme.
- `Rend`: 2 Attack og 2 Bleed. Nyt Bleed skader ikke i samme round. Ved starten af næste player resolution giver eksisterende Bleed direkte HP-skade gennem Shield og falder derefter med 1.

Alle tre evolutioner har fem samlet potentiel output, men forskellig timing og funktion: Power er øjeblikkelig, Momentum kan flytte styrke til Shield/Heal, og Rend er forsinket men omgår enemy Shield. Flere faces på samme die må vælge samme evolution; dette skal fortsat balance-playtestes mod blandede builds.

Evolutioner skal kunne identificeres på selve face-fladen uden at læse et tooltip. Den visuelle identitet er bindende på tværs af Workshop, dice summaries, den aktive combat-die, draw order og score-transfer:

- `Power` bruger et lyst eksplosions-/stjernemotiv og en hvidgylden accent.
- `Momentum` bruger tre fremadgående chevrons, fartstriber og en cyan accent.
- `Rend` bruger tre flænsende spor, en mørk blodrød overflade og en crimson accent.

Farven må ikke stå alene. Hver evolution beholder sin egen silhuet og sit mønster, mens et lille Attack-mærke fastholder, at den stadig bidrager til Attack. Når en evolution lander, får den en kort unik impact-puls og viser evolutionens navn, før værdien flyver til round-totalen. Den efterfølgende settled state skal fortsat være fuldt læsbar uden animation.

## Persistence

- Save-formatet er versionsstyret.
- Save-key er `new-dice-dungeon-save` og er isoleret fra legacy-spillet.
- Profil, aktivt run, enemy, HP, combat-phase, totals samt player- og enemy-roll-resultater persisteres.
- Save version 7 fjerner `runSouls` og flytter eventuelle version-6 Run Souls sikkert til spillerens permanente Soul-beholdning. De tidligere talent-, intent- og combat-shape-migrationer bevares.
- Save version 8 tilføjer idempotente `runStats` for enemies defeated samt XP/Souls optjent i den aktuelle descent. Et kompatibelt version-7-run rekonstruerer statistikken fra sine allerede ryddede floors.
- Save version 9 introducerer stabile encounter-ID'er, gentagne enemy-levels, 1–3 enemy dice og Dungeon 2. Et aktivt ældre run mappes sikkert via dungeonens floor-index, og eksisterende XP, Souls, talents, dice og faces bevares.
- Save version 10 erstatter den gamle Auto Roll-setting med Auto Combat, flytter talentet direkte efter Twin Arsenal, refunderer den gamle prisforskel én gang og persisterer automationens checkpoint, tidsbudget og random-seed.
- Save version 11 tilføjer controlled Forge-operationer, idempotente operation-ID'er, Attack-evolutioner, Momentum-state og enemy Bleed. Eksisterende Attack-faces over 3 migreres til Power uden at miste investeret styrke.
- Reload må ikke rulle en face igen eller give rewards igen.

## Visuel retning

- Mobile-first portræt ved cirka 384 px.
- Hard-edge pixel-art-kort, tydelige neon-accenter og høj kontrast.
- Attack er rød, Shield blå, Heal grøn, XP cyan og Souls lilla.
- Combat-boardet er rent og uden ydre kort omkring spillede dice eller totals.
- En spillet die genkendes på selve face-fladens farve og det rullede ikon, ikke på en type-label eller omgivende boks.
- Attack-, Shield- og Heal-totaler er skjult, indtil den pågældende type faktisk bliver rullet. Derefter vises kun ikon og værdi.
- Et nyt roll-resultat må ikke tælle med i den synlige total, mens terningen ruller. Efter landing flyver face-ikonet og værdien op i scoreområdet; totalen opdateres først ved impact. Samme feedback-system skal genbruges af alle nuværende og fremtidige face-typer.
- Evolved Attack-faces bryder bevidst den almindelige røde Attack-overflade med deres egen ramme, baggrundsmønster og silhuet. Et lille Attack-mærke bevarer typeaflæsningen, og landing samt score-transfer bruger evolutionens accent og navn.
- Enemy dice bruger samme Attack-, Shield- og Heal-faces, ikoner og fysiske terningesprog som player dice, men vises i cirka 65–70% størrelse i en kompakt intent-række. 1–3 resultater forbliver synlige, kan hver inspiceres for alle seks faces, pulserer ved deres resolutionstrin og dæmpes som `Cancelled`, hvis fjenden dør.
- Hub skal føles som spillerens fysiske base: dungeon-port, kompakt permanent resource-HUD, udstyrede dice på en pedestal og tydeligt adskilte ruter til Workshop eller en ny run.
- Workshop skal føles som et forge-rum: dice-rack, tydeligt Chaos/Precision-valg, seks fysiske face-fliser, anvil-preview, synlig Souls/impact-feedback og et særskilt evolution-kammer.
- Enemy sprites fra legacy-projektet kan genbruges, hvis animationens baseline er stabil.
- Victory skal føles som en kort pixel-game reward-pulse frem for et dashboard: fysisk banner, besejret enemy på en dungeon-platform, tydelige `XP`/`Souls`-drops og én knap videre. Detaljer om næste enemy hører først til på Combat-skærmen.
- Defeat skal afslutte med et descent-resumé, så spillerens incremental fremgang er synlig uden at forklare, at rewards er “permanent”, “kept” eller “secured”.
- Kritisk information må aldrig eksistere kun i animation; resultat og totals forbliver læsbare.

## MVP-balance og næste gate

Den data-drevne simulator bruges som regressionsværn, ikke som erstatning for playtest. Med 10.000 simulerede runs gav første tuning følgende gennemsnitlige dybde:

| Build | Gennemsnitligt højeste clear |
|---|---:|
| 1 Attack Die, 10 HP | 1,18 |
| 2 base Attack Dice, 12 HP | 2,66 |
| 2 Attack ≥3 + Shield ≥2, 15 HP | 6,29 |
| 2 Attack ≥4 + Shield ≥3, 16 HP | 8,16 |
| 2 Attack + Shield + Heal ≥3, 15 HP | Boss-clear over 90% |

Dungeon 1 bevarer den godkendte MVP-cadence: startbuildet stopper omkring floor 1, anden Attack Die flytter væggen til cirka floor 2–3, og en fuld fire-dice build med faces på mindst værdi 3 har over 90% boss-clear-rate. Heal forbliver derfor en sen Dungeon 1-unlock i stedet for at blive låst bag første clear.

Dungeon 2 starter en ny incremental kurve. Den samme fire-dice build lander i seedede regressioner omkring floor 4, et mellemtrin når cirka floor 5, og et sent build når bossen. Tre konkrete Shield-faces fra 4 → 5 løfter eksempelvis boss-clear-rate fra cirka 4% til cirka 70%; individuelle face-køb er dermed synligt meningsfulde frem for kun at virke ved fuld cap.

Før flere dice families, dungeons eller avancerede automationstrin bygges, skal følgende playtestes:

> Føles hvert enemy kill som permanent fremgang gennem både XP og Souls, og kan spilleren tydeligt mærke både nye muligheder og stærkere personlige dice i efterfølgende runs?

Der skal især måles, om Twin Arsenal faktisk købes efter run 2–3, om spilleren forstår at nye dice skal equippes, og om boss-væggen føles motiverende frem for abrupt. Hvis svaret ikke er et tydeligt ja, justeres XP-priser, enemy-tal, rewards og face-priser før større content-produktion.
