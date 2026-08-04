import { useEffect, useState } from "react";
import { brandDomain } from "@/lib/brand-domains";

const TOKEN = import.meta.env.VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY as string | undefined;

/** Round badge with the car brand's official logo, falling back to its initial. */
export function BrandLogo({
  make,
  size = 28,
  className = "",
}: {
  make?: string;
  size?: number;
  className?: string;
}) {
  const domain = make ? brandDomain(make) : null;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [domain]);

  const initial = (make ?? "").trim().charAt(0).toUpperCase();

  return (
    <span
      className={`inline-grid shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-secondary/70 ${className}`}
      style={{ width: size, height: size }}
    >
      {domain && TOKEN && !failed ? (
        <img
          src={`https://img.logo.dev/${domain}?token=${TOKEN}&size=${size * 3}&format=png&retina=true`}
          alt={`${make} logotyp`}
          width={size}
          height={size}
          loading="lazy"
          className="size-full object-contain p-[2px]"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className="font-display font-bold leading-none text-muted-foreground"
          style={{ fontSize: Math.max(10, size * 0.42) }}
          aria-hidden="true"
        >
          {initial || "?"}
        </span>
      )}
    </span>
  );
}
