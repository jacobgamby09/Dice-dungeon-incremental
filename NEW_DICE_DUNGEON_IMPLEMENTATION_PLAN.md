# New Dice Dungeon — Implementation Plan

## Implementeringsstatus — 22. juli 2026

Fase 0–8 er implementeret som en samlet MVP-slice. Kerneflowet Hub → Talent Tree/Loadout/Workshop → 10-floor dungeon → random draw af alle udstyrede dice → manuel eller automatisk rulning → Victory/Defeat → Extract/Continue → permanent progression er nu spilbart. Floor 10 er en Demon-boss, der automatisk banker hele runnets Soul-pulje ved sejr.

XP Talent Tree indeholder den tidlige progression fra +2 Max HP til anden Attack Die, Shield, tre specialiseringsgrene, Heal, fire slots, Quick Draw og Auto Roll. Nye dice er unikke permanente objekter og skal aktivt equippes. En data-dreven simulator dækker den forventede dybdekurve; næste skridt er nu rigtig browser-playtest og tuning, ikke flere kernesystemer.

Alle 10 enemies bruger nu hver sin seks-sidede Attack Die. Resultatet precommittes og persisteres før en kompakt enemy-die ruller som synligt intent ved rundestart. Player Draw og Auto Roll venter på reveal; lethal player damage annullerer fortsat både intent og attack-animation. Save version 4 migrerer eksisterende numeriske intents til stabile enemy-face-ID'er.

Arbejdet fortsætter på branch `agent/random-draw-bag` og den eksisterende draft PR #1. Dette forløbs ændringer er ikke committed endnu.

## Dokumentets formål

Dette dokument er implementeringsplanen for det nye, selvstændige Dice Dungeon-spil.

Den nuværende mappe er allerede en kopi af det eksisterende Dice Dungeon-projekt og er arbejdsgrundlaget for den nye kodebase. Det gamle spil bruges som visuel og teknisk donor, men gameplay-arkitekturen skal ikke gradvist ombygges til det nye spil.

Det overordnede mål er at bevise følgende kerne-loop:

```text
Kæmp
↓
Risiker Run Souls
↓
Extract
↓
Opgrader én konkret face permanent
↓
Mærk forbedringen i næste run
```

Den første vertikale prototype skal bevise dette loop, før der bygges et stort talent tree, mange dice families eller avanceret content.

---

## 1. Fastlåste designregler

Følgende regler er fundamentale og må ikke ændres indirekte under implementationen:

- Terninger er permanente.
- Hver terning har sin egen permanente identitet.
- Hver af en ternings seks faces er et individuelt, permanent objekt med sit eget ID.
- XP er permanent og mistes aldrig.
- Run Souls er midlertidige og mistes ved død.
- Extraction flytter Run Souls til Banked Souls.
- XP bruges i talent tree.
- Banked Souls bruges på konkrete terninger og individuelle faces.
- Der findes ingen Gold, Coins eller Materials.
- HP fortsætter mellem encounters i samme dungeon-run.
- Shield er midlertidigt og nulstilles efter rundens resolution.
- Heal kan ikke overstige spillerens max HP.
- Når spillerens angreb dræber fjenden, udfører fjenden ikke sit intent.
- Hvis en fremtidig mechanic skaber en reel Double K.O. gennem recoil, Thorns eller selvskade, har Player Death prioritet.
- Spillet designes teknisk til cirka 1–12 udstyrede terninger.
- Spilleren starter kun med én Attack Die.
- Shield Die og Heal Die unlockes senere gennem progression.
- Alle udstyrede terninger blandes og trækkes uden replacement hver runde.
- Spilleren skal trække alle terninger, før runden kan resolves.
- Combat-boardet har ingen faste dice-slots og viser kun spillede dice i draw-rækkefølge.
- Dice genkendes på deres face-farve og ikon, ikke gennem ydre typebokse.
- Attack-, Shield- og Heal-totaler er skjult, indtil typen faktisk bliver rullet.
- Manuel rulning er grundsystemet.
- Auto Roll automatiserer kun spillerens tryk og ændrer ikke combat-reglerne.
- Alle synlige talent nodes skal have en implementeret effekt.
- Der må ikke eksistere demo-nodes, som kan købes uden at virke.

### Fast resolution-rækkefølge

En runde resolves i denne rækkefølge:

