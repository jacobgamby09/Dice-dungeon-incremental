# Dice Dungeon — Visual Design System

Status: gældende visuel og interaktiv designreference for **Dice Dungeon Incremental**.  
Version: 1.3 — 2026-07-23.

Læs dette dokument før nye skærme, komponenter, animationer eller assets designes. `NEW_GAME_GDD.md` bestemmer spillets regler og progression; dette dokument bestemmer, hvordan spillet skal føles og se ud. `DESIGN_STATE.md` beskriver det gamle Dice Dungeon og er kun legacy-kontekst.

## Design vision

Dice Dungeon skal ligne et lille, håndbygget dungeon-diorama i pixel art — ikke en webapp med et pixel-font ovenpå.

Spilleren skal opleve, at UI-elementerne findes fysisk i verdenen:

- Navigation er porte, stier, skilte og arbejdsstationer.
- Information ligger på bannere, plaques, målere og loot-objekter.
- Terninger står på racks, piedestaler eller spilleflader.
- Knapper føles som solide, trykbare pixel-objekter med dybde.
- Resultater bevæger sig fra deres kilde til deres destination i stedet for blot at dukke op.

Det visuelle mål kan opsummeres som:

> Dark fantasy dungeon + farverig arcade-læsbarhed + fysisk 3D-pixel-scene.

## Production art bible

Denne sektion omsætter visionen til faste produktionsvalg. Den er baseline for nye skærme og assets; afvigelser skal være bevidste og begrundede.

### Visuel karakter

Dice Dungeon er **mørkt, men ikke grimdark**. Verdenen er sort sten, mørkt jern og slidt træ, oplyst af varm forge-ild, lilla Soul-magi og klare gameplay-farver. Miljøet må være dystert; interaktive objekter skal være arcade-læsbare og indbydende at trykke på.

Tre ord styrer udtrykket:

- **Håndbygget:** objekter har tydelig masse, samlinger, sokler og kontakt med gulvet.
- **Arkade:** fare, reward og handling aflæses øjeblikkeligt gennem stærke silhuetter og farver.
- **Personligt:** permanente dice og faces skal ligne spillerens konkrete ejendele, ikke anonyme statistikfelter.

### Sceneopbygning

Alle primære skærme bygges i fire dybdelag:

1. **Baggrund:** murværk, tunnel, væg eller mørk atmosfære. Lav kontrast og ingen vigtig tekst.
2. **Mellemgrund:** port, bue, forge, rack, arena eller anden fysisk scenearkitektur.
3. **Gameplay-lag:** enemy, dice, face, loot og den aktuelle handling. Højeste kontrast.
4. **Forgrund/HUD:** kompakte plaques og målere, som er forankret til scenen og aldrig skjuler hovedobjektet.

Et centralt objekt skal have en synlig kontaktflade: piedestal, hylde, bænk, gulvskygge eller platform. Ikoner må ikke svæve alene som erstatning for et sceneobjekt.

### Pixel-grid og kanter

- Layout kan være responsivt, men hvilende kanter og sprites skal lande på hele CSS-pixels.
- Primære sceneobjekter bruger 3–4 px næsten-sort outline (`#030308`–`#080812`).
- Interaktive objekter bruger 4–7 px hård kontakt-/bundskygge.
- Inset-highlights er 2–3 px og kommer som udgangspunkt ovenfra/venstre.
- Ingen primære objekter må være defineret alene af en tynd 1 px-streg.
- Sprite-assets skaleres i hele multipler, når pladsen tillader det. En stabil, skarp sprite har prioritet over maksimal størrelse.
- Rotation og subpixel-bevægelse er tilladt under animation; objektet skal lande skarpt på grid igen.

### Lys og materialer

Fælles lysretning er ovenfra/venstre. Gameplay-glow kommer fra en identificerbar kilde og må ikke bruges som generel dekoration.

| Scene | Materialer | Primært lys | Magisk accent |
|---|---|---|---|
| Hub | Sort sten, mørkt træ, jern | Kølig violet ambience | Lilla portal/Souls |
| Combat | Sort sten, blodbrun arena, stål | Lavt rødt trusselslys | Face-typens farve ved impact |
| Workshop | Jern, sod, mørkt træ | Orange forge-lys nedefra | Lilla Souls ind i forgen |
| Victory | Stenplatform, loot-metal | Grøn/cyan reward-belysning | XP-cyan og Souls-lilla |
| Defeat | Kold sten, slukket jern | Smalt rødt restlys | Kun bevaret progression gløder |

