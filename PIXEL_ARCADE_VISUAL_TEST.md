# Pixel Arcade Visual Test

## Formål

Dette dokument beskriver den alternative grafiske retning på branchen
`codex/pixel-arcade-visual-test`.

`CLASSIC_INCREMENTAL_V2.md` er fortsat kilden til gameplay, progression,
økonomi og persistence. Dette dokument ændrer kun præsentationen og overstyrer
`DESIGN.md` visuelt på denne testbranch.

Målet er at undersøge, om Dice Dungeon bliver mere umiddelbart, læsbart og
spilagtigt med et markant simplere pixel-arcade-look:

- ren sort canvas;
- hårde hvide pixelrammer;
- få, mættede gameplayfarver;
- mindre dekorativt dungeon-støj;
- fysiske 3D-terninger som de vigtigste hero-objekter.

## Fastlåst scope

Testen omfatter:

- Hub;
- Combat;
- Workshop;
- Talent Tree;
- nødvendige bro-skærme: Dungeon Select, Loadout, Victory, Defeat, Run Menu og
  overlays.

Testen ændrer ikke:

- gameplay-regler;
- balance eller rewards;
- save-format eller progression;
- enemy-sprites;
- combat- og Workshop-terningernes fysiske 3D-logik.

`main` og `codex/classic-incremental-v2` skal derfor kunne sammenlignes direkte
med denne branch.

## Visuelle grundregler

### 1. Sort er selve scenen

Baggrunden er ren sort. Der bruges ikke murværk, runer, tåge, gradientkort eller
dekorative rammer, hvis de ikke kommunikerer gameplay.

Negativ plads skal gøre sprites, terninger, HP og handlinger lettere at aflæse.

### 2. Hvide pixelrammer skaber hierarki

Primære sektioner bruger hårde hvide rammer. Interne opdelinger bruger tyndere
hvide linjer. Der bruges:

- ingen afrundede kort;
- ingen glassmorphism;
- ingen bløde skygger;
- ingen diffuse panelglows.

Trykbare elementer må bruge en hård, forskudt pixel-skygge, så de stadig føles
som fysiske knapper.

### 3. Farve har en funktion

Farver bruges som gameplay-sprog og ikke som baggrundsdekoration:

| Farve | Primær betydning |
| --- | --- |
| Rød | Attack, enemy og fare |
| Blå | Shield og forsvar |
| Grøn | HP, Heal og fremgang |
| Lilla | Souls og Fate |
| Gul | Workshop, køb og stærk highlight |
| Cyan | Dice, loadout og aktiv automation |

Hvid tekst og form skal stadig gøre informationen forståelig uden farven alene.

### 4. Terningerne er de fysiske hero-objekter

UI-skallen er flad, men player-, enemy- og Workshop-terninger forbliver ægte
seks-sidede 3D-objekter.

- Alle faces har hvid outline og mættet familiefarve.
- Bagsider skal altid skjules.
- Rolling må vise fysisk dybde.
- Landed-state viser resultatet præcist frontvendt.
- Glow eller jackpot-feedback skal ligge i separate dekorationslag og må aldrig
  påføre `filter`, `opacity` eller en ny `transform` på selve 3D-cuben eller dens
  ancestor.
- Det landede resultat skal kunne aflæses uden animation.

## Skærmretning

### Hub

Hubben er en kompakt startmenu og statusoversigt:

- enkel titelramme;
- XP og Souls i én tydelig resource-række;
- permanent loadout i en hvid ramme;
- fire ligeværdige handlinger i et 2×2-grid: Dungeon, Talent Tree, Workshop og
  Loadout;
- developer-værktøjer forbliver sekundære.

### Combat

Combat skal ligne et fokuseret arcade-board:

- topbjælke med floor, round og Souls;
- enemy-sprite på ren sort scene;
- navn, level, HP og enemy dice uden et bagvedliggende dungeon-panel;
- player HP og kun de round totals, som faktisk eksisterer;
- stor negativ roll-flade omkring den aktive 3D-terning;
- draw order og handlinger forbliver synlige efter animationen.

Flere enemy dice bruger samme fysiske sprog som player-dice, men i en mindre
skala.

### Workshop

Workshoppen præsenterer to tydelige trin:

1. En target-række viser, hvilken permanent face det første rul vælger.
2. Den fysiske Workshop Die viser, hvor stor opgraderingen bliver.

Gul er Workshop-accenten. `+2/+3` får et tydeligt jackpot-frame omkring cuben,
men resultatet forbliver frontvendt og fysisk.

### Talent Tree

Talent Tree er et sort spatialt canvas med kompakte die-sized nodes:

- aktive forbindelser er gule;
- åbne forbindelser er hvide;
- låste forbindelser forbliver mørke, også hvis deres prerequisite er købt;
- købsklare nodes har gul/hvid markering;
- købte nodes er mættede og tydeligt udfyldte;
- fog-nodes er svage silhuetter;
- nodeinformation vises i et stort, fladt overlay med læsbar tekst.

Pan, zoom, fog og purchase-animationer bevares.

## Mobile-first regler

- Primær referencebredde: 384 px.
- Understøttet kontrolbredde: 320–430 px.
- Primære handlinger skal have mindst omtrent 44×44 px touch target.
- Ingen vandret side-overflow; lokale dice-racks må scrolle vandret.
- Combat skal holde de vigtigste handlinger synlige ved 700 px viewport-højde.
- Safe-area padding bevares ved nederste actions.
- Desktop må centrere mobil-boardet med en hård hvid ydre ramme.

## Acceptkriterier for testen

Retningen er teknisk godkendt, når:

- Hub, Combat, Workshop og Talent Tree bruger samme arcade-sprog;
- alle primære flows kan gennemføres uden gameplayændringer;
- fysiske dice virker under idle, roll, landed og jackpot;
- UI fungerer ved 320, 384 og 430 px;
- låste Talent Tree-paths ikke fremstår købsklare;
- Victory og Defeat føles som del af samme spil;
- browserkonsollen er uden errors og warnings;
- TypeScript, tests, lint og production-build består.

## Bevidst udskudt

- nye eller omtegnede enemy-sprites;
- et nyt samlet ikonbibliotek;
- ny fontproduktion;
- fuld oprydning af den ældre CSS under override-laget;
- endelig beslutning om denne retning skal erstatte den nuværende V2-stil.

Før en mergebeslutning bør begge versioner sammenlignes på en fysisk telefon
med samme save og de samme combat-, Workshop- og Talent Tree-scenarier.
