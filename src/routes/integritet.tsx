import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/legal-page";
import { SELLER } from "@/lib/seller";

export const Route = createFileRoute("/integritet")({
  head: () => ({
    meta: [
      { title: "Integritetspolicy — CarIQ" },
      { name: "description", content: "Hur CarIQ samlar in, använder och delar personuppgifter, och vilka rättigheter du har enligt GDPR." },
      { property: "og:title", content: "Integritetspolicy — CarIQ" },
      { property: "og:description", content: "Hur CarIQ behandlar personuppgifter och vilka rättigheter du har enligt GDPR." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SELLER.site}/integritet` }],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <LegalPage title="Integritetspolicy" updated="2026-08-20">
      <p>
        {SELLER.legalName} är personuppgiftsansvarig för behandlingen av personuppgifter i CarIQ
        ({SELLER.site}). Kontakt i dataskyddsfrågor: {SELLER.email}.
      </p>

      <h2>Personuppgifter vi behandlar</h2>
      <ul>
        <li>Kontouppgifter: e-postadress, inloggningsidentifierare och autentiseringsdata.</li>
        <li>Fordonsuppgifter: märke, modell, årsmodell, drivmedel, mil/km och registreringsnummer du anger.</li>
        <li>Innehåll du laddar upp: symptombeskrivningar, ljudinspelningar, bilder och video.</li>
        <li>Köp- och abonnemangsuppgifter: order-, abonnemangs- och kundidentifierare samt status (kortnummer hanteras aldrig av oss).</li>
        <li>Kontaktuppgifter vid verkstadsbokning: namn, telefonnummer, e-post och plats.</li>
        <li>Teknisk data: loggar, felrapporter och grundläggande användningsstatistik.</li>
      </ul>

      <h2>Ändamål och rättslig grund</h2>
      <ul>
        <li>Leverera diagnoser och kontofunktioner – fullgörande av avtal.</li>
        <li>Hantera betalningar, kvitton och bokföring – avtal och rättslig förpliktelse.</li>
        <li>Support, säkerhet och missbruksförebyggande – berättigat intresse.</li>
        <li>Förmedla din förfrågan till verkstad – ditt samtycke.</li>
      </ul>

      <h2>Mottagare vi delar uppgifter med</h2>
      <ul>
        <li>Paddle.com Market Ltd – Merchant of Record som hanterar betalning, moms, kvitton och återbetalningar.</li>
        <li>Supabase – hosting av databas och autentisering.</li>
        <li>AI-leverantörer (Google Gemini via Lovable AI Gateway) – bearbetning av text, ljud och bild för att skapa diagnosen.</li>
        <li>Verkstadspartner – endast när du själv väljer att skicka en bokningsförfrågan.</li>
      </ul>
      <p>Vi säljer aldrig dina personuppgifter.</p>

      <h2>Överföring utanför EU/EES</h2>
      <p>
        Vissa leverantörer kan behandla uppgifter utanför EU/EES. Sådana överföringar sker med
        EU-kommissionens standardavtalsklausuler eller motsvarande skyddsåtgärder.
      </p>

      <h2>Lagringstid</h2>
      <p>
        Kontodata och diagnoshistorik sparas så länge ditt konto är aktivt och raderas inom 30 dagar
        efter att kontot avslutats. Transaktions- och bokföringsunderlag sparas så länge lagen kräver.
      </p>

      <h2>Dina rättigheter</h2>
      <p>
        Du har rätt till tillgång, rättelse, radering, begränsning, dataportabilitet och att invända
        mot behandling, samt att när som helst återkalla lämnat samtycke. Kontakta {SELLER.email}. Du
        kan även klaga till Integritetsskyddsmyndigheten (IMY).
      </p>

      <h2>Cookies</h2>
      <p>
        Vi använder nödvändiga cookies och liknande lagring för inloggning och säkerhet. Paddle kan
        sätta cookies i kassan för att genomföra betalningen och förhindra bedrägeri.
      </p>
    </LegalPage>
  );
}
