# Dice Dungeon — Classic Incremental V2 GDD

- **Status:** Autoritativt designdokument for den spilbare eksperiment-branch
- **Branch:** `codex/arcade-foundation-v1`
- **GDD-version:** 1.2
- **Senest opdateret:** 2026-08-02
- **Aktuel save-version:** 21

Denne GDD beskriver Classic Incremental V2. Hvis dokumentet er i konflikt med
`NEW_GAME_GDD.md`, gælder denne fil for V2-branchen. Production-spillet på `main`
forbliver urørt og fungerer kun som teknisk og visuel reference.

---

## 1. High concept

Dice Dungeon er et mobile-first incremental combat-spil om at udvikle en lille
samling permanente terninger.

Spilleren begynder svag, rammer hurtigt en dungeon-væg og vender tilbage med
permanent XP og Souls. XP åbner nye muligheder. Souls forbedrer tilfældige faces på
spillerens valgte terning. Næste run begynder med en lille, synlig fordel, som gør
det muligt at nå en smule længere.

Spillets centrale spørgsmål er:

> Hvor meget længere kan netop mine permanent udviklede terninger bringe mig i
> næste run?

Det primære produktløfte er:

> Hvert run giver permanent fremgang, hver Forge ændrer en virkelig terning, og
> gentagne handlinger bliver gradvist automatiseret.

V2 er ikke et roguelike. Der findes ingen bust, extraction, midlertidige builds,
run-only loot eller tab af allerede optjent valuta.

---

## 2. Designhypotese

Spillet skal bevise følgende:

> Korte tidlige nederlag, sikre permanente rewards og små uforudsigelige
> terningeforbedringer kan skabe en stærkere incremental-rytme end lange runs med
> mange manuelle valg.

Pacing løses derfor ikke ved at lægge mere input ind i hvert combat-turn. Den skabes
gennem:

- korte tidlige runs;
- synlige vægge;
- permanente rewards fra hvert kill;
- hyppige små upgrades;
- tilfældig face-growth;
- tidlig fuld automation;
- langsommere, mærkbare system-unlocks;
- flere permanente dice og loadout-valg senere.

---

## 3. Designprincipper

### 3.1 Incremental first

Spilleren skal altid kunne svare på:

- Hvad fik jeg permanent fra mit sidste run?
- Hvad er stærkere i mit næste run?
- Hvilken væg prøver jeg at flytte nu?
- Hvilken større unlock arbejder jeg mod?

### 3.2 Permanent progression må aldrig mistes

XP og Souls gives direkte ved hvert kill. Defeat og frivillig retreat nulstiller kun
det aktive dungeon-forsøg.

### 3.3 De permanente ressourcer har adskilte roller

- XP ændrer spillerens adgang, kapacitet og systemer.
- Souls ændrer konkrete faces på konkrete permanente terninger.
- Fate Tokens bruges kun til at afsløre og forbedre permanente Charms.

De tre ressourcer må ikke købe den samme type progression.

### 3.4 RNG skal skabe historier, ikke fiasko

Workshoppen må vælge et andet face end det, spilleren håbede på, men et køb må
aldrig give nul fremgang. RNG bestemmer placering og størrelse, ikke om købet virker.

### 3.5 Klarhed før kompleksitet

Resultater, totals, enemy intent og permanente upgrades skal kunne aflæses uden en
combat-log. Nye mechanics introduceres gradvist.

### 3.6 Automation er progression

Manuel interaktion lærer spilleren systemet. Auto Combat fjerner derefter gentagelsen
og gør spillet reelt idle/AFK-kompatibelt.

### 3.7 Terninger er personlige objekter

En unlock giver én navngiven permanent terning, aldrig uendelige kopier. Spilleren
vælger aktivt sit loadout inden for sin slot-cap.

---

## 4. Kerne-loop

```text
Start dungeon run
↓
Enemy ruller og viser intent
↓
Player-terninger ruller i den rækkefølge, de står i loadoutet
↓
Runden resolves tydeligt
↓
Et kill giver permanent XP og Souls med det samme
↓
Efter Fatecraft kan et kill også give Fate Tokens
↓
Fortsæt til næste floor eller dø/forlad runnet
↓
Brug XP i Talent Tree
↓
Brug Souls i Workshop
↓
Start igen med mere HP, bedre dice, flere slots eller mere automation
↓
Flyt den forventede dungeon-væg
```

Spilleren kan gennemføre flere kills i samme run, men behøver aldrig afslutte hele
dungeonen for at gøre permanent fremgang.

---

## 5. Fresh start og første progression

En ny V2-profil starter med:

| Parameter | Startværdi |
| --- | --- |
| Max HP | 10 |
| Dice slots | 1 |
| Ejet loadout | `Worn Blade Die` |
| Equipped | `Worn Blade Die` |
| Worn Blade faces | `1–1–1–1–1–1 Attack` |
| XP | 0 |
| Souls | 0 |
| Auto Combat | Låst |
| Workshop Die | `1–1–1–1–1–2` |
| Soul Die | `×1–×1–×1–×2–×2–×2` |
| Normal face cap | Ingen hard cap |
| Unlocked dungeon | `The First Descent` |

