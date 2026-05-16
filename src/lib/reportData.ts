// Reporting core — adapted from MigraineScope spec.
// Maps the prototype's Episode + HealthDay shapes into the spec's
// Migraine/Metric model so we can produce a clinician-ready Markdown report.

import type { Episode, PainMarker } from "./store";
import type { HealthDay } from "./mock-sleep";

export type Migraine = {
  id: string;
  started_at: string;
  duration_minutes: number | null;
  severity: number;
  brain_locations: string[];
  symptoms: string[];
  medications: string[];
  triggers: string[];
  notes: string | null;
};

export type Metric = {
  metric_type: string;
  value: number;
  unit: string | null;
  recorded_at: string;
  end_at: string | null;
  source: string;
};

export type Profile = {
  display_name: string;
  date_of_birth: string;
  sex: string;
};

export const DEFAULT_PROFILE: Profile = {
  display_name: "Migraina patient",
  date_of_birth: "",
  sex: "",
};

// --- Episode → Migraine mapping ---------------------------------------------

import { regionById } from "./regions";

function locationFromMarker(m: PainMarker): string {
  if (m.region) {
    const r = regionById(m.region);
    if (r) return r.label.toLowerCase();
  }
  const side = m.x > 0.2 ? "right" : m.x < -0.2 ? "left" : "central";
  const region =
    m.z > 0.4 ? "forehead" : m.z < -0.4 ? "occipital" : m.y > 0.4 ? "crown" : "temple";
  return `${side} ${region}`;
}

export function episodeToMigraine(e: Episode): Migraine {
  const severity = e.markers.length
    ? Math.max(...e.markers.map((m) => m.intensity))
    : 0;
  return {
    id: e.id,
    started_at: e.createdAt,
    duration_minutes: e.durationMinutes ?? null,
    severity,
    brain_locations: [...new Set(e.markers.map(locationFromMarker))],
    symptoms: [...new Set(e.markers.map((m) => m.type))],
    medications: e.medication ? [e.medication] : [],
    triggers: e.triggers,
    notes: e.notes || null,
  };
}

export function healthToMetrics(days: HealthDay[]): Metric[] {
  const out: Metric[] = [];
  for (const d of days) {
    const iso = `${d.date}T12:00:00.000Z`;
    out.push({ metric_type: "sleep_minutes", value: Math.round(d.hours * 60), unit: "min", recorded_at: iso, end_at: null, source: "apple_health" });
    out.push({ metric_type: "resting_heart_rate", value: d.restingHr, unit: "bpm", recorded_at: iso, end_at: null, source: "apple_health" });
    out.push({ metric_type: "steps", value: d.steps, unit: "count", recorded_at: iso, end_at: null, source: "apple_health" });
  }
  return out;
}

// --- Summary -----------------------------------------------------------------

type AggMode = "avg" | "sum";
const AGG: Record<string, AggMode> = {
  sleep_minutes: "sum",
  steps: "sum",
  resting_heart_rate: "avg",
  hrv_sdnn: "avg",
};

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

function bucketDaily(metrics: Metric[], type: string): Record<string, number> {
  const mode = AGG[type] ?? "avg";
  const acc: Record<string, { sum: number; n: number }> = {};
  for (const m of metrics) {
    if (m.metric_type !== type) continue;
    const k = dayKey(m.recorded_at);
    acc[k] ??= { sum: 0, n: 0 };
    acc[k].sum += m.value;
    acc[k].n += 1;
  }
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(acc)) {
    out[k] = mode === "sum" ? v.sum : v.sum / v.n;
  }
  return out;
}

function splitOnOff(daily: Record<string, number>, migraineDays: Set<string>) {
  const on: number[] = [];
  const off: number[] = [];
  for (const [k, v] of Object.entries(daily)) {
    (migraineDays.has(k) ? on : off).push(v);
  }
  const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  return { onMigraine: avg(on), offMigraine: avg(off), dayCount: Object.keys(daily).length };
}

