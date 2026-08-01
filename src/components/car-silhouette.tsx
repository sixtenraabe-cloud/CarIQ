type Body = "suv" | "wagon" | "hatch" | "sedan";

const SUV = /\b(xc|q[3-8]|x[1-7]|suv|tucson|sportage|rav4|kuga|tiguan|touareg|cx-?5|cx-?30|captur|kodiaq|karoq|duster|santa fe|sorento|evoque|discovery|defender|gl[aebcs]|macan|cayenne|model y|id\.?4|eqb|eqc|jimny|forester|outback)\b/i;
const WAGON = /\b(v[567]0|kombi|estate|touring|avant|variant|sw|combi|passat|superb|octavia|206sw|breakt?)\b/i;
const HATCH = /\b(golf|polo|fabia|corsa|clio|yaris|fiesta|ibiza|up|c3|208|zoe|leaf|i20|i30|micra|swift|a[13]|1-?series|118|mini)\b/i;

export function bodyStyleFor(model: string): Body {
  if (SUV.test(model)) return "suv";
  if (WAGON.test(model)) return "wagon";
  if (HATCH.test(model)) return "hatch";
  return "sedan";
}

const PATHS: Record<Body, string> = {
  sedan:
    "M18 66 L30 66 C33 52 44 46 60 46 L96 46 C112 46 124 51 134 60 L166 65 C178 67 184 70 184 76 L184 84 L18 84 Z M62 50 L94 50 C106 50 116 54 124 61 L62 61 Z",
  wagon:
    "M18 66 L28 66 C31 51 42 45 58 45 L128 45 C142 45 152 50 160 60 L172 64 C182 67 186 70 186 76 L186 84 L18 84 Z M60 49 L126 49 C136 49 144 53 150 61 L60 61 Z",
  hatch:
    "M22 66 L32 66 C35 52 45 46 60 46 L104 46 C118 46 128 51 136 60 L156 64 C168 67 174 70 174 76 L174 84 L22 84 Z M62 50 L102 50 C112 50 120 54 127 61 L62 61 Z",
  suv: "M18 62 L28 62 C31 44 43 38 60 38 L118 38 C134 38 146 44 154 56 L172 61 C183 64 188 67 188 74 L188 84 L18 84 Z M62 42 L116 42 C127 42 136 46 143 57 L62 57 Z",
};

export function CarSilhouette({
  model = "",
  className = "",
}: {
  model?: string;
  className?: string;
}) {
  const body = bodyStyleFor(model);
  return (
    <svg viewBox="0 0 204 100" className={className} role="img" aria-hidden="true">
      <path d={PATHS[body]} className="fill-muted-foreground/25 stroke-muted-foreground/50" strokeWidth="1.5" />
      <circle cx="62" cy="84" r="13" className="fill-muted-foreground/30 stroke-muted-foreground/60" strokeWidth="1.5" />
      <circle cx="62" cy="84" r="5" className="fill-muted-foreground/50" />
      <circle cx="150" cy="84" r="13" className="fill-muted-foreground/30 stroke-muted-foreground/60" strokeWidth="1.5" />
      <circle cx="150" cy="84" r="5" className="fill-muted-foreground/50" />
      <line x1="10" y1="97" x2="194" y2="97" className="stroke-muted-foreground/25" strokeWidth="1.5" />
    </svg>
  );
}