1. Heal anvendes på spilleren og capped ved max HP.
2. Player Attack rammer enemy Shield og derefter enemy HP.
3. Eventuelle spillerpåvirkende attack-effekter, eksempelvis recoil, beregnes.
4. Hvis spilleren er død af en sådan samtidig effekt, bliver resultatet Defeat.
5. Hvis fjenden er død, bliver resultatet Victory, og fjendens intent annulleres.
6. Hvis fjenden lever, udfører den sit viste intent.
7. Rundens Shield absorberer normal enemy damage.
8. Resterende damage rammer spillerens HP.
9. Hvis spilleren dør, bliver resultatet Defeat.
10. Midlertidigt Shield nulstilles.
11. Næste runde og næste enemy intent forberedes.

En fjende må aldrig nå sin attack-animation eller damage-resolution, hvis den allerede er død.

---

## 2. Afgrænsning mod det eksisterende Dice Dungeon

Det gamle spil er et extraction bag-builder-spil, hvor kernespørgsmålet er:

> Tør jeg trække én terning mere, før jeg buster?

Det nye spil handler i stedet om:

> Hvordan udvikler jeg mine permanente terninger, og tør jeg risikere mine Souls i én kamp mere?

Det er to forskellige spil. Den gamle implementation skal derfor behandles som reference og donor-materiale, ikke som den nye domain-model.

### Genbrugsmatrix

| Eksisterende del | Beslutning |
|---|---|
| React, Vite og TypeScript | Behold teknologistakken |
| Zustand persistence | Behold teknologien, erstat hele save-schemaet |
| Framer Motion | Behold til UI- og combat-feedback |
| Lucide icons | Behold |
| Enemy sprite sheets | Behold runtime-assets |
| Enemy idle/attack/hurt/death-controller | Tilpas til stabile enemy-ID'er |
| Pixel-art-farver, knapper, HP-bars og hard shadows | Udtræk som fælles design tokens og primitives |
| Dice spin, landing, impact, orbs og screen shake | Genimplementér i generiske komponenter |
| Enemy intent-præsentation | Tilpas |
| Dice Inspector og Dice Library | Omskriv til permanente dice instances |
| Skill Tree-canvas | Genbrug UI-konceptet, skift valuta og nodes |
| Victory/Defeat-præsentation | Tilpas |
| Loadout-skærmens slot-idé | Omskriv til permanent collection og unlockede slots |
| Det gamle `gameStore.ts` | Erstat helt |
| Det gamle `CombatScreen.tsx` | Brug som visuel reference, omskriv gameplay-flowet |
| Det gamle `DieCard.tsx` | Udtræk animationserfaring, byg en generisk renderer |
| Draft-system | Fjern fra det nye kernespil |
| Skull/Bust-system | Fjern |
| Cursed Dice | Fjern |
| The Culling | Fjern |
| Run-only Relics | Fjern fra første spilversion |
| Forge Merge, Purify og Stabilize | Fjern |
| Joker og Vessel | Fjern fra kernesystemet |
| Venom som overdraw-straf | Fjern |
| Fortune Teller og Scouting | Fjern som draw-pile-systemer |
| Gamle dev-knapper og clear-save-knapper | Fjern fra produktionsflowet |

### Filer og mapper, der ikke skal videreføres som produktionsindhold

- `node_modules/`
- `dist/`
- `tmp/`
- Gamle Vite-logfiler.
- Generated source-art, medmindre det senere ønskes som arkiv.
- Ubrugte Vite/React-assets.
- Det gamle localStorage-save.
- Gamle gameplay-dokumenter som autoritet for det nye spil.

De gamle dokumenter må gerne bevares som historisk reference, men det skal være tydeligt, at dette dokument og et kommende nyt GDD beskriver det nye spil.

---

## 3. Foreslået teknisk struktur

Den nye kodebase opdeles efter ansvar, så domain-logik, state, content og animation ikke blandes i én stor fil.

