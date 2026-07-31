import { useEffect, useState } from "react";
import type { CarProfile } from "./diagnosis-types";

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

export function writeCar(car: CarProfile | null) {
  if (typeof window === "undefined") return;
  if (car) window.localStorage.setItem(KEY, JSON.stringify(car));
  else window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("bilhjalpen:car"));
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

  return { car, ready, saveCar: writeCar };
}

export function carLine(car: CarProfile) {
  return `${car.year} · ${car.fuel} · ${car.mileageKm.toLocaleString("sv-SE")} km`;
}