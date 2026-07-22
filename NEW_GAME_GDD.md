# Dice Dungeon Incremental — Game Design Document

Status: gældende design for det nye spil. Version: MVP 0.4.

## High concept

Dice Dungeon Incremental er først og fremmest et mobile-first incremental combat-spil. Spilleren begynder med få muligheder og korte dungeon-runs, men opbygger permanent styrke, større systemadgang og gradvist mere automation. Dungeon-dybde er et resultat af spillerens langsigtede progression.

Spillerens terninger er permanente genstande. Hver terning har seks individuelle faces med stabile IDs. Spilleren mærker progressionen direkte ved at opgradere én konkret face og senere se netop den face lande i kamp.

Extraction er spillets risikolag, ikke dets primære genreidentitet. Et run skaber altid permanent fremgang gennem XP, mens extraction afgør, om de optjente Run Souls også kommer med hjem og kan forbedre terningerne.

Det overordnede produktløfte er:

> Hvert run gør spilleren permanent mere kapabel, og de permanente forbedringer lader spilleren nå dybere, tjene hurtigere og gradvist automatisere tidligere manuelt arbejde.

Det centrale spørgsmål inde i et run er:

> Tør jeg tage én kamp mere med min nuværende HP og mine Run Souls på spil?

Det gamle Dice Dungeon spurgte, om spilleren turde trække én terning mere før bust. Det draw/bust-loop er ikke en del af det nye spil.

## Incremental-first designhierarki

Spillets systemer prioriteres i denne rækkefølge:

1. Permanent incremental fremgang.
2. Personlige, permanente terninger.
3. Klar og tilfredsstillende combat-feedback.
4. Extraction-risiko omkring Souls.
5. Gradvis automation og større systemdybde.

Tidlige runs må gerne være korte. De er ikke selvstændige roguelike-builds, der skal kunne gennemføre alt fra starten. De leverer ressourcer til den permanente progression, som flytter spillerens forventede dungeon-dybde over tid.

Spilleren skal mærke hurtig fremgang fra begyndelsen. De første 2–3 runs skal give adgang til mærkbare XP-opgraderinger, og terning nummer to skal unlockes tidligt nok til, at combat-loopet hurtigt udvikler sig fra ét enkelt roll til opbygningen af en rigtig rundetotal.

## Kerne-loop

```text
Hub
→ vælg dungeon
→ træk alle permanente terninger i tilfældig rækkefølge
→ resolve Heal, Attack, Shield og enemy intent
→ vind XP og Run Souls
→ bliv permanent tættere på næste XP-talent
→ Extract og bank Souls, eller Continue og risikér dem for større udbytte
→ brug XP på karakter-, system- og content-unlocks
→ brug Banked Souls på én bestemt face på én eksisterende terning
→ start et nyt run med større kapacitet og stærkere personlige dice
→ nå dybere, tjene hurtigere og unlock mere automation
```

## Ressourcer

| Ressource | Type | Optjenes | Bruges | Ved død |
|---|---|---|---|---|
| XP | Permanent | Ved enemy kill | Talent tree | Beholdes |
| Run Souls | Midlertidig | Ved enemy kill | Extraction-pulje | Mistet |
| Banked Souls | Permanent | Ved extraction | Dice/face-upgrades | Beholdes |

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
- Auto Roll og hurtigere combat.
- Nye dungeons.
- Højere face caps.
- Adgang til face evolutions.
- Soul-relaterede talents, eksempelvis delvis beskyttelse ved Defeat.

XP gør ikke eksisterende dice faces stærkere direkte. En XP-node kan give adgang til eller tildele en ny permanent die, men efterfølgende forbedringer af den konkrete die betales med Banked Souls.

### Souls — konkret dice-styrke

Souls repræsenterer kraft taget med ud af dungeonen. Ved enemy kills tilføjes de som Run Souls til det aktive run.

