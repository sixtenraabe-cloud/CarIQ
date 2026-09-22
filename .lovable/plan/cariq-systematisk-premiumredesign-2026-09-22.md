# CarIQ — systematisk premiumredesign

## Audit: nuläge

### Det som redan fungerar bra
- Tydlig mobil struktur med fyra huvudflikar, fungerande språkbyte och separata sidor för hem, bil, historik, profil, pris och konto.
- Bilprofilen återanvänds genom hela analysflödet och synkas till kontot vid inloggning.
- Diagnostiken har en stark funktionell kärna: symptomval, bilmapp, varningslampor, foto/video, kända modellfel, allvarlighetsgrad, kostnad, andra bedömning, mekanikerchatt och verkstadsunderlag.
- Betalning, användningsrättigheter, gratis månatlig snabbkoll, historik och skyddade sidor är redan separerade från presentationen.
- Nuvarande mörka navy-bas, blå accent och bilillustrationer är en bra grund att förfina.
- Kontrollerade vyer vid 320 px och 767 px har ingen horisontell scroll eller synliga konsolfel.

### Problem att lösa
- För många likvärdiga paneler gör att bil, nästa åtgärd och sekundär information konkurrerar visuellt.
- Globala glow-effekter, gradients, kraftiga textskuggor och återkommande dekorativa ljusblobbar motverkar det lugna premiumuttrycket.
- Hemskärmen har fem nästan likvärdiga val; Snabbkoll och full analys behöver en tydligare huvudväg.
- Bottennavigation, sidfot och testbanner tar mycket plats på små skärmar; testbannern visas dessutom dubbelt på prissidan.
- Navigationen visas även på konto-, betalnings- och juridiska sidor där den stör den aktuella uppgiften.
- Analyssteget är långt och informationsrikt. Media, kända fel, bilområde, tidpunkt och beskrivning behöver grupperas och visas i rätt ordning.
- Resultatet innehåller rätt information men saknar en skarp prioritering mellan: körbesked, vad det troligen är och vad användaren ska göra nu.
- Historiken visar sparade poster men saknar tydlig visuell sammanfattning och ett användbart detaljläge.
- Garageformuläret har inkonsekvent fältbredd och modellval; variant behöver vara tydligt obligatorisk enligt befintligt krav.
- Laddning, tomlägen och felmeddelanden använder flera olika visuella mönster.
- Några interaktiva element är specialbyggda trots att befintliga gemensamma knappar och fält kan återanvändas.

### Återanvänd och refaktorera
- Behåll befintliga Button, Input, Textarea, Select, Dialog, Badge, Skeleton och Toast som grund; ge dem gemensamma CarIQ-varianter.
- Behåll och förfina CarSilhouette, BrandLogo, CarDiagram, WarningLamps, AudioRecorder och DiagnosisReport.
- Skapa små gemensamma presentationsmönster för sidhuvud, bilsammanfattning, statusrad, huvudåtgärd, tomläge och laddning — utan att skapa ett nytt kort för varje sektion.
- Låt Garage fortsatt vara den befintliga sidan för “Min bil”; skapa inte ett parallellt bilsystem eller ändra sparformatet.

### Ska inte ändras
- Databasstruktur, RLS, bilsynk, autentiseringsmodell och skyddade sidors beteende.
- AI-prompter, fordons-/drivlinekontroller, kostnadslogik och diagnosresultatets datamodell.
- Betalningsleverantör, priser, rättighetslogik, gratis snabbkoll och accesskodflöde.
- Registreringsuppslagning, mediaextraktion, språk och valutor.
- Befintliga publika URL:er och juridiska texter.

## Implementering

### 1. CarIQ-designsystem
- Strama upp navy/off-white/blå-paletten och behåll statusfärgerna för säker, försiktig, snart och akut.
- Ta bort bakgrundsblobbar, överdriven glow, gradients och tunga textskuggor.
- Standardisera typografi, 4/8-baserad spacing, 8 px kort-/fält-radie, tunna borders och mycket diskreta skuggor.
- Ge knappar, fält, valknappar, statusindikatorer, dialoger, skeletons, tomlägen och fel enhetliga states och minst cirka 44 px tryckyta.
- Lägg in safe-area-stöd och rörelser som respekterar reducerad animation.