```text
src/
  game/
    types/
      dice.ts
      combat.ts
      progression.ts
      dungeon.ts

    content/
      dice.ts
      enemies.ts
      dungeons.ts
      talents.ts
      upgradeCosts.ts

    combat/
      rollDie.ts
      resolveRound.ts
      calculateIntent.ts

    progression/
      awardRewards.ts
      extractRun.ts
      upgradeFace.ts

  store/
    profileSlice.ts
    runSlice.ts
    combatSlice.ts
    persistence.ts
    useGameStore.ts

  components/
    shared/
      PixelButton.tsx
      HpBar.tsx
      FaceIcon.tsx
      CurrencyDisplay.tsx

    dice/
      DieCard.tsx
      DiceFace.tsx
      DiceInspector.tsx
      RollAnimation.tsx

    enemies/
      EnemySprite.tsx
      EnemyIntent.tsx

  screens/
    HubScreen.tsx
    DungeonSelectScreen.tsx
    CombatScreen.tsx
    PostCombatScreen.tsx
    DieWorkshopScreen.tsx
    TalentTreeScreen.tsx
```

Der kan fortsat være én samlet Zustand-hook udadtil, men implementationen opdeles i slices.

### Arkitekturregler

- Combat-resolution skal være ren TypeScript uden React-afhængigheder.
- Animationer må afspejle state, men må ikke bestemme gameplay-resultater.
- Roll-resultatet gemmes, før animationen starter.
- Rewards gives atomisk sammen med state-overgangen til Victory.
- Content-data adskilles fra state actions.
- Face visuals centraliseres i én udtømmende registry.
- Enemy visuals slås op via stabile IDs, ikke display-navne.
- Alle persisted data får `saveVersion` og migrationer.
- RNG skal kunne injiceres i tests.

---

## 4. Datamodel

### 4.1 Permanent profil

```ts
type PlayerProfile = {
  saveVersion: number
  xp: number
  bankedSouls: number
  unlockedTalentIds: string[]
  unlockedDungeonIds: string[]
  diceCollection: DieInstance[]
  equippedDieIds: string[]
  settings: {
    rollSpeed: number
    autoRoll: boolean
    autoResolve: boolean
  }
}
```

### 4.2 Permanent terning

```ts
type DieInstance = {
  id: string
  name: string
  family: DieFamily
  faces: [
    FaceInstance,
    FaceInstance,
    FaceInstance,
    FaceInstance,
    FaceInstance,
    FaceInstance
  ]
}
```

### 4.3 Individuel face

```ts
type FaceInstance = {
  id: string
  type: FaceType
  value: number
  evolution?: FaceEvolution
}
```

To faces med samme type og værdi er stadig forskellige objekter. En opgradering må kun ændre den valgte `face.id`.

### 4.4 Aktuelt run

```ts
type RunState = {
  status: 'inactive' | 'active' | 'victory' | 'defeat'
  dungeonId: string
  encounterIndex: number
  runSouls: number
  playerHp: number
  playerMaxHp: number
  equippedDiceSnapshot: DieInstance[]
  enemy: EnemyState
}
```

Loadoutet snapshots ved run-start. Spilleren kan ikke ændre eller opgradere terninger midt i et aktivt run.

### 4.5 Aktuel runde

```ts
type RoundState = {
  roundNumber: number
  phase:
    | 'awaiting_roll'
    | 'rolling'
    | 'awaiting_resolve'
    | 'resolving'
  currentDieIndex: number
  results: RollResult[]
  totals: {
    attack: number
    shield: number
    heal: number
  }
}
```

### 4.6 Overordnede app-faser

```text
hub
dungeon_select
combat
post_combat
die_workshop
talent_tree
defeat
```

Dice Inspector og lignende informationsvisninger bør være modals eller overlays og ikke egne gameplay-faser.

---

## 5. Implementeringsfaser

## Fase 0 — Repo- og designfundament

Den nuværende mappe er arbejdsgrundlaget for det nye repository.

### Arbejde

- Bevar den eksisterende kode midlertidigt som reference.
- Forbind mappen til det nye GitHub-repository, når det eksplicit ønskes.
- Brug et nyt package-navn og et nyt save-key.
- Opret et nyt GDD for det nye spil.
- Opdatér projektets `AGENTS.md` til de nye regler.
- Dokumentér economy-, death- og resolution-reglerne.
- Identificér præcist hvilke assets der bevares.
- Etablér fælles design tokens og UI primitives.

### Acceptkriterier

- Det nye spil bruger ikke det gamle save-key.
- De gamle gameplay-regler er tydeligt markeret som legacy.
- De nye designregler findes både i GDD og projektets guardrails.
- Git-arbejdet kan udføres uden at ændre det oprindelige referenceprojekt.

