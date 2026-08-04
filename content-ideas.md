# Dice Dungeon Incremental — Content Ideas

Dette dokument er en levende idébank for indhold efter den nuværende MVP, UI/UX-polish og det første større balancepass.

Idéerne er **ikke bindende GDD-beslutninger**. De skal vurderes, prototypes og playtestes, før de flyttes til `CLASSIC_INCREMENTAL_V2.md` eller implementeres.

## Produktretning

Nye dungeons giver mere spilletid. Nye måder at bygge sine permanente terninger på giver mere genspilningsværdi.

Fremtidigt content bør derfor som udgangspunkt styrke mindst ét af disse områder:

- Synlig incremental fremgang.
- Tydeligere build-identitet.
- Mere variation mellem runs uden mere unødvendigt input.
- Nye mål for eksisterende permanente systemer.
- Mere værdi i allerede producerede dungeons og enemies.

Spillet skal fortsat være incremental-first. Nye systemer bør ikke udvikle sig til tunge inventory-, management- eller event-minigames.

## 1. Flere dice families

Nye permanente terninger bør have en mekanisk rolle og ikke blot være endnu en Attack eller Shield Die med en anden talfordeling.

Mulige families:

- **Multi-hit Die:** Lavere værdier, men flere separate hits.
- **Bleed Die:** Opbygger skade, der udløses over tid eller kan detoneres.
- **Thorns Die:** Returnerer skade, når spilleren bliver ramt.
- **Barrier Die:** Skaber Shield, som helt eller delvist overlever næste round.
- **Leech Die:** Kombinerer skade og healing.
- **Focus Die:** Oplader et stærkere resultat efter flere rolls eller rounds.
- **Chaos Die:** Høj variance og usædvanlige specialfaces.
- **Support Die:** Forstærker den næste terning i draw order i stedet for selv at levere stort output.

En mulig content-rytme er at introducere cirka én ny family per dungeon. Hver dungeon åbner dermed både nyt enemy-content og et nyt build space.

## 2. Familie-specifikke Signature Dice og Imprints

Hver dice family bør have egne Signature Dice og Imprints, så specialeffekterne understøtter terningens identitet uden et separat Evolution-system.

Eksempel for en Bleed Die:

- Mange små Bleed-stacks.
- Færre, kraftigere stacks.
- Et specialface, der detonerer eksisterende Bleed.

Eksempel for en Barrier Die:

- Mere permanent Shield-retention.
- Barrier omdannes delvist til Attack.
- Barrier eksploderer, når den brydes.

Målet er, at spilleren udvikler sin egen version af en family gennem dice-valg, Workshop-vækst og flytbare Imprints frem for blot at maksimere seks ens værdier.

## 3. Større enemy- og dungeon-identitet

Hver ny dungeon bør introducere én hovedmekanik klart og først senere kombinere den med tidligere mechanics.

Mulig progression:

- **Dungeon 1:** Basal Attack.
- **Dungeon 2:** Shield.
- **Dungeon 3:** Poison og healing.
- **Dungeon 4:** Multi-hit og Thorns.
- **Dungeon 5:** Charge-attacks med tydelig varsling.
- **Dungeon 6:** Debuffs på spillerens næste rolls.
- **Dungeon 7:** Enemies og bosses med flere combat phases.
- **Dungeon 8+:** Kombinationer af allerede lærte mechanics.

Nye enemies kan genbruges på flere floors og stige i level. Ressourcerne bør bruges på mekanisk tydelige archetypes og stærke boss-identiteter frem for ti helt nye sprites per dungeon.

## 4. Flere Charms og build hooks

Charms kan fungere som bro mellem dice families og gøre både specialist- og hybrid-loadouts attraktive.

Mulige effekter:

- Første Shield-roll hver round giver også Attack.
- Healing over Max HP bliver til Shield.
- Multi-hit har chance for at gentage sidste hit.
- Bleed-skade healer en mindre mængde HP.
- Fire forskellige dice families aktiverer en hybridbonus.
- Kun Attack Dice aktiverer en stærk specialistbonus.
- Kun én family i hele loadoutet forstærker dens specialfaces.
- Et bestemt face-resultat oplader den næste die i draw order.

Charms bør fortsat være lette at aflæse, mærkbare fra rank 1 og have tydelig rarity-baseret power.

## 5. Workshop Die som permanent progression

Workshop Die kan udvikles ud over højere gennemsnitsværdi.

Mulige opgraderinger:

- Flere `+2`-faces.
- Et sjældent `+3`-face.
- Reroll af Workshop Die.
- Roll twice, keep highest.
- Et Jackpot-face, der også reducerer næste Forge-pris.
- Et face, der opgraderer to forskellige target-faces med `+1`.
- Mulighed for at påvirke sandsynligheden for bestemte target-faces uden at vælge dem direkte.

Workshoppen er et af spillets mest karakteristiske systemer og kan bære en hel selvstændig talentgren.

## 6. Soul Die-specialisering

Soul Die kan udvikle sig både numerisk og mekanisk.

Mulige retninger:

- Stabil indkomst med højere minimum.
- Høj variance og store jackpots.
- Exploding max-face, der ruller igen.
- Bonus efter boss kills.
- Lille chance for Fate Tokens efter Fatecraft.
- Midlertidigt forbedrede faces under særlige dungeon-forhold.

Spilleren kan dermed vælge mellem stabil økonomi og en mere slot-machine-præget reward-profil.

## 7. Dice Resonance

Bestemte loadout-kombinationer kan automatisk skabe en passiv Resonance:

- Attack + Shield: **Vanguard**.
- Attack + Heal: **Bloodbound**.
- Shield + Heal: **Sanctuary**.
- Fire forskellige families: **Wild Array**.
- Fire dice fra samme family: **Pure Form**.

