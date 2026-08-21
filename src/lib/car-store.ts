import { useEffect, useState } from "react";
import type { CarProfile } from "./diagnosis-types";
import { supabase } from "@/integrations/supabase/client";

const KEY = "bilhjalpen.car";

export function readCar(): CarProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CarProfile) : null;
  } catch {
    return null;
  }
}

function writeLocal(car: CarProfile | null) {
  if (typeof window === "undefined") return;
  if (car) window.localStorage.setItem(KEY, JSON.stringify(car));
  else window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("bilhjalpen:car"));
}

type CarRow = {
  make: string;
  model: string;
  variant: string | null;
  year: number;
  transmission: string;
  fuel: string;
  mileage_km: number;
  last_inspection: string | null;
  oil_change_date: string | null;
  oil_change_km: number | null;
};

function rowToCar(row: CarRow): CarProfile {
  return {
    make: row.make,
    model: row.model,
    variant: row.variant ?? undefined,
    year: row.year,
    transmission: row.transmission,
    fuel: row.fuel,
    mileageKm: row.mileage_km,
    lastInspection: row.last_inspection ?? undefined,
    oilChangeDate: row.oil_change_date ?? undefined,
    oilChangeKm: row.oil_change_km ?? undefined,
  };
}

/** Persists the car to the signed-in user's account (no-op when signed out). */
async function syncRemote(car: CarProfile | null) {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return;

  if (!car) {
    await supabase.from("cars").delete().eq("user_id", userId);
    return;
  }

  await supabase.from("cars").upsert(
    {
      user_id: userId,
      make: car.make,
      model: car.model,
      variant: car.variant ?? null,
      year: car.year,
      transmission: car.transmission,
      fuel: car.fuel,
      mileage_km: car.mileageKm,
      last_inspection: car.lastInspection ?? null,
      oil_change_date: car.oilChangeDate ?? null,
      oil_change_km: car.oilChangeKm ?? null,
    },
    { onConflict: "user_id" },
  );
}

export function writeCar(car: CarProfile | null) {
  writeLocal(car);
  void syncRemote(car).catch((error) => console.error("car sync failed", error));
}

/** Loads the account's saved car, falling back to pushing a local-only car up. */
async function loadRemote(): Promise<CarProfile | null | undefined> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return undefined;
  const { data, error } = await supabase
    .from("cars")
    .select(
      "make, model, variant, year, transmission, fuel, mileage_km, last_inspection, oil_change_date, oil_change_km",
    )
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (error) {
    console.error("car load failed", error);
    return undefined;
  }
  return data ? rowToCar(data as CarRow) : null;
}

export function useCar() {
  const [car, setCar] = useState<CarProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setCar(readCar());
    sync();
    setReady(true);
    window.addEventListener("bilhjalpen:car", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("bilhjalpen:car", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const remote = await loadRemote();
      if (cancelled || remote === undefined) return;
      if (remote) {
        writeLocal(remote);
      } else {
        const local = readCar();
        if (local) await syncRemote(local);
      }
    };
    void hydrate();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") void hydrate();
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { car, ready, saveCar: writeCar };
}

export function carLine(car: CarProfile) {
  return `${car.year} · ${car.fuel} · ${car.mileageKm.toLocaleString("sv-SE")} km`;
}