### Første encounter

Floor 1 er en Slime med:

- 3 HP;
- én deterministisk Attack Die på `2–2–2–2–2–2`;
- 4 XP reward;
- Soul Value 1.

Den urørte spiller:

1. bruger tre runder på at give 3 damage;
2. modtager to enemy-angreb før lethal player attack;
3. vinder med 6/10 HP;
4. får 4 XP og ruller Soul Die for 1–2 permanente Souls;
5. rammer floor 2 som den første tydelige væg.

Det første kill finansierer begge progressionslag:

- 4 XP køber `Inner Spark` rank 1.
- selv et `×1`-roll køber den første Workshop Forge.

---

## 6. Permanent økonomi

Der findes tre permanente ressourcer med hver sin rolle.

| Ressource | Optjenes | Bruges | Mistet ved Defeat |
| --- | --- | --- | --- |
| XP | Hvert enemy kill | Talent Tree | Nej |
| Souls | Hvert enemy kill | Konkrete dice-face upgrades | Nej |
| Fate Tokens | Drops efter Fatecraft | Fate Draw og Charm-ranks | Nej |

Der findes ingen Gold, Coins, Materials, ubankede Souls eller `At Risk`.

### 6.1 XP — adgang og kapacitet

XP svarer på:

> Hvad kan min karakter og konto nu?

XP kan give:

- Max HP;
- dice slots;
- navngivne permanente dice;
- Auto Combat;
- hurtigere combat;
- stærkere Workshop Die;
- flere valgfrie Workshop target-rerolls;
- nye dungeons;
- adgang til systemer som Charms.

XP må ikke øge værdien på et konkret player-face.

### 6.2 Souls — konkret terningestyrke

Souls svarer på:

> Hvor stærke er mine permanente terninger blevet?

Souls bruges på et Workshop-ritual, der forbedrer ét konkret face på én
player-valgt terning. Souls må ikke købe HP, slots, automation, content-adgang eller
Talent Tree-noder.

### 6.3 Reward-regler

- Rewards gives atomisk ved et gyldigt kill.
- Hver enemy har en fast Soul Value. Soul-payout er `Soul Value × Soul Die`.
- Soul Die bruger en persisteret shuffle-cycle: alle seks stabile faces trækkes én gang før reshuffle.
- Soul-roll og payout gemmes før animationen; Auto Combat bruger samme resultat uden at pause.
- Samme encounter-reward kan kun gives én gang.
- Reload, dobbeltklik eller Auto Combat må ikke duplikere rewards.
- Defeat bevarer alle kills fra det afsluttede run.
- `Leave Dungeon` bevarer alle allerede optjente rewards og tæller ikke som Defeat.

### 6.4 Fate Tokens, drops og skjult bad-luck protection

Fate Tokens begynder først at droppe, når `Fatecraft` er købt.

- Normale enemies har 20% dropchance for 1 Fate Token.
- Hver femte eligible kill uden drop garanterer 1 Token og nulstiller pity.
- Elite-enemies giver altid 1 Token.
- Bosses giver altid 3 Tokens.
- Pity er permanent profil-state og bevares mellem runs.
- Pity er aldrig player-facing. Før Fatecraft vises, rulles eller optjenes ingen Fate-state.
- Dungeon 1's otte normale enemies, elite og boss giver mindst 5 Tokens selv ved
  værst mulige normale rolls, så ét Fate Draw altid kan finansieres.
- Samme encounter kan aldrig udbetale Tokens to gange.

### 6.5 Fate Draw

Et Fate Draw koster 5 Fate Tokens og fastlåser én permanent Charm.

- Prisen trækkes atomisk, før reveal-animationen starter.
- Den valgte Charm og operationens ID persisteres, så reload ikke reroller eller
  dobbeltbetaler.
- Resultatet afsløres i et separat slot-machine-overlay, som visuelt cykler
  Charm-puljen igennem og lander på den allerede persisterede Charm.
- Hvert Draw vælger først rarity med basisvægtene Common 50%, Rare 30%, Epic
  15% og Legendary 5%. Legendary bruger orange som sin faste UI-farve.
- Der findes ingen gratis første-draw-garanti og ingen indbygget rarity-pity.
- Ukendte Charms har fire gange vægten af kendte Charms inden for den valgte
  rarity, men duplicates er mulige fra første Draw.
- Talentet `Fate's Favor` kan senere tilføje synlig bad-luck protection for
  Epic+ og Legendary draws. Beskyttelsen eksisterer kun, når talentet er købt.
- En kendt Charm øges én rank; max-rank Charms fjernes fra draw-poolen.
- Fate Sanctums header har en kompakt info-knap, som viser basisraterne
  Common 50%, Rare 30%, Epic 15% og Legendary 5%. Panelet forklarer også
  normalisering ved max-rank categories og at kun `Fate's Favor` giver
  rarity-beskyttelse.

