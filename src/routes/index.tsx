import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  CircleHelp,
  Ear,
  Gauge,
  Lock,
  Pencil,
  Plus,
  ScanSearch,
  Volume2,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { useCar } from "@/lib/car-store";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useEntitlement } from "@/hooks/use-entitlement";
import { carValueLabel, useI18n, APP_NAME } from "@/lib/i18n";
import logoAsset from "@/assets/cariq-logo.jpg.asset.json";
import { LanguagePicker } from "@/components/language-picker";
import { CarSilhouette } from "@/components/car-silhouette";
import { BrandLogo } from "@/components/brand-logo";
import { CarStatusPanel } from "@/components/cariq-ui";
import type { StatusLevel } from "@/components/cariq-ui";
import { activeDiagnosis, resolveDiagnosis } from "@/lib/diagnose.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CarIQ — Din digitala bilmekaniker" },
      {
        name: "description",
        content:
          "Diagnostisera bilproblem med ljud, foto och intelligent AI-analys.",
      },
      { property: "og:title", content: "CarIQ — Din digitala bilmekaniker" },
      {
        property: "og:description",
        content: "Diagnostisera bilproblem med ljud, foto och intelligent AI-analys.",
      },
      { property: "og:url", content: "https://cariq-test.lovable.app/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://cariq-test.lovable.app/" }],
  }),
  component: Home,
});

