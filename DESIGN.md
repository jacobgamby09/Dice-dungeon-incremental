# Dice Dungeon — Pixel Arcade Design System

Status: gældende visuel og interaktiv produktionsreference.
Version: 2.1 — 2026-07-30.

Læs dette dokument før nye skærme, komponenter, animationer eller assets designes.
`CLASSIC_INCREMENTAL_V2.md` bestemmer gameplay, progression og økonomi. Dette
dokument bestemmer den officielle visuelle retning. Den tidligere
dungeon-diorama-retning er arkiveret i `DESIGN_LEGACY_DIORAMA.md`.

## Design vision

Dice Dungeon skal ligne et fokuseret pixel-arcade-spil, ikke en webapp og ikke
et dekorativt dungeon-diorama.

Spillet bygges omkring en klar kontrast:

- UI-skallen er flad, sort, kompakt og øjeblikkeligt læsbar.
- Terningerne er fysiske 3D-objekter og skærmens vigtigste helte.
- Enemy-sprites står frit på scenen uden dekorativ baggrundsstøj.
- Farve bruges til gameplaybetydning, ikke som tilfældig pynt.
- Hårde pixelrammer viser hierarki og interaktion.

Det visuelle mål kan opsummeres som:

> Ren sort arcade-canvas + hårde pixelrammer + mættet gameplayfarve + fysiske 3D-terninger.

## Bindende grundregler

### 1. Sort er scenen

Den primære baggrund er ren sort. Negativ plads er et aktivt designværktøj og
skal give enemy-sprites, dice, HP, rewards og handlinger plads til at dominere.

Brug ikke:

- murværk, runer, tåge eller dungeon-paneler som standardbaggrund;
- gradientkort, glassmorphism eller diffuse panelglows;
- dekorative piedestaler og rammer uden gameplayfunktion;
- tomme placeholders, som forklarer en tilstand UI'et allerede kommunikerer.

### 2. Tre niveauer af rammer

Hvide pixelrammer skaber et tydeligt informationshierarki:

1. **Primær handling / modal:** 3–4 px hvid ramme og eventuelt hård pixel-skygge.
2. **Gameplaysektion:** 2 px hvid ramme eller separator.
3. **Sekundær intern information:** 1–2 px dæmpet grå ramme.

Ikke alle elementer må have samme visuelle vægt. En ramme skal enten gruppere,
separere eller signalere interaktion.

Faste regler:

- Ingen `border-radius` på spillets primære UI.
- Ingen bløde skygger.
- Klikbare hovedelementer må bruge en hård forskudt skygge.
- Pressed-state flytter knappen ned mod skyggen.
- Fokus vises med en tydelig gul outline.

### 3. Farve er gameplay-sprog

| Farve | Betydning |
| --- | --- |
| Rød | Attack, enemy, skade og fare |
| Blå | Shield og forsvar |
| Grøn | HP, Heal, victory og sikker fremgang |
| Lilla | Souls, Fate og permanent magisk kraft |
| Gul | Workshop, køb, jackpot og stærk highlight |
| Cyan | Dice, loadout, XP og automation |
| Hvid | Primær tekst, struktur og neutral handling |
| Grå | Sekundær tekst, utilgængelig eller hvilende state |

Farve må aldrig stå alene. Ikon, tekst, værdi eller form skal samtidig gøre
betydningen forståelig.

### 4. Terningen er helten

Player-, enemy- og Workshop-dice forbliver rigtige seks-sidede 3D-objekter.
Det flade UI må aldrig gøre dem til almindelige kort eller ikoner.

- Alle faces bruger stabil familiefarve, tydeligt ikon og læsbar værdi.
- Bagsider skjules i både standard- og WebKit-rendering.
- Rolling må vise fysisk dybde.
- Landed-state står præcist frontvendt.
- Resultatet forbliver synligt efter animationen.
- Evolution- og signature-faces skal kunne identificeres uden tekst.
- Glow, jackpot og impacts ligger i separate dekorationslag.
- Anvend aldrig `filter`, `opacity` eller en ny ancestor-`transform` på 3D-cuben.

## Typografi og ikoner

- `--arcade-font-display` bruges til titler, labels og handlinger med tydelig
  arcade-identitet.
- `--arcade-font-ui` bruges til forklarende tekst, status og længere copy, hvor
  læsbarhed er vigtigere end karakter.
