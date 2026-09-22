# CarIQ — komplett UI/UX-redesign utan att bryta funktioner

## Audit: nuläge

### Routes och produktflöden
- `/` är startsidan och första vägen in till bil, snabbkoll och diagnos.
- `/garage` hanterar sparad bil, registreringsuppslagning, manuell bilprofil, variant/motorkod och serviceuppgifter.
- `/diagnos`, `/snabbkoll`, `/history` och `/profil` är skyddade appflöden med inloggningskrav.
- `/pris`, `/auth`, `/reset-password`, `/villkor`, `/aterbetalning` och `/integritet` är fokuserade stödflöden utan appnavigation.
- Bottennavigationen har fyra huvudval: Hem, Historik, Garage och Profil. Den visas bara i kärnappen.

### Funktioner som redan fungerar och ska bevaras
- Bilprofilen sparas lokalt och synkas till kontot vid inloggning.
- Analysen använder befintlig bilprofil, symptom, foto/video, varningslampor, kända modellfel och språk/valuta.
- Snabbkollen använder ljud/media och har en gratis månadslogik.
- Historiken sparar diagnoser, visar tidigare resultat och kan radera poster.
- Premium, engångsköp, accesskod, checkout och betalningswebhook är redan separerade från UI:t.
- Inloggning, Google-inloggning, lösenordsåterställning och skyddade routes fungerar och ska inte byggas om.
- Befintliga komponenter som CarSilhouette, CarDiagram, WarningLamps, AudioRecorder, DiagnosisReport, BrandLogo och gemensamma knappar/fält ska återanvändas.

### Konflikter mot nya briefen
- Startsidan har fortfarande “Analysera min bil” som starkaste väg, medan briefen vill göra Snabbkoll till primär CTA.
- “Garage” finns som egen huvudtabb, medan briefen föreslår att “Min bil” ska vara central detaljsida och garage mer integrerat.
- Snabbkoll-resultatet använder fortfarande emoji-status och kan göras mer premium och konsekvent.
- Resultatvyn är förbättrad men har fortfarande flera likvärdiga sektioner; mer teknisk information bör döljas progressivt.
- Historiken är en lista, inte riktigt en biljournal/tidslinje.
- Vissa råa knappar/labels finns kvar i mediaflöden och kan ersättas med samma interaktionsmönster.
- Designsysteemet är redan på rätt väg men behöver fler återanvändbara status-, empty-, loading- och actionmönster.

## Målbild
CarIQ ska kännas som en premium bilassistent där bilen är huvudpersonen: enkel, trygg, tydlig och intelligent utan AI-klichéer. Funktionalitet och affärslogik bevaras.

## Implementering i faser

### Fas 1 — Konsolidera CarIQ-designsystem
- Förfina befintliga tokens och utility-mönster för lugn premiumkänsla: mörk navy, off-white, sparsam CarIQ-blå och konsekventa statusfärger.
- Skapa/återanvänd gemensamma mönster för:
  - bilstatus
  - primär åtgärd
  - sekundära åtgärder
  - analyssteg/loading
  - empty states
  - error states
  - tidslinjepost
  - kompakt bilsammanfattning
- Ta bort kvarvarande emoji som primära statusikoner i resultat och snabbkoll.
- Håll touch targets runt minst 44 px och använd safe-area på viktiga åtgärder.

### Fas 2 — Navigation och appskal
- Behåll fyra huvudflikar men gör “Garage” visuellt och textmässigt till “Min bil” om översättningarna stödjer det.
- Fortsätt dölja appnavigation på auth, pris, betalning/juridik och andra fokuserade flöden.
- Säkerställ att bottennavigation och primära åtgärder inte krockar på små mobiler.

### Fas 3 — Home
- Gör startsidan mer självklar på 2–3 sekunder:
  - vilken bil användaren har
  - bilens lugna status
  - en tydlig primär åtgärd
- Byt huvudprioritet till “Gör en snabbkoll” som primär CTA.
- Lägg fyra sekundära problemvägar under primär åtgärd:
  - Lyssna på bilen
  - Varningslampa
  - Något känns fel
  - Dålig prestanda
- Låt dessa gå till befintliga diagnosflöden med rätt starttaggar där det redan finns stöd.
- Minska sekundär text och undvik att flera knappar konkurrerar.

### Fas 4 — Min bil och Garage
- Gör den sparade bilen till en tydlig digital bilprofil med siluett, modell, miltal och status.
- Behåll registreringsuppslagning, manuell inmatning, variantkrav och servicefält.
- Strukturera service och data så de känns som hjälpsam fordonsinformation, inte en databaslista.
- Empty state: “Din första bil börjar här” med en tydlig CTA.

### Fas 5 — Snabbkoll och diagnosflöden
- Snabbkoll ska kännas som en lugn undersökning, inte en vanlig spinner.
- Inför en diskret analyssekvens: förbereder, lyssnar/läser media, analyserar, jämför orsaker, resultat.
- Första diagnossteget behåller ikoner och färglogik men förfinas till fyra tydligare sekundära startvägar enligt briefen där det passar befintlig logik.
- Bilen fungerar inte och dålig prestanda ska vara stress-tåliga, symptomstyrda steg med färre val per vy.
- Behåll befintliga serverfunktioner, mediahantering, kända fel och valideringar.

### Fas 6 — Resultat
- Resultatet ska prioriteras så här:
  1. Kan jag köra vidare?
  2. Vad tror CarIQ att det är?
  3. Hur säker är bedömningen?
  4. Hur allvarligt är det?
  5. Vad bör jag göra?
  6. Tekniska detaljer och alternativa orsaker
- Visa orsaker och verkstadsdetaljer progressivt så rapporten inte blir en vägg.
- Behåll andra bedömning, mekanikerchatt, verkstadsunderlag, sparning och bokningsflöde.

### Fas 7 — Historik som biljournal
- Gör historiken till en tydligare tidslinje med datumgruppering, kategori/status och viktigaste slutsatsen.
- Behåll radering och tidigare sparad information.
- Empty state ska leda till första analys/snabbkoll.

### Fas 8 — Premium, profil och states
- Premium ska kännas värdefullt och lugnt, inte aggressivt.
- Profilen behåller konto, språk, bil och plan men görs mer fokuserad.
- Empty/error/loading states görs konsekventa genom hela appen.

### Fas 9 — QA
- Kontrollera 320, 375, 390, 414 px och bredare vyer.
- Kontrollera att ingen horisontell scroll, klippt text eller överlapp finns.
- Kontrollera centrala flöden: hem, lägg till bil, snabbkoll, diagnos, resultat, historik, premium, auth och juridiska sidor.
- Kontrollera att befintliga backendflöden, auth, AI-anrop, betalning och historik inte ändrats eller brutits.

## Teknisk inriktning
- Ingen ändring av databas, RLS, betalningswebhook, authmodell, AI-prompter eller API-kontrakt utan konkret UX-skäl.
- Arbeta i befintliga routes och komponenter.
- Använd semantiska tokens och befintliga UI-komponenter.
- Skapa små återanvändbara presentationskomponenter istället för monolitiska omskrivningar.
- Behåll alla publika URL:er.