### 6.6 Charm collection og loadout

Charms er permanente, konto-ejede regelændringer. De forbedrer combat-rytmer,
rewards eller overlevelse, men ændrer ikke konkrete dice faces.

- `Fatecraft` giver første Charm-slot.
- `Woven Pair` giver slot 2.
- `Trinity Knot` giver slot 3 efter Dungeon 2-clear.
- Charms vælges i Fate Sanctum og auto-equippes aldrig ved unlock.
- Equipped Charms snapshots ved run-start; loadout kan ikke ændres mid-run.
- Progress counters til rytme-Charms persisteres i det aktive run.

Det første Charm-katalog:

| Charm | Rank 1 | Rank 2 | Rank 3 |
| --- | --- | --- | --- |
| Ward Clock · Common | Start hver encounter med 2 Shield | 3 Shield | 4 Shield |
| Soul Prism · Common | +1 Soul per kill | +2 | +3 |
| Blade Rhythm · Rare | Hvert 3. Attack-roll får +3 Attack | +5 | +7 |
| Bloodroot · Rare | Heal 1 HP efter hvert 2. kill | Heal 1 efter hvert kill | Heal 2 efter hvert kill |
| Echo Knot · Epic | 15% chance for at gentage et rolls raw output | 20% | 25% |
| Loaded Star · Epic | Hver 5. die gentager sit raw output | Hver 4. | Hver 3. |
| Crimson Oath · Legendary | Med kun Attack Dice får hvert Attack-roll +1 | +2 | +3 |
| Unbroken Wall · Legendary | Behold 25% ubrugt Shield til næste round | 40% | 60% |

Raw roll betyder værdien før Charm-bonusser. Native output følger face-familien:
Attack, Shield eller Heal.

---

## 7. Permanente terninger og loadout

### 7.1 Datamodel

Hver permanent terning har:

- et stabilt `die.id`;
- et player-facing navn;
- en family: Attack, Shield eller Heal;
- præcis seks faces;
- et stabilt `face.id` per face;
- en permanent individuel face-værdi;
- senere eventuel evolution eller signature.

Faces med samme værdi er fortsat separate objekter.

### 7.2 Ownership og slots

- En talent-unlock giver én bestemt permanent die.
- En ny die auto-equippes ikke.
- Når en ny dice-slot købes, fyldes den automatisk med den første allerede ejede,
  ikke-equipped die. Eksisterende loadout-rækkefølge ændres ikke.
- Spilleren vælger loadout i Hub.
- Mindst én die skal være equipped.
- Loadout kan ikke ændres under et aktivt run.
- Equipped dice snapshots ved run-start, så Hub-upgrades ikke ændrer runnet midtvejs.

### 7.3 Aktuelt dice-katalog

| Stabilt ID | Navn | Family | Startfaces | Adgang |
| --- | --- | --- | --- | --- |
| `attack-die-1` | Worn Blade Die | Attack | `1–1–1–1–1–1` | Fresh start |
| `attack-die-2` | Striker Die | Attack | `1–1–1–2–2–3` | Striker Pattern |
| `shield-die-1` | Iron Guard Die | Shield | `1–1–2–2–2–3` | Shieldcraft |
| `heal-die-1` | Vitality Die | Heal | `1–1–1–2–2–3` | Healing Arts |
| `attack-die-executioner` | Executioner Die | Attack | `2–2–3–3 + 2 Execute` | Executioner Doctrine |
| `shield-die-tower` | Tower Die | Shield | `2–2–3–3 + 2 Fortify` | Tower Discipline |
| `heal-die-bloodwell` | Bloodwell Die | Heal | `2–2–2–2 + 2 Drain` | Bloodwell Doctrine efter Dungeon 1-clear |

Worn Blade og Striker starter mekanisk ens i V2. Deres langsigtede forskel opstår
gennem uafhængig random growth, forskellige Workshop-forløb og senere
family-evolutions.

### 7.4 Signature-faces

`Execute`:

- giver 3 Attack;
- giver 5 Attack, hvis enemy begyndte player-roll-sekvensen på højst 50% HP.

`Fortify`:

- giver 3 Shield;
- giver +2 til næste Shield-face i samme roll-sekvens;
- hvis intet Shield-face følger, gives +2 Shield straks.

`Drain`:

- giver 1 Heal;
- tilføjer samtidig 2 Attack til rundens player-total.

Signature-faces kan ikke vælges af den nuværende Workshop.

---

## 8. Workshop

Workshoppen er V2’s vigtigste gentagne incremental-upgrade.

### 8.1 Player flow

1. Spilleren vælger én ejet permanent die.
2. UI viser dens seks nuværende faces og samlede Forge-vækst.
3. Spilleren betaler den viste Soul-pris.
4. Workshoppen flicker mellem alle eligible faces.
5. Ét tilfældigt face fastlåses som target.
6. Eventuelle Face Mastery-rerolls kan bruges eller gemmes; et nyt target kan være
   det samme face igen.
