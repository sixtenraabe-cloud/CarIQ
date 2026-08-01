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
  const shape = SHAPES[bodyStyleFor(model)];
  const glow = "oklch(0.8 0.15 80)";

  return (
    <svg viewBox="0 0 264 124" className={className} role="img" aria-hidden="true">
      <defs>
        <linearGradient id="cariq-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.68 0.055 258)" />
          <stop offset="34%" stopColor="oklch(0.5 0.045 262)" />
          <stop offset="52%" stopColor="oklch(0.62 0.05 258)" />
          <stop offset="70%" stopColor="oklch(0.33 0.035 264)" />
          <stop offset="100%" stopColor="oklch(0.24 0.03 264)" />
        </linearGradient>
        <linearGradient id="cariq-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.07 240)" />
          <stop offset="55%" stopColor="oklch(0.5 0.06 252)" />
          <stop offset="100%" stopColor="oklch(0.33 0.05 258)" />
        </linearGradient>
        <linearGradient id="cariq-tyre" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.3 0.015 264)" />
          <stop offset="100%" stopColor="oklch(0.16 0.015 264)" />
        </linearGradient>
        <linearGradient id="cariq-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.9 0.01 258)" />
          <stop offset="50%" stopColor="oklch(0.62 0.015 258)" />
          <stop offset="100%" stopColor="oklch(0.42 0.015 258)" />
        </linearGradient>
        <radialGradient id="cariq-shadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="oklch(0 0 0)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="oklch(0 0 0)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cariq-headlamp" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="oklch(0.98 0.09 95)" />
          <stop offset="100%" stopColor="oklch(0.86 0.16 85)" />
        </linearGradient>
        <clipPath id="cariq-clip-body">
          <path d={shape.body} />
        </clipPath>
      </defs>

      {/* ground shadow */}
      <ellipse cx="132" cy="107" rx="118" ry="9" fill="url(#cariq-shadow)" />

      {/* highlight zones */}
      {highlight === "front" || highlight === "engine" ? (
        <rect x="150" y="24" width="106" height="76" rx="18" fill={glow} opacity="0.10" stroke={glow} strokeOpacity="0.35" />
      ) : null}
      {highlight === "rear" ? (
        <rect x="8" y="24" width="96" height="76" rx="18" fill={glow} opacity="0.10" stroke={glow} strokeOpacity="0.35" />
      ) : null}
      {highlight === "under" ? (
        <rect x="24" y="86" width="216" height="26" rx="13" fill={glow} opacity="0.12" stroke={glow} strokeOpacity="0.35" />
      ) : null}

      <path
        d={shape.body}
        fill="url(#cariq-body)"
        stroke="oklch(0.72 0.02 258)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* body sculpting: shoulder crease, rocker shadow, sill, specular sweep */}
      <g clipPath="url(#cariq-clip-body)">
        <path
          d="M20 66 C70 60 190 58 246 66"
          fill="none"
          stroke="oklch(0.95 0.01 258)"
          strokeOpacity="0.28"
          strokeWidth="1.4"
        />
        <path
          d="M22 76 C74 71 188 70 244 76"
          fill="none"
          stroke="oklch(0.1 0.01 264)"
          strokeOpacity="0.35"
          strokeWidth="2"
        />
        <rect x="0" y="88" width="264" height="10" fill="oklch(0.14 0.02 264)" opacity="0.55" />
        <path
          d="M0 58 L120 30 L150 30 L30 58 Z"
          fill="oklch(1 0 0)"
          opacity="0.07"
        />
        {/* wheel arches */}
        <path d="M50 96 A22 22 0 0 1 94 96" fill="none" stroke="oklch(0.12 0.01 264)" strokeOpacity="0.6" strokeWidth="3" />
        <path d="M176 96 A22 22 0 0 1 220 96" fill="none" stroke="oklch(0.12 0.01 264)" strokeOpacity="0.6" strokeWidth="3" />
      </g>

      <path d={shape.glassRear} fill="url(#cariq-glass)" opacity="0.85" />
      <path d={shape.glassFront} fill="url(#cariq-glass)" opacity="0.85" />
      {/* glass reflections */}
      <g opacity="0.35">
        <path d="M60 60 L78 47 L86 47 L66 60 Z" fill="oklch(0.98 0.01 250)" />
        <path d="M136 58 L150 44 L156 44 L143 58 Z" fill="oklch(0.98 0.01 250)" />
      </g>
      {/* window trim */}
      <path
        d={shape.glassRear}
        fill="none"
        stroke="oklch(0.85 0.015 258)"
        strokeOpacity="0.55"
        strokeWidth="1"
      />
      <path
        d={shape.glassFront}
        fill="none"
        stroke="oklch(0.85 0.015 258)"
        strokeOpacity="0.55"
        strokeWidth="1"
      />
      <line x1="123" y1="38" x2="123" y2="88" stroke="oklch(0.72 0.02 258)" strokeWidth="1.1" opacity="0.55" />
      <rect x="108" y="68" width="12" height="3" rx="1.5" fill="oklch(0.82 0.02 258)" opacity="0.8" />
      <rect x="132" y="68" width="12" height="3" rx="1.5" fill="oklch(0.82 0.02 258)" opacity="0.8" />
      {/* side mirror */}
      <path d="M150 62 l9 -2 3 4 -9 2 z" fill="oklch(0.45 0.03 262)" stroke="oklch(0.78 0.02 258)" strokeWidth="0.8" />

      {/* lights */}
      <g>
        <ellipse cx="241" cy="73" rx="13" ry="9" fill="oklch(0.92 0.12 95)" opacity="0.16" />
        <rect x="234" y="69" width="12" height="8" rx="3.5" fill="url(#cariq-headlamp)" />
        <rect x="230" y="80" width="14" height="2.4" rx="1.2" fill="oklch(0.95 0.09 95)" opacity="0.65" />
      </g>
      <g>
        <ellipse cx="21" cy="73" rx="11" ry="8" fill="oklch(0.62 0.21 25)" opacity="0.18" />
        <rect x="16" y="69" width="11" height="8" rx="3.5" fill="oklch(0.62 0.21 25)" />
        <rect x="18" y="80" width="11" height="2.2" rx="1.1" fill="oklch(0.68 0.2 25)" opacity="0.6" />
      </g>

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
          <line x1="206" y1="34" x2="200" y2="58" stroke={glow} strokeWidth="1.6" strokeDasharray="4 4" />
          <g transform="translate(190 6) scale(1.5)">
            <CheckEngineGlyph color={glow} />
          </g>
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
  const spokes = Array.from({ length: 10 }, (_, i) => (i * 360) / 10);
  return (
    <g>
      <circle cx={cx} cy={cy} r="20" fill="url(#cariq-tyre)" stroke="oklch(0.1 0.01 264)" strokeWidth="1" />
      <circle
        cx={cx}
        cy={cy}
        r="16.5"
        fill="none"
        stroke="oklch(0.42 0.015 264)"
        strokeWidth="1"
        strokeDasharray="2 2.5"
        opacity="0.7"
      />
      <circle cx={cx} cy={cy} r="13" fill="url(#cariq-rim)" stroke="oklch(0.85 0.01 258)" strokeWidth="0.8" />
      <circle cx={cx} cy={cy} r="11" fill="oklch(0.24 0.02 264)" />
      {spokes.map((a) => (
        <rect
          key={a}
          x={cx - 1.3}
          y={cy - 11}
          width="2.6"
          height="8.5"
          rx="1.3"
          fill="url(#cariq-rim)"
          transform={`rotate(${a} ${cx} ${cy})`}
        />
      ))}
      <circle cx={cx} cy={cy} r="3.6" fill="oklch(0.72 0.02 258)" stroke="oklch(0.9 0.01 258)" strokeWidth="0.6" />
      <circle cx={cx} cy={cy} r="1.4" fill="oklch(0.58 0.19 260)" />
      <path
        d={`M${cx - 8} ${cy - 12} A 14 14 0 0 1 ${cx + 6} ${cy - 13}`}
        fill="none"
        stroke="oklch(1 0 0)"
        strokeOpacity="0.3"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </g>
  );
}

/** Classic dashboard "check engine" symbol, drawn as one filled outline. */
export function CheckEngineGlyph({ color = "oklch(0.85 0.17 85)" }: { color?: string }) {
  return (
    <path
      transform="scale(0.95)"
      fill={color}
      d="M6.2 4.6h6.4c.5 0 .9.4.9.9s-.4.9-.9.9h-1.9v1.1h2.6c1 0 1.8.8 1.9 1.8l.1.9h1.4V9.5c0-.5.4-.9.9-.9h1.1c.5 0 .9.4.9.9v5.2c0 .5-.4.9-.9.9h-1.1c-.5 0-.9-.4-.9-.9v-.7h-1.4l-.1.9c-.1 1-.9 1.8-1.9 1.8H7.8c-.6 0-1.1-.3-1.5-.7l-1-1.2H3.6v1.1c0 .5-.4.9-.9.9s-.9-.4-.9-.9V8.2c0-.5.4-.9.9-.9s.9.4.9.9v1.1h1.5V8.2c0-1 .8-1.8 1.8-1.8h1.6V5.3H6.2c-.5 0-.9-.4-.9-.9s.4-.9.9-.9z"
    />
  );
}
