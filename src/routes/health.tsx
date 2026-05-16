import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { health7, health30 } from "@/lib/mock-sleep";
import { loadEpisodes } from "@/lib/store";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Moon, Heart, Footprints, Activity, Check, Watch, Waves } from "lucide-react";
void Activity;

export const Route = createFileRoute("/health")({
  head: () => ({ meta: [{ title: "Health — Migraina" }] }),
  component: HealthPage,
});

function HealthPage() {
  const [range, setRange] = useState<"7" | "30">("7");
  const data = range === "7" ? health7 : health30;
  const [episodes, setEpisodes] = useState<ReturnType<typeof loadEpisodes>>([]);
  useEffect(() => {
    setEpisodes(loadEpisodes());
  }, []);

  const sleep = data[data.length - 1];
  const avg7 = Math.round(health7.reduce((a, b) => a + b.quality, 0) / health7.length);
  const avgSleep = Math.round(data.reduce((a, b) => a + b.quality, 0) / data.length);
  const avgHr = Math.round(data.reduce((a, b) => a + b.restingHr, 0) / data.length);
  const avgSteps = Math.round(data.reduce((a, b) => a + b.steps, 0) / data.length);
  const avgHrv = Math.round(data.reduce((a, b) => a + b.hrv, 0) / data.length);

  const correlation = useMemo(() => {
    const headacheDays = new Set(
      episodes.map((e) => new Date(e.createdAt).toISOString().slice(0, 10))
    );
    const badSleep = health7.filter((n) => n.quality < 60).map((n) => n.date);
    const overlap = badSleep.filter((d) => headacheDays.has(d)).length;
    return { badSleep: badSleep.length, overlap };
  }, [episodes]);

  return (
    <MobileShell title="Health">
      <div className="px-5 pt-5">
        {/* Sleep tonight */}
        <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/70 p-5 text-primary-foreground shadow-lg shadow-primary/20">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-80">
            <Moon className="h-3.5 w-3.5" /> Sleep tonight
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <div className="text-4xl font-semibold">{sleep.hours}h</div>
              <div className="text-xs opacity-80">Quality {sleep.quality}/100</div>
            </div>
            <div className="text-right text-[11px] opacity-90">
              7-day avg<br />{avg7}/100
            </div>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/20">
            <div className="h-full bg-white" style={{ width: `${sleep.quality}%` }} />
          </div>
          <p className="mt-3 text-xs opacity-90">
            {avg7 < 60
              ? "Sleep dips often precede your headaches."
              : "You've been sleeping consistently."}
          </p>
        </div>

        <div className="mt-5 inline-flex rounded-full bg-muted p-1 text-xs font-medium">
          {(["7", "30"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-4 py-1.5 transition ${
                range === r ? "bg-card text-foreground shadow" : "text-muted-foreground"
              }`}
            >
              {r} days
            </button>
          ))}
        </div>

        {/* Sleep */}
        <MetricCard
          icon={<Moon className="h-3.5 w-3.5" />}
          label="Sleep quality"
          value={`${avgSleep}`}
          unit="/100 avg"
        >
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ left: -20, right: 5, top: 5 }}>
              <defs>
                <linearGradient id="gSleep" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="quality" stroke="var(--primary)" fill="url(#gSleep)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </MetricCard>

        {/* Heart rate */}
        <MetricCard
          icon={<Heart className="h-3.5 w-3.5" />}
          label="Resting heart rate"
          value={`${avgHr}`}
          unit="bpm avg"
        >
          <ResponsiveContainer>
            <LineChart data={data} margin={{ left: -20, right: 5, top: 5 }}>
              <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[40, 90]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="restingHr" stroke="var(--pain-high)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </MetricCard>

        {/* HRV — stress proxy */}
        <MetricCard
          icon={<Waves className="h-3.5 w-3.5" />}
          label="Heart rate variability"
          value={`${avgHrv}`}
          unit="ms avg · stress proxy"
        >
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ left: -20, right: 5, top: 5 }}>
              <defs>
                <linearGradient id="gHrv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[20, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="hrv" stroke="var(--accent)" fill="url(#gHrv)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </MetricCard>

        <MetricCard
          icon={<Footprints className="h-3.5 w-3.5" />}
          label="Steps"
          value={avgSteps.toLocaleString()}
          unit="avg / day"
        >
          <ResponsiveContainer>
            <BarChart data={data} margin={{ left: -10, right: 5, top: 5 }}>
              <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="steps" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </MetricCard>

        <div className="mt-5 rounded-3xl bg-secondary/60 p-5">
          <div className="text-xs uppercase tracking-widest text-secondary-foreground/70">
            Pattern insight
          </div>
          <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">
            You had poor sleep on <strong>{correlation.badSleep}</strong> of the last 7
            nights. <strong>{correlation.overlap}</strong> of those overlapped with a
            logged headache.
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Health data is mocked in this prototype. The iOS app reads sleep, heart rate
            and steps directly from Apple Health.
          </p>
        </div>

        <div className="mt-5 rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <Activity className="h-3.5 w-3.5" /> Apple Health
            </div>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold"
              style={{
                background: "color-mix(in oklab, var(--pain-low) 18%, transparent)",
                color: "var(--pain-low)",
              }}
            >
              <Check className="h-3 w-3" /> Synced
            </span>
          </div>
          <p className="mt-2 text-sm text-foreground">
            Live data from your iPhone &amp; Apple Watch.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
            <SyncRow icon={<Moon className="h-3 w-3" />} label="Sleep" source="iPhone" />
            <SyncRow icon={<Heart className="h-3 w-3" />} label="Heart rate" source="Apple Watch" />
            <SyncRow icon={<Footprints className="h-3 w-3" />} label="Steps" source="iPhone" />
            <SyncRow icon={<Watch className="h-3 w-3" />} label="HRV" source="Apple Watch" />
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Last sync just now · background updates every 15 min
          </p>
        </div>
      </div>
    </MobileShell>
  );
}

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
} as const;

function MetricCard({
  icon,
  label,
  value,
  unit,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 rounded-3xl bg-card p-4 shadow-sm">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">
        {value}
        <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
      </div>
      <div className="mt-3 h-36">{children}</div>
    </div>
  );
}

function SyncRow({
  icon,
  label,
  source,
}: {
  icon: React.ReactNode;
  label: string;
  source: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2">
      <span className="flex items-center gap-1.5 font-medium">
        {icon} {label}
      </span>
      <span className="text-muted-foreground">{source}</span>
    </div>
  );
}