### Typografi og ikoner

- Typografien opdeles i display, UI-labels og tal. Store displaytitler må have særpræg; kompakt UI skal prioritere læsbarhed.
- `Courier New` er prototypefallback, ikke endelig brand-font. En kommende bitmap-font skal testes ved 320 px før global udskiftning.
- Eyebrows under `0.52rem` må kun bruges til sekundær tekst med høj kontrast og kort ordlyd.
- Permanente gameplay-ikoner følger én pixel-grid og ens outline-vægt.
- Lucide er tilladt som prototypefallback. Centrale sceneikoner — dungeon-port, forge, Souls, XP og face-typer — erstattes først.
- Farve står aldrig alene: type kommunikeres med mindst ikon eller tekst samtidig.

### Canonical combat composition

Combat er reference for resten af spillets game feel og læses i denne rækkefølge:

1. Kompakt encounter/round/Run Souls-rail.
2. Fysisk enemy-stage med enemy, næste intent og HP.
3. Kompakt player-rail med HP og kun faktisk afslørede totals.
4. Aktiv roll-piedestal samt et draw-order-rack til afsluttede resultater.
5. Én bundforankret primær handling.

Den aktive die er større end afsluttede resultater. Når den er scoret, flytter resultatet ned i draw-order-racket og forbliver læsbart. Racket må scrolle vandret ved mange dice; det må ikke wrappe og skabe en uforudsigelig høj skærm. Tom plads skal have en scenisk funktion som arena, runes eller fysisk arbejdsflade — aldrig ligne et manglende dashboard-card.

Afslørede round totals ligger i en separat vandret **effect-rail** under spillerens HP. Hver type bruger ikon, værdi og kort label fra den centrale face registry. Railen viser kun typer, der faktisk er rullet, bevarer deres første reveal-rækkefølge og scroller vandret ved mange typer. HP-baren eller draw-headeren må aldrig blive smallere, når Shield, Heal, Poison eller senere effects tilføjes.

### Motion grammar

Hver effekt består af **anticipation → impact → settled state**:

- Roll: kort løft/tumble → hård landing → læsbar face.
- Score: face-effekt forlader die → rammer total → total reagerer.
- Attack: player power samles → enemy impact/hurt → HP ændres.
- Enemy turn: intent aktiveres → attack-sprite → block/HP-impact.
- Forge: Souls forlader beholdningen → hammer/forge-impact → kun valgt face forbedres.

Ingen sekundær ambient-animation må konkurrere med et gameplay-impact. Resultatet skal forblive tydeligt, når al bevægelse stopper eller reduceret motion er aktivt.

## Designprincipper

### 1. Verden før paneler

Byg først en scene, og placér derefter informationen i den. Undgå en lodret række af ens rektangulære cards. En sektion skal have en funktion i verdenen: port, forge, rack, arena, skattekiste, vejskilt eller alter.

Paneler er tilladt til kompakt sekundær information, men må ikke være skærmens primære identitet.

### 2. Dybde gennem hårde pixel-lag

Brug sorte outlines, forskudte skygger, inset-highlights og tydelige for-/mellem-/baggrunde. Dybden skal ligne stablede pixels eller game tiles — aldrig bløde moderne cards.

- Ingen `border-radius`.
- Ingen diffuse glassmorphism-flader.
- Ingen svage 1 px-grå borders som eneste afgrænsning.
- Primære objekter bruger typisk 3–4 px mørk outline.
- Klikbare objekter har en 4–7 px hård bundskygge.
- Aktiv tilstand løftes eller gløder; tryk flytter objektet ned mod sin skygge.

### 3. Farve betyder gameplay

Farver er semantiske og skal bruges konsekvent:

