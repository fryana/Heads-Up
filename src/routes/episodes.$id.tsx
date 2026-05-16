import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import HeadCanvas from "@/components/HeadCanvas";
import {
  deleteEpisode,
  getEpisode,
  TRIGGER_OPTIONS,
  updateEpisode,
  type Episode,
} from "@/lib/store";
import { regionById } from "@/lib/regions";
import { useEffect, useState } from "react";
import { ChevronLeft, Pencil, Trash2, X, Check } from "lucide-react";

export const Route = createFileRoute("/episodes/$id")({
  head: () => ({ meta: [{ title: "Episode — Migraina" }] }),
  component: EpisodePage,
});

function EpisodePage() {
  const { id } = useParams({ from: "/episodes/$id" });
  const navigate = useNavigate();
  const [episode, setEpisode] = useState<Episode | undefined>();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Editable draft
  const [intensity, setIntensity] = useState(5);
  const [duration, setDuration] = useState(60);
  const [medication, setMedication] = useState("");
  const [notes, setNotes] = useState("");
  const [triggers, setTriggers] = useState<string[]>([]);

  useEffect(() => {
    const ep = getEpisode(id);
    setEpisode(ep);
    if (ep) {
      setIntensity(Math.max(0, ...ep.markers.map((m) => m.intensity)));
      setDuration(ep.durationMinutes);
      setMedication(ep.medication);
      setNotes(ep.notes);
      setTriggers(ep.triggers);
    }
  }, [id]);

  if (!episode) {
    return (
      <MobileShell title="Episode">
        <div className="px-5 pt-10 text-sm text-muted-foreground">Episode not found.</div>
      </MobileShell>
    );
  }

  function toggleTrigger(t: string) {
    setTriggers((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function handleSave() {
    if (!episode) return;
    const updatedMarkers = episode.markers.map((m) => ({ ...m, intensity }));
    updateEpisode(episode.id, {
      durationMinutes: duration,
      medication,
      notes,
      triggers,
      markers: updatedMarkers,
    });
    setEpisode({ ...episode, durationMinutes: duration, medication, notes, triggers, markers: updatedMarkers });
    setEditing(false);
  }

  function handleDelete() {
    if (!episode) return;
    deleteEpisode(episode.id);
    navigate({ to: "/" });
  }

  const max = Math.max(...episode.markers.map((m) => m.intensity), 0);

  return (
    <MobileShell>
      <div className="px-5 pt-4 pb-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
          {!editing && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium"
                style={{ background: "color-mix(in oklab, var(--pain-high) 15%, transparent)", color: "var(--pain-high)" }}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          )}
          {editing && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditing(false);
                  // Reset draft from saved episode
                  setIntensity(Math.max(0, ...episode.markers.map((m) => m.intensity)));
                  setDuration(episode.durationMinutes);
                  setMedication(episode.medication);
                  setNotes(episode.notes);
                  setTriggers(episode.triggers);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium"
              >
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
              >
                <Check className="h-3.5 w-3.5" /> Save
              </button>
            </div>
          )}
        </div>

        <h1 className="mt-2 text-xl font-semibold">
          {new Date(episode.createdAt).toLocaleString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </h1>
        <p className="text-xs text-muted-foreground">
          Peak intensity {editing ? intensity : max}/10 · {editing ? duration : episode.durationMinutes} min
        </p>

        <div className="mt-4 h-72 overflow-hidden rounded-3xl bg-secondary/30">
          <HeadCanvas
            selectedRegions={episode.markers.map((m) => m.region).filter(Boolean) as string[]}
            intensity={editing ? intensity : max}
            interactive={false}
          />
        </div>

        {!editing ? (
          <>
            <dl className="mt-5 space-y-3 rounded-3xl bg-card p-4 shadow-sm">
              <Row label="Triggers" value={episode.triggers.join(", ") || "—"} />
              <Row label="Medication" value={episode.medication || "—"} />
              <Row
                label="Regions"
                value={
                  episode.markers
                    .map((m) => (m.region ? regionById(m.region)?.label : null))
                    .filter(Boolean)
                    .join(", ") || `${episode.markers.length} markers`
                }
              />
              <Row label="Pain types" value={[...new Set(episode.markers.map((m) => m.type))].join(", ")} />
            </dl>

            {episode.notes && (
              <div className="mt-4 rounded-3xl bg-secondary/60 p-4 text-sm leading-relaxed">
                {episode.notes}
              </div>
            )}

            <Link
              to="/report"
              className="mt-6 block rounded-2xl bg-primary py-3.5 text-center text-sm font-semibold text-primary-foreground"
            >
              Include in GP report
            </Link>
          </>
        ) : (
          <div className="mt-5 space-y-4 rounded-3xl bg-card p-4 shadow-sm">
            <Field label={`Intensity · ${intensity}/10`}>
              <input
                type="range"
                min={1}
                max={10}
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="w-full accent-[color:var(--primary)]"
              />
            </Field>
            <Field label="Duration (min)">
              <input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value) || 0)}
                className="w-full rounded-xl bg-secondary px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Medication">
              <input
                type="text"
                value={medication}
                onChange={(e) => setMedication(e.target.value)}
                placeholder="e.g. Ibuprofen 400mg"
                className="w-full rounded-xl bg-secondary px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Triggers">
              <div className="flex flex-wrap gap-1.5">
                {TRIGGER_OPTIONS.map((t) => {
                  const on = triggers.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleTrigger(t)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        on
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl bg-secondary px-3 py-2 text-sm"
              />
            </Field>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-3xl bg-card p-5 shadow-xl">
            <h2 className="text-base font-semibold">Delete this episode?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This will permanently remove the entry from your log.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-2xl bg-secondary py-2.5 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-2xl py-2.5 text-sm font-semibold text-white"
                style={{ background: "var(--pain-high)" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}