7. Spilleren accepterer target og ruller den separate Workshop Die.
8. Workshop Die bestemmer upgrade-mængden.
9. Target-face får hele den viste permanente forbedring.
10. Resultatet viser face-nummer, `+X` samt gammel og ny værdi.

### 8.2 Eligible faces

Et face kan rammes, hvis det:

- ikke er et signature-face;
- ikke allerede er evolved;
- ikke venter på en evolution.

Target vælges uniformt blandt alle eligible faces uanset nuværende værdi.

### 8.3 Workshop Die

Base Workshop Die:

```text
1–1–1–1–1–2
```

| Loaded Alloy-rank | Workshop Die | Gennemsnit |
| ---: | --- | ---: |
| 0 | `1–1–1–1–1–2` | 1,17 |
| 1 | `1–1–1–1–2–2` | 1,33 |
| 2 | `1–1–1–2–2–2` | 1,50 |
| 3 | `1–1–1–2–2–3` | 1,67 |

Et resultat over 1 er et jackpot-resultat. Workshop Die har ingen 0-side.

### 8.4 Fri face-skalering og Face Mastery

Normale, ikke-evolved faces har ingen hard numeric cap. Et `+2/+3`-resultat
anvendes altid fuldt. Den stigende Soul-pris er systemets soft cap.

`Face Mastery` giver 1, 2 og 3 valgfrie target-rerolls per Forge. Rerolls sker
efter target-roll og før Workshop Die-roll, koster ikke ekstra Souls og kan ramme
samme face igen. Ubrugte rerolls overføres ikke til næste Forge.

### 8.5 Soul-pris

Prisen beregnes ud fra terningens samlede permanente face-vækst over startværdien 1:

```text
Cost = 1 + floor(total applied face upgrades / 3)
```

| Samlet growth før køb | Pris |
| ---: | ---: |
| 0–2 | 1 Soul |
| 3–5 | 2 Souls |
| 6–8 | 3 Souls |
| 9–11 | 4 Souls |
| 12–14 | 5 Souls |

Et `+2`-resultat øger den samlede growth med 2 og kan derfor krydse et pristrin
hurtigere.

### 8.6 Atomisk persistence

Ved første Forge-handling fastlåses og gemmes:

- operation-ID;
- die-ID;
- target-face-ID;
- target-face-historik;
- brugte reroll-operation-ID’er;
- resterende rerolls;
- Workshop-face-ID;
- råt roll;
- faktisk anvendt roll;
- tidligere face-værdi;
- Soul-pris.

Souls trækkes én gang ved operationens start. Reload mellem target-roll og
Workshop-roll genoptager samme operation. Completion må kun ændre face-værdien én
gang.

### 8.7 Visuel retning

- Target-faces flicker og stopper tydeligt.
- Workshop Die er en fysisk seks-sidet 3D-cube.
- Workshop og Combat deler cube-, tumble- og landing-logik.
- Efter tumble roterer cuben præcist til det landede face, som vises frontvendt på
  samme måde som en player-die i Combat.
- `+X` vises i resultatpanelet og må ikke erstatte cuben med en flad face.

### 8.8 Bevidst ikke player-facing i V2

Følgende eksisterer helt eller delvist som teknisk reference, men er ikke en del af
V2’s nuværende Workshop-loop:

- Precision Forge;
- manuelt face-valg;
- family-evolution-selection;
- signatur-upgrades.

---

## 9. Talent Tree

Talent Tree bruger kun XP og er bygget radialt omkring `Inner Spark`.

### 9.1 Retninger

| Retning | Identitet | Primær progression |
| --- | --- | --- |
| Centrum | Core | Tidlig HP og adgang til alle retninger |
| Nord | Arsenal | Slots og nye permanente dice |
| Vest | Workshop | Workshop Die, Soul-effektivitet og target-kontrol |
| Syd | Descent | Auto Combat, hastighed, HP og dungeons |
| Øst | Fate & Fortune | XP/Soul-effektivitet, Fate Tokens og Charms |

Rank 1 af `Inner Spark` åbner alle fire retninger samtidigt. Retningerne udelukker
ikke hinanden. Flere junctions kræver kun ét af to eller to af tre forbundne
talenter, så centrale mål kan nås ad flere veje.

### 9.2 Komplet aktuelt talent-katalog

