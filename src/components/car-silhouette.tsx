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

export type Zone = "front" | "rear" | "engine" | "under" | null;

/** per-body tweaks applied to one master 3/4 front-quarter drawing */
const TUNE: Record<Body, { roof: number; rear: number; ride: number; tail: number }> = {
  sedan: { roof: 0, rear: 0, ride: 0, tail: 0 },
  coupe: { roof: 4, rear: 6, ride: 3, tail: -6 },
  wagon: { roof: -4, rear: -10, ride: -1, tail: 10 },
  hatch: { roof: -2, rear: 4, ride: -1, tail: 22 },
  suv: { roof: -16, rear: -14, ride: -9, tail: 4 },
};

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
  const t = TUNE[bodyStyleFor(model)];
  const glow = "oklch(0.82 0.16 82)";

  /* master geometry, front-right 3/4 view */
  const roofY = 64 + t.roof;
  const rearX = 52 + t.tail;
  const rearTopY = 112 + t.rear;
  const ride = t.ride;

  /** near-side + front outline */
  const bodyPath = `
    M ${rearX} ${132 + ride}
    C ${rearX - 6} ${rearTopY + 6} ${rearX - 4} ${rearTopY - 4} ${rearX + 14} ${rearTopY - 10}
    C ${rearX + 34} ${rearTopY - 20} ${rearX + 46} ${rearTopY - 22} ${rearX + 66} ${rearTopY - 24}
    C ${140} ${roofY + 22} ${168} ${roofY + 2} ${206} ${roofY - 2}
    C ${240} ${roofY - 5} ${262} ${roofY + 4} ${286} ${roofY + 20}
    C ${306} ${roofY + 33} ${318} ${roofY + 40} ${336} ${roofY + 43}
    C ${358} ${roofY + 46} ${372} ${roofY + 52} ${380} ${roofY + 64}
    C ${389} ${roofY + 77} ${390} ${112 + ride} ${386} ${126 + ride}
    C ${383} ${137 + ride} ${374} ${150 + ride} ${360} ${154 + ride}
    L ${250} ${158 + ride}
    C ${210} ${159 + ride} ${150} ${152 + ride} ${104} ${146 + ride}
    C ${80} ${143 + ride} ${62} ${140 + ride} ${rearX} ${132 + ride} Z`;

  /** greenhouse */
  const glassPath = `
    M ${rearX + 26} ${rearTopY - 12}
    C ${rearX + 56} ${rearTopY - 22} ${150} ${roofY + 14} ${204} ${roofY + 6}
    C ${238} ${roofY + 3} ${258} ${roofY + 12} ${278} ${roofY + 26}
    C ${250} ${roofY + 30} ${180} ${roofY + 34} ${120} ${roofY + 32}
    C ${92} ${roofY + 31} ${rearX + 34} ${rearTopY - 6} ${rearX + 26} ${rearTopY - 12} Z`;

  const rearWheel = { cx: 118 + t.tail / 2, cy: 138 + ride, rx: 21, ry: 25 };
  const frontWheel = { cx: 300, cy: 150 + ride, rx: 32, ry: 34 };

  return (
    <svg viewBox="0 0 420 210" className={className} role="img" aria-hidden="true">
      <defs>
        <linearGradient id="ciq-body" x1="0.1" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="oklch(0.86 0.004 260)" />
          <stop offset="42%" stopColor="oklch(0.7 0.006 260)" />
          <stop offset="70%" stopColor="oklch(0.52 0.008 262)" />
          <stop offset="100%" stopColor="oklch(0.36 0.008 264)" />
        </linearGradient>
        <linearGradient id="ciq-glass2" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="oklch(0.42 0.012 258)" />
          <stop offset="55%" stopColor="oklch(0.26 0.012 260)" />
          <stop offset="100%" stopColor="oklch(0.18 0.01 262)" />
        </linearGradient>
        <linearGradient id="ciq-rim2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.93 0.003 260)" />
          <stop offset="60%" stopColor="oklch(0.62 0.005 260)" />
          <stop offset="100%" stopColor="oklch(0.38 0.005 260)" />
        </linearGradient>
        <linearGradient id="ciq-lamp" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="oklch(0.98 0.02 250)" />
          <stop offset="100%" stopColor="oklch(0.74 0.02 250)" />
        </linearGradient>
        <radialGradient id="ciq-shadow2" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="oklch(0 0 0)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="oklch(0 0 0)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="215" cy={170 + ride} rx="170" ry="16" fill="url(#ciq-shadow2)" />

      {/* highlight zones */}
      {highlight === "front" || highlight === "engine" ? (
        <rect x="272" y="30" width="140" height="130" rx="26" fill={glow} opacity="0.09" stroke={glow} strokeOpacity="0.32" />
      ) : null}
      {highlight === "rear" ? (
        <rect x="16" y="60" width="130" height="104" rx="24" fill={glow} opacity="0.09" stroke={glow} strokeOpacity="0.32" />
      ) : null}
      {highlight === "under" ? (
        <rect x="60" y={150 + ride} width="310" height="18" rx="9" fill={glow} opacity="0.14" stroke={glow} strokeOpacity="0.32" />
      ) : null}

      {/* far-side wheels */}
      <ellipse cx={rearWheel.cx + 42} cy={rearWheel.cy - 12} rx="14" ry="19" fill="oklch(0.2 0.006 262)" opacity="0.75" />
      <ellipse cx={frontWheel.cx + 40} cy={frontWheel.cy - 20} rx="15" ry="21" fill="oklch(0.2 0.006 262)" opacity="0.75" />

      {/* body */}
      <path d={bodyPath} fill="url(#ciq-body)" stroke="oklch(0.94 0.002 260)" strokeWidth="1.8" strokeLinejoin="round" />

      {/* lower flank shade */}
      <path
        d={`M ${rearX + 12} ${134 + ride} C 120 ${146 + ride} 220 ${154 + ride} ${344} ${152 + ride} L ${348} ${158 + ride} C 230 ${160 + ride} 120 ${152 + ride} ${rearX + 8} ${138 + ride} Z`}
        fill="oklch(0.2 0.008 264)"
        opacity="0.55"
      />

      {/* glass */}
      <path d={glassPath} fill="url(#ciq-glass2)" stroke="oklch(0.9 0.002 260)" strokeOpacity="0.55" strokeWidth="1.2" />
      <path
        d={`M ${rearX + 46} ${roofY + 26} C ${120} ${roofY + 16} ${170} ${roofY + 8} ${212} ${roofY + 8}`}
        fill="none"
        stroke="oklch(1 0 0)"
        strokeOpacity="0.22"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* B-pillar */}
      <path
        d={`M ${168} ${roofY + 10} L ${172} ${roofY + 33}`}
        stroke="oklch(0.9 0.002 260)"
        strokeOpacity="0.45"
        strokeWidth="1.6"
      />

      {/* shoulder crease + character line */}
      <path
        d={`M ${rearX + 10} ${rearTopY - 2} C 130 ${roofY + 44} 220 ${roofY + 50} ${300} ${roofY + 46}`}
        fill="none"
        stroke="oklch(1 0 0)"
        strokeOpacity="0.3"
        strokeWidth="1.6"
      />
      <path
        d={`M ${rearX + 16} ${126 + ride} C 130 ${134 + ride} 210 ${140 + ride} ${288} ${138 + ride}`}
        fill="none"
        stroke="oklch(0.16 0.008 264)"
        strokeOpacity="0.45"
        strokeWidth="2"
      />

      {/* doors */}
      <path d={`M ${170} ${roofY + 33} C ${168} ${112 + ride} ${166} ${126 + ride} ${164} ${140 + ride}`} fill="none" stroke="oklch(0.9 0.002 260)" strokeOpacity="0.35" strokeWidth="1.2" />
      <path d={`M ${rearX + 44} ${roofY + 30} C ${rearX + 44} ${112 + ride} ${rearX + 42} ${124 + ride} ${rearX + 40} ${134 + ride}`} fill="none" stroke="oklch(0.9 0.002 260)" strokeOpacity="0.25" strokeWidth="1.2" />
      <rect x={182} y={roofY + 42} width="16" height="3.4" rx="1.7" fill="oklch(0.9 0.002 260)" opacity="0.8" />
      <rect x={rearX + 54} y={roofY + 40} width="15" height="3.2" rx="1.6" fill="oklch(0.9 0.002 260)" opacity="0.6" />

      {/* mirror */}
      <path d={`M ${282} ${roofY + 30} l 16 -5 6 8 -16 5 z`} fill="oklch(0.46 0.008 262)" stroke="oklch(0.92 0.002 260)" strokeWidth="1" strokeLinejoin="round" />

      {/* bonnet split */}
      <path d={`M ${300} ${roofY + 30} C ${330} ${roofY + 34} ${358} ${roofY + 44} ${378} ${roofY + 62}`} fill="none" stroke="oklch(1 0 0)" strokeOpacity="0.25" strokeWidth="1.4" />

      {/* headlight */}
      <path
        d={`M ${340} ${roofY + 52} C ${358} ${roofY + 54} ${372} ${roofY + 60} ${380} ${roofY + 70} L ${358} ${roofY + 72} C ${352} ${roofY + 62} ${346} ${roofY + 57} ${336} ${roofY + 56} Z`}
        fill="url(#ciq-lamp)"
        opacity="0.9"
      />
      {/* grille + intake */}
      <path
        d={`M ${352} ${118 + ride} C ${368} ${118 + ride} ${380} ${120 + ride} ${384} ${124 + ride} C ${382} ${134 + ride} ${374} ${142 + ride} ${360} ${145 + ride} C ${352} ${136 + ride} ${350} ${126 + ride} ${352} ${118 + ride} Z`}
        fill="oklch(0.22 0.008 264)"
        stroke="oklch(0.88 0.002 260)"
        strokeOpacity="0.55"
        strokeWidth="1.1"
      />
      <path
        d={`M ${330} ${146 + ride} C ${346} ${150 + ride} ${358} ${150 + ride} ${368} ${146 + ride}`}
        fill="none"
        stroke="oklch(0.16 0.008 264)"
        strokeOpacity="0.6"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* tail lamp */}
      <path
        d={`M ${rearX - 2} ${rearTopY + 2} C ${rearX + 10} ${rearTopY - 2} ${rearX + 20} ${rearTopY - 3} ${rearX + 30} ${rearTopY - 4} L ${rearX + 30} ${rearTopY + 3} C ${rearX + 18} ${rearTopY + 5} ${rearX + 8} ${rearTopY + 7} ${rearX - 1} ${rearTopY + 9} Z`}
        fill="oklch(0.6 0.2 25)"
        opacity="0.85"
      />

      {/* wheel arches */}
      <path
        d={`M ${rearWheel.cx - 26} ${rearWheel.cy + 4} C ${rearWheel.cx - 24} ${rearWheel.cy - 30} ${rearWheel.cx + 22} ${rearWheel.cy - 32} ${rearWheel.cx + 26} ${rearWheel.cy - 4}`}
        fill="none"
        stroke="oklch(0.14 0.008 264)"
        strokeOpacity="0.7"
        strokeWidth="3.5"
      />
      <path
        d={`M ${frontWheel.cx - 38} ${frontWheel.cy + 2} C ${frontWheel.cx - 36} ${frontWheel.cy - 42} ${frontWheel.cx + 30} ${frontWheel.cy - 44} ${frontWheel.cx + 36} ${frontWheel.cy - 8}`}
        fill="none"
        stroke="oklch(0.14 0.008 264)"
        strokeOpacity="0.7"
        strokeWidth="3.5"
      />

      {/* zone accents */}
      {highlight === "front" || highlight === "engine" ? (
        <path d={`M ${300} ${roofY + 30} C ${336} ${roofY + 34} ${366} ${roofY + 46} ${384} ${roofY + 68} L ${356} ${roofY + 72} C ${342} ${roofY + 56} ${324} ${roofY + 44} ${296} ${roofY + 40} Z`} fill={glow} opacity="0.3" stroke={glow} strokeWidth="1.6" />
      ) : null}
      {highlight === "rear" ? (
        <path d={`M ${rearX - 2} ${rearTopY + 4} C ${rearX + 4} ${rearTopY - 12} ${rearX + 40} ${rearTopY - 22} ${rearX + 70} ${rearTopY - 26} L ${rearX + 66} ${rearTopY - 12} C ${rearX + 36} ${rearTopY - 6} ${rearX + 14} ${rearTopY + 2} ${rearX + 4} ${rearTopY + 12} Z`} fill={glow} opacity="0.3" stroke={glow} strokeWidth="1.6" />
      ) : null}
      {highlight === "under" ? (
        <path d={`M ${rearX + 20} ${164 + ride} L ${350} ${166 + ride}`} fill="none" stroke={glow} strokeWidth="3" strokeLinecap="round" strokeDasharray="7 7" />
      ) : null}

      {highlight === "engine" ? (
        <g>
          <line x1={330} y1={roofY + 6} x2={344} y2={roofY + 40} stroke={glow} strokeWidth="1.6" strokeDasharray="4 4" />
          <g transform={`translate(${312} ${roofY - 34}) scale(1.7)`}>
            <CheckEngineGlyph color={glow} />
          </g>
        </g>
      ) : null}

      <Wheel {...frontWheel} />
      <Wheel {...rearWheel} />
    </svg>
  );
}