### 2. Navigation och appskal
- Förfina bottennavigationen med tydligare aktiv markering, korrekt safe area och enklare etiketter.
- Visa appnavigationen bara i kärnappen; konto, betalning och juridiska sidor får fokuserade sidlayouter.
- Gör sidfoten kompakt och undvik att den skapar stora tomma ytor eller konkurrerar med huvuduppgiften.
- Ta bort den dubbla betalningstest-bannern.

### 3. Hem och Min bil
- Gör den sparade bilen till första tydliga signalen med renare bilvy, identitet och relevant hälsostatus utan påhittad statistik.
- Ge en primär “Analysera problem”-åtgärd och gör Snabbkoll till ett tydligt, enklare alternativ.
- Samla problemtyperna bakom huvudåtgärden eller presentera dem först när analysen startas, så startsidan blir mindre beslutsbelastad.
- Förenkla registreringsuppslagning och manuell inmatning, förbättra formulärhierarki och gör variant obligatorisk med tydlig validering.
- Behåll serviceuppgifter som en lugn sekundär del och säkerställ korrekt layout vid 320 px.

### 4. Analys och problemflöden
- Ge flödet ett gemensamt, kompakt stegformat med tydlig framåtriktning och en enda primär CTA per skärm.
- Behåll kategoriunika regler: ingen bilområdesfråga för varningslampa eller dålig prestanda; varningslampor får foto och beskrivning.
- Prioritera obligatoriska frågor först och lägg valfria media/kända modellfel i tydliga, expanderbara delar.
- Behåll bilritningens aktiva områden men gör markeringen lugnare och mer självklar.
- Förbättra analysens vänteläge med tydlig progress och trygg, kort återkoppling utan AI-marknadsföring.

### 5. Resultat, historik och mekaniker
- Bygg resultathierarkin som: körbesked → rekommenderad åtgärd → troligaste orsak → kostnad → detaljer.
- Behåll allvarlighetsindex, sannolikheter, utökbara orsaker, andra bedömningen, chatten och verkstadsunderlaget.
- Gör sekundära funktioner progressivt synliga så rapporten inte blir en lång vägg av likvärdiga paneler.
- Gör historikposter mer skannbara och öppningsbara till ett tydligt detaljläge med sparad information; behåll radering.
- Ge tom historik en enkel väg till ny analys.

### 6. Konto och Premium
- Förenkla konto till tydliga grupper för konto, bil, språk och abonnemang.
- Gör prissidan lugnare med klar jämförelse, ett rekommenderat val och transparent användningsinformation.
- Bevara exakt pris, checkout, inloggningskrav, accesskod och Merchant of Record-information.

### 7. Slutkontroll
- Verifiera varje route och kärnflöde i både utloggat och inloggat läge.
- Kontrollera bilskapande/redigering, registreringsuppslagning, ljud/foto/video, analys, snabbkoll, sparning, historik, andra bedömning, chatt och betalningsvägar.
- Kontrollera 320 px, vanlig mobil och bredare vy: ingen horisontell scroll, inga överlapp, läsbara texter och minst 44 px tryckytor.
- Kontrollera laddning, fel, tomlägen, konsol och nätverksfel samt konsekvens mellan alla sidor.

## Teknisk inriktning
- Arbeta i befintliga routes och komponenter; ingen ny appstruktur och inga ändrade publika URL:er.
- Presentationen ändras först via semantiska tokens och gemensamma komponentvarianter, därefter sida för sida.
- Backend och affärslogik lämnas orörda om inte ett redan befintligt användarflöde kräver en liten kopplingsfix.
- Större visuella ändringar görs i små verifierbara etapper: system/appskal, hem/bil, analys/resultat, historik/konto/pris, QA.