| Betydning | Primær | Mørk overflade | Brug |
|---|---:|---:|---|
| Attack / fare | `#f87171` | `#7f1d2d` | Attack-faces, skade, fjendtlig trussel |
| Shield | `#60a5fa` | `#1e3a8a` | Shield-faces og blokering |
| Heal / sikkerhed | `#4ade80` | `#166534` | Heal-faces, HP og sikre valg |
| Run/Banked Souls | `#c084fc` / `#d8b4fe` | `#581c87` | Souls, portalenergi, extraction |
| Permanent XP | `#67e8f9` | `#164e63` | XP og langsigtet adgang |
| Forge | `#fb923c` | `#7c2d12` | Workshop, varme og opgraderinger |
| Primær handling | `#6366f1` | `#312e81` | Neutral progression og dungeon entry |
| Fokus | `#facc15` | — | Keyboard focus og vigtig opmærksomhed |

Farven skal altid ledsages af ikon, tekst eller form. Gameplay må aldrig kræve, at spilleren alene kan skelne to farver.

### 4. Terningen er helten

En terning genkendes på sin egen overfladefarve, sit ikon og sit resultat — ikke på en omgivende labelboks. Combat-terninger må derfor stå frit på spillefladen uden et ekstra card omkring sig.

Faste regler:

- Attack bruger sværdikon og rød overflade.
- Shield bruger skjoldikon og blå overflade.
- Heal bruger hjerteikon og grøn overflade.
- Værdi og ikon skal være læsbare samtidig.
- Nye face-typer skal få deres egen semantiske farve, ikon og mørke overflade.
- Et navn beskriver den konkrete die (`die.name`); det må ikke udledes af typen.
- Permanente faces skal opleves som individuelle objekter, især i Workshop.

### 5. Vis information, når den er sand

UI må ikke afsløre et terningresultat eller en round total før den relevante animation er færdig.

Standardsekvensen for et roll er:

```text
Ukendt terning
→ roll-animation
→ face lander og bliver læsbar
→ værdi + ikon flyver til den relevante total
→ total opdateres
→ næste input bliver tilgængeligt
```

Når runden resolves:

```text
Spillerens Heal / Attack / Shield
→ tydelig player impact
→ hvis enemy dør: stop, intent annulleres
→ ellers enemy attack-animation
→ block og HP-resultat
→ næste round eller outcome
```

Enemy må aldrig angribe efter at være blevet dræbt. Et stærkt roll skal kunne føles overpowered.

### 6. Læsbarhed før dekoration

Den vigtigste handling, aktuelle fare og primære ressourcer skal kunne aflæses på få sekunder på en 320 px bred telefon. Dekoration må gerne være rig, men må ikke skabe støj omkring værdier og valg.

## Fundament

### Viewport og layout

- Mobile-first portrætformat.
- `.game-shell` er maksimalt `384px` bred og centreret på større skærme.
- Minimum understøttet viewport er `320px` bred.
- Brug `100dvh`, så browserens mobile chrome ikke ødelægger højden.
- Undgå horisontal body-scroll under alle omstændigheder.
- Combat prioriterer én viewport; indholdsskærme som Workshop må scrolle naturligt.
- Primære handlinger placeres nederst eller efter den aktive arbejdsflade.
- Respektér safe areas og giv mindst 14–16 px vandret luft ved skærmens kanter, medmindre en scene bevidst går edge-to-edge.

### Spacing

Brug som udgangspunkt en 4 px rytme:

- `4px`: intern micro-spacing.
- `8px`: tæt relaterede elementer.
- `12px`: indhold i kompakte objekter.
- `16px`: standardsafstand mellem sektioner.
- `24–32px`: scenisk luft og tydelige niveauskift.

Tæt UI må gerne være kompakt, men touch targets skal normalt være mindst 44 px høje/brede.

### Typografi

Den nuværende prototype bruger:

```css
font-family: "Courier New", ui-monospace, monospace;
```

Typografisk hierarki:

- Store skærmnavne: uppercase, tung vægt, kort tekst, hård pixel-text-shadow.
- Objekt-/sektionsnavne: uppercase, cirka `0.8–1rem`, tydelig vægt.
- Eyebrows og labels: uppercase, `0.47–0.6rem`, høj letter-spacing.
- Tal: høj kontrast og større end deres label.
- Brødtekst: kort, cirka `0.59–0.78rem`, line-height omkring `1.4–1.55`.

Undgå lange centrerede tekstblokke. Copy skal være kort, handlingsorienteret og passe til et spilinterface.

### Grundpalette

De fælles CSS-tokens er udgangspunktet:

```css
--bg: #090911;
--panel: #121220;
--panel-raised: #1a1a2c;
--line: #2b2b42;
--muted: #8b8ba5;
--text: #f8fafc;
--purple: #a855f7;
--purple-dark: #581c87;
--yellow: #facc15;
--red: #ef4444;
--green: #22c55e;
--blue: #3b82f6;
```

Nye scene-paletter skal bygge videre på disse, ikke introducere et separat designunivers.

## Scenearketyper

### Hub — dungeon gate

Hubben er spillerens sikre base og spillets forside.

- Purple portalenergi kommunikerer Souls og dungeon-forbindelse.
- Titlen sidder på et fysisk skilt foran porten.
- Permanente ressourcer vises i en kompakt fælles HUD.
- Equipped Dice står på et rack/piedestal, ikke i generiske inventory-cards.
- Workshop og Dungeon er to tydeligt forskellige fysiske veje.
- Dungeon er den stærkeste fremadrettede handling; Workshop er den håndværksmæssige sidevej.

### Workshop — forge bench

Workshoppen skal føles varm, konkret og mekanisk.

- Orange glød og anvil-symbolik definerer scenen.
- Spilleren vælger først die, derefter præcis én face.
- Alle seks faces skal være synlige som individuelle, trykbare objekter.
- Preview viser `Current → After` på ambolten.
- Pris og betalingsressource skal være tydelige før tryk.
- Ved opgradering bevæger Souls/impact sig ind i forgen, og kun den valgte face reagerer.
- Disabled state forklarer årsagen, eksempelvis `Need 10 Souls` eller `Face Cap Reached`.

### Talent Tree — incremental dice map

Talent Tree bruger den velkendte visuelle grammatik fra et klassisk incremental tree: en centreret foundation-stamme, tydelige forbindelser og et senere trevejs branch-split. Spillets egen identitet kommer fra, at hver node er en fysisk talent-terning.

- Battle-Hardened står alene i centrum på et fresh save. Dice Slot 2 anes kun som en navnløs silhuet bag fog.
- En talent-node bruger samme størrelsesfamilie, hårde outline og fysiske dybde som player dice. Talent dice er cyan/neutral XP-magi og må ikke ligne en Attack-, Shield- eller Heal Die.
- Hver node har ét stabilt, tydeligt ikon. Navn, rank, næste effekt og pris vises i et kompakt detailpanel efter valg; lange tekster presses aldrig ind på die-facen.
- Træet viser højst ét fremtidigt lag som svage, ikke-interaktive silhuetter. Silhuetter viser intet navn, ikon eller pris, og dybere noder renderes ikke.
- Rankede nodes viser `current/max` på facen. Battle-Hardened bruger tre ranks; senere ranks må ikke visuelt se ud som nye separate talents.
- XP er altid cyan på priser, aktiverede nodes og forbindelser. Survival, Arsenal og Control bruger navn og ikon som identitet uden at ligne separate valutaer.
- Et køb animerer på selve træet: XP reagerer, noden ruller kontrolleret på stedet, lander med korrekt ikonorientering og sender energi gennem forbindelsen.
- Når et køb ændrer frontier, opløses fog, forbindelserne lades op, og nye nodes materialiseres i graf-rækkefølge. Shieldcraft splitter energien ud i alle tre branches.
- Den store separate reward-dialog bruges ikke. Et kompakt bundpanel håndterer preview og køb og forsvinder før ceremonien, så træets årsag/virkning forbliver synlig.
- Første køb og nye reveals må vare cirka `1–1.5s`; en ekstra rank uden reveal bruger en kortere ceremoni. `prefers-reduced-motion` bevarer stateændringen uden den fulde bevægelse.
- En ny permanent die auto-equippes aldrig. Nodebeskrivelsen gør det tydeligt, at den konkrete die tilføjes til collection.
- Collection, equipped slots og Max HP vises samlet over træet, så kapacitet og ejerskab ikke forveksles.

### Combat — arena og spilleflade

Combat skal kunne aflæses oppefra og ned:

1. Encounter, round og Run Souls at risk.
2. Enemy, HP og intent.
3. Player HP og aktuelle round totals.
4. Den aktive draw/roll-flade.
5. Én primær handling.

