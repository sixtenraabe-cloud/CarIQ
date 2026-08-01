import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCar } from "@/lib/car-store";
import { useI18n } from "@/lib/i18n";
import { suggestBrands } from "@/lib/car-brands";
import { fuelsFor, isKnownCar, normalizeBrand, suggestModels, suggestVariants } from "@/lib/car-models";
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
      { property: "og:description", content: "Lägg till din bil för bättre diagnoser." },
    ],
  }),
  component: Garage,
});

function Garage() {
  const { car, ready, saveCar } = useCar();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);
  const [showVariantSuggestions, setShowVariantSuggestions] = useState(false);
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
  const variantSuggestions = suggestVariants(form.make, form.model, form.variant).filter(
    (v) => v !== form.variant,
  );
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

  return (
    <main className="px-4 pt-8">
      <h1 className="text-2xl">{t.garageTitle}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.garageSub}</p>

      {form.make.trim() || form.model.trim() ? (
        <div className="panel mt-5 flex flex-col items-center p-4">
          <CarSilhouette make={form.make} model={form.model} className="w-64" />
          <p className="stencil mt-1">
            {form.make} {form.model}
          </p>
        </div>
      ) : null}

      <div className="panel mt-5 space-y-4 p-5">
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
                      className="w-full px-3 py-2 text-left text-sm hover:bg-secondary"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setForm({ ...form, make: brand, model: "", variant: "" });
                        setShowSuggestions(false);
                      }}
                    >
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
              placeholder={knownCar ? "G80 / 335i / 991.2" : t.variantPickModel}
              value={form.variant}
              onFocus={() => setShowVariantSuggestions(true)}
              onBlur={() => window.setTimeout(() => setShowVariantSuggestions(false), 150)}
              onChange={(e) => {
                setForm({ ...form, variant: e.target.value });
                setShowVariantSuggestions(true);
              }}
            />
            {knownCar && showVariantSuggestions && variantSuggestions.length ? (
              <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-card shadow-lg">
                {variantSuggestions.map((v) => (
                  <li key={v}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-secondary"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setForm({ ...form, variant: v });
                        setShowVariantSuggestions(false);
                      }}
                    >
                      {v}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
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

      <Button size="lg" className="mt-5 w-full" disabled={!valid} onClick={submit}>
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
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}
