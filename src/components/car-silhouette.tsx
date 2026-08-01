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

type P = [number, number];

type Shape = {
  /** near-side profile, front pointing right */
  rearBottom: P;
  rearTop: P;
  trunkTop: P;
  beltRear: P;
  roofRear: P;
  roofFront: P;
  beltFront: P;
  hood: P;
  noseTop: P;
  noseBottom: P;
  wheels: [number, number];
};

const SHAPES: Record<Body, Shape> = {
  sedan: {
    rearBottom: [20, 106],
    rearTop: [20, 82],
    trunkTop: [28, 70],
    beltRear: [64, 66],
    roofRear: [92, 42],
    roofFront: [146, 40],
    beltFront: [172, 64],
    hood: [206, 62],
    noseTop: [216, 70],
    noseBottom: [216, 106],
    wheels: [74, 190],
  },
  coupe: {
    rearBottom: [22, 106],
    rearTop: [22, 84],
    trunkTop: [32, 74],
    beltRear: [70, 70],
    roofRear: [102, 46],
    roofFront: [140, 44],
    beltFront: [176, 68],
    hood: [208, 66],
    noseTop: [217, 74],
    noseBottom: [217, 106],
    wheels: [76, 192],
  },
  wagon: {
    rearBottom: [18, 106],
    rearTop: [18, 78],
    trunkTop: [22, 62],
    beltRear: [58, 60],
    roofRear: [84, 38],
    roofFront: [162, 36],
    beltFront: [180, 62],
    hood: [206, 60],
    noseTop: [216, 68],
    noseBottom: [216, 106],
    wheels: [72, 190],
  },
  hatch: {
    rearBottom: [34, 106],
    rearTop: [34, 82],
    trunkTop: [40, 68],
    beltRear: [70, 64],
    roofRear: [94, 42],
    roofFront: [144, 40],
    beltFront: [168, 64],
    hood: [198, 62],
    noseTop: [208, 70],
    noseBottom: [208, 106],
    wheels: [82, 184],
  },
  suv: {
    rearBottom: [18, 106],
    rearTop: [18, 76],
    trunkTop: [22, 56],
    beltRear: [56, 54],
    roofRear: [80, 30],
    roofFront: [158, 28],
    beltFront: [178, 54],
    hood: [204, 52],
    noseTop: [216, 60],
    noseBottom: [216, 106],
    wheels: [72, 190],
  },
};

