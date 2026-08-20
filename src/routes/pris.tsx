import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Check, KeyRound, Loader2, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PaymentTestModeBanner } from "@/components/payment-test-banner";
import { useAuth } from "@/hooks/use-auth";
import { useEntitlement } from "@/hooks/use-entitlement";
import { usePaddleCheckout } from "@/hooks/use-paddle-checkout";
import { useI18n } from "@/lib/i18n";
import { redeemAccessCode, type PriceId } from "@/lib/payments.functions";

export const Route = createFileRoute("/pris")({
  validateSearch: (search: Record<string, unknown>): { checkout?: string } =>
    typeof search["checkout"] === "string" ? { checkout: search["checkout"] } : {},
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
                {entitlement?.plan === "unlimited"
                  ? t.payPlanUnlimited
                  : entitlement?.plan === "pro"
                    ? t.payPlanPro
                    : t.payPlanFree}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {entitlement?.plan === "unlimited"
                  ? t.codeSub
                  : entitlement?.plan === "pro"
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

        <RedeemCodeCard onRedeemed={() => void refetch()} signedIn={signedIn} />

        {!signedIn ? (
          <Button asChild className="mt-5 w-full">
            <Link to="/auth">{t.authSignIn}</Link>
          </Button>
        ) : null}

        <p className="mt-6 text-xs text-muted-foreground">{t.disclaimer}</p>

        <p className="mt-3 text-xs text-muted-foreground">
          Betalningar hanteras av Paddle.com Market Ltd, vår Merchant of Record.
        </p>
        <nav className="mt-2 flex flex-wrap gap-3 text-xs text-primary underline">
          <Link to="/villkor">Villkor</Link>
          <Link to="/aterbetalning">Återbetalning</Link>
          <Link to="/integritet">Integritet</Link>
        </nav>
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

function RedeemCodeCard({ signedIn, onRedeemed }: { signedIn: boolean; onRedeemed: () => void }) {
  const { t } = useI18n();
  const redeem = useServerFn(redeemAccessCode);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!code.trim() || busy) return;
    setBusy(true);
    try {
      const result = await redeem({ data: { code: code.trim() } });
      if (result.ok) {
        setCode("");
        toast.success(t.codeOk);
        onRedeemed();
      } else if (result.reason === "already") {
        toast.error(t.codeAlready);
      } else if (result.reason === "exhausted") {
        toast.error(t.codeExhausted);
      } else {
        toast.error(t.codeInvalid);
      }
    } catch {
      toast.error(t.errGeneric);
    } finally {
      setBusy(false);
    }
  };

  if (!signedIn) return null;

  return (
    <div className="panel mt-5 p-5">
      <div className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-primary/20 text-primary">
          <KeyRound className="size-5" />
        </span>
        <p className="font-display text-lg">{t.codeTitle}</p>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{t.codeSub}</p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder={t.codePlaceholder}
          aria-label={t.codePlaceholder}
          className="min-w-0 flex-1 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm font-semibold tracking-wide text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
        />
        <Button type="submit" disabled={busy || !code.trim()}>
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" /> {t.codeRedeeming}
            </>
          ) : (
            t.codeRedeem
          )}
        </Button>
      </form>
    </div>
  );
}