---

## Fase 1 — Ny datamodel og persistence

### Arbejde

- Implementér `DieInstance` og `FaceInstance` med permanente IDs.
- Implementér profile-, run- og round-state.
- Implementér versioneret persistence.
- Persistér både permanent profil og et aktivt run.
- Genskab præcis samme run efter reload.
- Gem roll-resultater før animation.
- Gør reward-claim atomisk for at forhindre dobbelt XP eller Souls ved reload.
- Snapshot equipped dice ved run-start.

### Acceptkriterier

- En reload ændrer ikke allerede rullede resultater.
- XP, Souls, dice collection og face-upgrades overlever reload.
- Et aktivt run fortsætter med samme HP, Run Souls, enemy og runde.
- Det gamle Dice Dungeon-save kan ikke påvirke det nye spil.

---

## Fase 2 — Ren combat-engine

### Arbejde

- Implementér `rollDie`.
- Implementér summering af Attack, Shield og Heal.
- Implementér `resolveRound` som en ren funktion.
- Implementér enemy intent og næste intent.
- Implementér enemy Attack Dice som data-drevne seks-face definitioner med injicerbar RNG.
- Precommit hvert enemy-resultat før UI-reveal og brug resultatet direkte som resolver-intent.
- Implementér victory og defeat.
- Implementér vedvarende HP mellem encounters.
- Implementér en injicerbar RNG.
- Skriv unit tests for alle centrale regler.

### Acceptkriterier

- En dræbt fjende angriber aldrig.
- Heal anvendes i korrekt rækkefølge og capper ved max HP.
- Shield absorberer korrekt og nulstilles korrekt.
- Player Death prioriteres ved en reel samtidig recoil-effekt.
- Combat kan gennemspilles og testes uden React, Zustand eller animationer.

---

## Fase 3 — Første combat-UI

### Arbejde

- Genopbyg den mobile combat-komposition.
- Genbrug enemy zone, HP-bars og intent-præsentation.
- Vis enemy intent som en mindre fysisk Attack Die med inspectable seks-face-fordeling.
- Lås player controls under enemy reveal, og vis landed, attacking og cancelled states.
- Start med én Attack Die i en random draw-bag.
- Implementér knappen `DRAW`.
- Vis faktisk trukne dice dynamisk uden faste board-slots.
- Fjern ydre typekort fra spillede dice; brug face-farve og ikon som identitet.
- Opret kun en type-total, når den pågældende type bliver rullet.
- Vis aktiv terning, spin, landing og face-resultat.
- Animér effekten fra terningen til den relevante total.
- Aktivér `RESOLVE ROUND`, når alle terninger er rullet.
- Vis Attack, Shield og Heal separat.
- Implementér enemy idle, hurt, attack og death.
- Stop enemy action og attack-animation ved enemy death.
- Tillad inspektion af permanente dice instances i Hub/collection, ikke som combat-støj.

### Acceptkriterier

- Spilleren kan altid se, hvilken terning der ruller.
- Spilleren kan altid se, hvilken face der blev rullet.
- Rundens totals kan forklares direkte ud fra de viste resultater.
- En victory føles øjeblikkelig, når spilleren dræber fjenden før dens tur.

---

## Fase 4 — Dungeon-run og extraction

Den første dungeon består af ti eskalerende floors. Floor 10 er en boss, og alle ti enemies bruger eksisterende sprite-assets.

### Victory-flow

- XP gives permanent med det samme.
- Run Souls tilføjes det aktive run.
- Spilleren ser nuværende HP og Run Souls.
- Spilleren ser information om næste encounter.
- Spilleren vælger `EXTRACT` eller `CONTINUE`.

### Continue

- HP fortsætter uændret.
- Run Souls forbliver i fare.
- Næste enemy spawner.
- Næste encounter giver en større reward.

### Extract

- Run Souls flyttes atomisk til Banked Souls.
- Run Souls sættes til 0.
- Runnet afsluttes.
- Spilleren returnerer til Hub.

### Defeat

- Run Souls sættes til 0.
- XP beholdes.
- Banked Souls beholdes.
- Dice collection og alle face-upgrades beholdes.
- Spilleren returnerer til Hub efter Defeat-skærmen.

### Acceptkriterier

