import { useEffect, useRef, useState } from "react";
import splashAsset from "@/assets/splash.mp4.asset.json";
import posterAsset from "@/assets/splash-poster.jpg.asset.json";

/**
 * Full-screen video splash shown while the app loads.
 * Plays once per session, then fades out. Falls back to the poster
 * image if the video can't autoplay or fails to load.
 *
 * Server-safe: renders nothing during SSR to avoid hydration mismatches.
 * Maximum visible time is capped at 2.5 seconds.
 */
const SPLASH_SEEN_KEY = "cariq_splash_seen";
const MAX_SPLASH_MS = 2000; // 2 s visible video + 0.5 s fade = 2.5 s total

export function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
    if (!window.sessionStorage.getItem(SPLASH_SEEN_KEY)) {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const v = videoRef.current;
    if (v) {
      // Explicit play() — some browsers block even muted autoplay until nudged
      v.play().catch(() => undefined);
    }
    // Hard cap: never trap the user on the splash
    const cap = window.setTimeout(() => setFading(true), MAX_SPLASH_MS);
    return () => window.clearTimeout(cap);
  }, [visible]);

  useEffect(() => {
    if (!fading) return;
    const t = window.setTimeout(() => {
      window.sessionStorage.setItem(SPLASH_SEEN_KEY, "1");
      setVisible(false);
    }, 500);
    return () => window.clearTimeout(t);
  }, [fading]);

  if (!mounted || !visible) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#0F172A] transition-opacity duration-500 ${
        fading ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <video
        ref={videoRef}
        src={splashAsset.url}
        poster={posterAsset.url}
        className="h-full w-full object-cover"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={() => setFading(true)}
        onError={() => setFading(true)}
        onStalled={() => setFading(true)}
      />
    </div>
  );
}