| Talent | Ranks/pris | Krav | Permanent effekt |
| --- | --- | --- | --- |
| Inner Spark | 4 / 7 / 11 / 16 / 24 XP | Ingen | +1 Max HP per rank; rank 1 åbner alle retninger |
| Second Grip | 16 XP | Inner Spark rank 1 | +1 slot |
| Striker Pattern | 16 XP | Inner Spark rank 1 | Striker Die |
| Shieldcraft | 42 XP | Second Grip **eller** Striker Pattern | Iron Guard Die |
| Third Grip | 58 XP | Shieldcraft | +1 slot |
| Healing Arts | 78 XP | Third Grip | Vitality Die |
| Fourth Grip | 36 XP | Healing Arts + Dungeon 1 clear | +1 slot |
| Bloodwell Doctrine | 36 XP | Healing Arts + Dungeon 1 clear | Bloodwell Die |
| Executioner Doctrine | 135 XP | Third Grip | Executioner Die |
| Tower Discipline | 110 XP | Third Grip | Tower Die |
| Loaded Alloy | 8 / 16 / 28 XP | Inner Spark rank 1 | Opgrader Workshop Die per rank |
| Efficient Tools | 10 / 22 / 40 XP | Inner Spark rank 1 | 20% lavere Workshop-pris per rank, multiplicativt |
| Face Mastery | 14 / 30 / 55 XP | Loaded Alloy **eller** Efficient Tools | +1 valgfri target-reroll per Forge per rank |
| Auto Combat | 6 XP | Inner Spark rank 1 | Fuld normal combat-automation |
| Quick Draw | 10 / 18 / 28 XP | Auto Combat | 15% hurtigere roll/score per rank |
| Deep Reserves | 18 / 28 / 42 XP | Auto Combat | +2 Max HP per rank |
| Second Descent | 75 XP | Quick Draw **eller** Deep Reserves + Dungeon 1 clear | Unlock The Iron Descent |
| Field Studies | 5 / 14 / 30 XP | Inner Spark rank 1 | +1 XP per enemy per rank |
| Soul Die Mastery | 5 / 14 / 30 XP | Inner Spark rank 1 | Soul Die: `1,1,2,2,2,2` → `1,1,2,2,2,3` → `1,2,2,2,2,3` |
| Fatecraft | 30 XP | Field Studies **eller** Soul Die Mastery + Dungeon 1 clear | Unlock Fate drops, Fate Sanctum og Charm-slot 1 |
| Fate's Favor | 18 / 36 / 64 XP | Fatecraft | Epic+ inden 8 draws → inden 6 draws → Legendary inden 15 draws |
| Woven Pair | 45 XP | Fatecraft | Charm-slot 2 |
| Trinity Knot | 90 XP | Woven Pair + Dungeon 2 clear | Charm-slot 3 |

Kun første rank af en multi-rank prerequisite er nødvendig, medmindre andet står
eksplicit.

### 9.3 Afledte caps

- Base Max HP: 10.
- Maksimal nuværende talent-HP: 21.
  - Inner Spark: +5.
  - Deep Reserves: +6.
- Base dice slots: 1.
- Maksimale nuværende slots: 4.
- Base Charm slots: 0.
- Maksimale nuværende Charm slots: 3.
- Normale faces har ingen hard numeric cap.
- Face Mastery giver maksimalt 3 target-rerolls per Forge.

### 9.4 Quick Draw

Hver rank multiplicerer roll-speed med `1,15`.

| Rank | Samlet speed-multiplier |
| ---: | ---: |
| 0 | ×1,000 |
| 1 | ×1,150 |
| 2 | ×1,323 |
| 3 | ×1,521 |

### 9.5 Talent Tree UX

- Noder ligger på et næsten sort, skærmfyldende canvas.
- Spilleren kan panorerere frit og zoome 65–140%.
- Retninger har korte, tydelige forbindelser.
- Købte nodes, åbne nodes og låste nodes skal aflæses uden små tekst-tags.
- En node viser ikon, checkmark/rank-pips, outline og eventuel puls.
- Ét fremtidigt lag kan anes som en svag fog-silhuet.
- Køb sender energi gennem forbindelsen og afslører nye nodes som en chain reaction.
- Nodeklik åbner et stort, læsbart modal-overlay med effekt, rank, pris og handling.

---

## 10. Combat

### 10.1 Round flow

1. Enemy-resultater genereres og persisteres.
2. Enemy-dice ruller automatisk og viser præcist intent.
3. Player-draw-pilen er låst under enemy reveal.
4. Alle equipped player-dice lægges i en persisteret draw-pile i præcis loadout-rækkefølge.
5. Spilleren trækker én die ad gangen uden replacement.
6. Hvert face-resultat persisteres før animationen.
7. Resultatet flyver til den relevante synlige round-total.
8. Når draw-pilen er tom, kan runden resolves.
9. Næste round starter, hvis begge parter lever.

Der er ingen bust, stop-early eller gratis reroll.

### 10.2 Round totals

En total vises først, når dens type faktisk er rullet:

- Attack;
- Shield;
- Heal.

Der vises ingen tomme type-placeholders.

### 10.3 Resolution-rækkefølge

1. Player Heal anvendes op til Max HP.
2. Player Attack reducerer enemy Shield og derefter HP.
3. Eventuel player recoil/selvskade anvendes.
4. Reel samtidig død afgøres som Player Defeat.
5. Hvis enemy er død: Victory; enemy intent og attack-animation annulleres.
6. Hvis enemy lever: enemy Heal anvendes op til max HP.
7. Enemy Attack rammer player Shield og derefter HP.
8. Ved 0 player HP: Defeat.
9. Midlertidigt Shield nulstilles.
10. Næste round forberedes.

