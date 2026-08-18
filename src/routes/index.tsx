import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ChevronRight,
  Ear,
  Gauge,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Volume2,
  Wrench,
} from "lucide-react";
import type { CSSProperties } from "react";

import { useCar, carLine } from "@/lib/car-store";
import { useI18n, APP_NAME } from "@/lib/i18n";
import logoAsset from "@/assets/cariq-logo.jpg.asset.json";
import { LanguagePicker } from "@/components/language-picker";
import { CarSilhouette } from "@/components/car-silhouette";
import { BrandLogo } from "@/components/brand-logo";

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

const ACTIONS = [
  { tag: "noise", title: "aNoise", subtitle: "aNoiseSub", icon: Volume2, tone: "text-primary bg-primary/15" },
  {
    tag: "warning",
    title: "aWarning",
    subtitle: "aWarningSub",
    icon: AlertTriangle,
    tone: "text-signal-urgent bg-signal-urgent/15",
  },
  {
    tag: "nostart",
    title: "aNostart",
    subtitle: "aNostartSub",
    icon: Wrench,
    tone: "text-signal-caution bg-signal-caution/15",
  },
  {
    tag: "performance",
    title: "aPerf",
    subtitle: "aPerfSub",
    icon: Gauge,
    tone: "text-signal-safe bg-signal-safe/15",
  },
] as const;

function Home() {
  const { car } = useCar();
  const { t } = useI18n();
  return (
    <main className="px-4 pt-8">
      <header className="rise relative z-50 mb-6 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="relative shrink-0">
            <span
              aria-hidden="true"
              className="absolute -inset-1.5 rounded-3xl bg-primary/25 blur-lg"
            />
            <img
              src={logoAsset.url}
              alt="CarIQ – blå bilikon med diagnostikpuls, appens logotyp"
              className="relative size-16 rounded-2xl border border-white/10 object-cover shadow-lg"
            />
          </span>
          <div>
            <h1 className="font-display text-4xl tracking-tight">
              <span className="brand-text">Car</span>
              <span className="text-primary">IQ</span>
              <span className="mt-1 block font-body text-sm font-medium text-muted-foreground">
                {t.tagline}
              </span>
            </h1>
          </div>
        </div>
        <LanguagePicker />
      </header>

      <div
        className={`surface rise relative mb-6 block overflow-hidden ${
          car ? "border-primary/45" : ""
        }`}
        style={{ animationDelay: "60ms" }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-primary/20 blur-3xl"
        />
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
          <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-secondary/60 text-muted-foreground">
            <ChevronRight className="size-4" />
          </span>
        </Link>
        {car ? (
          <div className="relative mt-2 flex flex-wrap gap-1.5 px-4">
            {carLine(car)
              .split(" · ")
              .map((chip) => (
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
          className="relative mx-auto -mt-1 w-64 drop-shadow-[0_18px_28px_rgba(0,0,0,0.55)]"
        />
        <div className="relative flex gap-2 px-4 pb-4">
          {car ? (
            <>
              <Link
                to="/garage"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/50"
              >
                <Pencil className="size-4" /> {t.editCar}
              </Link>
              <Link
                to="/garage"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/50 bg-primary/15 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/25"
              >
                <RefreshCw className="size-4" /> {t.changeCar}
              </Link>
            </>
          ) : (
            <Link
              to="/garage"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/50 bg-primary/15 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/25"
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

      <div className="space-y-3">
        <ActionTile
          to="/snabbkoll"
          disabled={!car}
          className="border-primary/50 bg-primary/10"
          style={{ animationDelay: "120ms" }}
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary ring-1 ring-primary/30">
            <Ear className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{t.quickHome}</span>
            <span className="block truncate text-sm text-muted-foreground">{t.quickHomeSub}</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
        </ActionTile>
        {ACTIONS.map((action, i) => (
          <ActionTile
            key={action.tag}
            to="/diagnos"
            search={{ tag: action.tag }}
            disabled={!car}
            style={{ animationDelay: `${170 + i * 55}ms` }}
          >
            <span
              className={`grid size-11 shrink-0 place-items-center rounded-xl ring-1 ring-inset ring-white/5 ${action.tone}`}
            >
              <action.icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{t[action.title]}</span>
              <span className="block truncate text-sm text-muted-foreground">
                {t[action.subtitle]}
              </span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
          </ActionTile>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        {APP_NAME} · {t.disclaimer}
      </p>
    </main>
  );
}