/** depth vector: how far the far side of the car sits toward the vanishing point */
const DX = 34;
const DY = -16;
const off = ([x, y]: P): P => [x + DX, y + DY];
const poly = (pts: P[]) => pts.map(([x, y]) => `${x},${y}`).join(" ");

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
  const s = SHAPES[bodyStyleFor(model)];
  const glow = "oklch(0.8 0.15 80)";

  const nearChain: P[] = [
    s.rearBottom,
    s.rearTop,
    s.trunkTop,
    s.beltRear,
    s.roofRear,
    s.roofFront,
    s.beltFront,
    s.hood,
    s.noseTop,
    s.noseBottom,
  ];
  const farChain = nearChain.map(off);

  /** the visible top / front planes: strip between the near and far profile chains */
  const topChain: P[] = [
    s.trunkTop,
    s.beltRear,
    s.roofRear,
    s.roofFront,
    s.beltFront,
    s.hood,
    s.noseTop,
    s.noseBottom,
  ];
  const stripPoints = [...topChain, ...topChain.map(off).reverse()];

  const beltY = (s.beltRear[1] + s.beltFront[1]) / 2;
  const roofY = (s.roofRear[1] + s.roofFront[1]) / 2;
  const pillarX = (s.roofRear[0] + s.roofFront[0]) / 2;

  const glassRear = poly([
    [s.beltRear[0] + 6, beltY - 2],
    [s.roofRear[0] + 5, roofY + 5],
    [pillarX - 3, roofY + 4],
    [pillarX - 3, beltY - 2],
  ]);
  const glassFront = poly([
    [pillarX + 4, roofY + 4],
    [s.roofFront[0] - 5, roofY + 5],
    [s.beltFront[0] - 5, beltY - 3],
    [pillarX + 4, beltY - 3],
  ]);
  /** windscreen plane, seen in perspective */
  const windscreen = poly([
    s.roofFront,
    off(s.roofFront),
    off(s.beltFront),
    s.beltFront,
  ]);
  /** front fascia plane */
  const fascia = poly([s.noseTop, off(s.noseTop), off(s.noseBottom), s.noseBottom]);
  /** bonnet plane */
  const bonnet = poly([s.beltFront, off(s.beltFront), off(s.noseTop), s.noseTop, s.hood]);
  /** roof plane */
  const roofPlane = poly([s.roofRear, off(s.roofRear), off(s.roofFront), s.roofFront]);

  const [wRear, wFront] = s.wheels;
  const groundY = s.noseBottom[1];

  return (
    <svg viewBox="0 0 300 150" className={className} role="img" aria-hidden="true">
      <defs>
        <linearGradient id="cariq-flank" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.6 0.05 258)" />
          <stop offset="38%" stopColor="oklch(0.44 0.04 262)" />
          <stop offset="58%" stopColor="oklch(0.55 0.045 258)" />
          <stop offset="100%" stopColor="oklch(0.24 0.03 264)" />
        </linearGradient>
        <linearGradient id="cariq-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.05 250)" />
          <stop offset="100%" stopColor="oklch(0.56 0.05 258)" />
        </linearGradient>
        <linearGradient id="cariq-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.66 0.05 256)" />
          <stop offset="100%" stopColor="oklch(0.34 0.035 262)" />
        </linearGradient>
        <linearGradient id="cariq-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.07 240)" />
          <stop offset="60%" stopColor="oklch(0.48 0.06 252)" />
          <stop offset="100%" stopColor="oklch(0.32 0.05 258)" />
        </linearGradient>
        <linearGradient id="cariq-tyre" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.3 0.015 264)" />
          <stop offset="100%" stopColor="oklch(0.15 0.015 264)" />
        </linearGradient>
        <linearGradient id="cariq-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.92 0.01 258)" />
          <stop offset="55%" stopColor="oklch(0.6 0.015 258)" />
          <stop offset="100%" stopColor="oklch(0.4 0.015 258)" />
        </linearGradient>
        <linearGradient id="cariq-headlamp" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="oklch(0.98 0.09 95)" />
          <stop offset="100%" stopColor="oklch(0.85 0.16 85)" />
        </linearGradient>
        <radialGradient id="cariq-shadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="oklch(0 0 0)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="oklch(0 0 0)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ground shadow, skewed with the car */}
      <ellipse cx="145" cy={groundY + 6} rx="132" ry="11" fill="url(#cariq-shadow)" />

      {/* highlight zones */}
      {highlight === "front" || highlight === "engine" ? (
        <rect x="176" y="18" width="118" height="100" rx="20" fill={glow} opacity="0.10" stroke={glow} strokeOpacity="0.35" />
      ) : null}
      {highlight === "rear" ? (
        <rect x="6" y="24" width="104" height="94" rx="20" fill={glow} opacity="0.10" stroke={glow} strokeOpacity="0.35" />
      ) : null}
      {highlight === "under" ? (
        <polygon
          points={poly([
            [30, groundY + 2],
            [30 + DX, groundY + 2 + DY + 6],
            [s.noseBottom[0] + DX, groundY + 2 + DY + 6],
            [s.noseBottom[0], groundY + 2],
          ])}
          fill={glow}
          opacity="0.14"
          stroke={glow}
          strokeOpacity="0.35"
        />
      ) : null}

      {/* far-side wheels peeking through */}
      <g opacity="0.55">
        <ellipse cx={wRear + DX} cy={groundY + DY + 2} rx="15" ry="15" fill="oklch(0.14 0.015 264)" />
        <ellipse cx={wFront + DX} cy={groundY + DY + 2} rx="15" ry="15" fill="oklch(0.14 0.015 264)" />
      </g>

      {/* far-side body block (gives the volume) */}
      <polygon points={poly(farChain)} fill="oklch(0.3 0.035 262)" />

      {/* connecting planes: roof, windscreen, bonnet, fascia */}
      <polygon points={poly(stripPoints)} fill="url(#cariq-top)" opacity="0.9" />
      <polygon points={roofPlane} fill="url(#cariq-top)" />
      <polygon points={windscreen} fill="url(#cariq-glass)" opacity="0.92" />
      <polygon points={bonnet} fill="url(#cariq-face)" opacity="0.95" />
      <polygon points={fascia} fill="url(#cariq-face)" />

      {/* fascia detail: grille, lamps, bumper */}
      <g>
        <polygon
          points={poly([
            [s.noseTop[0] + 6, s.noseTop[1] + 6],
            [s.noseTop[0] + DX - 4, s.noseTop[1] + DY + 8],
            [s.noseTop[0] + DX - 4, s.noseTop[1] + DY + 22],
            [s.noseTop[0] + 6, s.noseTop[1] + 22],
          ])}
          fill="oklch(0.18 0.02 264)"
          stroke="oklch(0.62 0.02 258)"
          strokeWidth="0.8"
        />
        <rect
          x={s.noseTop[0] - 2}
          y={s.noseTop[1] + 3}
          width="11"
          height="7"
          rx="3"
          fill="url(#cariq-headlamp)"
          transform={`rotate(-12 ${s.noseTop[0]} ${s.noseTop[1]})`}
        />
        <rect
          x={s.noseTop[0] + DX - 14}
          y={s.noseTop[1] + DY + 5}
          width="11"
          height="7"
          rx="3"
          fill="url(#cariq-headlamp)"
          opacity="0.85"
          transform={`rotate(-12 ${s.noseTop[0] + DX} ${s.noseTop[1] + DY})`}
        />
        <ellipse cx={s.noseTop[0] + 14} cy={s.noseTop[1] + 6} rx="26" ry="13" fill="oklch(0.92 0.12 95)" opacity="0.10" />
        <polygon
          points={poly([
            [s.noseBottom[0], groundY - 12],
            [s.noseBottom[0] + DX, groundY + DY - 10],
            [s.noseBottom[0] + DX, groundY + DY - 2],
            [s.noseBottom[0], groundY - 4],
          ])}
          fill="oklch(0.2 0.02 264)"
          opacity="0.8"
        />
      </g>

      {/* near-side flank */}
      <polygon
        points={poly(nearChain)}
        fill="url(#cariq-flank)"
        stroke="oklch(0.74 0.02 258)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* flank detail */}
      <g>
        <polygon points={glassRear} fill="url(#cariq-glass)" opacity="0.9" />
        <polygon points={glassFront} fill="url(#cariq-glass)" opacity="0.9" />
        <polygon points={glassRear} fill="none" stroke="oklch(0.85 0.015 258)" strokeOpacity="0.5" strokeWidth="0.9" />
        <polygon points={glassFront} fill="none" stroke="oklch(0.85 0.015 258)" strokeOpacity="0.5" strokeWidth="0.9" />
        {/* shoulder crease + rocker shadow */}
        <path
          d={`M${s.rearBottom[0] + 6} ${beltY + 12} C 90 ${beltY + 6} 170 ${beltY + 5} ${s.noseBottom[0] - 6} ${beltY + 12}`}
          fill="none"
          stroke="oklch(0.96 0.01 258)"
          strokeOpacity="0.22"
          strokeWidth="1.4"
        />
        <path
          d={`M${s.rearBottom[0] + 4} ${groundY - 14} C 90 ${groundY - 20} 170 ${groundY - 20} ${s.noseBottom[0] - 4} ${groundY - 14}`}
          fill="none"
          stroke="oklch(0.1 0.01 264)"
          strokeOpacity="0.45"
          strokeWidth="3"
        />
        {/* door split + handles */}
        <line x1={pillarX} y1={roofY + 6} x2={pillarX - 4} y2={groundY - 8} stroke="oklch(0.8 0.02 258)" strokeWidth="1" opacity="0.5" />
        <line
          x1={s.beltRear[0] + 4}
          y1={beltY + 2}
          x2={s.beltRear[0] + 1}
          y2={groundY - 10}
          stroke="oklch(0.8 0.02 258)"
          strokeWidth="1"
          opacity="0.35"
        />
        <rect x={pillarX - 20} y={beltY + 6} width="11" height="3" rx="1.5" fill="oklch(0.86 0.02 258)" opacity="0.85" />
        <rect x={pillarX + 8} y={beltY + 6} width="11" height="3" rx="1.5" fill="oklch(0.86 0.02 258)" opacity="0.85" />
        {/* mirror */}
        <path
          d={`M${s.beltFront[0] - 4} ${beltY + 1} l10 -3 4 5 -10 3 z`}
          fill="oklch(0.46 0.03 262)"
          stroke="oklch(0.8 0.02 258)"
          strokeWidth="0.8"
        />
        {/* tail lamp */}
        <rect x={s.rearBottom[0] + 1} y={beltY + 4} width="10" height="8" rx="3" fill="oklch(0.62 0.21 25)" />
        <ellipse cx={s.rearBottom[0] + 6} cy={beltY + 8} rx="12" ry="9" fill="oklch(0.62 0.21 25)" opacity="0.16" />
        {/* wheel arches */}
        <path d={`M${wRear - 23} ${groundY} A 23 23 0 0 1 ${wRear + 23} ${groundY}`} fill="none" stroke="oklch(0.12 0.01 264)" strokeOpacity="0.6" strokeWidth="3" />
        <path d={`M${wFront - 23} ${groundY} A 23 23 0 0 1 ${wFront + 23} ${groundY}`} fill="none" stroke="oklch(0.12 0.01 264)" strokeOpacity="0.6" strokeWidth="3" />
        {/* specular sweep */}
        <polygon
          points={poly([
            [s.rearBottom[0] + 4, beltY + 20],
            [pillarX, beltY + 6],
            [s.noseBottom[0] - 10, beltY + 8],
            [s.noseBottom[0] - 10, beltY + 13],
            [pillarX, beltY + 12],
            [s.rearBottom[0] + 4, beltY + 26],
          ])}
          fill="oklch(1 0 0)"
          opacity="0.08"
        />
      </g>

      {/* zone accents */}
      {highlight === "front" || highlight === "engine" ? (
        <polygon points={bonnet} fill={glow} opacity="0.22" stroke={glow} strokeWidth="1.6" />
      ) : null}
      {highlight === "rear" ? (
        <polygon
          points={poly([s.rearTop, s.trunkTop, s.beltRear, off(s.beltRear), off(s.trunkTop), off(s.rearTop)])}
          fill={glow}
          opacity="0.22"
          stroke={glow}
          strokeWidth="1.6"
        />
      ) : null}
      {highlight === "under" ? (
        <path
          d={`M${s.rearBottom[0] + 12} ${groundY + 2} L ${s.noseBottom[0] - 8} ${groundY + 2}`}
          fill="none"
          stroke={glow}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="6 6"
        />
      ) : null}

      {/* engine lamp with a line to the bonnet */}
      {highlight === "engine" ? (
        <g>
          <line
            x1={s.hood[0] + 12}
            y1={s.hood[1] - 24}
            x2={s.hood[0] + 6}
            y2={s.hood[1] - 4}
            stroke={glow}
            strokeWidth="1.6"
            strokeDasharray="4 4"
          />
          <g transform={`translate(${s.hood[0] - 4} ${s.hood[1] - 54}) scale(1.6)`}>
            <CheckEngineGlyph color={glow} />
          </g>
        </g>
      ) : null}

      {/* near wheels */}
      <Wheel cx={wRear} cy={groundY} />
      <Wheel cx={wFront} cy={groundY} />
    </svg>
  );
}

