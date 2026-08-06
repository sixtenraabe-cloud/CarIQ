import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCar } from "@/lib/car-store";
import { useI18n } from "@/lib/i18n";
import { lookupPlate } from "@/lib/plate.functions";
import { suggestBrands } from "@/lib/car-brands";
import { BrandLogo } from "@/components/brand-logo";
import { fuelsFor, isKnownCar, normalizeBrand, suggestModels } from "@/lib/car-models";
import { CarSilhouette } from "@/components/car-silhouette";

export const Route = createFileRoute("/garage")({
  head: () => ({
    meta: [
      { title: "Mitt garage — CarIQ" },
      {
        name: "description",
        content: "Spara märke, modell, årsmodell och miltal så blir AI-bedömningen mer träffsäker.",
      },
      { property: "og:title", content: "Mitt garage — CarIQ" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://cariq-test.lovable.app/garage" },
      { property: "og:description", content: "Lägg till din bil för bättre diagnoser." },
    ],
    links: [{ rel: "canonical", href: "https://cariq-test.lovable.app/garage" }],
  }),
  component: Garage,
});

function Garage() {
  const { car, ready, saveCar } = useCar();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const findPlate = useServerFn(lookupPlate);
  const [plate, setPlate] = useState("");
  const [plateLoading, setPlateLoading] = useState(false);
  const [plateNote, setPlateNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);
  const [form, setForm] = useState({
    make: "",
    model: "",
    variant: "",
    year: "",
    mileageKm: "",
    transmission: "manual",
    fuel: "petrol",
  });

  const TRANSMISSIONS = [
    { value: "manual", label: t.manual },
    { value: "automatic", label: t.automatic },
    { value: "DSG", label: "DSG" },
    { value: "CVT", label: "CVT" },
  ];
  const FUELS = [
    { value: "petrol", label: t.petrol },
    { value: "diesel", label: t.diesel },
    { value: "hybrid", label: t.hybrid },
    { value: "electric", label: t.electric },
  ];

  useEffect(() => {
    if (car) {
      setForm({
        make: car.make,
        model: car.model,
        variant: car.variant ?? "",
        year: String(car.year),
        mileageKm: String(car.mileageKm),
        transmission: car.transmission,
        fuel: car.fuel,
      });
    }
  }, [car]);

  const suggestions = suggestBrands(form.make).filter((b) => b !== form.make);
  const brand = normalizeBrand(form.make);
  const modelSuggestions = suggestModels(form.make, form.model).filter((m) => m !== form.model);
  const knownCar = isKnownCar(form.make, form.model);
  const makeError = form.make.trim() !== "" && !brand;
  const modelError = Boolean(brand) && form.model.trim() !== "" && !knownCar;
  const allowedFuels = fuelsFor(form.make, form.model);
  const fuelLocked = knownCar && allowedFuels.length === 1;
  const valid = Boolean(knownCar && Number(form.year) >= 1950 && form.mileageKm !== "");

  const label = (list: { value: string; label: string }[], value: string) =>
    list.find((o) => o.value === value)?.label ?? value;

  useEffect(() => {
    if (!knownCar) return;
    if (!allowedFuels.includes(form.fuel as never)) {
      setForm((f) => ({ ...f, fuel: allowedFuels[0]! }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.make, form.model, knownCar]);

  const submit = () => {
    if (!isKnownCar(form.make, form.model)) {
      toast.error(t.unknownCar);
      return;
    }
    saveCar({
      make: normalizeBrand(form.make) ?? form.make.trim(),
      model: form.model.trim(),
      variant: form.variant.trim(),
      year: Number(form.year),
      transmission: label(TRANSMISSIONS, form.transmission),
      fuel: label(FUELS, form.fuel),
      mileageKm: Number(form.mileageKm),
    });
    toast.success(t.carSaved);
    void navigate({ to: "/" });
  };

  const runPlateLookup = async () => {
    if (plate.trim().length < 2) return;
    setPlateLoading(true);
    setPlateNote(null);
    try {
      const found = await findPlate({ data: { plate } });
      if (!found.found) {
        setPlateNote({ ok: false, text: t.plateNotFound });
        return;
      }
      setForm((f) => ({
        ...f,
        make: found.make,
        model: found.model,
        variant: found.variant || f.variant,
        year: found.year ? String(found.year) : f.year,
        fuel: found.fuel || f.fuel,
        transmission: found.transmission || f.transmission,
      }));
      setPlateNote({ ok: true, text: t.plateFound });
    } catch {
      setPlateNote({ ok: false, text: t.plateError });
    } finally {
      setPlateLoading(false);
    }
  };

  return (
    <main className="px-4 pt-8">
      <div className="rise">
        <h1 className="text-2xl">{t.garageTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.garageSub}</p>
      </div>

      {lang === "sv" ? (
        <div
          className="surface rise relative mt-5 overflow-hidden p-5"
          style={{ animationDelay: "40ms" }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-24 size-56 rounded-full bg-primary/20 blur-3xl"
          />
          <div className="relative">
            <p className="stencil">{t.plateSection}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t.plateHint}</p>
          </div>

          <Label htmlFor="plate" className="sr-only">
            {t.plateLabel}
          </Label>
          <div className="plate-frame relative mt-4 flex h-16 items-stretch overflow-hidden">
            <div className="flex w-10 shrink-0 flex-col items-center justify-center gap-1 bg-plate-eu">
              <span
                aria-hidden="true"
                className="text-[9px] leading-none tracking-tighter text-plate-eu-star"
              >
                ★★★
              </span>
              <span
                aria-hidden="true"
                className="text-[8px] leading-none tracking-tighter text-plate-eu-star"
              >
                ★ ★
              </span>
              <span className="text-[11px] font-bold leading-none text-plate-surface">S</span>
            </div>
            <input
              id="plate"
              autoComplete="off"
              inputMode="text"
              maxLength={10}
              placeholder={t.platePlaceholder}
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") void runPlateLookup();
              }}
              className="w-full flex-1 bg-transparent px-3 text-center font-display text-2xl font-bold uppercase tracking-[0.18em] text-plate-ink [text-shadow:none] outline-none placeholder:text-plate-ink/30"
            />
          </div>

          <Button
            type="button"
            className="mt-3 w-full"
            disabled={plateLoading || plate.trim().length < 2}
            onClick={() => void runPlateLookup()}
          >
            {plateLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> {t.plateFetching}
              </>
            ) : (
              <>
                <Search className="size-4" /> {t.plateFetch}
              </>
            )}
          </Button>

          {plateNote ? (
            <p
              className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
                plateNote.ok
                  ? "border-signal-safe/40 bg-signal-safe/10 text-signal-safe"
                  : "border-border bg-muted/30 text-muted-foreground"
              }`}
            >
              {plateNote.text}
            </p>
          ) : null}
        </div>
      ) : null}

      <div
        className="surface rise relative mt-5 overflow-hidden px-4 pb-2 pt-4"
        style={{ animationDelay: "60ms" }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 -top-24 size-56 rounded-full bg-primary/20 blur-3xl"
        />
        <div className="relative flex items-center gap-2">
          <span className="stencil">{t.myCar}</span>
          <span className="ml-auto flex items-center gap-1" aria-hidden="true">
            {[Boolean(brand), knownCar, valid].map((done, i) => (
              <span
                key={i}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  done ? "bg-primary" : "bg-secondary"
                }`}
              />
            ))}
          </span>
        </div>
        <div className="relative mt-0.5 flex items-center gap-2">
          {brand ? <BrandLogo make={brand} size={30} /> : null}
          <p className="truncate text-xl font-bold tracking-tight">
            {form.make.trim() || form.model.trim()
              ? `${form.make} ${form.model}`.trim()
              : t.carSub}
          </p>
        </div>
        <CarSilhouette
          make={form.make}
          model={form.model}
          className="relative mx-auto w-60 drop-shadow-[0_18px_28px_rgba(0,0,0,0.55)]"
        />
      </div>

      <div className="surface rise mt-5 space-y-4 p-5" style={{ animationDelay: "120ms" }}>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative space-y-2">
            <Label htmlFor="make">{t.make}</Label>
            <Input
              id="make"
              autoComplete="off"
              placeholder="Volvo"
              aria-invalid={makeError}
              className={makeError ? "border-destructive focus-visible:ring-destructive" : ""}
              value={form.make}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => window.setTimeout(() => setShowSuggestions(false), 150)}
              onChange={(e) => {
                setForm({ ...form, make: e.target.value });
                setShowSuggestions(true);
              }}
            />
            {showSuggestions && suggestions.length ? (
              <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-card shadow-lg">
                {suggestions.map((brand) => (
                  <li key={brand}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setForm({ ...form, make: brand, model: "", variant: "" });
                        setShowSuggestions(false);
                      }}
                    >
                      <BrandLogo make={brand} size={22} />
                      {brand}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="relative space-y-2">
            <Label htmlFor="model">{t.model}</Label>
            <Input
              id="model"
              autoComplete="off"
              disabled={!brand}
              aria-invalid={modelError}
              className={modelError ? "border-destructive focus-visible:ring-destructive" : ""}
              placeholder={brand ? "V70" : t.pickMakeFirst}
              value={form.model}
              onFocus={() => setShowModelSuggestions(true)}
              onBlur={() => window.setTimeout(() => setShowModelSuggestions(false), 150)}
              onChange={(e) => {
                setForm({ ...form, model: e.target.value, variant: "" });
                setShowModelSuggestions(true);
              }}
            />
            {brand && showModelSuggestions && modelSuggestions.length ? (
              <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-card shadow-lg">
                {modelSuggestions.map((m) => (
                  <li key={m}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-secondary"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setForm({ ...form, model: m, variant: "" });
                        setShowModelSuggestions(false);
                      }}
                    >
                      {m}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="relative col-span-2 space-y-2">
            <Label htmlFor="variant">{t.variant}</Label>
            <Input
              id="variant"
              autoComplete="off"
              disabled={!knownCar}
              placeholder={knownCar ? t.variant : t.variantPickModel}
              value={form.variant}
              onChange={(e) => setForm({ ...form, variant: e.target.value })}
            />
            {knownCar ? <p className="text-xs text-muted-foreground">{t.variantHint}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">{t.year}</Label>
            <Input
              id="year"
              type="number"
              placeholder="2014"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mileage">{t.mileage}</Label>
            <Input
              id="mileage"
              type="number"
              placeholder="184000"
              value={form.mileageKm}
              onChange={(e) => setForm({ ...form, mileageKm: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t.transmission}</Label>
          <div className="flex flex-wrap gap-2">
            {TRANSMISSIONS.map((option) => (
              <Pick
                key={option.value}
                active={form.transmission === option.value || form.transmission === option.label}
                onClick={() => setForm({ ...form, transmission: option.value })}
              >
                {option.label}
              </Pick>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t.fuel}</Label>
          {!knownCar ? (
            <p className="text-xs text-muted-foreground">{t.pickModelFirst}</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {FUELS.filter((o) => allowedFuels.includes(o.value as never)).map((option) => (
                  <Pick
                    key={option.value}
                    active={form.fuel === option.value || form.fuel === option.label}
                    onClick={() => {
                      if (!fuelLocked) setForm({ ...form, fuel: option.value });
                    }}
                  >
                    {option.label}
                  </Pick>
                ))}
              </div>
              {fuelLocked ? (
                <p className="text-xs text-muted-foreground">
                  {t.fuelLocked.replace("{fuel}", label(FUELS, allowedFuels[0]!).toLowerCase())}
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>

      <Button
        size="lg"
        className="mt-5 w-full shadow-[0_18px_36px_-20px] shadow-primary/80 transition-transform active:scale-[0.99]"
        disabled={!valid}
        onClick={submit}
      >
        {t.saveCar}
      </Button>
      {makeError || modelError ? (
        <p className="mt-2 text-center text-xs text-destructive">{t.unknownCar}</p>
      ) : brand ? (
        <p className="mt-2 text-center text-xs text-muted-foreground">{t.modelSuggestHint}</p>
      ) : null}

      {ready && car ? (
        <Button
          variant="ghost"
          className="mt-2 w-full text-muted-foreground"
          onClick={() => {
            saveCar(null);
            setForm({
              make: "",
              model: "",
              variant: "",
              year: "",
              mileageKm: "",
              transmission: "manual",
              fuel: "petrol",
            });
            toast.success(t.carRemoved);
          }}
        >
          {t.removeCar}
        </Button>
      ) : null}
    </main>
  );
}

function Pick({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-[0_10px_22px_-14px] shadow-primary"
          : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
