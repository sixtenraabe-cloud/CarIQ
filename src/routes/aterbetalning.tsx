import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/legal-page";
import { SELLER } from "@/lib/seller";

export const Route = createFileRoute("/aterbetalning")({
  head: () => ({
    meta: [
      { title: "Återbetalningspolicy — CarIQ" },
      { name: "description", content: `Så begär du återbetalning för CarIQ: full återbetalning inom ${SELLER.refundDays} dagar från köpet.` },
      { property: "og:title", content: "Återbetalningspolicy — CarIQ" },
      { property: "og:description", content: `Full återbetalning inom ${SELLER.refundDays} dagar från köpet.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SELLER.site}/aterbetalning` }],
  }),
  component: Refunds,
});

function Refunds() {
  return (
    <LegalPage title="Återbetalningspolicy" updated="2026-08-20">
      <p>
        {SELLER.legalName} vill att du ska vara nöjd med CarIQ. Du kan begära återbetalning inom{" "}
        {SELLER.refundDays} dagar från köpdatumet, för både engångsköp och den senaste
        abonnemangsbetalningen.
      </p>

      <h2>Så begär du återbetalning</h2>
      <ul>
        <li>Mejla {SELLER.email} med din order- eller kvittoreferens och kort beskrivning.</li>
        <li>Vi svarar normalt inom 2 arbetsdagar.</li>
        <li>Godkända återbetalningar hanteras av Paddle.com Market Ltd, vår Merchant of Record, och betalas tillbaka till samma betalningsmetod inom 5–10 bankdagar.</li>
      </ul>

      <h2>Abonnemang</h2>
      <p>
        Du kan säga upp CarIQ Pro när som helst. Uppsägning stoppar framtida betalningar och du
        behåller åtkomsten till periodens slut. Den senaste betalningen kan återbetalas inom{" "}
        {SELLER.refundDays} dagar enligt ovan.
      </p>

      <h2>Undantag</h2>
      <p>
        Vi kan neka återbetalning vid bevisat missbruk, bedrägeri eller upprepade
        återbetalningsbegäranden för samma tjänst. I övrigt påverkar denna policy inte dina
        lagstadgade konsumenträttigheter.
      </p>

      <p>Frågor? Kontakta {SELLER.email}.</p>
    </LegalPage>
  );
}