- Extraction-valget har økonomisk betydning efter første encounter.
- HP-attrition skaber stigende risiko gennem dungeon.
- Rewards kan ikke gives to gange gennem reload eller dobbeltklik.
- Død påvirker kun de værdier, der eksplicit er midlertidige.

---

## Fase 5 — Første permanente face-upgrade

Hubben får et simpelt Die Workshop.

### Flow

1. Vis spillerens permanente terninger.
2. Vælg én terning.
3. Vis dens seks individuelle faces.
4. Vælg én konkret face.
5. Vis nuværende værdi, næste værdi og pris.
6. Betal med Banked Souls.
7. Opgrader kun den valgte `face.id`.
8. Gem ændringen permanent.
9. Afvis opgraderinger over den aktuelle face cap.

### Første prisstruktur

| Upgrade | Pris |
|---|---:|
| 1 → 2 | 5 Banked Souls |
| 2 → 3 | 10 Banked Souls |
| 3 → 4 | 40 Banked Souls |
| 4 → 5 | 100 Banked Souls |

Priserne er prototypeværdier og skal være data-driven.

### Acceptkriterier

- To ens faces på samme terning kan opgraderes uafhængigt.
- Kun den valgte face ændres.
- Prisen trækkes præcis én gang.
- Den forbedrede face kan genkendes i næste run.
- Forbedringen overlever reload og død.

### Første store playtest-gate

Efter Fase 5 stoppes content-udvidelsen midlertidigt. Følgende skal playtestes:

> Er det tilfredsstillende at risikere Souls, extracte, forbedre én konkret face og derefter genkende forbedringen under næste run?

Hvis svaret ikke er tydeligt ja, forbedres combat-feedback, pacing og upgrade-loopet, før talent tree og større content bygges.

---

## Fase 6 — Permanent collection og større draw-bag

### Arbejde

- Byg en permanent dice collection.
- Lad spilleren udstyre terninger i en permanent draw-bag uden nummererede combat-slots.
- Start med plads til den ene Attack Die.
- Understøt teknisk cirka 1–12 udstyrede dice.
- Skjul draw-rækkefølgen; den bestemmes random uden replacement.
- Lås loadout-ændringer til Hub.
- Lad ekstra bag-kapacitet unlockes gennem talent tree.

### Acceptkriterier

- Ekstra bag-kapacitet kan tilføjes uden at ændre combat-engine.
- UI kan håndtere både én og tolv terninger.
- Et aktivt run ændres ikke, hvis den permanente collection opdateres uden for runnet.

---

## Fase 7 — XP Talent Tree

Det eksisterende pan/zoom-koncept kan tilpasses, men valutaen bliver XP.

### Foreslåede tracks

- **Survival:** Max HP og defensive rammer.
- **Arsenal:** Flere dice slots og nye dice families.
- **Control:** Auto Roll, roll speed og senere Auto Resolve.
- **Exploration:** Nye dungeons og encounter-information.
- **Mastery:** Face caps og adgang til evolutions.
- **Extraction:** Soul protection og reward-forbedringer.

### Regler

- Hver synlig node skal have en implementeret effekt.
- XP bruges kun permanent.
- Souls må ikke bruges i talent tree.
- Pure information som face-beskrivelser og dice inspection er altid tilgængelig.
- Automatisering kan være progression, men må ikke ændre combat-resultatet.

### Acceptkriterier

- Et købt talent påvirker næste relevante situation.
- XP reduceres præcis én gang ved køb.
- Talent-unlocks overlever reload og død.
- Ingen node kan købes uden en effekt.

---

## Fase 8 — Auto Roll og combat-tempo

### Arbejde

- Auto Roll simulerer kun trykket på `DRAW`.
- Roll speed ændrer kun animationsvarigheden.
- Auto Resolve implementeres som en separat unlock.
- Auto Start Next Round implementeres senere.
- Pause ved special faces implementeres, når special faces findes.
- Grouped rolls udskydes, indtil den sekventielle følelse er bevist.

### Acceptkriterier

- Manuel og automatisk rulning bruger samme engine.
- Samme precommitted rolls giver samme combat-resultat i begge modes.
- Stop af Auto Roll efterlader spillet i en gyldig manuel state.
- Ingen animation kan få en gameplay-action til at køre to gange.

---

## Fase 9 — Nye dice families og face evolutions