- Ved `Defeat` mistes alle ubankede Run Souls.
- Ved `Extract` flyttes alle Run Souls atomisk til Banked Souls.
- Banked Souls mistes aldrig ved Defeat.
- Banked Souls bruges kun på konkrete permanente dice- og face-upgrades.

Souls svarer på:

> Hvor stærke er mine terninger blevet?

Souls må ikke købe Talent Tree-noder, Max HP, dice slots, automation eller dungeon-adgang. XP må omvendt ikke betale for en konkret face-upgrade.

### Samspillet mellem XP og Souls

XP unlocker muligheder; Souls forbedrer de konkrete muligheder:

```text
XP: Unlock Shield Dice
→ spilleren modtager sin første permanente Shield Die
→ Banked Souls forbedrer individuelle faces på netop den terning

XP: Unlock Face Mastery
→ faces må udvikles over den nuværende cap
→ Banked Souls betaler for den konkrete face-opgradering eller evolution
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

| Talent | Pris | Krav | Permanent effekt |
|---|---:|---|---|
| Battle-Hardened I | 8 XP | Ingen | +2 Max HP |
| Twin Arsenal | 16 XP | Battle-Hardened I | +1 dice slot og én Striker Die |
| Shieldcraft | 32 XP | Twin Arsenal | Én Iron Guard Die og adgang til Shield-familien |
| Battle-Hardened II | 24 XP | Shieldcraft | +3 Max HP |
| Third Grip | 40 XP | Shieldcraft | +1 dice slot |
| Quick Draw | 20 XP | Shieldcraft | Roll- og score-animationer er 25% hurtigere |
| Healing Arts | 55 XP | Third Grip | Én Vitality Die og adgang til Heal-familien |
| Auto Roll | 40 XP | Quick Draw | Permanent adgang til en spillerstyret Auto Roll-toggle |
| Fourth Grip | 90 XP | Healing Arts | +1 dice slot |

Auto Roll simulerer kun spillerens `Draw`-tryk. Spilleren kan slå togglen til og fra under combat, og manuel rulning er stadig tilgængelig, når den er slået fra. Næste draw starter 300 ms efter, at det forrige resultat er færdigscoret. Auto Roll resolver ikke automatisk runden; Auto Resolve er en separat senere progression.

Den tidlige tilsigtede cadence er:

1. Første floor giver 8 XP og låser Battle-Hardened I op efter første run.
2. Twin Arsenal købes normalt efter run 2 eller 3, afhængigt af hvor dybt spilleren gik.
3. Den nye Striker Die findes derefter i collection, men spilleren skal selv equippe den i det nye slot.
4. Shieldcraft åbner derefter de tre samtidige spor Survival, Arsenal og Control.

## Kamp

Spilleren ser altid enemy HP og det præcise næste intent før første draw. Hver enemy ejer en data-drevet seks-sidet Attack Die med stabile die- og face-ID'er. Ved rundestart vælges og persisteres enemy-resultatet først; derefter ruller en mindre fysisk enemy-die automatisk og lander som det synlige intent. Player Draw er låst under reveal-animationen. Resultatet ændres aldrig bagefter, og en dræbt enemy får fortsat sit viste intent annulleret.

Efter enemy reveal blandes alle udstyrede player dice i en persisteret draw-pile. `Draw` tager den næste tilfældige terning uden replacement, ruller den og føjer den dynamisk til rækken af spillede terninger. Boardet har ingen faste Attack-, Shield- eller Heal-slots. Hvert resultat gemmes som præcis `die.id`, `face.id`, type og værdi før animationen vises.

Alle udstyrede terninger skal trækkes præcis én gang. Først når posen er tom, aktiveres manuel `Resolve Round`. Der er intet stop- eller bust-valg.

### Resolution-rækkefølge

1. Heal spilleren op til max HP.
2. Attack reducerer først enemy Shield og derefter enemy HP.
3. Eventuel recoil, Thorns eller selvskade anvendes.
4. Hvis spilleren er død, er udfaldet Defeat — også ved reel Double K.O.
5. Hvis fjenden er død, er udfaldet Victory, og dens intent og attack-animation annulleres.
6. Hvis fjenden lever, udfører den sit viste intent.
7. Rundens Shield blokerer enemy damage; resten rammer HP.
8. Ved 0 HP er udfaldet Defeat.
9. Midlertidigt Shield nulstilles, og næste runde forberedes.

Spilleren skal kunne føle sig overpowered. En fjende, der bliver dræbt af spillerens Attack, får derfor aldrig et sidste gratis angreb. Senere enemies skaleres i stedet op.

Resolutionen vises som to faktiske state-trin: først opdateres enemy HP og spillerens Attack-animation, derefter — efter en tydelig pause — udføres og vises en overlevende fjendes tur. Player HP må ikke falde, før enemy-trinnet begynder.

## Dungeon og extraction

MVP-dungeonen `The First Descent` har ti floors. Floor 10 er bossen.

| Floor | Enemy | HP | Start Shield | Attack Die faces | XP | Run Souls |
|---:|---|---:|---:|---|---:|---:|
| 1 | Slime | 5 | 0 | 1·2·2·2·2·3 | 8 | 5 |
| 2 | Slime Crawler | 7 | 0 | 2·2·2·3·3·3 | 10 | 7 |
| 3 | Marrow Bat | 9 | 0 | 2·2·3·3·4·4 | 12 | 9 |
| 4 | Goblin | 12 | 0 | 3·3·3·4·4·4 | 14 | 10 |
| 5 | Shieldbearer | 14 | 3 | 3·3·4·4·4·4 | 18 | 15 |
| 6 | Cultist | 17 | 0 | 3·3·3·4·4·5 | 22 | 18 |
| 7 | Skeleton | 20 | 0 | 4·4·4·5·5·5 | 26 | 22 |
| 8 | Orc | 24 | 0 | 4·4·5·5·6·6 | 32 | 28 |
| 9 | Blood Orc | 29 | 0 | 5·5·5·6·6·7 | 40 | 36 |
| 10 | Demon — Boss | 38 | 6 | 6·6·6·7·8·9 | 60 | 60 |

HP fortsætter mellem encounters. Efter hver sejr gives XP permanent med det samme, mens Souls føjes til run-puljen.

- `Extract`: flyt alle Run Souls atomisk til Banked Souls, afslut run og returnér til Hub.
- `Continue`: behold HP og Run Souls, spawn næste encounter med større pres og reward.
- `Defeat`: sæt Run Souls til 0; behold XP, Banked Souls, dice collection og face-upgrades.
- `Boss Victory`: bank hele runnets Soul-pulje automatisk, markér dungeon-clear og returnér derefter til Hub uden en ekstra risikobeslutning.

Et Defeat er derfor ikke et tabt run i incremental forstand: al XP optjent under runnet beholdes og flytter spilleren permanent mod næste talent. Det eneste risikotab er de endnu ikke bankede Run Souls.

## Die Workshop

Spilleren vælger først én permanent terning og derefter én af dens seks konkrete faces. UI viser face-ID, nuværende værdi, næste værdi og pris.

| Upgrade | Banked Souls |
|---|---:|
| 1 → 2 | 5 |
| 2 → 3 | 10 |
| 3 → 4 | 40 |
| 4 → 5 | 100 |

Prototype-cap er 5. Kun den valgte `face.id` ændres, og betalingen udføres atomisk.

## Persistence

- Save-formatet er versionsstyret.
- Save-key er `new-dice-dungeon-save` og er isoleret fra legacy-spillet.
- Profil, aktivt run, enemy, HP, Run Souls, combat-phase, totals samt player- og enemy-roll-resultater persisteres.
- Save version 5 migrerer et eksisterende numerisk enemy intent til en stabil face med samme damage og afviser inkompatible legacy combat-shapes sikkert til Hub i stedet for at lade UI'et crashe.
- Reload må ikke rulle en face igen eller give rewards igen.

## Visuel retning

- Mobile-first portræt ved cirka 384 px.
- Hard-edge pixel-art-kort, tydelige neon-accenter og høj kontrast.
- Attack er rød, Shield blå, Heal grøn, XP cyan og Souls lilla.
- Combat-boardet er rent og uden ydre kort omkring spillede dice eller totals.
- En spillet die genkendes på selve face-fladens farve og det rullede ikon, ikke på en type-label eller omgivende boks.
- Attack-, Shield- og Heal-totaler er skjult, indtil den pågældende type faktisk bliver rullet. Derefter vises kun ikon og værdi.
- Et nyt roll-resultat må ikke tælle med i den synlige total, mens terningen ruller. Efter landing flyver face-ikonet og værdien op i scoreområdet; totalen opdateres først ved impact. Samme feedback-system skal genbruges af alle nuværende og fremtidige face-typer.
- Enemy Attack Die bruger samme røde Attack-face, ikon og fysiske terningesprog som player dice, men vises i cirka 65–70% størrelse i enemy-zonen. Den forbliver synlig som låst intent, kan inspiceres for alle seks faces, pulserer ved enemy action og dæmpes som `Cancelled`, hvis fjenden dør.
- Hub skal føles som spillerens fysiske base: dungeon-port, kompakt permanent resource-HUD, udstyrede dice på en pedestal og tydeligt adskilte ruter til Workshop eller en ny run.
- Workshop skal føles som et forge-rum: dice-rack, seks fysiske face-fliser, anvil-preview og synlig Souls/impact-feedback, når præcis ét permanent face forbedres.
- Enemy sprites fra legacy-projektet kan genbruges, hvis animationens baseline er stabil.
- Victory skal føles som en pixel-game scene frem for et dashboard: fysisk banner, besejret enemy på en dungeon-platform, loot-pickups og to tydelige ruter for Extract eller Continue.
- Kritisk information må aldrig eksistere kun i animation; resultat og totals forbliver læsbare.

## MVP-balance og næste gate

Den data-drevne simulator bruges som regressionsværn, ikke som erstatning for playtest. Med 10.000 simulerede runs gav første tuning følgende gennemsnitlige dybde:

| Build | Gennemsnitligt højeste clear |
|---|---:|
| 1 Attack Die, 10 HP | 1,18 |
| 1 Attack Die, 12 HP | 1,46 |
| 2 Attack Dice, 12 HP | 2,67 |
| 2 Attack + Shield, 15 HP | 4,41 |
| 2 Attack + Shield + Heal, 15 HP | 6,99 |

Enemy dice sænker den gennemsnitlige dybde en anelse uden at flytte de tilsigtede progression walls. Startbuildet klarer floor 1 i 99,86% af 10.000 seedede runs. Faces på mindst værdi 3 giver den fulde fire-dice build en boss-clear-rate på 93,5%, så bossen er stabilt mulig uden at blive deterministisk. Det skaber en bevidst sen MVP-væg, hvor både XP-unlocks og konkrete Soul-opgraderinger er nødvendige.

Før flere dice families, dungeons eller avancerede automationstrin bygges, skal følgende playtestes:

> Føles hvert tidligt run som permanent fremgang gennem XP, samtidig med at extraction af Souls er spændende, og kan spilleren tydeligt mærke både nye muligheder og stærkere personlige dice i efterfølgende runs?

Der skal især måles, om Twin Arsenal faktisk købes efter run 2–3, om spilleren forstår at nye dice skal equippes, og om boss-væggen føles motiverende frem for abrupt. Hvis svaret ikke er et tydeligt ja, justeres XP-priser, enemy-tal, rewards og face-priser før større content-produktion.
