import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { loadEpisodes } from "@/lib/store";
import { health30 } from "@/lib/mock-sleep";
import {
  DEFAULT_PROFILE,
  buildMarkdown,
  computeSummary,
  episodeToMigraine,
  healthToMetrics,
  type Summary,
} from "@/lib/reportData";
import { useEffect, useMemo, useState } from "react";
import { FileText, Download, Copy, Check, FileDown } from "lucide-react";
import jsPDF from "jspdf";

export const Route = createFileRoute("/report")({
  head: () => ({ meta: [{ title: "GP report — Migraina" }] }),
  component: ReportPage,
});

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function ReportPage() {
  const [episodes, setEpisodes] = useState<ReturnType<typeof loadEpisodes>>([]);
  const [copied, setCopied] = useState(false);

  const today = new Date();
  const ninetyAgo = new Date();
  ninetyAgo.setDate(today.getDate() - 90);
  const [from, setFrom] = useState(isoDate(ninetyAgo));
  const [to, setTo] = useState(isoDate(today));

  useEffect(() => {
    setEpisodes(loadEpisodes());
  }, []);

  const { markdown, summary, fromDate, toDate } = useMemo(() => {
    const fromDate = new Date(`${from}T00:00:00`);
    const toDate = new Date(`${to}T23:59:59`);
    const migraines = episodes.map(episodeToMigraine);
    const metrics = healthToMetrics(health30);
    const summary = computeSummary(migraines, metrics, fromDate, toDate);
    const markdown = buildMarkdown(DEFAULT_PROFILE, summary, migraines, {
      from: fromDate,
      to: toDate,
    });
    return { markdown, summary, fromDate, toDate };
  }, [episodes, from, to]);

  async function copy() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function downloadMd() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `migraine-report-${from}-to-${to}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPdf() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const lines = doc.splitTextToSize(markdown, 480);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    let y = 56;
    for (const line of lines) {
      if (y > 780) {
        doc.addPage();
        y = 56;
      }
      doc.text(line, 56, y);
      y += 13;
    }
    doc.save(`migraine-report-${from}-to-${to}.pdf`);
  }

  return (
    <MobileShell title="GP report">
      <div className="px-5 pt-5">
        <div className="rounded-3xl bg-gradient-to-br from-secondary to-card p-5">
          <FileText className="h-7 w-7 text-primary" />
          <h2 className="mt-3 text-lg font-semibold">Clinician-ready report</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Visual preview of the PDF your GP will receive.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="rounded-2xl bg-card p-3 text-xs shadow-sm">
            <span className="text-muted-foreground">From</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 w-full bg-transparent text-sm font-medium outline-none"
            />
          </label>
          <label className="rounded-2xl bg-card p-3 text-xs shadow-sm">
            <span className="text-muted-foreground">To</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full bg-transparent text-sm font-medium outline-none"
            />
          </label>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <button
            onClick={downloadPdf}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-primary py-3 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/20"
          >
            <FileDown className="h-3.5 w-3.5" /> PDF
          </button>
          <button
            onClick={downloadMd}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-card py-3 text-xs font-semibold shadow-sm"
          >
            <Download className="h-3.5 w-3.5" /> .md
          </button>
          <button
            onClick={copy}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-card py-3 text-xs font-semibold shadow-sm"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <div className="mt-5 text-[11px] uppercase tracking-widest text-muted-foreground">
          PDF preview
        </div>
        <PdfPreview summary={summary} from={fromDate} to={toDate} />

        <p className="mt-3 pb-2 text-center text-[11px] text-muted-foreground">
          In the iOS app this opens the native share sheet — email it straight to your GP.
        </p>
      </div>
    </MobileShell>
  );
}

function PdfPreview({ summary, from, to }: { summary: Summary; from: Date; to: Date }) {
  const period = `${isoDate(from)} → ${isoDate(to)}`;
  const pct = summary.days
    ? Math.round((summary.migraineDayCount / summary.days) * 100)
    : 0;
  const fmtH = (m: number | null | undefined) =>
    m == null ? "—" : m >= 60 ? `${(m / 60).toFixed(1)} h` : `${Math.round(m)} min`;

  return (
    <div
      className="mt-2 overflow-hidden rounded-2xl border border-border shadow-lg"
      style={{ background: "#ffffff", color: "#1a1a1a" }}
    >
      {/* Paper sheet */}
      <div
        className="space-y-4 px-5 py-6 text-[10.5px] leading-relaxed"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        <header className="border-b border-neutral-200 pb-3">
          <h1 className="text-base font-bold tracking-tight text-neutral-900">
            Migraine Clinical Report
          </h1>
          <p className="mt-0.5 text-[9px] text-neutral-500">
            Reporting period: {period} · {summary.days} days
          </p>
        </header>

        <section>
          <h2 className="mb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-700">
            Episode summary
          </h2>
          <table className="w-full border-collapse text-[10px]">
            <tbody>
              <PdfRow k="Total episodes" v={`${summary.totalEpisodes}`} />
              <PdfRow
                k="Migraine days"
                v={`${summary.migraineDayCount} (${pct}% of period)`}
              />
              <PdfRow
                k="Frequency"
                v={`${summary.frequencyPerMonth.toFixed(1)} / month`}
              />
              <PdfRow k="Avg severity" v={`${summary.avgSeverity.toFixed(1)} / 10`} />
              <PdfRow k="Avg duration" v={fmtH(summary.avgDuration)} />
              <PdfRow k="Total time affected" v={fmtH(summary.totalDuration)} />
              <PdfRow
                k="Longest episode"
                v={fmtH(summary.longest?.duration_minutes ?? null)}
              />
            </tbody>
          </table>
        </section>

        {summary.topLocations.length > 0 && (
          <PdfBullets title="Pain location frequency" items={summary.topLocations} />
        )}
        {summary.topSymptoms.length > 0 && (
          <PdfBullets title="Symptoms reported" items={summary.topSymptoms} />
        )}
        {summary.topTriggers.length > 0 && (
          <PdfBullets title="Suspected triggers" items={summary.topTriggers} />
        )}
        {summary.meds.length > 0 && (
          <PdfBullets title="Medications used" items={summary.meds} />
        )}

        <section>
          <h2 className="mb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-700">
            Wearable signals — migraine vs non-migraine
          </h2>
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="border-b border-neutral-300 text-left text-neutral-500">
                <th className="py-1 font-medium">Signal</th>
                <th className="py-1 text-right font-medium">On days</th>
                <th className="py-1 text-right font-medium">Off days</th>
              </tr>
            </thead>
            <tbody>
              <WearRow
                label="Sleep (h)"
                on={summary.wearable.sleep.onMigraine != null ? summary.wearable.sleep.onMigraine / 60 : null}
                off={summary.wearable.sleep.offMigraine != null ? summary.wearable.sleep.offMigraine / 60 : null}
                digits={1}
              />
              <WearRow
                label="Resting HR (bpm)"
                on={summary.wearable.restingHr.onMigraine}
                off={summary.wearable.restingHr.offMigraine}
                digits={0}
              />
              <WearRow
                label="Steps"
                on={summary.wearable.steps.onMigraine}
                off={summary.wearable.steps.offMigraine}
                digits={0}
              />
            </tbody>
          </table>
        </section>

        {summary.inRange.length > 0 && (
          <section>
            <h2 className="mb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-700">
              Episode log
            </h2>
            <table className="w-full border-collapse text-[9px]">
              <thead>
                <tr className="border-b border-neutral-300 text-left text-neutral-500">
                  <th className="py-1 font-medium">Date</th>
                  <th className="py-1 font-medium">Sev.</th>
                  <th className="py-1 font-medium">Dur.</th>
                  <th className="py-1 font-medium">Location</th>
                </tr>
              </thead>
              <tbody>
                {summary.inRange.slice(0, 10).map((m) => (
                  <tr key={m.id} className="border-b border-neutral-100">
                    <td className="py-1 pr-2 text-neutral-800">
                      {new Date(m.started_at).toISOString().slice(0, 10)}
                    </td>
                    <td className="py-1 pr-2 text-neutral-800">{m.severity}/10</td>
                    <td className="py-1 pr-2 text-neutral-800">{fmtH(m.duration_minutes)}</td>
                    <td className="py-1 text-neutral-700">
                      {m.brain_locations.join(", ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {summary.inRange.length > 10 && (
              <p className="mt-1 text-[9px] italic text-neutral-500">
                + {summary.inRange.length - 10} more in the downloaded PDF
              </p>
            )}
          </section>
        )}

        <footer className="border-t border-neutral-200 pt-2 text-center text-[9px] italic text-neutral-500">
          For clinical reference only.
        </footer>
      </div>
    </div>
  );
}

function PdfRow({ k, v }: { k: string; v: string }) {
  return (
    <tr className="border-b border-neutral-100">
      <td className="py-1 pr-2 text-neutral-600">{k}</td>
      <td className="py-1 text-right font-medium text-neutral-900">{v}</td>
    </tr>
  );
}

function PdfBullets({
  title,
  items,
}: {
  title: string;
  items: { label: string; count: number }[];
}) {
  return (
    <section>
      <h2 className="mb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-700">
        {title}
      </h2>
      <ul className="space-y-0.5">
        {items.slice(0, 5).map((i) => (
          <li
            key={i.label}
            className="flex justify-between border-b border-neutral-100 py-0.5 text-neutral-800"
          >
            <span className="capitalize">{i.label}</span>
            <span className="font-semibold">{i.count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function WearRow({
  label,
  on,
  off,
  digits,
}: {
  label: string;
  on: number | null;
  off: number | null;
  digits: number;
}) {
  const fmt = (n: number | null) => (n == null || isNaN(n) ? "—" : n.toFixed(digits));
  return (
    <tr className="border-b border-neutral-100">
      <td className="py-1 text-neutral-700">{label}</td>
      <td className="py-1 text-right font-medium text-neutral-900">{fmt(on)}</td>
      <td className="py-1 text-right text-neutral-700">{fmt(off)}</td>
    </tr>
  );
}
