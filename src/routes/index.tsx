import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { loadEpisodes } from "@/lib/store";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Watch, Brain, Lightbulb } from "lucide-react";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Migraina" },
      { name: "description", content: "Track sleep and headache episodes from your iPhone." },
    ],
  }),
  component: Home,
});

type RiskLevel = "low" | "moderate" | "high";

function computeRisk(episodes: ReturnType<typeof loadEpisodes>): {
  score: number;
  level: RiskLevel;
  summary: string;
  drivers: string[];
} {
  const now = Date.now();
  const windowMs = 7 * 86_400_000;
  const recent = episodes.filter(
    (e) => now - new Date(e.createdAt).getTime() <= windowMs,
  );

  let score = 0;
  let maxIntensity = 0;
  for (const e of recent) {
    const ageDays = (now - new Date(e.createdAt).getTime()) / 86_400_000;
    const recency = Math.max(0, 1 - ageDays / 7); // 1 today → 0 at 7d
    const intensity = Math.max(0, ...e.markers.map((m) => m.intensity));
    maxIntensity = Math.max(maxIntensity, intensity);
    score += intensity * recency * 6;
  }
  score = Math.min(100, Math.round(score));

  const level: RiskLevel = score >= 67 ? "high" : score >= 34 ? "moderate" : "low";

  const drivers: string[] = [];
  if (recent.length >= 3) drivers.push("frequent episodes");
  else if (recent.length >= 1) drivers.push(`${recent.length} recent episode${recent.length > 1 ? "s" : ""}`);
  if (maxIntensity >= 7) drivers.push("high intensity");
  else if (maxIntensity >= 4) drivers.push("moderate intensity");

  const summary =
    level === "high"
      ? "Multiple or intense recent episodes — risk is elevated. Rest, hydrate, and avoid known triggers."
      : level === "moderate"
        ? "Some recent episodes detected. Watch for triggers and prioritize sleep."
        : recent.length === 0
          ? "No recent episodes logged. Risk is low today."
          : "Recent episodes are mild and infrequent. Risk stays low.";

  return { score, level, summary, drivers };
}

function Home() {
  const [episodes, setEpisodes] = useState<ReturnType<typeof loadEpisodes>>([]);
  const [today, setToday] = useState<string>("");

  useEffect(() => {
    const refresh = () => setEpisodes(loadEpisodes());
    refresh();
    setToday(
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    );
    // Refresh on focus/visibility so the score updates after logging.
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const prediction = useMemo(() => computeRisk(episodes), [episodes]);

  const predColor =
    prediction.level === "high"
      ? "var(--pain-high)"
      : prediction.level === "moderate"
        ? "var(--pain-mid)"
        : "var(--pain-low)";

  return (
    <MobileShell>
      <section className="px-5 pb-2 pt-8">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{today || "\u00a0"}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Heads Up</h1>
      </section>

      <section className="px-5 pt-6">
        <div
          className="rounded-3xl border border-border bg-card p-5 shadow-sm"
          style={{ boxShadow: `0 10px 30px -18px ${predColor}` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <Brain className="h-3.5 w-3.5" /> AI migraine risk
            </div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Today</span>
          </div>

          <RiskGauge score={prediction.score} level={prediction.level} />
          <div className="mt-1 flex items-end justify-between">
            <div>
              <div className="text-2xl font-semibold capitalize" style={{ color: predColor }}>
                {prediction.level}
              </div>
              <div className="text-xs text-muted-foreground">Score {prediction.score}/100</div>
            </div>
            <div className="text-right text-[11px] text-muted-foreground">
              Based on logged
              <br />episodes (7d)
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-foreground/80">{prediction.summary}</p>
          {prediction.drivers.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {prediction.drivers.map((d) => (
                <span
                  key={d}
                  className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-medium text-secondary-foreground"
                >
                  {d}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="px-5 pt-6">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Lightbulb className="h-3.5 w-3.5" /> Heads Up Suggestions
          </div>
          <ul className="mt-3 space-y-2">
            {[
              { icon: "💧", text: "Drink more water, less coffee!" },
              { icon: "🚶", text: "Stand up and walk!" },
              { icon: "🧘", text: "Breathe and relax!" },
            ].map((s) => (
              <li
                key={s.text}
                className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-3 py-2.5 text-sm"
              >
                <span className="text-lg leading-none">{s.icon}</span>
                <span className="text-foreground/90">{s.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-5 pt-6">
        <Link
          to="/log"
          className="block rounded-3xl border border-dashed border-primary/40 bg-secondary/40 p-5 text-center"
        >
          <div className="text-sm font-medium text-primary">+ Log a headache</div>
          <p className="mt-1 text-xs text-muted-foreground">Pick the diagram that matches your pain</p>
        </Link>
      </section>

      <section className="px-5 pt-4">
        <Link
          to="/devices"
          className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "var(--secondary)" }}
            >
              <Watch className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-sm font-medium">iPhone &amp; Watch preview</div>
              <div className="text-xs text-muted-foreground">Notifications &amp; 1-tap log shortcut</div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </section>

      <section className="px-5 pt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight">Recent episodes</h2>
          <span className="text-xs text-muted-foreground">{episodes.length} total</span>
        </div>
        <ul className="space-y-2">
          {episodes.slice(0, 5).map((e) => {
            const max = Math.max(...e.markers.map((m) => m.intensity), 0);
            return (
              <li key={e.id}>
                <Link
                  to="/episodes/$id"
                  params={{ id: e.id }}
                  className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-sm"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {new Date(e.createdAt).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {e.durationMinutes}m · {e.triggers.join(", ") || "no trigger"}
                    </div>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{
                      background:
                        max > 6
                          ? "color-mix(in oklab, var(--pain-high) 20%, transparent)"
                          : max > 3
                            ? "color-mix(in oklab, var(--pain-mid) 25%, transparent)"
                            : "color-mix(in oklab, var(--pain-low) 25%, transparent)",
                      color: max > 6 ? "var(--pain-high)" : max > 3 ? "oklch(0.4 0.1 70)" : "oklch(0.35 0.1 150)",
                    }}
                  >
                    {max}/10
                  </span>
                </Link>
              </li>
            );
          })}
          {episodes.length === 0 && (
            <li className="rounded-2xl bg-muted p-6 text-center text-sm text-muted-foreground">
              No episodes logged yet.
            </li>
          )}
        </ul>
      </section>
    </MobileShell>
  );
}

function RiskGauge({ score, level }: { score: number; level: "low" | "moderate" | "high" }) {
  const clamped = Math.max(0, Math.min(100, score));
  // Apple-style Health-app palette: green → yellow → red.
  const APPLE_GREEN = "#34C759";
  const APPLE_YELLOW = "#FFCC00";
  const APPLE_RED = "#FF3B30";

  return (
    <div className="mt-3">
      <div className="relative h-3 w-full rounded-full"
        style={{
          background: `linear-gradient(to right, ${APPLE_GREEN} 0%, ${APPLE_YELLOW} 50%, ${APPLE_RED} 100%)`,
        }}
      >
        {/* Pointer */}
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all"
          style={{ left: `${clamped}%` }}
          aria-label={`Risk level: ${level}`}
        >
          <div
            className="h-5 w-1.5 rounded-full bg-foreground"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.25)" }}
          />
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <span>Low</span>
        <span>Moderate</span>
        <span>Risk</span>
      </div>
    </div>
  );
}
