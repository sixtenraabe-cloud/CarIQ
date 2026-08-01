import { CarSilhouette, type Zone } from "@/components/car-silhouette";
import { useI18n } from "@/lib/i18n";

export type ZoneKey = "front" | "engine" | "rear" | "under" | "unknown";

export function CarDiagram({
  make,
  model,
  value,
  onChange,
}: {
  make: string;
  model: string;
  value: ZoneKey | "";
  onChange: (zone: ZoneKey) => void;
}) {
  const { t } = useI18n();

  const ZONES: { key: ZoneKey; label: string }[] = [
    { key: "front", label: t.front },
    { key: "engine", label: t.engine },
    { key: "rear", label: t.rear },
    { key: "under", label: t.under },
    { key: "unknown", label: t.dontKnow },
  ];

  const highlight: Zone =
    value === "front" || value === "engine" || value === "rear" || value === "under" ? value : null;

  return (
    <div className="space-y-3">
      <div className="panel relative overflow-hidden p-3">
        <CarSilhouette make={make} model={model} highlight={highlight} className="w-full" />
        <p className="mt-1 text-center text-xs text-muted-foreground">{t.whereHint}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {ZONES.map((zone) => (
          <button
            key={zone.key}
            type="button"
            onClick={() => onChange(zone.key)}
            aria-pressed={value === zone.key}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
              value === zone.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {zone.label}
          </button>
        ))}
      </div>
    </div>
  );
}