function Wheel({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) {
  const spokes = Array.from({ length: 10 }, (_, i) => (i * 360) / 10);
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="oklch(0.17 0.006 264)" stroke="oklch(0.1 0.005 264)" strokeWidth="1" />
      <ellipse cx={cx} cy={cy} rx={rx * 0.82} ry={ry * 0.82} fill="none" stroke="oklch(0.4 0.005 264)" strokeWidth="1" strokeDasharray="2 2.5" opacity="0.7" />
      <ellipse cx={cx} cy={cy} rx={rx * 0.66} ry={ry * 0.66} fill="url(#ciq-rim2)" stroke="oklch(0.88 0.002 260)" strokeWidth="0.8" />
      <ellipse cx={cx} cy={cy} rx={rx * 0.56} ry={ry * 0.56} fill="oklch(0.22 0.008 264)" />
      {spokes.map((a) => (
        <rect
          key={a}
          x={cx - rx * 0.06}
          y={cy - ry * 0.56}
          width={rx * 0.12}
          height={ry * 0.44}
          rx={rx * 0.06}
          fill="url(#ciq-rim2)"
          transform={`rotate(${a} ${cx} ${cy})`}
        />
      ))}
      <ellipse cx={cx} cy={cy} rx={rx * 0.17} ry={ry * 0.17} fill="oklch(0.76 0.003 260)" />
      <path
        d={`M ${cx - rx * 0.5} ${cy - ry * 0.62} A ${rx} ${ry} 0 0 1 ${cx + rx * 0.42} ${cy - ry * 0.68}`}
        fill="none"
        stroke="oklch(1 0 0)"
        strokeOpacity="0.25"
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
