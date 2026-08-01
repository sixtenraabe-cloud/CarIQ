import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ChevronRight, Gauge, Volume2, Wrench } from "lucide-react";

import { useCar, carLine } from "@/lib/car-store";
import { useI18n } from "@/lib/i18n";
import { LanguagePicker } from "@/components/language-picker";
import { CarSilhouette } from "@/components/car-silhouette";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BilHjälpen AI — lyssna på bilen, få svar direkt" },
      {
        name: "description",
        content:
          "Spela in ljudet, beskriv problemet och få en AI-bedömning av vad som är fel och om bilen är säker att köra.",
      },
      { property: "og:title", content: "BilHjälpen AI — din digitala bilhjälp" },
      {
        property: "og:description",
        content: "Spela in ljudet från bilen och få en AI-bedömning på under en minut.",
      },
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
      <header className="mb-5">
        <h1 className="text-3xl">BilHjälpen AI</h1>
        <p className="mt-1 text-sm text-primary">{t.tagline}</p>
      </header>

      <div className="mb-5">
        <p className="stencil mb-2">{t.language}</p>
        <LanguagePicker />
      </div>

      <Link to="/garage" className="tile mb-6 flex items-center gap-4 p-4 active:scale-[0.99]">
        <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-secondary">
          <CarSilhouette model={car?.model ?? ""} className="w-14" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="stencil block">{t.myCar}</span>
          <span className="block truncate font-semibold">
            {car ? `${car.make} ${car.model}` : t.addCar}
          </span>
          <span className="block truncate text-sm text-muted-foreground">
            {car ? carLine(car) : t.carSub}
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
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

      <p className="mt-6 text-xs text-muted-foreground">{t.disclaimer}</p>
    </main>
  );
}