Player lethality har prioritet over enemy intent. En dræbt enemy angriber aldrig.

### 10.4 Enemy dice

- En enemy har 1–3 seks-sidede dice.
- Dice er Attack, Shield eller Heal.
- Resultaterne er synlige før player-rolls.
- Enemy Shield erstattes ved hver ny round og udløber efter enemy-fasen.
- Enemy Heal udføres kun, hvis enemy overlever player-fasen.

### 10.5 Auto Combat

Auto Combat er én player-styret toggle, der:

- ruller alle player-dice;
- scorer resultater;
- resolver runden;
- starter næste round;
- fortsætter gennem normale Victory-pulses;
- starter næste normale floor.

Auto Combat stopper ved:

- Defeat;
- Boss Victory;
- manuelt pausevalg;
- åbning af Run Menu.

Auto Retry findes ikke.

### 10.6 Ingen offline-fremdrift

Auto Combat kører kun, mens spillet er åbent og aktivt. Browser-suspension,
lukning eller fravær simulerer ingen rounds og giver ingen XP eller Souls. Det
aktive runs præcise state persisteres stadig og fortsætter ved næste åbning.

### 10.7 Leave Dungeon

Run Menu kan åbnes under et run.

- Menuen pauser live Auto Combat.
- `Leave Dungeon` kræver bekræftelse.
- XP, Souls og permanent progression bevares.
- Floor, enemy, round og aktuel HP-runstate nulstilles.
- Handlingen tæller ikke som Defeat.

---

## 11. Dungeon-struktur

Hver dungeon har:

- 10 floors;
- genbrugte archetypes i stærkere levels;
- floor 9 som Elite;
- floor 10 som boss;
- permanent reward efter hvert kill.

### 11.1 Dungeon 1 — The First Descent

Formål:

- lære Attack og enemy intent;
- etablere run → reward → Forge-loopet;
- lade spilleren lære Auto Combat;
- skabe en længere første incremental-bue uden enemy Shield eller Heal.

Alle enemies har præcis én Attack Die.

| Floor | Enemy | Level | HP | Attack faces | XP | Soul Value |
| ---: | --- | ---: | ---: | --- | ---: | ---: |
| 1 | Slime | 1 | 3 | `2–2–2–2–2–2` | 4 | 1 |
| 2 | Slime Crawler | 1 | 5 | `2–2–2–3–3–3` | 5 | 1 |
| 3 | Goblin | 1 | 8 | `2–2–3–3–3–4` | 6 | 1 |
| 4 | Skeleton | 1 | 12 | `3–3–3–4–4–4` | 8 | 1 |
| 5 | Slime | 2 | 17 | `3–3–3–4–4–4` | 11 | 1 |
| 6 | Slime Crawler | 2 | 23 | `3–3–3–4–4–5` | 15 | 1 |
| 7 | Goblin | 2 | 30 | `4–4–4–4–5–5` | 20 | 1 |
| 8 | Skeleton | 2 | 36 | `4–4–4–5–5–6` | 28 | 1 |
| 9 | Skeleton Elite | 3 | 42 | `5–5–5–6–6–7` | 38 | 2 |
| 10 | Demon | Boss | 55 | `6–6–6–7–8–9` | 55 | 3 |

### 11.2 Dungeon 2 — The Iron Descent

Formål:

- introducere multi-die enemy intent;
- lære spilleren at aflæse kombinationer af enemy-dice;
- teste værdien af player Shield, Heal og større loadouts;
- introducere Shield, Heal og dobbelte Attack-profiler før bossens tre-die preview.

Normale enemies har præcis to dice, men forskellige roller: Shieldbearer bruger
Attack + Shield, Cultist bruger Attack + Heal, og Orc/Blood Orc bruger to Attack
Dice. Spiked Behemoth bruger Attack + Shield + Heal som preview af Dungeon 3's
tre-die-sprog.

| Floor | Enemy | Level | HP | Attack | Shield | Heal | XP | Soul Value |
| ---: | --- | ---: | ---: | --- | --- | --- | ---: | ---: |
| 1 | Shieldbearer | 1 | 22 | `5–5–6–6–7–7` | `0–1–1–1–2–2` | — | 48 | 5 |
| 2 | Cultist | 1 | 26 | `4–4–5–5–5–6` | — | `0–1–1–2–2–3` | 52 | 5 |
| 3 | Orc | 1 | 30 | `2–2–2–3–3–4` + `3–3–4–4–4–5` | — | — | 58 | 5 |
| 4 | Blood Orc | 1 | 34 | `2–2–3–3–4–6` + `2–3–3–4–5–7` | — | — | 64 | 5 |
| 5 | Shieldbearer | 2 | 39 | `6–7–7–7–8–9` | `1–2–2–2–3–3` | — | 72 | 6 |
| 6 | Cultist | 2 | 44 | `5–5–6–6–6–7` | — | `1–1–2–2–3–4` | 80 | 6 |
| 7 | Orc | 2 | 50 | `3–3–4–4–5–5` + `4–4–5–5–6–6` | — | — | 90 | 6 |
| 8 | Blood Orc | 2 | 57 | `3–3–4–4–6–8` + `3–4–4–5–7–9` | — | — | 102 | 6 |
| 9 | Blood Orc Elite | 3 | 65 | `4–4–5–5–7–9` + `4–5–5–6–8–10` | — | — | 118 | 8 |
| 10 | Spiked Behemoth | Boss | 80 | `8–9–9–9–10–11` | `3–3–4–4–5–6` | `0–0–1–1–2–3` | 160 | 12 |

