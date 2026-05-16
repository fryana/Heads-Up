// Anatomical regions + headache-type catalog for the 3D head picker.
// Positions are direction vectors in head-space; HeadCanvas projects them
// onto the head ellipsoid surface (scale [1, 1.25, 1.05]).

export type HeadacheType =
  | "tension"
  | "migraine"
  | "cluster"
  | "sinus"
  | "caffeine"
  | "hormone"
  | "hemicrania"
  | "hypertension"
  | "rebound"
  | "post-traumatic"
  | "exertion"
  | "spinal"
  | "thunderclap"
  | "ice-pick"
  | "cervicogenic";

export type Region = {
  id: string;
  label: string;
  position: [number, number, number];
  radius: number;
  color: string;
  types: HeadacheType[];
};

// Legacy region catalog — still used by reports & episode markers so older
// data keeps rendering. New log flow drives the head via HEADACHE_TYPES.
export const HEAD_REGIONS: Region[] = [
  { id: "forehead", label: "Forehead", position: [0, 0.55, 0.95], radius: 0.22, color: "#b794f6", types: ["tension", "sinus"] },
  { id: "left-temple", label: "Left temple", position: [-0.85, 0.25, 0.45], radius: 0.28, color: "#ed64a6", types: ["migraine", "hemicrania"] },
  { id: "right-temple", label: "Right temple", position: [0.85, 0.25, 0.45], radius: 0.28, color: "#ed64a6", types: ["migraine", "hemicrania"] },
  { id: "around-eyes", label: "Around eyes", position: [0, 0.05, 1.0], radius: 0.26, color: "#d53f8c", types: ["cluster", "sinus"] },
  { id: "crown", label: "Top of head", position: [0, 1.15, 0.1], radius: 0.38, color: "#ed8936", types: ["hypertension", "exertion"] },
  { id: "back-of-head", label: "Back of head", position: [0, 0.55, -0.95], radius: 0.34, color: "#e53e3e", types: ["rebound", "post-traumatic"] },
  { id: "around-ears", label: "Around ears", position: [0.95, -0.05, 0.0], radius: 0.22, color: "#4299e1", types: ["hemicrania"] },
  { id: "around-ears-l", label: "Around ears (L)", position: [-0.95, -0.05, 0.0], radius: 0.22, color: "#4299e1", types: ["hemicrania"] },
  { id: "neck", label: "Neck", position: [0, -1.1, -0.25], radius: 0.3, color: "#48bb78", types: ["cervicogenic", "post-traumatic"] },
];

export function inferHeadacheType(regionIds: string[]): HeadacheType | null {
  const tally: Record<string, number> = {};
  for (const id of regionIds) {
    const r = HEAD_REGIONS.find((x) => x.id === id);
    if (!r) continue;
    for (const t of r.types) tally[t] = (tally[t] ?? 0) + 1;
  }
  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  return (sorted[0]?.[0] as HeadacheType) ?? null;
}

export function regionById(id: string) {
  return HEAD_REGIONS.find((r) => r.id === id);
}

// ---------- New: headache-type catalog driving the 3D head highlight ----------

export type HeadachePatch = {
  position: [number, number, number]; // direction vector, projected to surface
  radius: number;                     // decal half-extent
};

export type HeadacheTypeDef = {
  id: HeadacheType;
  label: string;
  blurb: string;
  patches: HeadachePatch[];
};