function Home() {
  const { car } = useCar();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const { entitlement, loading: entLoading, signedIn } = useEntitlement();
  // Without credits (or signed out) any feature tap goes straight to checkout.
  const needsPayment = !authLoading && (!signedIn || (!entLoading && (entitlement?.left ?? 0) <= 0));
  // The quick check is free once per calendar month.
  const freeQuickLeft = entitlement?.freeQuickLeft ?? 0;
  const quickNeedsPayment = signedIn ? needsPayment && !entLoading && freeQuickLeft <= 0 : false;

  // The car status mirrors the newest analysis until the owner marks it as fixed.
  const fetchActive = useServerFn(activeDiagnosis);
  const markFixed = useServerFn(resolveDiagnosis);
  const queryClient = useQueryClient();
  const activeQuery = useQuery({
    queryKey: ["active-diagnosis"],
    queryFn: () => fetchActive(),
    enabled: Boolean(user),
  });
  const active = activeQuery.data ?? null;
  const resolve = useMutation({
    mutationFn: (id: string) => markFixed({ data: { id } }),
    onSuccess: () => {
      toast.success(t.issueFixedDone);
      void queryClient.invalidateQueries({ queryKey: ["active-diagnosis"] });
      void queryClient.invalidateQueries({ queryKey: ["diagnoses"] });
    },
  });
  return (
    <main className="app-page">
      <header className="rise relative z-50 mb-7 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="shrink-0">
            <img
              src={logoAsset.url}
              alt="CarIQ – blå bilikon med diagnostikpuls, appens logotyp"
              className="size-12 rounded-lg border border-border object-cover"
            />
          </span>
          <div>
            <h1 className="font-display text-3xl">
              <span className="brand-text">Car</span>
              <span className="text-primary">IQ</span>
              <span className="mt-1 block font-body text-sm font-medium text-muted-foreground">
                {t.tagline}
              </span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!authLoading && !user ? (
            <Button asChild size="sm">
              <Link to="/auth">{t.authSignIn}</Link>
            </Button>
          ) : null}
          <LanguagePicker />
        </div>
      </header>

      <div
        className={`surface rise relative mb-6 block overflow-hidden ${
          car ? "border-primary/45" : ""
        }`}
        style={{ animationDelay: "60ms" }}
      >
        <Link to="/garage" className="relative flex items-center gap-3 px-4 pt-4">
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              {car ? (
                <span
                  className="glow-dot inline-flex size-1.5 rounded-full bg-signal-safe"
                  aria-hidden="true"
                />
              ) : null}
              <span className="stencil block">{t.myCar}</span>
            </span>
            <span className="mt-0.5 flex items-center gap-2">
              {car ? <BrandLogo make={car.make} size={32} /> : null}
              <span className="truncate font-display text-2xl font-bold tracking-tight">
                {car ? `${car.make} ${car.model}` : t.addCar}
              </span>
            </span>
            {car?.variant ? (
              <span className="block truncate text-sm font-medium text-primary">{car.variant}</span>
            ) : null}
            {!car ? (
              <span className="block truncate text-sm text-muted-foreground">{t.carSub}</span>
            ) : null}
          </span>
            <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-secondary/60 text-muted-foreground">
            <ChevronRight className="size-4" />
          </span>
        </Link>
        {car ? (
          <div className="relative mt-2 flex flex-wrap gap-1.5 px-4">
            {[
              String(car.year),
              carValueLabel(car.fuel, t),
              `${car.mileageKm.toLocaleString("sv-SE")} km`,
            ].map((chip) => (
                <span
                  key={chip}
                  className="rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {chip}
                </span>
              ))}
          </div>
        ) : null}
        <CarSilhouette
          make={car?.make ?? ""}
          model={car?.model ?? ""}
          className="relative mx-auto -mt-1 w-64"
        />
        <div className="relative flex gap-2 px-4 pb-4">
          {car ? (
            <Link
              to="/garage"
              className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/50"
            >
              <Pencil className="size-4" /> {t.editCar}
            </Link>
          ) : (
            <Link
              to="/garage"
              className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/50 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
            >
              <Plus className="size-4" /> {t.addCarPlus}
            </Link>
          )}
        </div>
      </div>

      {!car ? (
        <div
          className="rise mb-3 flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground"
          style={{ animationDelay: "110ms" }}
        >
          <Lock className="size-4" />
          {t.addCarToUse}
        </div>
      ) : null}

      <div className="rise mb-5" style={{ animationDelay: "110ms" }}>
        <CarStatusPanel
          title={t.carStatusTitle}
          label={active ? active.headline : car ? t.carStatusGood : t.firstCarTitle}
          body={active ? t.carStatusActiveSub : car ? t.carStatusGoodSub : t.firstCarSub}
          level={active ? (active.verdict as StatusLevel) : car ? "safe" : "neutral"}
        >
          {active ? (
            <Button
              className="w-full"
              disabled={resolve.isPending}
              onClick={() => resolve.mutate(active.id)}
            >
              <Check className="size-4" /> {t.issueFixed}
            </Button>
          ) : null}
        </CarStatusPanel>
      </div>

      <div className="space-y-3" aria-labelledby="home-primary-action">
        <h2 id="home-primary-action" className="sr-only">
          {t.quickPrimary}
        </h2>
        <ActionTile
          to="/snabbkoll"
          disabled={!car}
          payFirst={quickNeedsPayment}
          className="border-2 border-primary bg-card text-primary-foreground hover:border-primary/80"
          style={{ animationDelay: "120ms" }}
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Ear className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold">{t.quickPrimary}</span>
            <span className="block text-sm leading-snug text-primary-foreground/80">{t.quickPrimarySub}</span>
            {!quickNeedsPayment ? (
              signedIn && freeQuickLeft <= 0 ? (
                <span className="mt-2 inline-block rounded-md border border-signal-urgent/40 bg-signal-urgent/15 px-2 py-1 text-xs font-semibold text-signal-urgent">
                  {t.freeQuickBadgeUsed}
                </span>
              ) : (
                <span className="mt-2 inline-block rounded-md border border-signal-safe/40 bg-signal-safe/15 px-2 py-1 text-xs font-semibold text-signal-safe">
                  {t.freeQuickBadge}
                </span>
              )
            ) : null}
          </span>
          <ChevronRight className="size-5 shrink-0 text-primary-foreground/80" />
        </ActionTile>
      </div>

      <section className="rise mt-6" style={{ animationDelay: "175ms" }} aria-labelledby="secondary-help">
        <p id="secondary-help" className="stencil mb-3">{t.homeSecondaryTitle}</p>
        <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
          <ProblemLink to="/diagnos" search={{ tag: "noise" }} disabled={!car} payFirst={needsPayment} icon={Volume2} label={t.aNoise} />
          <ProblemLink to="/diagnos" search={{ tag: "warning" }} disabled={!car} payFirst={needsPayment} icon={AlertTriangle} label={t.aWarning} tone="caution" />
          <ProblemLink to="/diagnos" search={{ tag: "other" }} disabled={!car} payFirst={needsPayment} icon={CircleHelp} label={t.feelsWrongTitle} tone="neutral" />
          <ProblemLink to="/diagnos" search={{ tag: "performance" }} disabled={!car} payFirst={needsPayment} icon={Gauge} label={t.aPerf} tone="soon" />
        </div>
        <ActionTile
          to="/diagnos"
          disabled={!car}
          payFirst={needsPayment}
          className="bg-card/55"
          style={{ animationDelay: "210ms" }}
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
            <ScanSearch className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{t.analyze}</span>
            <span className="block text-sm leading-snug text-muted-foreground">{t.describeHint}</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
        </ActionTile>
      </section>

      <p className="mt-6 text-xs text-muted-foreground">
        {APP_NAME} · {t.disclaimer}
      </p>
    </main>
  );
}