Først efter godkendelse af kerneloopet introduceres flere mechanics.

### Mulige nye mechanics

- Crit.
- Poison.
- Lifesteal.
- Healing over Time.
- Piercing.
- Shield Bash.
- Multiplier.
- Utility/control.
- Exact-value og threshold-effekter.

Gamle Dice Dungeon-mekanikker bruges som inspirationsbank, ikke som implementation, der automatisk kopieres.

### Evolution-regel

```text
XP unlocker muligheden
Banked Souls betaler for den konkrete evolution
```

Eksempel:

```text
Attack 5
├─ Attack 6
├─ Piercing 4
├─ Critical Strike
└─ Cleave 4
```

### Central face registry

Hver face type skal registreres ét sted med:

- Type-ID.
- Label.
- Beskrivelse.
- Icon.
- Farve.
- Shadow/accent.
- Resolver eller effect-kind.
- Animationstype.
- Upgrade-regler.
- Cap-regler.
- Mulige evolutions.

Dette erstatter den gamle arkitekturs mange duplikerede icon- og color-maps.

---

## Fase 10 — Dungeons, bosses og extraction-depth

### Arbejde

- Flyt gradvist extraction fra efter hver mob til designede checkpoints.
- Øg rewards jo dybere spilleren går.
- Tilføj enemy intent cycles.
- Tilføj bosses med tydeligt forudsigelige mønstre.
- Introducér enemy Shield, Wound eller andre counters efter behov.
- Tilføj nye dungeons gennem talent progression.
- Introducér Soul protection forsigtigt.

### Soul protection-regel

Spilleren skal fortsat kun forstå to Souls-beholdninger:

- Run Souls i fare.
- Banked Souls i sikkerhed.

Beskyttede Souls bør enten:

- Flyttes direkte til Banked Souls, når de sikres, eller
- Beregnes ved dødsøjeblikket.

Der bør ikke tilføjes en tredje synlig currency-pung.

### Acceptkriterier

- Continue giver målbart højere reward end Extract.
- Extraction forbliver relevant trods beskyttelsestalenter.
- En OP spiller kan stadig dræbe svagere enemies før deres tur.
- Sværere enemies skaber modspil gennem stats og mechanics, ikke posthume angreb.

---

## Fase 11 — Polish og release-kvalitet

### Arbejde

- Centralisér styling og fjern duplikerede visual helpers.
- Test ved relevante mobile bredder, inklusive 320, 375 og 384 px.
- Kontrollér alle enemy states visuelt.
- Tilføj reduceret motion-indstilling.
- Tilføj robuste save migrations.
- Fjern alle dev-controls fra produktionsflowet.
- Profilér 12-terningers combat.
- Balancér HP, enemy scaling, rewards og upgrade costs.
- Gennemfør hele flowet fra nyt save til flere succesfulde extractions.

---

## 6. Første prototype-content

### Player

```text
10 HP
0 XP
0 Run Souls
0 Banked Souls

1 Attack Die

Shield Die og Heal Die unlockes senere gennem progression.
```

### Første Attack Die

```text
1 – 1 – 2 – 2 – 2 – 3 Attack
```

Shield og Heal får tilsvarende simple prototypefordelinger, som efterfølgende balanceres ud fra deres faktiske overlevelsesværdi.

### Første dungeon

MVP-dungeonen består af ti floors med stigende pres:

1. Slime.
2. Slime Crawler.
3. Marrow Bat.
4. Goblin.
5. Shieldbearer.
6. Cultist.
7. Skeleton.
8. Orc.
9. Blood Orc.
10. Demon-boss.

Præcise HP-, Shield-, intent- og reward-tal er content-data og kan tunes uden ændring af combat-engine. De gældende tal findes i `NEW_GAME_GDD.md`.

---

## 7. Test- og kvalitetskrav

Efter hver implementeringsfase skal relevante checks bestå:

- TypeScript strict typecheck.
- Lint.
- Unit tests.
- Produktionsbuild.
- Visuel mobile-browser-gennemgang.

### Obligatoriske domain-tests