// Patches modeled from the Healthline "Types of Headaches" infographic.
// Front of head = +Z, right side = +X, top = +Y.
export const HEADACHE_TYPES: HeadacheTypeDef[] = [
  {
    id: "tension",
    label: "Tension",
    blurb: "Band-like pressure across the forehead.",
    patches: [
      { position: [-0.55, 0.65, 0.75], radius: 0.22 },
      { position: [0, 0.7, 0.95], radius: 0.24 },
      { position: [0.55, 0.65, 0.75], radius: 0.22 },
    ],
  },
  {
    id: "migraine",
    label: "Migraine",
    blurb: "Throbbing pain on one side of the head and face.",
    patches: [
      { position: [0.55, 0.45, 0.7], radius: 0.32 },
      { position: [0.8, 0.05, 0.45], radius: 0.3 },
      { position: [0.4, -0.25, 0.85], radius: 0.22 },
    ],
  },
  {
    id: "cluster",
    label: "Cluster",
    blurb: "Sharp pain centered around one eye.",
    patches: [{ position: [0.3, 0.08, 0.95], radius: 0.22 }],
  },
  {
    id: "sinus",
    label: "Allergy / Sinus",
    blurb: "Pressure across the brow, cheek and nose.",
    patches: [
      { position: [-0.3, 0.1, 0.95], radius: 0.18 },
      { position: [-0.1, -0.15, 0.98], radius: 0.16 },
      { position: [-0.35, -0.3, 0.85], radius: 0.16 },
    ],
  },
  {
    id: "caffeine",
    label: "Caffeine",
    blurb: "Diffuse pain across forehead and both temples.",
    patches: [
      { position: [-0.55, 0.4, 0.7], radius: 0.24 },
      { position: [0, 0.5, 0.95], radius: 0.26 },
      { position: [0.55, 0.4, 0.7], radius: 0.24 },
    ],
  },
  {
    id: "hormone",
    label: "Hormone (menstrual)",
    blurb: "One-sided pain covering temple, eye and cheek.",
    patches: [
      { position: [0.55, 0.4, 0.65], radius: 0.4 },
      { position: [0.85, 0.0, 0.35], radius: 0.32 },
      { position: [0.35, -0.2, 0.85], radius: 0.22 },
    ],
  },
  {
    id: "hemicrania",
    label: "Hemicrania continua",
    blurb: "Persistent pain on one whole side of the head.",
    patches: [
      { position: [-0.55, 0.4, 0.65], radius: 0.42 },
      { position: [-0.85, 0.0, 0.3], radius: 0.32 },
      { position: [-0.4, -0.25, 0.8], radius: 0.22 },
    ],
  },
  {
    id: "hypertension",
    label: "Hypertension",
    blurb: "Pulsing pain on both sides of the head.",
    patches: [
      { position: [-0.75, 0.45, 0.5], radius: 0.3 },
      { position: [0.75, 0.45, 0.5], radius: 0.3 },
      { position: [0, 0.5, 0.9], radius: 0.2 },
    ],
  },
  {
    id: "rebound",
    label: "Rebound",
    blurb: "Dull pain across the top and side of the head.",
    patches: [
      { position: [0.6, 0.85, 0.1], radius: 0.45 },
      { position: [0.85, 0.45, 0.35], radius: 0.28 },
    ],
  },
  {
    id: "post-traumatic",
    label: "Post-traumatic",
    blurb: "Localized pain at impact site, often eye and neck.",
    patches: [
      { position: [-0.3, 0.1, 0.95], radius: 0.18 },
      { position: [-0.75, -0.45, 0.2], radius: 0.22 },
      { position: [-0.55, 0.7, 0.5], radius: 0.14 },
    ],
  },
  {
    id: "exertion",
    label: "Exertion",
    blurb: "Pressure on both temples brought on by activity.",
    patches: [
      { position: [-0.7, 0.5, 0.55], radius: 0.3 },
      { position: [0.7, 0.5, 0.55], radius: 0.3 },
    ],
  },
  {
    id: "spinal",
    label: "Spinal",
    blurb: "Pain across the crown radiating to the back.",
    patches: [
      { position: [0, 1.0, 0.3], radius: 0.4 },
      { position: [0.5, 0.85, 0.0], radius: 0.3 },
    ],
  },
  {
    id: "thunderclap",
    label: "Thunderclap",
    blurb: "Sudden, severe pain striking multiple areas at once.",
    patches: [
      { position: [-0.4, 0.7, 0.7], radius: 0.12 },
      { position: [0.4, 0.7, 0.7], radius: 0.12 },
      { position: [0, 0.5, 0.95], radius: 0.12 },
      { position: [-0.3, 0.2, 0.92], radius: 0.1 },
      { position: [0.3, 0.2, 0.92], radius: 0.1 },
      { position: [0, -0.3, 0.95], radius: 0.1 },
    ],
  },
  {
    id: "ice-pick",
    label: "Ice pick",
    blurb: "Brief, stabbing pinpoints across the head.",
    patches: [
      { position: [-0.4, 0.75, 0.6], radius: 0.07 },
      { position: [0.45, 0.7, 0.55], radius: 0.07 },
      { position: [0, 0.6, 0.95], radius: 0.07 },
      { position: [-0.2, 0.3, 0.95], radius: 0.07 },
      { position: [0.25, 0.35, 0.9], radius: 0.07 },
      { position: [0.1, -0.05, 0.98], radius: 0.07 },
      { position: [-0.5, 0.45, 0.75], radius: 0.07 },
    ],
  },
];

export function headacheTypeById(id: string) {
  return HEADACHE_TYPES.find((t) => t.id === id);
}
