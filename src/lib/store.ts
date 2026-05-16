// Local-only prototype storage. The native iOS app will replace this with SwiftData/CloudKit.
export type PainMarker = {
  id: string;
  // Optional anatomical region id (see src/lib/regions.ts). Newer episodes
  // are region-based; legacy ones may only have raw coordinates.
  region?: string;
  // 3D coordinate on the head surface (region centroid for new episodes).
  x: number;
  y: number;
  z: number;
  intensity: number; // 1-10
  type: "throbbing" | "sharp" | "pressure" | "dull";
};

export type Episode = {
  id: string;
  createdAt: string; // ISO
  durationMinutes: number;
  medication: string;
  triggers: string[];
  notes: string;
  markers: PainMarker[];
};

const KEY = "headache.episodes.v4";

export function loadEpisodes(): Episode[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed();
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveEpisodes(list: Episode[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addEpisode(e: Episode) {
  const list = loadEpisodes();
  list.unshift(e);
  saveEpisodes(list);
}

export function getEpisode(id: string): Episode | undefined {
  return loadEpisodes().find((e) => e.id === id);
}

export function deleteEpisode(id: string) {
  saveEpisodes(loadEpisodes().filter((e) => e.id !== id));
}

export function updateEpisode(id: string, patch: Partial<Omit<Episode, "id">>) {
  const list = loadEpisodes().map((e) => (e.id === id ? { ...e, ...patch } : e));
  saveEpisodes(list);
}

function seed(): Episode[] {
  const now = Date.now();
  const sample: Episode[] = [
    {
      id: "seed-1",
      createdAt: new Date(now - 1000 * 60 * 60 * 18).toISOString(),
      durationMinutes: 45,
      medication: "None",
      triggers: ["screen"],
      notes: "Mild pressure behind right temple, faded quickly.",
      markers: [
        { id: "m1", x: 0.75, y: 0.4, z: 0.55, intensity: 1, type: "dull" },
      ],
    },
    {
      id: "seed-2",
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(),
      durationMinutes: 60,
      medication: "None",
      triggers: ["stress"],
      notes: "Light band of pressure across forehead.",
      markers: [
        { id: "m2", x: 0, y: 0.6, z: 0.95, intensity: 1, type: "dull" },
        { id: "m3", x: -0.4, y: 0.5, z: 0.85, intensity: 1, type: "dull" },
      ],
    },
  ];
  saveEpisodes(sample);
  return sample;
}

export const TRIGGER_OPTIONS = ["sleep", "stress", "food", "screen", "hormonal", "weather"];
export const PAIN_TYPES: PainMarker["type"][] = ["throbbing", "sharp", "pressure", "dull"];