Der må ikke være permanente tomme Attack/Shield/Heal-slots. En totaltype opstår først, når mindst én relevant die er landet og scoret. Systemet skal kunne rumme flere face-typer uden layout-redesign.

Enemy intent er en advarsel, ikke en samtidig animation. Player resolution vises først; enemy resolution vises kun bagefter og kun, hvis enemy stadig lever.

### Victory / post-combat — reward stage

Victory er en lille scene, ikke en overskrift i et card.

- Brug fysisk banner, besejret enemy, platform og lys/rays.
- Rewards skal ligne loot drops og have klar XP/Souls-semantik.
- Current HP, Souls at risk og Total XP opsummeres kompakt.
- Extract og Continue er fysiske, tematiske stier med tydelig sikkerhed/risiko.
- Extract er grøn/sikker; Continue er rød/farlig.
- Resultatet skal føles celebratory uden at skjule den næste beslutning.

### Defeat

Defeat skal være mørkere og mere stille end Victory, men stadig være en game scene. Vis klart:

- Hvad der blev tabt: ubankede Run Souls.
- Hvad der blev beholdt: XP, Banked Souls og permanente dice upgrades.
- En entydig vej tilbage til Hub.

Player death har altid prioritet over Victory ved simultaneous death.

## Komponentregler

### Knapper

- Én tydelig primær handling pr. beslutningsområde.
- Solid farve, sort outline og hård bundskygge.
- `:active` flytter knappen ned og reducerer skyggen.
- `:disabled` må ikke kun ændre farve; label skal forklare blokeringen.
- `:focus-visible` bruger 3 px gul outline med afstand.
- Ikon kommer før label, medmindre knappens sceneform kræver andet.

### HUD og ressourcer

- Brug den fælles `PermanentResourceHud` til Banked Souls og XP.
- Run Souls skal altid markeres som `at risk` under et run.
- Der findes ingen Gold, Coins eller Materials.
- Banked Souls og Run Souls må ikke ligne samme state: tekst og kontekst skal tydeliggøre forskellen.
- Ressourceværdien er vigtigere end dens label.

### Status og feedback

- HP bruger tydelig numerisk værdi sammen med bar.
- Enemy intent vises før resolution.
- Toast-lignende beskeder bruges sparsomt; feedback bør helst ske på objektet, der ændres.
- Fejl og manglende ressourcer forklares i nærheden af handlingen.
- Brug `aria-live="polite"` til dynamisk tekst, der skal annonceres uden at afbryde.

### Ikoner

- Lucide kan bruges til prototype-UI og skal have konsekvent stroke-vægt og størrelse.
- Et ikon er støtte til betydning, ikke erstatning for vigtig tekst.
- Sceneobjekter må gerne bruge større ikoner med pixel-shadow som midlertidig art.
- Ved production-art erstattes centrale sceneikoner med stabile pixel-assets, uden at semantikken ændres.

## Motion og game feel

Motion skal forklare årsag og virkning.

Gode animationer:

- Soul-partikler stiger fra portal eller forge.
- Et roll skjuler resultatet, lander og afslører facen.
- Face-værdi flyver til sin round total.
- Attack impact rammer enemy før enemy kan svare.
- Forge-impact forbinder pris med forbedret face.
- Victory-banner og loot får en kort, trinvis entrance.

Undgå:

- Konstant bevægelse på alle elementer.
- Lange animationer, der forsinker gentagne handlinger.
- Samtidige effekter, hvor spilleren ikke kan se rækkefølgen.
- Animationer, der viser en ny værdi før årsagen er landet.
- Bløde, webagtige easing-effekter på pixel-objekter, når `steps()` giver bedre game feel.

Retningslinjer:

- Micro-feedback: cirka `150–280ms`.
- Roll/reveal: cirka `500–700ms`, skaleret med roll speed.
- Score transfer/impact: cirka `340–720ms`.
- Resolution beat mellem player og enemy: cirka `700–900ms`.
- Respektér `prefers-reduced-motion`; fjern unødvendig bevægelse uden at skjule stateændringen.

## Pixel-art og sprites

