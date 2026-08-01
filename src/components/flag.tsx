import type { Lang } from "@/lib/i18n";

// Small inline flags — emoji flags don't render on many platforms.
export function Flag({ code, className = "" }: { code: Lang; className?: string }) {
  const common = `inline-block overflow-hidden rounded-[3px] ring-1 ring-border ${className}`;
  if (code === "sv") {
    return (
      <svg viewBox="0 0 16 10" className={common} role="img" aria-hidden="true">
        <rect width="16" height="10" fill="#005293" />
        <rect x="5" width="2" height="10" fill="#FECB00" />
        <rect y="4" width="16" height="2" fill="#FECB00" />
      </svg>
    );
  }
  if (code === "da") {
    return (
      <svg viewBox="0 0 16 10" className={common} role="img" aria-hidden="true">
        <rect width="16" height="10" fill="#C8102E" />
        <rect x="5" width="2" height="10" fill="#fff" />
        <rect y="4" width="16" height="2" fill="#fff" />
      </svg>
    );
  }
  if (code === "de") {
    return (
      <svg viewBox="0 0 16 10" className={common} role="img" aria-hidden="true">
        <rect width="16" height="10" fill="#000" />
        <rect y="3.33" width="16" height="3.34" fill="#DD0000" />
        <rect y="6.67" width="16" height="3.33" fill="#FFCE00" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 10" className={common} role="img" aria-hidden="true">
      <rect width="16" height="10" fill="#fff" />
      {[0, 2, 4, 6, 8].map((y) => (
        <rect key={y} y={y} width="16" height="1" fill="#B22234" />
      ))}
      <rect width="7" height="5" fill="#3C3B6E" />
    </svg>
  );
}
