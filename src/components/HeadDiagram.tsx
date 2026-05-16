import { HEADACHE_TYPES, type HeadacheType, headacheTypeById } from "@/lib/regions";

// 2D head diagrams modeled after common headache-region illustrations.
// Each type owns a list of SVG shapes drawn in red on a neutral head silhouette.

type Shape =
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number; rotate?: number }
  | { kind: "circle"; cx: number; cy: number; r: number }
  | { kind: "path"; d: string };

type View = "front" | "side";

const DIAGRAMS: Record<HeadacheType, { view: View; shapes: Shape[] }> = {
  tension: {
    view: "front",
    shapes: [{ kind: "path", d: "M58,72 Q100,58 142,72 L142,90 Q100,80 58,90 Z" }],
  },
  migraine: {
    view: "side",
    shapes: [
      { kind: "path", d: "M62,60 Q92,52 118,70 Q126,100 110,140 Q90,150 72,142 Q58,110 62,60 Z" },
    ],
  },
  cluster: {
    view: "front",
    shapes: [{ kind: "ellipse", cx: 118, cy: 100, rx: 16, ry: 10 }],
  },
  sinus: {
    view: "front",
    shapes: [
      { kind: "ellipse", cx: 84, cy: 100, rx: 8, ry: 6 },
      { kind: "ellipse", cx: 116, cy: 100, rx: 8, ry: 6 },
      { kind: "ellipse", cx: 100, cy: 118, rx: 12, ry: 8 },
    ],
  },
  caffeine: {
    view: "front",
    shapes: [
      { kind: "path", d: "M70,72 Q100,60 130,72 L130,92 Q100,82 70,92 Z" },
      { kind: "ellipse", cx: 88, cy: 110, rx: 14, ry: 18 },
      { kind: "ellipse", cx: 112, cy: 110, rx: 14, ry: 18 },
    ],
  },
  hormone: {
    // Cyclical hormonal headaches: bilateral frontal/temporal band across the forehead.
    view: "front",
    shapes: [
      { kind: "path", d: "M60,78 Q100,66 140,78 Q142,92 140,100 Q100,90 60,100 Q58,92 60,78 Z" },
      { kind: "ellipse", cx: 72, cy: 96, rx: 8, ry: 10 },
      { kind: "ellipse", cx: 128, cy: 96, rx: 8, ry: 10 },
    ],
  },
  hemicrania: {
    // Strictly unilateral continuous pain: one-sided strip from temple down through orbit.
    view: "side",
    shapes: [
      { kind: "path", d: "M118,70 Q140,80 142,108 Q138,134 122,148 Q108,150 102,134 Q98,108 104,86 Q108,72 118,70 Z" },
    ],
  },
  hypertension: {
    view: "front",
    shapes: [
      { kind: "ellipse", cx: 86, cy: 96, rx: 14, ry: 22 },
      { kind: "ellipse", cx: 114, cy: 96, rx: 14, ry: 22 },
    ],
  },
  rebound: {
    view: "side",
    shapes: [{ kind: "ellipse", cx: 96, cy: 70, rx: 36, ry: 24 }],
  },
  "post-traumatic": {
    view: "front",
    shapes: [
      { kind: "ellipse", cx: 84, cy: 100, rx: 8, ry: 6 },
      { kind: "ellipse", cx: 78, cy: 78, rx: 9, ry: 6, rotate: -25 },
      { kind: "ellipse", cx: 74, cy: 150, rx: 8, ry: 6 },
    ],
  },
  exertion: {
    view: "front",
    shapes: [
      { kind: "ellipse", cx: 80, cy: 96, rx: 12, ry: 18 },
      { kind: "ellipse", cx: 120, cy: 96, rx: 12, ry: 18 },
      { kind: "ellipse", cx: 100, cy: 78, rx: 18, ry: 10 },
    ],
  },
  spinal: {
    view: "side",
    shapes: [{ kind: "ellipse", cx: 100, cy: 66, rx: 40, ry: 18 }],
  },
  thunderclap: {
    view: "front",
    shapes: [
      { kind: "circle", cx: 80, cy: 80, r: 9 },
      { kind: "circle", cx: 120, cy: 80, r: 9 },
      { kind: "circle", cx: 100, cy: 100, r: 9 },
      { kind: "circle", cx: 82, cy: 120, r: 8 },
      { kind: "circle", cx: 118, cy: 120, r: 8 },
      { kind: "circle", cx: 100, cy: 140, r: 8 },
    ],
  },
  "ice-pick": {
    view: "front",
    shapes: [
      { kind: "circle", cx: 78, cy: 78, r: 5 },
      { kind: "circle", cx: 122, cy: 80, r: 5 },
      { kind: "circle", cx: 100, cy: 90, r: 5 },
      { kind: "circle", cx: 88, cy: 108, r: 5 },
      { kind: "circle", cx: 116, cy: 110, r: 5 },
      { kind: "circle", cx: 100, cy: 124, r: 5 },
      { kind: "circle", cx: 84, cy: 140, r: 5 },
    ],
  },
  cervicogenic: {
    view: "side",
    shapes: [
      { kind: "ellipse", cx: 86, cy: 150, rx: 18, ry: 10 },
      { kind: "ellipse", cx: 96, cy: 168, rx: 14, ry: 10 },
    ],
  },
};