Resonance bør ikke være et nyt inventory-system. Den opstår automatisk fra loadoutet og vises tydeligt før og under et run.

Formålet er at gøre loadout-valget mere interessant uden ekstra administration.

## 8. Boss Imprints

Første sejr over en boss kan låse et permanent Boss Imprint op. Et Imprint bruges til at udvikle et normalt face til et boss-inspireret specialface.

Eksempler:

- **Slime:** Resultatet gentages med reduceret styrke.
- **Spiked Behemoth:** Shield giver også Thorns.
- **Necromancer:** Genaktiverer et tidligere combat- eller reward-resultat.
- **Dragon:** Et meget kraftigt face, der kræver opladning.

Boss Imprints binder dungeon-progression direkte til spillerens permanente dice og gør første clears mere betydningsfulde end almindelige rewards.

## 9. Dungeon Mastery

Efter første clear åbnes en Mastery-version af dungeonen med valgfrie modifiers.

Mulige modifiers:

- Enemies får mere HP.
- Enemy Dice får bedre faces.
- Healing reduceres.
- Bossen får en ekstra fase.
- Spilleren starter med mindre HP.
- Soul Die forbedres under runnet.
- Flere mechanics kombineres tidligere i dungeonen.

Hver modifier øger en reward multiplier eller giver Mastery-milestones.

Dette er en oplagt langsigtet incremental/endgame-struktur, fordi eksisterende dungeons får længere levetid uden at kræve fuldt nyt content for hvert progressionstrin.

## 10. Sjældne dungeon rooms

En sjælden floor kan være et hurtigt automatisk eller ét-valgs-event i stedet for en normal enemy:

- **Soul Fountain:** De næste Soul-rolls ruller to gange.
- **Broken Forge:** Én die får en midlertidig run-bonus.
- **Fate Shrine:** Chance for Fate Tokens efter Fatecraft.
- **Mirror Room:** Kopierer én equipped die resten af runnet.
- **Cursed Altar:** Enemies bliver stærkere, men rewards forbedres.

Events skal være sjældne, hurtige og kompatible med Auto Combat. De må ikke gøre runs langsomme eller kræve konstant spillerinput.

## 11. Dice Memories

Permanente dice kan registrere særlige bedrifter:

- Land max-face 100 gange.
- Besejr en boss med denne die.
- Blokér 500 samlet damage.
- Overlev en round med 1 HP.
- Udløs et Signature Face eller Imprint 50 gange.

Milestones kan give titler, kosmetiske ændringer eller meget små permanente bonusser.

Systemet understøtter fantasien om, at terningerne er personlige objekter med deres egen historie, frem for udskifteligt loot.

## 12. Run Forecasts

Før et run kan dungeonen vise én midlertidig regel:

- Shield-faces er empowered.
- Soul Die har et midlertidigt Jackpot-face.
- Enemies angriber hårdere, men har bedre Fate Token-chance.
- Heal Dice kan critte.
- En bestemt family får bonus i denne descent.

Forecasts skaber variation uden flere handlinger under combat. Senere talents eller Charms kan muligvis påvirke eller rerolle forecastet.

## 13. Research Board / Expedition Board

Et langsigtet board kan give parallel progression gennem konkrete mål:

- Besejr 40 Slimes.
- Roll 100 Shield-faces.
- Nå floor 7 uden Heal Dice.
- Udløs 25 Charm-effekter.
- Besejr en boss med en bestemt Resonance.

Belønninger bør primært være nye muligheder frem for endnu en generisk valuta:

- En ny Charm til Fate-puljen.
- En ny dice family.
- Et Boss Imprint.
- Et nyt Imprint eller en Signature Die.
- Kosmetik eller lore.

Systemet må ikke blive offline-produktion eller daglige chores. Det skal være permanente mastery-mål, der naturligt udføres gennem spillet.

## Anbefalet content-rækkefølge

1. Afslut UI/UX-polish og første større balancepass.
2. Færdiggør Dungeon 2 og dens Shield-identitet.
3. Tilføj én eller to nye dice families.
4. Giv de nye families egne Signature Dice og Imprints.
5. Udvid Charm-puljen med direkte hooks til de nye dice.
6. Byg Dungeon 3 omkring én ny hovedmekanik.
7. Prototype Boss Imprints.
8. Tilføj Dungeon Mastery som repeatable endgame-content.
9. Overvej Research Board, Dice Memories og sjældne rooms efter kerneindholdet fungerer.

## Foreløbig stærkeste kombination

Den mest lovende samlede retning er:

1. Familie-specifikke dice, Signatures og Imprints skaber build-identitet.
2. Boss Imprints forbinder dungeon-clears med permanente, personlige dice.
3. Dungeon Mastery skaber langsigtet incremental progression og genbruger eksisterende content på en meningsfuld måde.

Kombinationen bygger direkte videre på spillets nuværende styrker: permanente terninger, RNG, incremental vækst, buildvalg og tydelig dungeon-progression.

## Åbne designspørgsmål

- Hvor mange dice families kan spilleren overskue, før loadoutet bliver utydeligt?
- Hvor mange Signature-varianter og Imprints bør hver family have, før valgene bliver uoverskuelige?
- Hvor meget må Dungeon Mastery påvirke rewards uden at blive den eneste rationelle progression?
- Skal Boss Imprints være unikke per die, eller må samme Imprint bruges på flere permanente dice?
- Hvordan vises Resonance og Forecasts uden at overfylde Combat UI?
- Hvilke systemer skal være synlige tidligt, og hvilke bør først afsløres gennem Talent Tree?
