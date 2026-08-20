import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/legal-page";
import { SELLER } from "@/lib/seller";

export const Route = createFileRoute("/villkor")({
  head: () => ({
    meta: [
      { title: "Villkor — CarIQ" },
      { name: "description", content: "Allmänna villkor för CarIQ:s AI-baserade bildiagnostjänst, inklusive köp, användning och uppsägning." },
      { property: "og:title", content: "Villkor — CarIQ" },
      { property: "og:description", content: "Allmänna villkor för CarIQ:s AI-baserade bildiagnostjänst." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SELLER.site}/villkor` }],
  }),
  component: Terms,
});

function Terms() {
  return (
    <LegalPage title="Allmänna villkor" updated="2026-08-20">
      <p>
        Dessa villkor gäller mellan dig och {SELLER.legalName} ("vi", "oss"), som tillhandahåller
        webbtjänsten CarIQ på {SELLER.site}. Kontakt: {SELLER.email}.
      </p>

      <h2>Betalning och Merchant of Record</h2>
      <p>
        Vår orderhantering och betalningar sköts av Paddle.com Market Ltd, som är Merchant of Record
        (återförsäljare) för alla köp. Paddle hanterar betalning, kvitton, moms och fakturering och
        framgår som betalningsmottagare på ditt kontoutdrag. Paddles köpvillkor gäller för själva
        transaktionen.
      </p>

      <h2>Tjänsten</h2>
      <p>
        CarIQ ger AI-genererade indikationer om möjliga fel på ett fordon utifrån den information,
        ljud och bild du lämnar. Tjänsten är ett beslutsstöd och ersätter inte en fysisk besiktning
        eller en auktoriserad verkstad. Vi garanterar inte att en diagnos är korrekt eller
        fullständig och ansvarar inte för åtgärder du vidtar baserat på den.
      </p>

      <h2>Konto</h2>
      <p>
        Du måste ha ett konto för att använda analyserna, lämna korrekta uppgifter och ansvarar för
        att hålla dina inloggningsuppgifter säkra.
      </p>

      <h2>Priser och abonnemang</h2>
      <ul>
        <li>Enskild diagnos: engångsköp som ger en analys.</li>
        <li>CarIQ Pro: löpande månadsabonnemang med 5 analyser per månad.</li>
        <li>Abonnemanget förnyas automatiskt varje månad tills du säger upp det. Du kan säga upp när som helst och behåller åtkomsten till periodens slut.</li>
        <li>Alla priser anges inklusive tillämplig moms där så krävs.</li>
      </ul>

      <h2>Tillåten användning</h2>
      <p>Du får inte:</p>
      <ul>
        <li>använda tjänsten för olagliga ändamål eller i strid med tredje parts rättigheter,</li>
        <li>ladda upp material du inte har rätt att dela, eller skadlig kod,</li>
        <li>försöka kringgå betalningar, kvoter, säkerhet eller åtkomstkontroller,</li>
        <li>skrapa, kopiera eller vidareförsälja tjänsten eller dess innehåll utan vårt skriftliga tillstånd.</li>
      </ul>

      <h2>Immateriella rättigheter</h2>
      <p>
        Tjänsten, dess programvara, design, varumärken och innehåll tillhör {SELLER.legalName} eller
        våra licensgivare. Du får en begränsad, icke-exklusiv och icke-överlåtbar rätt att använda
        tjänsten för eget bruk. Innehåll du laddar upp förblir ditt; du ger oss rätt att behandla det
        för att leverera tjänsten.
      </p>

      <h2>Avstängning och uppsägning</h2>
      <p>
        Vi kan stänga av eller avsluta ditt konto vid brott mot dessa villkor, misstänkt bedrägeri
        eller missbruk av tjänsten. Du kan avsluta ditt konto när som helst genom att kontakta{" "}
        {SELLER.email}.
      </p>

      <h2>Ansvarsbegränsning</h2>
      <p>
        Tjänsten tillhandahålls i befintligt skick. I den utsträckning lagen tillåter ansvarar vi
        inte för indirekta skador, och vårt totala ansvar begränsas till det belopp du betalat under
        de senaste tolv månaderna.
      </p>

      <h2>Ändringar och tillämplig lag</h2>
      <p>
        Vi kan uppdatera villkoren; väsentliga ändringar meddelas i appen eller via e-post. Svensk
        lag gäller. Frågor skickas till {SELLER.email}.
      </p>
    </LegalPage>
  );
}