function topCounts(items: string[]): { label: string; count: number }[] {
  const c: Record<string, number> = {};
  for (const i of items) c[i] = (c[i] ?? 0) + 1;
  return Object.entries(c)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export type Summary = ReturnType<typeof computeSummary>;

export function computeSummary(
  migraines: Migraine[],
  metrics: Metric[],
  fromDate: Date,
  toDate: Date,
) {
  const from = fromDate.getTime();
  const to = toDate.getTime();
  const inRange = migraines.filter((m) => {
    const t = new Date(m.started_at).getTime();
    return t >= from && t <= to;
  });
  const days = Math.max(1, Math.round((to - from) / (1000 * 60 * 60 * 24)));

  const totalEpisodes = inRange.length;
  const avgSeverity =
    totalEpisodes ? inRange.reduce((a, m) => a + m.severity, 0) / totalEpisodes : 0;
  const durations = inRange.map((m) => m.duration_minutes ?? 0);
  const totalDuration = durations.reduce((a, b) => a + b, 0);
  const avgDuration = totalEpisodes ? totalDuration / totalEpisodes : 0;
  const longest =
    inRange.length === 0
      ? null
      : inRange.reduce((a, b) =>
          (b.duration_minutes ?? 0) > (a.duration_minutes ?? 0) ? b : a,
        );

  const migraineDayKeys = new Set(inRange.map((m) => dayKey(m.started_at)));
  const migraineDayCount = migraineDayKeys.size;
  const frequencyPerMonth = totalEpisodes / (days / 30);

  const topLocations = topCounts(inRange.flatMap((m) => m.brain_locations));
  const topSymptoms = topCounts(inRange.flatMap((m) => m.symptoms));
  const topTriggers = topCounts(inRange.flatMap((m) => m.triggers));
  const meds = topCounts(inRange.flatMap((m) => m.medications));

  const metricsInRange = metrics.filter((m) => {
    const t = new Date(m.recorded_at).getTime();
    return t >= from && t <= to;
  });

  const wearable = {
    sleep: splitOnOff(bucketDaily(metricsInRange, "sleep_minutes"), migraineDayKeys),
    restingHr: splitOnOff(bucketDaily(metricsInRange, "resting_heart_rate"), migraineDayKeys),
    hrv: splitOnOff(bucketDaily(metricsInRange, "hrv_sdnn"), migraineDayKeys),
    steps: splitOnOff(bucketDaily(metricsInRange, "steps"), migraineDayKeys),
  };

  return {
    days,
    totalEpisodes,
    avgSeverity,
    avgDuration,
    longest,
    totalDuration,
    frequencyPerMonth,
    migraineDayCount,
    topLocations,
    topSymptoms,
    topTriggers,
    meds,
    wearable,
    inRange,
  };
}

// --- Markdown ----------------------------------------------------------------

const fmt = (n: number | null | undefined, d = 1) =>
  n == null || Number.isNaN(n) ? "—" : n.toFixed(d);

const fmtMins = (m: number | null | undefined) => {
  if (m == null) return "—";
  return m >= 60 ? `${(m / 60).toFixed(1)} h` : `${Math.round(m)} min`;
};

const escapeCell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");

function bulletList(title: string, items: { label: string; count: number }[]) {
  if (!items.length) return "";
  return `## ${title}\n\n${items.map((i) => `- ${i.label} — **${i.count}**`).join("\n")}\n\n`;
}

export function buildMarkdown(
  profile: Profile,
  summary: Summary,
  migraines: Migraine[],
  range: { from: Date; to: Date },
) {
  const periodStr = `${range.from.toISOString().slice(0, 10)} → ${range.to.toISOString().slice(0, 10)}`;
  const pct = summary.days
    ? ((summary.migraineDayCount / summary.days) * 100).toFixed(0)
    : "0";

  let md = `# Migraine Clinical Report\n\n`;
  md += `_Generated ${new Date().toISOString().replace("T", " ").slice(0, 16)} UTC_\n\n`;
  md += `**Reporting period:** ${periodStr} (${summary.days} days)\n\n`;

  md += `## Patient\n\n`;
  md += `- **Name:** ${profile.display_name || "—"}\n`;
  md += `- **DOB:** ${profile.date_of_birth || "—"}\n`;
  md += `- **Sex:** ${profile.sex || "—"}\n\n`;

  if (summary.totalEpisodes === 0) {
    md += `_No episodes recorded in this period._\n\n`;
  } else {
    md += `## Episode summary\n\n`;
    md += `| Metric | Value |\n|---|---|\n`;
    md += `| Total episodes | ${summary.totalEpisodes} |\n`;
    md += `| Migraine days | ${summary.migraineDayCount} (${pct}% of period) |\n`;
    md += `| Frequency | ${fmt(summary.frequencyPerMonth)} / month |\n`;
    md += `| Avg severity | ${fmt(summary.avgSeverity)} / 10 |\n`;
    md += `| Avg duration | ${fmtMins(summary.avgDuration)} |\n`;
    md += `| Total time affected | ${fmtMins(summary.totalDuration)} |\n`;
    md += `| Longest episode | ${fmtMins(summary.longest?.duration_minutes ?? null)} |\n\n`;

    md += bulletList("Pain location frequency", summary.topLocations);
    md += bulletList("Symptoms reported", summary.topSymptoms);
    md += bulletList("Suspected triggers", summary.topTriggers);
    md += bulletList("Medications used", summary.meds);
  }

  const hasWearable = Object.values(summary.wearable).some((w) => w.dayCount > 0);
  if (hasWearable) {
    md += `## Wearable signals — migraine vs non-migraine days\n\n`;
    md += `| Signal | On migraine days | Off migraine days |\n|---|---|---|\n`;
    md += `| Sleep (h) | ${fmt(summary.wearable.sleep.onMigraine != null ? summary.wearable.sleep.onMigraine / 60 : null)} | ${fmt(summary.wearable.sleep.offMigraine != null ? summary.wearable.sleep.offMigraine / 60 : null)} |\n`;
    md += `| Resting HR (bpm) | ${fmt(summary.wearable.restingHr.onMigraine, 0)} | ${fmt(summary.wearable.restingHr.offMigraine, 0)} |\n`;
    md += `| HRV SDNN (ms) | ${fmt(summary.wearable.hrv.onMigraine, 0)} | ${fmt(summary.wearable.hrv.offMigraine, 0)} |\n`;
    md += `| Steps | ${fmt(summary.wearable.steps.onMigraine, 0)} | ${fmt(summary.wearable.steps.offMigraine, 0)} |\n\n`;
  }

  if (summary.totalEpisodes > 0) {
    md += `## Episode log\n\n`;
    md += `| Date | Severity | Duration | Location | Symptoms | Medication | Triggers | Notes |\n`;
    md += `|---|---|---|---|---|---|---|---|\n`;
    for (const m of summary.inRange) {
      md += `| ${new Date(m.started_at).toISOString().slice(0, 16).replace("T", " ")} | ${m.severity}/10 | ${fmtMins(m.duration_minutes)} | ${escapeCell(m.brain_locations.join(", "))} | ${escapeCell(m.symptoms.join(", "))} | ${escapeCell(m.medications.join(", "))} | ${escapeCell(m.triggers.join(", "))} | ${escapeCell(m.notes ?? "")} |\n`;
    }
    md += `\n`;
  }

  md += `---\n_For clinical reference only._\n`;
  return md;
}
