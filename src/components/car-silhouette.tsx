import { baseModelFor } from "@/lib/base-models";

type Body = "suv" | "wagon" | "hatch" | "sedan" | "coupe";

const SUV = /\b(xc\d0|q[3-8]|x[1-7]|suv|tucson|sportage|rav4|kuga|tiguan|touareg|cx-?\d0?|captur|kodiaq|karoq|duster|santa fe|sorento|evoque|discovery|defender|gl[aebcs]|macan|cayenne|model y|id\.?4|eqb|eqc|jimny|forester|outback|cherokee|atto|niva|ds 7)\b/i;
const WAGON = /\b(v[567]0|kombi|estate|touring|avant|variant|sw|combi|passat|superb|octavia|breakt?)\b/i;
const HATCH = /\b(golf|polo|fabia|corsa|clio|yaris|fiesta|ibiza|leon|ceed|up|c[34]|308|208|zoe|leaf|i20|i30|micra|swift|a[13]|1-?series|118|mini|cooper|500|sandero|mg4|focus|astra|civic|corolla|impreza|mazda 3|fortwo)\b/i;
const COUPE = /\b(e9[026]|coupe|coupé|911|continental|db11|488|huracán|huracan|ghost|m[2346]\b)\b/i;

export function bodyStyleFor(model: string): Body {
  if (COUPE.test(model)) return "coupe";
  if (SUV.test(model)) return "suv";
  if (WAGON.test(model)) return "wagon";
  if (HATCH.test(model)) return "hatch";
  return "sedan";
}

type Shape = { body: string; glassRear: string; glassFront: string; wheelY: number };

const SHAPES: Record<Body, Shape> = {
  sedan: {
    body: "M16 86 C16 71 23 65 37 62 L76 43 C84 39 92 37 102 37 L150 37 C165 37 176 41 185 50 L204 63 L229 69 C241 71 247 75 247 83 L247 90 C247 94 244 96 240 96 L23 96 C19 96 16 92 16 86 Z",
    glassRear: "M52 61 L84 45 C90 42 96 41 102 41 L120 41 L120 61 Z",
    glassFront: "M127 41 L148 41 C159 41 168 45 175 53 L182 61 L127 61 Z",
    wheelY: 92,
  },
  coupe: {
    body: "M18 86 C18 72 25 66 39 63 L80 42 C89 38 97 36 108 36 L142 36 C158 36 170 41 180 51 L202 64 L228 70 C240 72 246 76 246 84 L246 90 C246 94 243 96 239 96 L25 96 C21 96 18 92 18 86 Z",
    glassRear: "M56 62 L88 44 C94 41 101 40 108 40 L122 40 L122 62 Z",
    glassFront: "M129 40 L141 40 C153 40 163 45 170 54 L177 62 L129 62 Z",
    wheelY: 92,
  },
  wagon: {
    body: "M16 86 C16 71 23 65 37 62 L74 41 C82 37 90 35 100 35 L162 35 C176 35 186 40 194 50 L209 63 L230 69 C242 71 247 75 247 83 L247 90 C247 94 244 96 240 96 L23 96 C19 96 16 92 16 86 Z",
    glassRear: "M50 61 L82 43 C88 40 94 39 100 39 L120 39 L120 61 Z",
    glassFront: "M127 39 L160 39 C170 39 178 43 184 52 L190 61 L127 61 Z",
    wheelY: 92,
  },
  hatch: {
    body: "M22 86 C22 71 29 65 43 62 L78 43 C86 39 94 37 104 37 L142 37 C156 37 166 41 174 50 L192 63 L218 69 C230 71 236 75 236 83 L236 90 C236 94 233 96 229 96 L29 96 C25 96 22 92 22 86 Z",
    glassRear: "M56 61 L86 45 C92 42 98 41 104 41 L120 41 L120 61 Z",
    glassFront: "M127 41 L141 41 C152 41 160 45 166 53 L172 61 L127 61 Z",
    wheelY: 92,
  },
  suv: {
    body: "M16 82 C16 66 23 59 37 56 L72 34 C80 30 88 28 98 28 L158 28 C173 28 184 33 192 44 L208 58 L230 64 C242 66 248 70 248 79 L248 90 C248 94 245 96 241 96 L23 96 C19 96 16 92 16 82 Z",
    glassRear: "M50 56 L80 36 C86 33 92 32 98 32 L120 32 L120 56 Z",
    glassFront: "M127 32 L156 32 C166 32 174 36 180 46 L187 56 L127 56 Z",
    wheelY: 90,
  },
};

