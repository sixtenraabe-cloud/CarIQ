import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Check, Loader2, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PaymentTestModeBanner } from "@/components/payment-test-banner";
import { useAuth } from "@/hooks/use-auth";
import { useEntitlement } from "@/hooks/use-entitlement";
import { usePaddleCheckout } from "@/hooks/use-paddle-checkout";
import { useI18n } from "@/lib/i18n";
import type { PriceId } from "@/lib/payments.functions";

export const Route = createFileRoute("/pris")({
  head: () => ({
    meta: [
      { title: "Priser — CarIQ" },
      {
        name: "description",
        content: "Enkel diagnos för 25 kr eller CarIQ Pro med 5 analyser i månaden för 49 kr.",
      },
      { property: "og:title", content: "Priser — CarIQ" },
      {
        property: "og:description",
        content: "Betala per diagnos eller kör CarIQ Pro med 5 analyser i månaden.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://cariq-test.lovable.app/pris" },
    ],
    links: [{ rel: "canonical", href: "https://cariq-test.lovable.app/pris" }],
  }),
  component: Pricing,
});

function Pricing() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { entitlement, refetch, signedIn } = useEntitlement();
  const { openCheckout, pending } = usePaddleCheckout();

  const search = Route.useSearch() as { checkout?: string };

  useEffect(() => {
    if (search.checkout !== "success") return;
    toast.success(t.paySuccess);
    const timers = [2000, 6000, 12000].map((ms) => setTimeout(() => void refetch(), ms));
    return () => timers.forEach(clearTimeout);
  }, [search.checkout, refetch, t.paySuccess]);

  const buy = (priceId: PriceId) => {
    if (!user) {
      void navigate({ to: "/auth" });
      return;
    }
    void openCheckout({ priceId, userId: user.id, email: user.email ?? undefined }).catch(() => {
      toast.error(t.errGeneric);
    });
  };

  const left = entitlement?.left ?? 0;

  return (
    <>
      <PaymentTestModeBanner />
      <main className="px-4 pt-8">
        <h1 className="font-display text-3xl tracking-tight">{t.payTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.paySub}</p>

        <div className="panel mt-5 p-4">
          <p className="stencil">{t.payPlanLabel}</p>
          {!signedIn ? (
            <p className="mt-1 text-sm text-muted-foreground">{t.payNeedLogin}</p>
          ) : (
            <>
              <p className="mt-1 font-display text-xl">
                {entitlement?.plan === "pro" ? t.payPlanPro : t.payPlanFree}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {entitlement?.plan === "pro"
                  ? t.payLeftPro.replace("{n}", String(entitlement.monthlyLeft))
                  : left > 0
                    ? t.payLeftCredits.replace("{n}", String(left))
                    : t.payNone}
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-2 text-xs font-semibold text-primary underline"
              >
                {t.payRefresh}
              </button>
            </>
          )}
        </div>

        <div className="mt-5 space-y-4">
          <PlanCard
            icon={<Zap className="size-5" />}
            title={t.payOnce}
            description={t.payOnceDesc}
            price={t.payOncePrice}
            unit={t.payOnceUnit}
            buying={pending === "single_diagnosis_once"}
            label={t.payBuy}
            opening={t.payOpening}
            onBuy={() => buy("single_diagnosis_once")}
          />
          <PlanCard
            highlight
            icon={<Sparkles className="size-5" />}
            title={t.payPro}
            description={t.payProDesc}
            price={t.payProPrice}
            unit={t.payProUnit}
            buying={pending === "cariq_pro_monthly"}
            label={t.payBuy}
            opening={t.payOpening}
            onBuy={() => buy("cariq_pro_monthly")}
          />
        </div>

        {!signedIn ? (
          <Button asChild className="mt-5 w-full">
            <Link to="/auth">{t.authSignIn}</Link>
          </Button>
        ) : null}

        <p className="mt-6 text-xs text-muted-foreground">{t.disclaimer}</p>
      </main>
    </>
  );
}

function PlanCard({
  icon,
  title,
  description,
  price,
  unit,
  label,
  opening,
  buying,
  highlight,
  onBuy,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  price: string;
  unit: string;
  label: string;
  opening: string;
  buying: boolean;
  highlight?: boolean;
  onBuy: () => void;
}) {
  return (
    <div className={`panel p-5 ${highlight ? "border-primary/50 bg-primary/10" : ""}`}>
      <div className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-primary/20 text-primary">{icon}</span>
        <p className="font-display text-lg">{title}</p>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <p className="mt-3 font-display text-3xl">
        {price} <span className="font-body text-sm text-muted-foreground">{unit}</span>
      </p>
      <Button className="mt-4 w-full" disabled={buying} onClick={onBuy}>
        {buying ? (
          <>
            <Loader2 className="size-4 animate-spin" /> {opening}
          </>
        ) : (
          <>
            <Check className="size-4" /> {label}
          </>
        )}
      </Button>
    </div>
  );
}