function Wheel({ cx, cy }: { cx: number; cy: number }) {
  const spokes = Array.from({ length: 10 }, (_, i) => (i * 360) / 10);
  return (
    <g>
      <circle cx={cx} cy={cy} r="21" fill="url(#cariq-tyre)" stroke="oklch(0.1 0.01 264)" strokeWidth="1" />
      <circle
        cx={cx}
        cy={cy}
        r="17"
        fill="none"
        stroke="oklch(0.42 0.015 264)"
        strokeWidth="1"
        strokeDasharray="2 2.5"
        opacity="0.7"
      />
      <circle cx={cx} cy={cy} r="13.5" fill="url(#cariq-rim)" stroke="oklch(0.85 0.01 258)" strokeWidth="0.8" />
      <circle cx={cx} cy={cy} r="11.5" fill="oklch(0.23 0.02 264)" />
      {spokes.map((a) => (
        <rect
          key={a}
          x={cx - 1.3}
          y={cy - 11.5}
          width="2.6"
          height="9"
          rx="1.3"
          fill="url(#cariq-rim)"
          transform={`rotate(${a} ${cx} ${cy})`}
        />
      ))}
      <circle cx={cx} cy={cy} r="3.6" fill="oklch(0.74 0.02 258)" stroke="oklch(0.92 0.01 258)" strokeWidth="0.6" />
      <circle cx={cx} cy={cy} r="1.4" fill="oklch(0.58 0.19 260)" />
      <path
        d={`M${cx - 8} ${cy - 13} A 15 15 0 0 1 ${cx + 7} ${cy - 14}`}
        fill="none"
        stroke="oklch(1 0 0)"
        strokeOpacity="0.28"
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
