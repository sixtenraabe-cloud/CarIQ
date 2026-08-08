import { useEffect, useState } from "react";

/** Fullscreen brand splash shown briefly on app load. */
export function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem("cariq-splash") === "1") {
      setDone(true);
      return;
    }
    window.sessionStorage.setItem("cariq-splash", "1");
    setMounted(true);
    const t1 = window.setTimeout(() => setLeaving(true), 1600);
    const t2 = window.setTimeout(() => setDone(true), 2200);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  if (done || !mounted) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
      style={{ background: "oklch(0.08 0.012 264)" }}
    >
      <div className="rise flex flex-col items-center">
        <svg
          viewBox="0 0 460 120"
          className="w-64 text-foreground"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        >
          <path d="M8 104c30 8 70 6 116-8 60-18 96-52 150-70 44-15 96-16 152 6-38 2-64 8-92 20" />
          <path d="M150 78c40-16 84-30 128-34" strokeWidth="4" />
          <circle cx="196" cy="70" r="5" strokeWidth="4" />
        </svg>
        <div className="-mt-3 font-display text-6xl font-bold tracking-tight">
          <span className="text-foreground">Car</span>
          <span className="text-primary">IQ</span>
        </div>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Smarter diagnostics. Better drives.
        </p>
      </div>
      <span className="absolute bottom-[22%] size-9 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
    </div>
  );
}