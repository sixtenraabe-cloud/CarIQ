import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ChevronRight, Gauge, Volume2, Wrench } from "lucide-react";

import { useCar, carLine } from "@/lib/car-store";
import { useI18n, APP_NAME } from "@/lib/i18n";
import logoAsset from "@/assets/cariq-logo.jpg.asset.json";
import { LanguagePicker } from "@/components/language-picker";
import { CarSilhouette } from "@/components/car-silhouette";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CarIQ — lyssna på bilen, få en mekanikers svar" },
      {
        name: "description",
        content:
          "Spela in ljudet, beskriv problemet och få en AI-mekanikers bedömning av vad som är fel och om bilen är säker att köra.",
      },
      { property: "og:title", content: "CarIQ — din digitala bilmekaniker" },
      {
        property: "og:description",
        content: "Spela in ljudet från bilen och få en bedömning på under en minut.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
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
      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={logoAsset.url}
            alt="CarIQ logotyp"
            className="size-16 shrink-0 rounded-2xl border border-border object-cover"
          />
          <div>
            <h1 className="text-4xl tracking-tight">
              Car<span className="text-primary">IQ</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{t.tagline}</p>
          </div>
        </div>
        <LanguagePicker />
      </header>

      <Link
        to="/garage"
        className="tile mb-6 block overflow-hidden active:scale-[0.99] hover:border-primary/60"
      >
        <div className="flex items-center gap-3 px-4 pt-4">
          <span className="min-w-0 flex-1">
            <span className="stencil block">{t.myCar}</span>
            <span className="block truncate text-lg font-semibold">
              {car ? `${car.make} ${car.model}` : t.addCar}
            </span>
            <span className="block truncate text-sm text-muted-foreground">
              {car ? carLine(car) : t.carSub}
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
        </div>
        <CarSilhouette make={car?.make ?? ""} model={car?.model ?? ""} className="mx-auto -mt-1 w-64" />
      </Link>

      <div className="space-y-3">
        {ACTIONS.map((action) => (
          <Link
            key={action.tag}
            to="/diagnos"
            search={{ tag: action.tag }}
            className="tile flex items-center gap-4 p-4 hover:border-primary/60 active:scale-[0.99]"
          >
            <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${action.tone}`}>
              <action.icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{t[action.title]}</span>
              <span className="block truncate text-sm text-muted-foreground">
                {t[action.subtitle]}
              </span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        {APP_NAME} · {t.disclaimer}
      </p>
    </main>
  );
}
