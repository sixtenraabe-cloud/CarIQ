import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Car, ChevronRight, Gauge, Volume2, Wrench } from "lucide-react";

import { useCar, carLine } from "@/lib/car-store";

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
  {
    tag: "noise",
    title: "Min bil låter konstigt",
    subtitle: "Spela in ljud eller beskriv det",
    icon: Volume2,
    tone: "text-primary bg-primary/15",
  },
  {
    tag: "warning",
    title: "Varningslampa lyser",
    subtitle: "Beskriv lampan på instrumentpanelen",
    icon: AlertTriangle,
    tone: "text-signal-urgent bg-signal-urgent/15",
  },
  {
    tag: "nostart",
    title: "Bilen fungerar inte",
    subtitle: "Rycker, startar dåligt m.m.",
    icon: Wrench,
    tone: "text-signal-caution bg-signal-caution/15",
  },
  {
    tag: "performance",
    title: "Dålig prestanda",
    subtitle: "Tappar kraft eller drar mycket",
    icon: Gauge,
    tone: "text-signal-safe bg-signal-safe/15",
  },
] as const;

function Home() {
  const { car } = useCar();

  return (
    <main className="px-4 pt-8">
      <header className="mb-6">
        <h1 className="text-3xl">BilHjälpen AI</h1>
        <p className="mt-1 text-sm text-primary">Din digitala bilhjälp</p>
      </header>

      <Link to="/garage" className="tile mb-6 flex items-center gap-4 p-4 active:scale-[0.99]">
        <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-secondary">
          <Car className="size-7 text-muted-foreground" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="stencil block">Min bil</span>
          <span className="block truncate font-semibold">
            {car ? `${car.make} ${car.model}` : "Lägg till din bil"}
          </span>
          <span className="block truncate text-sm text-muted-foreground">
            {car ? carLine(car) : "Märke, årsmodell och miltal"}
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
              <span className="block font-semibold">{action.title}</span>
              <span className="block truncate text-sm text-muted-foreground">
                {action.subtitle}
              </span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Bedömningen är AI-genererad vägledning — inte en verkstadsbesiktning.
      </p>
    </main>
  );
}