export type Zone = "front" | "rear" | "engine" | "under" | null;

export function CarSilhouette({
  make = "",
  model = "",
  className = "",
  highlight = null,
}: {
  make?: string;
  model?: string;
  className?: string;
  highlight?: Zone;
}) {
  const hint = model || baseModelFor(make);
  const shape = SHAPES[bodyStyleFor(hint)];
  const glow = "oklch(0.8 0.15 80)";

  return (
    <svg viewBox="0 0 264 124" className={className} role="img" aria-hidden="true">
      <defs>
        <linearGradient id="cariq-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.5 0.03 264)" />
          <stop offset="100%" stopColor="oklch(0.3 0.03 264)" />
        </linearGradient>
        <linearGradient id="cariq-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.7 0.06 250)" />
          <stop offset="100%" stopColor="oklch(0.45 0.05 255)" />
        </linearGradient>
      </defs>

      {/* highlight zones */}
      {highlight === "front" || highlight === "engine" ? (
        <rect x="150" y="24" width="106" height="76" rx="18" fill={glow} opacity="0.16" />
      ) : null}
      {highlight === "rear" ? (
        <rect x="8" y="24" width="96" height="76" rx="18" fill={glow} opacity="0.16" />
      ) : null}
      {highlight === "under" ? (
        <rect x="24" y="86" width="216" height="26" rx="13" fill={glow} opacity="0.18" />
      ) : null}

      <path
        d={shape.body}
        fill="url(#cariq-body)"
        stroke="oklch(0.72 0.02 258)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d={shape.glassRear} fill="url(#cariq-glass)" opacity="0.85" />
      <path d={shape.glassFront} fill="url(#cariq-glass)" opacity="0.85" />
      <line x1="123" y1="38" x2="123" y2="88" stroke="oklch(0.72 0.02 258)" strokeWidth="1.1" opacity="0.55" />
      <rect x="108" y="68" width="12" height="3" rx="1.5" fill="oklch(0.82 0.02 258)" opacity="0.8" />

      {/* lights */}
      <rect x="236" y="70" width="10" height="7" rx="3" fill="oklch(0.92 0.12 95)" opacity="0.9" />
      <rect x="17" y="70" width="9" height="7" rx="3" fill="oklch(0.62 0.21 25)" opacity="0.9" />

      {/* hood highlight edge */}
      {highlight === "front" || highlight === "engine" ? (
        <path
          d="M186 51 L206 64 L232 70"
          fill="none"
          stroke={glow}
          strokeWidth="3"
          strokeLinecap="round"
        />
      ) : null}
      {highlight === "rear" ? (
        <path d="M18 68 L38 62 L58 56" fill="none" stroke={glow} strokeWidth="3" strokeLinecap="round" />
      ) : null}
      {highlight === "under" ? (
        <path d="M40 98 L226 98" fill="none" stroke={glow} strokeWidth="3" strokeLinecap="round" strokeDasharray="6 6" />
      ) : null}

      {/* engine lamp with a line to the hood */}
      {highlight === "engine" ? (
        <g>
          <line x1="206" y1="30" x2="200" y2="58" stroke={glow} strokeWidth="1.6" strokeDasharray="4 4" />
          <circle cx="208" cy="22" r="13" fill={glow} opacity="0.18" />
          <circle cx="208" cy="22" r="13" fill="none" stroke={glow} strokeWidth="1.6" />
          <path
            d="M201 22 h3 v-3 h3 v-2 h5 a4 4 0 0 1 4 4 v3 a4 4 0 0 1 -4 4 h-8 a3 3 0 0 1 -3 -3 z"
            fill={glow}
          />
        </g>
      ) : null}

      {/* wheels */}
      <Wheel cx={72} cy={shape.wheelY} />
      <Wheel cx={198} cy={shape.wheelY} />
      <line x1="10" y1="112" x2="254" y2="112" stroke="oklch(0.29 0.028 264)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Wheel({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="20" fill="oklch(0.2 0.02 264)" stroke="oklch(0.72 0.02 258)" strokeWidth="1.6" />
      <circle cx={cx} cy={cy} r="10" fill="oklch(0.4 0.02 264)" />
      <circle cx={cx} cy={cy} r="3.5" fill="oklch(0.8 0.02 258)" />
    </g>
  );
}
