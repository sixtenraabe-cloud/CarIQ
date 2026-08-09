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

export function LampGlyph({ lamp, className }: { lamp: LampKey; className?: string }) {
  const p = { viewBox: "0 0 32 32", className, "aria-hidden": true as const, fill: "currentColor" };
  switch (lamp) {
    case "engine":
      // Classic check-engine block: cooling fins left, cam cover top, bolt right.
      return (
        <svg {...p}>
          <path d="M11 7h6v3h4v3h4l4 4v3h2v3h-2v2.5a1.5 1.5 0 0 1-1.5 1.5H11v-2H8.5v2h-2v-2H4v2H2V13h2v-2h2.5V9H9V7Z" />
          <path d="M13.5 15h6v2h-6v-2Zm0 4h4v2h-4v-2Z" fill="var(--card)" />
        </svg>
      );
    case "oil":
      // Oil can with spout and a falling drop.
      return (
        <svg {...p}>
          <path d="M6 18.5C6 16 8 14 10.5 14H18c2.8 0 5 2.2 5 5v2H6v-2.5Z" />
          <path d="M17.5 13.6 25 9.4l1 1.7-7.5 4.3-1-1.8ZM10 10h6v2h-6z" />
          <path d="M12 23.4c1 1.5 1.5 2.3 1.5 3a1.5 1.5 0 1 1-3 0c0-.7.5-1.5 1.5-3Zm6 0c1 1.5 1.5 2.3 1.5 3a1.5 1.5 0 1 1-3 0c0-.7.5-1.5 1.5-3Z" />
        </svg>
      );
    case "battery":
      return (
        <svg {...p}>
          <path d="M9 7h3.5v2.5H9V7Zm10.5 0H23v2.5h-3.5V7ZM6.5 10h19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-19a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2Z" />
          <path d="M8.5 16.2h5v1.7h-5v-1.7Zm10 0h5v1.7h-5v-1.7Zm1.7-3.4h1.7v3.4h-1.7v-3.4Z" fill="var(--card)" />
        </svg>
      );
    case "brake":
      return (
        <svg {...p}>
          <path d="M16 7a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm-.9 4v7h1.8v-7h-1.8Zm0 8.4v1.8h1.8v-1.8h-1.8Z" fillRule="evenodd" />
          <path d="M5.2 9.6 6.8 10a13 13 0 0 0 0 12l-1.6.4a14.6 14.6 0 0 1 0-12.8Zm21.6 0a14.6 14.6 0 0 1 0 12.8l-1.6-.4a13 13 0 0 0 0-12l1.6-.4Z" />
        </svg>
      );
    case "coolant":
      return (
        <svg {...p}>
          <path d="M16 5a2.6 2.6 0 0 1 2.6 2.6v9.1a4.6 4.6 0 1 1-5.2 0V7.6A2.6 2.6 0 0 1 16 5Zm-.8 4v9.4a2.9 2.9 0 1 0 1.6 0V9h-1.6Z" />
          <path d="M4 11.5c1.2-1.4 2.4-1.4 3.6 0s2.4 1.4 3.6 0l-1-1.4c-.6.7-1 .7-1.6 0-1.2-1.4-2.4-1.4-3.6 0l-1 1.4Zm0 5c1.2-1.4 2.4-1.4 3.6 0s2.4 1.4 3.6 0l-1-1.4c-.6.7-1 .7-1.6 0-1.2-1.4-2.4-1.4-3.6 0l-1 1.4Zm17 -5c1.2-1.4 2.4-1.4 3.6 0s2.4 1.4 3.6 0l-1-1.4c-.6.7-1 .7-1.6 0-1.2-1.4-2.4-1.4-3.6 0l-1 1.4Zm0 5c1.2-1.4 2.4-1.4 3.6 0s2.4 1.4 3.6 0l-1-1.4c-.6.7-1 .7-1.6 0-1.2-1.4-2.4-1.4-3.6 0l-1 1.4Z" />
        </svg>
      );
    case "abs":
      return (
        <svg {...p}>
          <path d="M16 7a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 1.8a7.2 7.2 0 1 0 0 14.4 7.2 7.2 0 0 0 0-14.4Z" />
          <path d="M5.2 9.6 6.8 10a13 13 0 0 0 0 12l-1.6.4a14.6 14.6 0 0 1 0-12.8Zm21.6 0a14.6 14.6 0 0 1 0 12.8l-1.6-.4a13 13 0 0 0 0-12l1.6-.4Z" />
          <text x="16" y="18.6" textAnchor="middle" fontSize="7.5" fontWeight="700">ABS</text>
        </svg>
      );
    case "tpms":
      return (
        <svg {...p}>
          <path d="M7 22V14c0-3.9 4-7 9-7s9 3.1 9 7v8h-2.2l-.9-2h-2l-.9 2h-6l-.9-2h-2l-.9 2H7Zm7.9-11v6h2.2v-6h-2.2Zm0 7.4V20h2.2v-1.6h-2.2Z" />
          <path d="M4 23h24v2H4z" />
        </svg>
      );
    case "airbag":
      return (
        <svg {...p}>
          <circle cx="22" cy="15" r="6.5" />
          <circle cx="9.5" cy="8" r="3.2" />
          <path d="M6 24v-6.2c0-2 1.5-3.6 3.5-3.6s3.5 1.6 3.5 3.6v1.6l4 2.2-1.2 2.4H6Z" />
        </svg>
      );
    case "esp":
      return (
        <svg {...p}>
          <path d="M6 22c1.6-1.4 3.4-2 5.4-2h9.2c2 0 3.8.6 5.4 2v2H6v-2Z" />
          <path d="M9.5 6.5c3.4 1 4.6 3 3.6 6-.9 2.6-.3 4.2 1.9 5.5l-1 1.6c-3.2-1.8-4.1-4.4-2.8-8 .6-1.7.2-2.7-1.7-3.3l.1-1.8Zm9 0c3.4 1 4.6 3 3.6 6-.9 2.6-.3 4.2 1.9 5.5l-1 1.6c-3.2-1.8-4.1-4.4-2.8-8 .6-1.7.2-2.7-1.7-3.3l.1-1.8Z" />
        </svg>
      );
    case "steering":
      return (
        <svg {...p}>
          <path d="M16 6a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 2a8 8 0 0 0-7.9 6.8c2.2-.7 4.8-1.1 7.9-1.1s5.7.4 7.9 1.1A8 8 0 0 0 16 8Zm-2.4 8c-1.9.2-3.6.5-5.2 1A8 8 0 0 0 14 23.8V19a3 3 0 0 0-.4-3Zm4.8 0a3 3 0 0 0-.4 3v4.8a8 8 0 0 0 5.6-6.8c-1.6-.5-3.3-.8-5.2-1Z" />
        </svg>
      );
    case "glow":
      return (
        <svg {...p}>
          <path d="M11.6 6.6c2.5 2 2.5 4.4 0 6.4-1.4 1.1-1.4 1.9 0 3 2.5 2 2.5 4.4 0 6.4l-1.2-1.6c1.4-1.1 1.4-1.9 0-3-2.5-2-2.5-4.4 0-6.4 1.4-1.1 1.4-1.9 0-3l1.2-1.8Zm10 0c2.5 2 2.5 4.4 0 6.4-1.4 1.1-1.4 1.9 0 3 2.5 2 2.5 4.4 0 6.4l-1.2-1.6c1.4-1.1 1.4-1.9 0-3-2.5-2-2.5-4.4 0-6.4 1.4-1.1 1.4-1.9 0-3l1.2-1.8Z" />
        </svg>
      );
    case "dpf":
      return (
        <svg {...p}>
          <path d="M8 10h13a4 4 0 0 1 0 8h-3l-3 4H8a4 4 0 0 1 0-8h2l-2-4Z" />
          <path d="M23 9c1 1.4 1.5 2.2 1.5 2.9a1.5 1.5 0 1 1-3 0c0-.7.5-1.5 1.5-2.9Zm4 3c1 1.4 1.5 2.2 1.5 2.9a1.5 1.5 0 1 1-3 0c0-.7.5-1.5 1.5-2.9Z" />
        </svg>
      );
    case "adblue":
      return (
        <svg {...p}>
          <path d="M16 5c4.7 6 7 8.7 7 11.6a7 7 0 1 1-14 0C9 13.7 11.3 11 16 5Zm0 3.6c-3.2 4.2-5 6.3-5 8a5 5 0 1 0 10 0c0-1.7-1.8-3.8-5-8Z" />
          <text x="16" y="20" textAnchor="middle" fontSize="7" fontWeight="700">AD</text>
        </svg>
      );
    case "transmission":
      return (
        <svg {...p}>
          <path d="M16 5a11 11 0 1 1 0 22 11 11 0 0 1 0-22Zm0 2a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" />
          <path d="M10 10h1.8v5.1H15V10h2v5.1h3.2V10H22v11h-1.8v-4.1H17V22h-2v-5.1h-3.2V21H10V10Z" />
        </svg>
      );
    case "fuel":
      return (
        <svg {...p}>
          <path d="M6 7h11a2 2 0 0 1 2 2v16H4V9a2 2 0 0 1 2-2Zm2 3v4h7v-4H8Z" />
          <path d="M20 11h2.6l2.4 2.6V21a2 2 0 0 0 2 2v2a4 4 0 0 1-4-4v-6.4l-1-1.1H20V11Z" />
        </svg>
      );
    case "lights":
      return (
        <svg {...p}>
          <path d="M15 8c5 0 9 3.6 9 8s-4 8-9 8V8Z" />
          <path d="M12 10H3v1.8h9V10Zm0 5.1H2v1.8h10v-1.8Zm0 5.1H3V22h9v-1.8Z" />
        </svg>
      );
    case "seatbelt":
      return (
        <svg {...p}>
          <circle cx="14" cy="8" r="3.2" />
          <path d="M9.6 25c0-6.2 2.1-9.8 6.2-12.3l1.6 2.4c-3.1 2-4.6 4.8-4.6 9.9H9.6Zm7.2 0c0-3.9-1-6.4-3-8.2l1.8-2.2c2.7 2.4 4 5.6 4 10.4h-2.8Z" />
          <path d="M22 12h2.6L27 14.6V25h-2v-9.6l-1-1.1H22V12Z" opacity="0" />
        </svg>
      );
    case "ev":
      return (
        <svg {...p}>
          <path d="M5 12h15a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Zm19 3h3v4h-3v-4Z" />
          <path d="M13.6 12.4 9 19h3.4l-1.2 4.6L16 17h-3.4l1-4.6Z" fill="var(--background)" />
        </svg>
      );
  }
}