Dungeon 2’s tal er implementerede, men endnu ikke endeligt balanceret til V2’s
langsommere progression.

---

## 12. Outcome-skærme

### Normal Victory

Viser kort:

- besejret enemy;
- floor-progress;
- encounterens XP og Souls;
- total XP og Souls;
- aktuel HP;
- Continue eller Auto Combat-status.

Der vises ingen information om næste enemy.

### Boss Victory

Viser:

- dungeon clear;
- samlet antal besejrede enemies;
- samlet XP og Souls fra descenten;
- permanent clear-progress;
- tilbagevenden til Hub.

### Defeat

Viser:

- floor reached;
- enemies defeated;
- XP og Souls optjent i runnet;
- at progressionen er beholdt;
- handling til at vende tilbage og opgradere.

---

## 13. Tilsigtet progression og pacing

Den deterministiske journey-simulator bruger en canonical prioritet:

1. Inner Spark rank 1.
2. Auto Combat.
3. Field Studies.
4. Quick Draw.
5. Loaded Alloy.
6. Second Grip.
7. Striker Pattern.
8. Flere Inner Spark-, Quick Draw- og Loaded Alloy-ranks.
9. Shieldcraft.
10. Third Grip.
11. Healing Arts.
12. Deep Reserves.
13. Second Descent.

Aktuelle regression-rails:

| Milepæl | Forventet run |
| --- | --- |
| Første permanent face-upgrade | Run 1 |
| Auto Combat | Run 2–3 |
| Anden permanent die | Run 6–15 |
| Første Dungeon 1-clear | Run 12–55 |

Disse er balancegrænser, ikke endelige release-løfter. Simulatoren måler runs og
matematik, men ikke realtid, animationstempo, ventetid eller spillerens subjektive
motivation.

Hubben giver adgang til et ikke-destruktivt `DEV · Balance Lab`, som kører
100–500 fresh-save-journeys mod de samme pure combat-, reward-, Talent Tree- og
Workshop-regler. Værktøjet viser P10, median, P90 og reach-rate for milepæle samt
en run-kurve. Fire canonical strategier — balanced, Arsenal-first,
Workshop-first og economy-first — gør det muligt at opdage obligatoriske paths
og falske valg, men de erstatter ikke fri spilleradfærd eller fysisk playtest.

### Pacing-mål

- Første kill skal føles garanteret og forståeligt.
- Første run skal finansiere både en XP- og en Soul-beslutning.
- Auto Combat skal komme før manuel rolling bliver trættende.
- Anden die skal være et langsigtet tidligt mål, ikke en første-session freebie.
- Hver Forge skal kunne ændre næste runs sandsynlige floor-wall.
- Dungeon 1-clear skal kræve gentagen permanent vækst, men ikke føles som tom grind.

---

## 14. UI/UX og visuel retning

### 14.1 Platform

- Mobile-first ved 384 px.
- Skal også fungere ved 320 px.
- Portrait-orienteret game-shell.
- Hard-edge pixel-art uden afrundede app-kort.

### 14.2 Visuelt hierarki

- Næsten-sort negativ plads.
- Fysiske 3D-pixelterninger.
- Attack er rød, Shield blå, Heal grøn.
- XP-valutaen er cyan, mens Talent Tree-systemets globale accent er grøn.
- Fate Sanctum og Fate-systemet er lilla og skal visuelt kunne skelnes tydeligt
  fra det grønne Talent Tree.
- Workshop-power er varm guld.
- HP, rewards og totals skal være læselige uden log.

### 14.3 Combat-readability

- Enemy sprite, navn, intent og HP er scene-hierarkiet.
- Enemy intent vises før player-action.
- Dice-resultater holdes længe nok til at kunne læses.
- Værdien animeres til den relevante total.
- En landet face og en afsluttet total skal stadig kunne læses efter animationen.
- Dice-bagsider skjules i WebKit og standard-rendering.

### 14.4 Semantik og accessibility

- Interaktioner bruger semantiske buttons.
- Headings og regions navngives.
- HP og dungeon-progress bruger progressbars.
- State kommunikeres ikke kun gennem farve.
- Fokus-state skal være synlig.
- Reduced-motion springer unødvendig tumble over, men bevarer det korrekte resultat.

---

## 15. Persistence og tekniske designregler

