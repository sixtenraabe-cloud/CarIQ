import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCar } from "@/lib/car-store";

export const Route = createFileRoute("/garage")({
  head: () => ({
    meta: [
      { title: "Mitt garage — BilHjälpen AI" },
      {
        name: "description",
        content: "Spara märke, modell, årsmodell och miltal så blir AI-bedömningen mer träffsäker.",
      },
      { property: "og:title", content: "Mitt garage — BilHjälpen AI" },
      { property: "og:description", content: "Lägg till din bil för bättre diagnoser." },
    ],
  }),
  component: Garage,
});

const TRANSMISSIONS = ["Manuell", "Automat", "DSG", "CVT"];
const FUELS = ["Bensin", "Diesel", "Hybrid", "El"];

function Garage() {
  const { car, ready, saveCar } = useCar();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: "",
    mileageKm: "",
    transmission: "Manuell",
    fuel: "Bensin",
  });

  useEffect(() => {
    if (car) {
      setForm({
        make: car.make,
        model: car.model,
        year: String(car.year),
        mileageKm: String(car.mileageKm),
        transmission: car.transmission,
        fuel: car.fuel,
      });
    }
  }, [car]);

  const valid =
    form.make.trim() && form.model.trim() && Number(form.year) >= 1950 && form.mileageKm !== "";

  const submit = () => {
    saveCar({
      make: form.make.trim(),
      model: form.model.trim(),
      year: Number(form.year),
      transmission: form.transmission,
      fuel: form.fuel,
      mileageKm: Number(form.mileageKm),
    });
    toast.success("Bilen är sparad.");
    void navigate({ to: "/" });
  };

  return (
    <main className="px-4 pt-8">
      <h1 className="text-2xl">Lägg till bil</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Uppgifterna sparas bara i den här telefonen.
      </p>

      <div className="panel mt-6 space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="make">Märke</Label>
            <Input
              id="make"
              placeholder="Volvo"
              value={form.make}
              onChange={(e) => setForm({ ...form, make: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Modell</Label>
            <Input
              id="model"
              placeholder="V70"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Årsmodell</Label>
            <Input
              id="year"
              type="number"
              placeholder="2014"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mileage">Mätarställning (km)</Label>
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
          <Label>Växellåda</Label>
          <div className="flex flex-wrap gap-2">
            {TRANSMISSIONS.map((option) => (
              <Pick
                key={option}
                active={form.transmission === option}
                onClick={() => setForm({ ...form, transmission: option })}
              >
                {option}
              </Pick>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Drivmedel</Label>
          <div className="flex flex-wrap gap-2">
            {FUELS.map((option) => (
              <Pick
                key={option}
                active={form.fuel === option}
                onClick={() => setForm({ ...form, fuel: option })}
              >
                {option}
              </Pick>
            ))}
          </div>
        </div>
      </div>

      <Button size="lg" className="mt-5 w-full" disabled={!valid} onClick={submit}>
        Spara bilen
      </Button>

      {ready && car ? (
        <Button
          variant="ghost"
          className="mt-2 w-full text-muted-foreground"
          onClick={() => {
            saveCar(null);
            toast.success("Bilen är borttagen.");
          }}
        >
          Ta bort sparad bil
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