- Dead enemy never acts.
- Enemy attack-animation starter ikke efter enemy death.
- Heal anvendes i korrekt rækkefølge.
- Heal kan ikke overstige max HP.
- Shield absorberer korrekt.
- Shield nulstilles efter runden.
- Player Death har prioritet ved reel Double K.O.
- XP beholdes ved død.
- Run Souls mistes ved død.
- Banked Souls beholdes ved død.
- Dice og face-upgrades beholdes ved død.
- Extraction overfører Souls præcis én gang.
- Rewards kan ikke duplikeres ved reload.
- Kun den valgte `face.id` opgraderes.
- Face cap respekteres.
- Reload skaber ikke et nyt roll-resultat.
- Auto Roll ændrer ikke combat-resultatet.
- Et aktivt run genskabes korrekt efter reload.

### Visuelle checks

- Enemy idle er stabil.
- Enemy attack holder sig inden for zonen.
- Enemy hurt afspilles ved damage.
- Enemy death afspilles før Victory UI.
- Dice spin og landing viser korrekt face.
- Effekt-animation lander ved korrekt total.
- UI fungerer med 1, 3, 6 og 12 terninger.
- Victory, Extract, Continue og Defeat kan ikke overlappe forkert.

---

## 8. Definition of Done for den første komplette prototype

Den første prototype er færdig, når spilleren kan:

1. Starte i Hub med én permanent Attack Die.
2. Se hver ternings seks individuelle faces.
3. Gå ind i en dungeon.
4. Se enemy intent før rulning.
5. Trække alle udstyrede terninger i tilfældig rækkefølge uden replacement.
6. Se kun faktisk rullede type-ikoner og totals blive bygget op uden tomme placeholders.
7. Resolve runden manuelt.
8. Dræbe en enemy, før den angriber.
9. Fortsætte gennem en 10-floor dungeon med vedvarende HP og en boss på floor 10.
10. Optjene permanent XP.
11. Optjene midlertidige Run Souls.
12. Vælge Extract eller Continue.
13. Beholde XP ved død.
14. Miste Run Souls ved død.
15. Banke Run Souls ved extraction.
16. Opgradere én bestemt permanent face.
17. Starte et nyt run.
18. Rulle og genkende den forbedrede face.
19. Genindlæse spillet uden at miste progression eller ændre et aktivt run.
20. Bruge XP på fungerende talenter og mærke den første upgrade efter run 1.
21. Unlocke en unik anden Attack Die efter cirka run 2–3 og aktivt equippe den.
22. Unlocke Shield, Heal, Quick Draw og en spillerstyret Auto Roll-toggle.
23. Få hele Soul-puljen banket automatisk ved første boss-clear.

Først efter browser-playtest og balance-gaten går implementationen videre til flere dice families, evolutions, nye dungeons og avancerede extraction-systemer.

---

## 9. Beslutnings- og playtest-gates

### Gate A — Combat-følelse

Efter den første fungerende kamp vurderes:

- Er et enkelt roll tilfredsstillende?
- Er det tydeligt, hvilken terning og face der skabte resultatet?
- Er tempoet rigtigt, når alle dice skal trækkes, og boardet vokser dynamisk?
- Føles victory før enemy attack stærk og retfærdig?

### Gate B — Extraction-loop

Efter den første 10-floor dungeon vurderes:

- Er Continue fristende?
- Er HP-attrition tydelig?
- Gør tabet af Run Souls ondt nok til at skabe spænding?
- Er XP-retention en god sikkerhedsventil?

### Gate C — Permanent face-upgrade

Efter første extraction og upgrade vurderes:

- Føles valget af en konkret face personligt?
- Er forbedringen genkendelig i næste run?
- Er stabil kontra eksplosiv udvikling interessant?
- Er upgrade-priserne hurtige nok til tidlig feedback?

### Gate D — Meta-progression

Før større content-produktion vurderes:

- Skaber talent tree nye muligheder frem for kun større tal?
- Er flere dice slots interessante uden at ødelægge tempoet?
- Er automatisering en tilfredsstillende unlock?
- Bevarer extraction sin betydning efter permanente upgrades?

---

## 10. Arbejdsprincip

Implementation skal ske i små, verificerbare vertikale bidder:

```text
Domain-regel
↓
Automatiseret test
↓
State-action
↓
UI
↓
Animation
↓
Browser-verifikation
```

Ingen stor content-udvidelse må bruges til at kompensere for et utilfredsstillende core-loop. Det centrale produktløfte er de permanente, selvbyggede terninger og spændingen ved at risikere Run Souls i én kamp mere.
