import { useEffect, useRef, useState } from "react";
import splashAsset from "@/assets/splash.mp4.asset.json";
import posterAsset from "@/assets/splash-poster.jpg.asset.json";

/**
 * Full-screen video splash shown while the app loads.
 * Plays once per session, then fades out. Falls back to the poster
 * image if the video can't autoplay or fails to load.
 */
export function SplashScreen() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    return !window.sessionStorage.getItem("cariq_splash_seen");
  });
  const [fading, setFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!visible) return;
    const v = videoRef.current;
    if (v) {
      // Explicit play() — some browsers block even muted autoplay until nudged
      v.play().catch(() => {
        // Video blocked: show poster briefly, then move on
        window.setTimeout(() => setFading(true), 2500);
      });
    }
    // Hard cap: never trap the user on the splash
    const cap = window.setTimeout(() => setFading(true), 6500);
    return () => window.clearTimeout(cap);
  }, [visible]);

  useEffect(() => {
    if (!fading) return;
    const t = window.setTimeout(() => {
      window.sessionStorage.setItem("cariq_splash_seen", "1");
      setVisible(false);
    }, 500);
    return () => window.clearTimeout(t);
  }, [fading]);

  if (!visible) return null;

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