// Soft head silhouettes — neutral teal tone matching reference style.
const HEAD_FILL = "#cfdde2";
const HEAD_STROKE = "#9fb6bd";
const FEATURE = "#7c969d";
const RED = "#ef5350";

function FrontHead() {
  return (
    <g>
      {/* neck */}
      <path
        d="M88,182 L88,200 Q70,206 60,222 L140,222 Q130,206 112,200 L112,182 Z"
        fill={HEAD_FILL}
        stroke={HEAD_STROKE}
        strokeWidth="1.5"
      />
      {/* head */}
      <path
        d="M100,30 C66,30 50,62 50,100 C50,140 64,178 100,186 C136,178 150,140 150,100 C150,62 134,30 100,30 Z"
        fill={HEAD_FILL}
        stroke={HEAD_STROKE}
        strokeWidth="1.5"
      />
      {/* brows / eyes */}
      <path d="M70,98 Q82,92 92,98" stroke={FEATURE} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M108,98 Q118,92 130,98" stroke={FEATURE} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* mouth hint */}
      <path d="M92,158 Q100,162 108,158" stroke={FEATURE} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  );
}

function SideHead() {
  return (
    <g>
      {/* neck + shoulder */}
      <path
        d="M78,180 L74,206 Q50,210 40,224 L150,224 L150,206 Q130,196 118,182 Z"
        fill={HEAD_FILL}
        stroke={HEAD_STROKE}
        strokeWidth="1.5"
      />
      {/* head profile facing right */}
      <path
        d="M60,90 C60,52 86,30 116,34 C140,38 152,62 150,92 C149,108 144,118 138,124 L138,132 L146,138 L138,144 L138,152 L132,158 Q132,170 124,178 L84,178 Q70,168 64,150 Q54,124 60,90 Z"
        fill={HEAD_FILL}
        stroke={HEAD_STROKE}
        strokeWidth="1.5"
      />
      {/* eye */}
      <path d="M120,98 Q128,92 136,98" stroke={FEATURE} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* ear */}
      <ellipse cx="92" cy="118" rx="6" ry="9" fill="none" stroke={FEATURE} strokeWidth="1.5" />
      {/* mouth */}
      <path d="M132,150 Q138,152 142,148" stroke={FEATURE} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  );
}

function RedShapes({ shapes }: { shapes: Shape[] }) {
  return (
    <g fill={RED} opacity={0.92}>
      {shapes.map((s, i) => {
        if (s.kind === "circle") return <circle key={i} cx={s.cx} cy={s.cy} r={s.r} />;
        if (s.kind === "ellipse")
          return (
            <ellipse
              key={i}
              cx={s.cx}
              cy={s.cy}
              rx={s.rx}
              ry={s.ry}
              transform={s.rotate ? `rotate(${s.rotate} ${s.cx} ${s.cy})` : undefined}
            />
          );
        return <path key={i} d={s.d} />;
      })}
    </g>
  );
}

const FRONT_HEAD_PATH =
  "M100,30 C66,30 50,62 50,100 C50,140 64,178 100,186 C136,178 150,140 150,100 C150,62 134,30 100,30 Z";
const SIDE_HEAD_PATH =
  "M60,90 C60,52 86,30 116,34 C140,38 152,62 150,92 C149,108 144,118 138,124 L138,132 L146,138 L138,144 L138,152 L132,158 Q132,170 124,178 L84,178 Q70,168 64,150 Q54,124 60,90 Z";

export function HeadDiagram({
  type,
  className,
}: {
  type: HeadacheType;
  className?: string;
}) {
  const def = DIAGRAMS[type];
  if (!def) return null;
  const clipId = `head-clip-${def.view}-${type}`;
  return (
    <svg
      viewBox="0 0 200 230"
      className={className}
      role="img"
      aria-label={`${headacheTypeById(type)?.label ?? type} headache region`}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={def.view === "front" ? FRONT_HEAD_PATH : SIDE_HEAD_PATH} />
        </clipPath>
      </defs>
      {def.view === "front" ? <FrontHead /> : <SideHead />}
      <g clipPath={`url(#${clipId})`}>
        <RedShapes shapes={def.shapes} />
      </g>
    </svg>
  );
}

export { HEADACHE_TYPES };