- Save-key: `new-dice-dungeon-save`.
- Save-version: 20.
- Version 18 migrerer gamle tre-offer Fate Draws til ét persisteret resultat
  uden ny betaling eller reroll.
- Version 16 migreres med en frisk persisteret Soul Die draw-pile uden tab af XP, Souls, dice, talents, Fate Tokens eller Charms.
- Version 15 migreres med Fate/Charm-defaults uden tab af XP, Souls, dice eller talents.
- Pre-V2 saves starter frisk på den isolerede branch.
- Aktivt run, enemy intent, draw-pile, runde og allerede rullede faces persisteres.
- Et face-resultat gemmes før animationen.
- Draw-pilen oprettes i loadout-rækkefølge ved round-start og trækkes uden replacement.
- `Resolve Round` er låst, mens draw-pilen indeholder dice.
- Enemy rewards er idempotente.
- Forge-operationer er idempotente.
- Fate Draw-operationer og Charm-valg er idempotente.
- Pending Fate Draw persisteres med det allerede valgte resultat.
- Equipped dice og Charms snapshots ved run-start.
- XP, Souls og Fate Tokens er de eneste valutaer.
- Legacy draw/bust, relics, draft og run-only dice må ikke importeres i V2-state.

---

## 16. Implementeret, eksperimentelt og deferred

### Implementeret og bindende i V2

- Fresh start med én seks-sidet 1-Attack Die.
- Permanente XP og Souls per kill.
- Defeat uden currency-tab.
- Random target Workshop.
- Separat Workshop Die og totrins-Forge.
- Radialt Talent Tree.
- Auto Combat.
- Quick Draw.
- Op til fire slots.
- Attack-, Shield- og Heal-dice.
- To dungeons á 10 floors.
- Enemy multi-dice i Dungeon 2.
- Run Menu og frivillig retreat.
- Fate Token-drops med skjult profile-level bad-luck protection efter Fatecraft.
- Fate Sanctum med atomisk single-result draw og slot-machine reveal.
- Otte Charms fordelt i Common, Rare, Epic og orange Legendary med tre ranks
  og tre mulige loadout-slots.
- Charm progress/procs i Combat og outcomes.
- Save-version 21 med rarity-progress, Soul Die cycle, single-result pending
  Fate Draw, Charm collection, loadout og run-snapshots.
- Version 20 migrerer Striker, Iron Guard, Vitality, Executioner og Tower til deres
  stærkere canonical baselines uden at overskrive højere investerede face-værdier.
- Gamle Twin Arsenal-køb splittes tabsfrit; et allerede købt tomt Fatecraft refunderes fuldt.

### Implementeret, men endnu ikke endeligt V2-balanceret

- Dungeon 2’s endelige HP, dice og rewards efter den første kombinations-tuning.
- Executioner Die.
- Tower Die.
- Deep Arsenal/Descent-priser.

### Bevidst deferred

- Flere Charms inden for de fire etablerede rarity tiers.
- Charm-reroll, banish eller targeted acquisition.
- Auto Retry.
- Precision Forge i player-facing V2.
- Manuelt face-valg.
- Family-evolution-selection i V2 Workshop.
- Signature-face Mastery.
- Dungeon 3+.
- Production merge.

---

## 17. Åbne designspørgsmål

1. Føles target-flicker og Workshop-roll stadig godt efter 15–25 køb?
2. Giver 1–3 target-rerolls agency uden at gøre random target ligegyldigt?
3. Er Auto Combat run 2–3 tidligt nok til at undgå input-træthed?
4. Er de separate 16-XP-køb Second Grip og Striker Pattern reelle valg, eller købes de altid sammen?
5. Opleves Dungeon 1-clear omkring run 12–45 som progression eller grind?
6. Skal Worn Blade og Striker have forskellige medfødte identiteter senere?
7. Hvornår skal family-evolutions vende tilbage i V2?
8. Føles 20% dropchance plus pity spændende uden at skabe for meget reward-støj?
9. Føles ét random resultat med early no-duplicate protection spændende eller for lidt player agency?
10. Er første Charm-slot efter Dungeon 1 det rigtige tidspunkt, eller bør Fatecraft komme lidt tidligere?
11. Er de otte første Charm-effekter og deres rarities lige læsbare under hurtig Auto Combat?

---

## 18. Næste anbefalede designarbejde

1. Gennemfør en fysisk fresh-save-playtest på iPhone.
2. Mål realtid til første kill, første Forge, Auto Combat, floor 3, Second Grip og Striker Pattern.
3. Log 15–25 Workshop-køb og vurder variation, tempo, Soul soft-cap og reroll-værdi.
4. Fysisk playtest D2's Attack+Heal og dobbelte Attack-profiler samt Bloodwell-loadoutet.
5. Playtest Fatecraft, første Fate Draw og mindst to simultaneous Charm-procs.
6. Mål acquisition rate og rank-up tempo gennem Dungeon 1 og 2.
7. Beslut derefter, om V2 skal erstatte production, fortsætte separat eller levere
   enkelte systemer tilbage til `main`.
