import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { MobileShell } from "@/components/MobileShell";
import HeadCanvas from "@/components/HeadCanvas";
import { useMemo, useState } from "react";
import { addEpisode, PainMarker, TRIGGER_OPTIONS } from "@/lib/store";
import {
  HEAD_REGIONS,
  inferHeadacheType,
  headacheTypeById,
  regionById,
  type HeadacheType,
} from "@/lib/regions";

export const Route = createFileRoute("/log")({
  head: () => ({ meta: [{ title: "Log headache — Migraina" }] }),
  component: LogPage,
});

const PAIN_TYPE_BY_HEADACHE: Record<HeadacheType, PainMarker["type"]> = {
  tension: "pressure",
  migraine: "throbbing",
  cluster: "sharp",
  sinus: "pressure",
  caffeine: "dull",
  hormone: "throbbing",
  hemicrania: "throbbing",
  hypertension: "pressure",
  rebound: "dull",
  "post-traumatic": "dull",
  exertion: "pressure",
  spinal: "dull",
  thunderclap: "sharp",
  "ice-pick": "sharp",
  cervicogenic: "dull",
};

function LogPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [intensity, setIntensity] = useState(5);
  const [duration, setDuration] = useState(60);
  const [medication, setMedication] = useState("");
  const [triggers, setTriggers] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const inferredType = useMemo(
    () => inferHeadacheType(selectedRegions),
    [selectedRegions],
  );
  const inferredDef = useMemo(
    () => (inferredType ? headacheTypeById(inferredType) : null),
    [inferredType],
  );

  function toggleRegion(id: string) {
    setSelectedRegions((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  }

  function toggleTrigger(t: string) {
    setTriggers((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function save() {
    if (selectedRegions.length === 0) return;
    const id = crypto.randomUUID();
    const painType = inferredType ? PAIN_TYPE_BY_HEADACHE[inferredType] ?? "dull" : "dull";
    const markers: PainMarker[] = selectedRegions.map((rid) => {
      const r = regionById(rid)!;
      return {
        id: crypto.randomUUID(),
        region: rid,
        x: r.position[0],
        y: r.position[1],
        z: r.position[2],
        intensity,
        type: painType,
      };
    });
    addEpisode({
      id,
      createdAt: new Date().toISOString(),
      durationMinutes: duration,
      medication,
      triggers,
      notes:
        notes ||
        (inferredDef
          ? `Pattern: ${inferredDef.label.toLowerCase()} headache.`
          : "Custom region pattern."),
      markers,
    });
    queryClient.invalidateQueries({ queryKey: ["migraine-prediction"] });
    navigate({ to: "/episodes/$id", params: { id } });
  }

  return (
    <MobileShell title="New headache">
      <div className="px-5 pt-4">
        <div className="rounded-3xl bg-card p-4 shadow-sm">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Where does it hurt?
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Tap the regions on the 3D head. Drag to rotate.
          </p>

          <div className="mt-3 h-72 overflow-hidden rounded-2xl bg-secondary/30">
            <HeadCanvas
              selectedRegions={selectedRegions}
              intensity={intensity}
              interactive
              onToggleRegion={toggleRegion}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {HEAD_REGIONS.map((r) => {
              const active = selectedRegions.includes(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => toggleRegion(r.id)}
                  className={`rounded-full px-3 py-1.5 text-xs transition ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          {selectedRegions.length > 0 && (
            <div className="mt-4 rounded-2xl bg-secondary/60 p-3 text-xs">
              <span className="text-muted-foreground">Likely pattern:</span>{" "}
              <span className="font-semibold">
                {inferredDef ? `${inferredDef.label} headache` : "Custom pattern"}
              </span>
              {inferredDef && (
                <div className="mt-1 text-muted-foreground">{inferredDef.blurb}</div>
              )}
            </div>
          )}

          {selectedRegions.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="uppercase tracking-widest text-muted-foreground">
                  Intensity
                </span>
                <span className="font-semibold">{intensity}/10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={intensity}
                onChange={(e) => setIntensity(+e.target.value)}
                className="mt-2 w-full accent-[color:var(--primary)]"
              />
            </div>
          )}
        </div>

        <div className="mt-5 space-y-4 pb-6">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Duration: {duration} min
            </label>
            <input
              type="range"
              min={10}
              max={480}
              step={10}
              value={duration}
              onChange={(e) => setDuration(+e.target.value)}
              className="mt-2 w-full accent-[color:var(--primary)]"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Triggers
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {TRIGGER_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTrigger(t)}
                  className={`rounded-full px-3 py-1.5 text-xs capitalize transition ${
                    triggers.includes(t)
                      ? "bg-accent text-accent-foreground"
                      : "border border-border bg-card text-muted-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Medication
            </label>
            <input
              value={medication}
              onChange={(e) => setMedication(e.target.value)}
              placeholder="e.g. Ibuprofen 400mg"
              className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="What were you doing when it started?"
              className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <button
            onClick={save}
            disabled={selectedRegions.length === 0}
            className="w-full rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition disabled:opacity-50"
          >
            Save episode
            {inferredDef ? ` · ${inferredDef.label}` : ""}
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
