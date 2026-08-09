export type LampKey =
  | "engine"
  | "oil"
  | "battery"
  | "brake"
  | "coolant"
  | "abs"
  | "tpms"
  | "airbag"
  | "esp"
  | "steering"
  | "glow"
  | "dpf"
  | "adblue"
  | "transmission"
  | "fuel"
  | "lights"
  | "seatbelt"
  | "ev";

export const COMMON_LAMPS: LampKey[] = [
  "engine",
  "oil",
  "battery",
  "brake",
  "coolant",
  "abs",
  "tpms",
  "airbag",
];

export const MORE_LAMPS: LampKey[] = [
  "esp",
  "steering",
  "glow",
  "dpf",
  "adblue",
  "transmission",
  "fuel",
  "lights",
  "seatbelt",
  "ev",
];

/** Lamps that only exist on combustion cars. */
export const COMBUSTION_ONLY: LampKey[] = ["oil", "coolant", "glow", "dpf", "adblue", "fuel", "engine"];

/** Red-level lamps (stop the car) vs amber (caution). */
export const RED_LAMPS: LampKey[] = ["oil", "brake", "coolant", "battery", "airbag", "steering", "ev"];

const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function LampGlyph({ lamp, className }: { lamp: LampKey; className?: string }) {
  const common = { viewBox: "0 0 32 32", className, "aria-hidden": true as const };
  switch (lamp) {
    case "engine":
      return (
        <svg {...common}>
          <path {...s} d="M5 20v-6h3v-3h5V9h6v2h3l3 3h2v3h-2v3h-3l-2 3H9l-2-3H5Z" />
        </svg>
      );
    case "oil":
      return (
        <svg {...common}>
          <path {...s} d="M6 19c0-3 3-5 7-5h4l4-4v4c3 0 5 2 5 5H6Z" />
          <path {...s} d="M13 22l-2 3M18 22l-2 3" />
        </svg>
      );
    case "battery":
      return (
        <svg {...common}>
          <rect {...s} x="5" y="10" width="22" height="13" rx="2" />
          <path {...s} d="M9 8v2M23 8v2M10 16h5M12.5 13.5v5M18 16h4" />
        </svg>
      );
    case "brake":
      return (
        <svg {...common}>
          <circle {...s} cx="16" cy="16" r="7" />
          <path {...s} d="M4 11c1.5 3 1.5 7 0 10M28 11c-1.5 3-1.5 7 0 10M13 13v6M16 13v6M19 13v6" />
        </svg>
      );
    case "coolant":
      return (
        <svg {...common}>
          <path {...s} d="M16 8v12" />
          <circle {...s} cx="16" cy="22" r="3" />
          <path {...s} d="M5 12h5M5 17h5M22 12h5M22 17h5M8 10l2 2-2 2M24 10l-2 2 2 2" />
        </svg>
      );
    case "abs":
      return (
        <svg {...common}>
          <circle {...s} cx="16" cy="16" r="9" />
          <path {...s} d="M4 11c1.5 3 1.5 7 0 10M28 11c-1.5 3-1.5 7 0 10" />
          <text x="16" y="19" textAnchor="middle" fontSize="8" fill="currentColor" stroke="none">ABS</text>
        </svg>
      );
    case "tpms":
      return (
        <svg {...common}>
          <path {...s} d="M7 21V13c0-2 2-4 4-4h10c2 0 4 2 4 4v8" />
          <path {...s} d="M5 21h22M13 15v3M16 14v4M19 15v3" />
        </svg>
      );
    case "airbag":
      return (
        <svg {...common}>
          <circle {...s} cx="21" cy="12" r="5" />
          <path {...s} d="M11 8a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM8 24v-4c0-2 2-3 4-3M6 24h12" />
        </svg>
      );
    case "esp":
      return (
        <svg {...common}>
          <path {...s} d="M9 22c-3-4 1-6 4-8s4-5 1-7" />
          <path {...s} d="M13 21h10M15 24h6" />
        </svg>
      );
    case "steering":
      return (
        <svg {...common}>
          <circle {...s} cx="16" cy="16" r="8" />
          <circle {...s} cx="16" cy="16" r="3" />
          <path {...s} d="M8.5 15h4.5M19 15h4.5M16 19v5" />
        </svg>
      );
    case "glow":
      return (
        <svg {...common}>
          <path {...s} d="M11 9c2 2 2 4 0 6s-2 4 0 6M19 9c2 2 2 4 0 6s-2 4 0 6" />
        </svg>
      );
    case "dpf":
      return (
        <svg {...common}>
          <rect {...s} x="7" y="11" width="18" height="10" rx="3" />
          <path {...s} d="M11 14v4M16 14v4M21 14v4" />
        </svg>
      );
    case "adblue":
      return (
        <svg {...common}>
          <path {...s} d="M16 7c4 5 6 7 6 10a6 6 0 0 1-12 0c0-3 2-5 6-10Z" />
        </svg>
      );
    case "transmission":
      return (
        <svg {...common}>
          <path {...s} d="M10 9v14M22 9v14M10 9h12M10 16h12M16 9v14" />
        </svg>
      );
    case "fuel":
      return (
        <svg {...common}>
          <rect {...s} x="8" y="8" width="11" height="16" rx="2" />
          <path {...s} d="M19 13h3v7a2 2 0 0 0 2 2M11 12h5" />
        </svg>
      );
    case "lights":
      return (
        <svg {...common}>
          <path {...s} d="M16 9c5 0 8 3 8 7s-3 7-8 7Z" />
          <path {...s} d="M12 11H5M12 16H4M12 21H5" />
        </svg>
      );
    case "seatbelt":
      return (
        <svg {...common}>
          <circle {...s} cx="16" cy="9" r="3" />
          <path {...s} d="M11 24c0-6 2-9 5-11M21 24c0-6-2-9-5-11" />
        </svg>
      );
    case "ev":
      return (
        <svg {...common}>
          <rect {...s} x="6" y="11" width="17" height="11" rx="2" />
          <path {...s} d="M23 15h3v4h-3M14 13l-3 5h4l-2 4" />
        </svg>
      );
  }
}