- `--arcade-font-numeric` bruges til HP, resources, round totals og andre tal;
  numeriske kolonner bruger tabular figures.
- Displaytitler må være pixelprægede; brødtekst og kompakt data skal være klart
  læseligt ved 320 px.
- Store tal og aktuelle resultater har højere vægt end labels.
- Eyebrows er korte, sekundære og må ikke bære nødvendig information alene.
- UI-copy skal være konkret: `Roll`, `Resolve`, `Buy`, `Enter`, `Leave`.
- Lucide er tilladt som midlertidigt ikonbibliotek.
- Funktionelle Lucide-ikoner normaliseres gennem deres afgrænsede UI-container,
  så stroke-vægt og størrelse er ens. Face-, evolution- og signature-ikoner
  forbliver data-drevne gennem den centrale face registry.
- Permanente gameplayikoner skal følge samme pixel-grid og outline-vægt.

En senere font- og ikonpass må ikke forsinke layout, hierarchy eller
gameplay-feedback.

## Motion grammar

Gameplaymotion følger:

> anticipation → impact → settled state

- **Roll:** løft/tumble → hård landing → frontvendt face.
- **Score:** effekt forlader die → rammer total → total reagerer.
- **Attack:** power samles → enemy impact → HP ændres.
- **Enemy turn:** intent aktiveres → enemy udfører → Shield/HP reagerer.
- **Workshop:** target vælges → Workshop Die ruller → permanent face forbedres.
- **Talent:** node ruller/impacter → forbindelser aktiveres → nye silhuetter afsløres.

Et resultat må aldrig kræve animation for at kunne forstås. Reduceret motion
skal stadig vise samme sluttilstand og rækkefølge.

### Arcade Polish v1-kontrakt

- Presentation layer læser kun allerede fastlåste og persisterede resultater;
  animation må aldrig vælge eller ændre et roll.
- Et player-roll bevæger sig gennem de læsbare states `rolling`, `landed`,
  `scoring` og `idle`.
- Landingen får en kort familie-farvet impact. Evolution- og signature-faces
  må få en stærkere separat effekt, men den frontvendte face skal forblive klar.
- Score-feedback skal vise source, bevægelse og arrival: effekten forlader
  terningen, rejser mod den relevante total og udløser en kort reaktion dér.
- HP-feedback ligger i et separat overlay og skelner mellem damage, heal og
  block. Ved partial block vises både blokeret skade og faktisk HP-skade.
- Resolution-states har forskellige toner for victory, heal, full block,
  player impact og enemy impact.
- Quick Draw reducerer presentation delays, men bevarer minimumspauser ved
  landing, score-transfer og resolution, så resultatet fortsat kan aflæses.
- Auto Combat er en cyan player-styret mode med en eksplicit `Pause`-handling.
  Dens primære statusknap må ikke ligne en almindelig utilgængelig knap.
- `prefers-reduced-motion` fjerner rejse og pulser, men bevarer alle settled
  states, værdier og semantiske forskelle.

## Mobile-first layout

- Primær referencebredde: 384 px.
- Understøttet kontrolbredde: 320–430 px.
- Primære touch targets er mindst omtrent 44 × 44 px.
- Ingen sidebred horisontal overflow.
- Lokale dice-racks må scrolle vandret.
- Safe-area padding bevares ved bundhandlinger.
- Desktop centrerer mobil-boardet; det udvider ikke informationsarkitekturen.
- På korte viewports komprimeres sekundære paneler før den aktive die,
  roll-resultater eller primær handling beskæres.

## Skærmspecifikationer

### Hub

Hub er en kompakt status- og navigationsskærm:

- titel og en kort incremental fantasy;
- XP og Souls i én resource-række;
- nuværende permanente loadout;
- fire tydelige handlinger i et 2 × 2-grid;
- developer-værktøjer er visuelt sekundære.

Hubben må ikke ligne en miljøscene. Den skal give spilleren svaret på:
`Hvad ejer jeg?`, `Hvad kan jeg forbedre?` og `Hvor går jeg hen nu?`

### Dungeon Select og Loadout

- Hver dungeon viser adgang, progression og central mekanisk identitet.
- Den primære `Enter`-handling har højere vægt end forklarende copy.
- Owned, equipped og locked skal være forskellige gennem form, ikon og kontrast.
- Dice-faces skal kunne inspiceres uden at åbne endnu et uklart informationslag.

### Combat