function ProblemLink({
  to,
  search,
  disabled,
  payFirst,
  icon: Icon,
  label,
  tone = "primary",
}: {
  to: string;
  search: Record<string, string>;
  disabled?: boolean;
  payFirst?: boolean;
  icon: LucideIcon;
  label: string;
  tone?: "primary" | "caution" | "soon" | "neutral";
}) {
  const { t } = useI18n();
  const toneClass =
    tone === "caution"
      ? "text-signal-caution bg-signal-caution/10 border-signal-caution/35"
      : tone === "soon"
        ? "text-signal-soon bg-signal-soon/10 border-signal-soon/35"
        : tone === "neutral"
          ? "text-muted-foreground bg-secondary/60 border-border"
          : "text-primary bg-primary/10 border-primary/35";
  const content = (
    <>
      <span className={`grid size-10 shrink-0 place-items-center rounded-lg border ${toneClass}`}>
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 text-sm font-semibold leading-snug">{label}</span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </>
  );
  if (disabled) {
    return (
      <Link
        to="/garage"
        aria-label={t.addCarToUse}
        className="action-row flex min-h-16 items-center gap-3 p-3 text-left opacity-60"
      >
        {content}
      </Link>
    );
  }
  if (payFirst) {
    return (
      <Link to="/pris" className="action-row flex min-h-16 items-center gap-3 p-3 text-left">
        {content}
      </Link>
    );
  }
  return (
    <Link
      to={to}
      search={search}
      aria-label={label}
      className="action-row flex min-h-16 items-center gap-3 p-3 text-left"
    >
      {content}
    </Link>
  );
}

function ActionTile({
  to,
  search,
  disabled,
  payFirst,
  className,
  style,
  children,
}: {
  to: "/diagnos" | "/snabbkoll";
  search?: Record<string, string>;
  disabled?: boolean;
  payFirst?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const base =
    "tile rise flex min-h-20 w-full items-center gap-4 p-4 text-left transition-opacity";
  if (disabled) {
    return (
      // Locked without a car, but tapping should take the user where the lock is
      // lifted instead of doing nothing.
      <Link
        to="/garage"
        aria-label={t.addCarToUse}
        className={`${base} opacity-60 ${className ?? ""}`}
        style={style}
      >
        {children}
      </Link>
    );
  }
  if (payFirst) {
    return (
      <Link to="/pris" className={`${base} lift ${className ?? ""}`} style={style}>
        {children}
      </Link>
    );
  }
  return (
    <Link
      to={to}
      search={search}
      className={`${base} lift ${className ?? ""}`}
      style={style}
    >
      {children}
    </Link>
  );
}