- Globalt bruges `image-rendering: pixelated`.
- Undgå subpixel-skalering af sprites, når det kan gøre dem slørede.
- Sorte eller meget mørke outlines skal adskille sprites fra scenen.
- Lysretning og baseline skal være konsistent inden for samme scene.
- Enemy sheets ligger i `public/sprites/enemies/<enemy>/`.
- Sheets bruger 100×100 px cells horisontalt: Idle, Attack01, Hurt og Death.
- Fjern magenta/chroma-key fringe.
- Hold fødder, center og baseline stabile på tværs af frames.
- En stabil single-frame idle er bedre end en animation, der driver rundt.

## Responsivitet og tilgængelighed

Alle nye skærme skal mindst verificeres ved:

- `320 × 844`.
- `384 × 844`.
- En desktopbredde, hvor den centrerede 384 px game shell stadig føles naturlig.

Kontrollér:

- Ingen vandret overflow.
- Ingen afskårne labels, værdier eller touch targets.
- Primær handling kan nås og forstås.
- Scroll forekommer kun, hvor skærmtypen tillader det.
- Fokus er synligt med keyboard.
- Interaktive elementer er rigtige `button`-elementer.
- Ikoner, der kun er dekorative, har `aria-hidden="true"`.
- `aria-pressed` bruges til valgte dice/faces.
- Farve er aldrig eneste indikator.
- Kontrast er høj nok mod mørke dungeon-flader.

## Do / don't

| Do | Don't |
|---|---|
| Byg en forge-scene omkring en upgrade | Put upgrade-formularen i et generisk card |
| Lad værdien flyve fra die til total | Opdatér totalen før roll-animationen slutter |
| Vis kun totals, der faktisk er rullet | Reservér faste slots til Attack, Shield og Heal |
| Brug farve + ikon + tekst | Brug farve som eneste gameplay-signal |
| Brug hårde outlines og pixel-skygger | Brug afrundede cards og diffuse shadows |
| Giv én primær handling visuel dominans | Giv alle knapper samme vægt |
| Lad player attack resolve først | Animér player og enemy attack samtidig |
| Annullér enemy intent ved lethal damage | Lad en død enemy angribe |
| Forklar hvorfor en handling er disabled | Vis kun en grå, tavs knap |
| Udvid dynamisk til nye face-typer | Hardcode UI til præcis tre typer |

## Implementeringscheckliste

Før en ny eller ændret skærm betragtes som færdig:

### Visuel retning

- Har skærmen en genkendelig fysisk scene eller arbejdsflade?
- Er generiske bokse reduceret til sekundær information?
- Er hierarchy tydelig uden at læse al teksten?
- Bruger farverne de eksisterende gameplay-betydninger?
- Er der pixel-dybde uden border-radius eller glassmorphism?

### Gameplay-feedback

- Vises state først, når den faktisk er opnået?
- Er årsag og virkning forbundet med placering eller animation?
- Er player/enemy resolution sekventiel og læsbar?
- Har death guards prioritet over victory transitions?
- Forklarer disabled og error states sig selv?

### Terninger og nye face-typer

- Har typen unik farve, mørk overflade, ikon og label?
- Er alle UI color maps og icon maps opdateret?
- Fungerer typen uden et fast forhåndsreserveret slot?
- Bruges `die.name` i stedet for et navn udledt af typen?

### Teknisk verifikation

- `npx tsc --noEmit`.
- `npm test -- --run`.
- `npm run lint`.
- `npm run build`.
- Visuel browsertest ved 320 px og 384 px.
- Test relevante animationer, disabled states og reduceret motion.

## Nuværende referenceimplementeringer

Brug disse som visuel og interaktiv baseline:

- `src/screens/HubScreen.tsx` — fysisk dungeon gate og navigation.
- `src/screens/WorkshopScreen.tsx` — forge, face selection og upgrade-feedback.
- `src/screens/CombatScreen.tsx` — roll/reveal/score-transfer og sekventiel resolution.
- `src/screens/PostCombatScreen.tsx` — gamey Victory-stage, loot og path choice.
- `src/newGame.css` — aktuelle tokens, sceneformer, responsive regler og animationer.
- `src/components/newgame/FaceIcon.tsx` og `faceVisuals.ts` — semantisk face-sprog.
- `src/components/newgame/PermanentResourceHud.tsx` — permanent resource HUD.

Hvis en ny designidé afviger fra denne reference, skal afvigelsen være bevidst, begrundet og opdateres her, hvis den bliver den nye fælles retning.