Combat er den visuelle reference for hele spillet og læses oppefra:

1. Floor, round, Souls og diskret Run Menu.
2. Enemy-scene med sprite, navn, level, HP og kommende dice-intent.
3. Player HP og kun de round totals, der faktisk er afsløret.
4. Roll-zone med aktiv 3D-die og vedvarende draw-order.
5. Auto-state og én dominerende konteksthandling.

Combat bruger tre visuelle vægte:

- enemy/player/roll er store sektioner;
- intent, totals og draw-order er interne gameplaygrupper;
- labels, counters og automationstatus er sekundære.

Den aktive die har en reserveret hero-zone. Effekter må ikke gemmes bag header,
draw-order eller browserchrome. Layoutet skal understøtte 1–6 player-dice og
1–3 enemy-dice uden at ændre resolutionens forståelighed.

Auto Combat skal ligne en aktiv mode, ikke en disabled knap. Spilleren skal
kunne se, at spillet fortsætter automatisk, og hvordan det pauses.

### Workshop

Workshop kommunikerer det permanente upgrade-ritual som to adskilte rul:

1. Target Roll vælger uniformt en eligible face.
2. Workshop Die bestemmer `+1`, `+2` eller `+3`.

Target-resultatet holdes synligt gennem hele ritualet. Workshop Die-resultat og
distribution må ikke afsløres før cuben er landet. Gul er primær accent, og et
jackpot-resultat får en separat hård frame uden at ændre cubens 3D-kontekst.

### Talent Tree

Talent Tree er et sort, rumligt canvas med die-sized nodes:

- spilleren kan pan og zoome;
- købt er mættet og udfyldt;
- købsklar er gul/hvid;
- synlig men låst er mørk;
- fog er en svag silhuet;
- aktive forbindelser er gule;
- åbne forbindelser er hvide;
- utilgængelige forbindelser er mørke.

Et nodeklik åbner et stort, fladt overlay med navn, state, konkrete effekter,
eventuelle die-faces og én købshandling. Gentaget branchtekst og intern
implementeringscopy fjernes.

### Victory, Defeat og overlays

- Victory bruger grøn/cyan reward-identitet.
- Defeat bruger rød identitet uden at ligne en straf for mistet permanent valuta.
- Reward, run-total og næste handling er den primære rækkefølge.
- Run Menu, Away Recap og die-details bruger samme flade framehierarki som
  resten af spillet.
- En modal skal tydeligt adskilles fra skærmen bagved og have én primær handling.

## CSS-arkitektur

Den officielle Pixel Arcade-stil ligger i `src/styles/arcade/`:

- `tokens.css` — farver og fælles designvariabler;
- `shared.css` — shell, typografi, knapper, HP og tværgående primitives;
- `dice.css` — fælles fysisk die-skin;
- `hub.css`;
- `combat.css`;
- `workshop.css`;
- `talent-tree.css`;
- `outcomes.css` — bro-, outcome- og overlayflader;
- `responsive.css` — viewport- og width-specifikke justeringer.

`src/newGame.css` indeholder fortsat det eksisterende strukturelle layout.
Arcade-modulerne importeres bagefter og er den canonical presentation layer.
Nye Pixel Arcade-regler skal placeres i det relevante modul, ikke appendes til
`newGame.css`.

## Accessibility og kvalitet

- Brug semantiske buttons, headings, labels og progressbars.
- Alle interaktive elementer har synlig `:focus-visible`.
- Disabled, locked, bought og active skal kunne skelnes uden farve alene.
- Vigtig tekst må ikke afhænge af ekstremt små pixel-fontstørrelser.
- `prefers-reduced-motion` skal respekteres.
- Browserkonsollen skal være fri for errors og warnings.

## Definition of done for visuelle ændringer

En ændring er først færdig, når:

- den er kontrolleret ved 320, 384 og 430 px;
- aktiv, landed, disabled og relevante edge states er læsbare;
- 3D-dice ikke flader ud, spejlvendes eller forsvinder;
- der ikke er horisontal side-overflow;
- TypeScript, tests, lint og production-build består;
- `progress.md` beskriver ændringen og kendte mangler.

## Bevidst udskudt

- omtegnede enemy-sprites;
- samlet custom pixel-ikonbibliotek;
- endelig brand-font;
- en fuld strukturel omskrivning af den ældre layout-CSS;
- desktop-specifik informationsarkitektur.
