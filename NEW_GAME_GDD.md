# Dice Dungeon Incremental — Game Design Document

Status: gældende design for det nye spil. Version: prototype 0.1.

## High concept

Dice Dungeon Incremental er et mobile-first extraction-spil, hvor spillerens terninger er permanente genstande. Hver terning har seks individuelle faces med stabile IDs. Spilleren mærker progressionen direkte ved at opgradere én konkret face og senere se netop den face lande i kamp.

Kernespørgsmålet er:

> Tør jeg tage én kamp mere med min nuværende HP og mine Run Souls på spil?

Det gamle Dice Dungeon spurgte, om spilleren turde trække én terning mere før bust. Det draw/bust-loop er ikke en del af det nye spil.

## Kerne-loop

```text
Hub
→ vælg dungeon
→ træk alle permanente terninger i tilfældig rækkefølge
→ resolve Heal, Attack, Shield og enemy intent
→ vind XP og Run Souls
→ Extract eller Continue
→ bank Souls
→ opgradér én bestemt face
→ start et nyt run og genkend forbedringen
```

## Ressourcer

| Ressource | Type | Optjenes | Bruges | Ved død |
|---|---|---|---|---|
| XP | Permanent | Ved enemy kill | Talent tree | Beholdes |
| Run Souls | Midlertidig | Ved enemy kill | Extraction-pulje | Mistet |
| Banked Souls | Permanent | Ved extraction | Dice/face-upgrades | Beholdes |

Der findes ingen Gold, Coins eller Materials.

## Permanente terninger

- En `DieInstance` har stabilt ID, navn, family og seks faces.
- En `FaceInstance` har stabilt ID, type, værdi og senere eventuel evolution.
- Faces med samme type og værdi er stadig forskellige objekter og kan opgraderes uafhængigt.
- Udstyrede terninger snapshots ved run-start. Et aktivt run ændres derfor ikke af senere Hub-data.

Start-loadout:

- Attack Die: `1, 1, 2, 2, 2, 3 Attack`.
- Shield Die og Heal Die findes i content-kataloget, men unlockes først senere gennem progression.

## Kamp

Spilleren ser altid enemy HP og næste intent før første draw. Ved rundens start blandes alle udstyrede terninger i en persisteret draw-pile. `Draw` tager den næste tilfældige terning uden replacement, ruller den og føjer den dynamisk til rækken af spillede terninger. Boardet har ingen faste Attack-, Shield- eller Heal-slots. Hvert resultat gemmes som præcis `die.id`, `face.id`, type og værdi før animationen vises.

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

## Dungeon og extraction

Prototype-dungeonen `The First Descent` har tre encounters:

| Encounter | Enemy | HP | Intent | XP | Run Souls |
|---:|---|---:|---|---:|---:|
| 1 | Slime | 5 | Attack 2 | 8 | 5 |
| 2 | Goblin | 16 | Attack 5/4 | 14 | 10 |
| 3 | Skeleton | 22 | Attack 6/5/7 | 24 | 20 |

HP fortsætter mellem encounters. Efter hver sejr gives XP permanent med det samme, mens Souls føjes til run-puljen.

- `Extract`: flyt alle Run Souls atomisk til Banked Souls, afslut run og returnér til Hub.
- `Continue`: behold HP og Run Souls, spawn næste encounter med større pres og reward.
- `Defeat`: sæt Run Souls til 0; behold XP, Banked Souls, dice collection og face-upgrades.

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
- Profil, aktivt run, enemy, HP, Run Souls, combat-phase, totals og roll-resultater persisteres.
- Reload må ikke rulle en face igen eller give rewards igen.

## Visuel retning

- Mobile-first portræt ved cirka 384 px.
- Hard-edge pixel-art-kort, tydelige neon-accenter og høj kontrast.
- Attack er rød, Shield blå, Heal grøn, XP cyan og Souls lilla.
- Combat-boardet er rent og uden ydre kort omkring spillede dice eller totals.
- En spillet die genkendes på selve face-fladens farve og det rullede ikon, ikke på en type-label eller omgivende boks.
- Attack-, Shield- og Heal-totaler er skjult, indtil den pågældende type faktisk bliver rullet. Derefter vises kun ikon og værdi.
- Enemy sprites fra legacy-projektet kan genbruges, hvis animationens baseline er stabil.
- Kritisk information må aldrig eksistere kun i animation; resultat og totals forbliver læsbare.

## Prototypegrænse og næste gate

Før flere dice families, talent tree, bosses eller automatisering bygges, skal følgende playtestes:

> Er det tilfredsstillende at risikere Souls, extracte, forbedre én konkret face og genkende forbedringen i næste run?

Hvis svaret ikke er et tydeligt ja, forbedres feedback, pacing og upgrade-loopet først. Den komplette rækkefølge findes i `NEW_DICE_DUNGEON_IMPLEMENTATION_PLAN.md`.
