// Apple Health import — XML (export.xml) + generic CSV.
import type { Metric } from "./reportData";

const TYPE_MAP: Record<string, string> = {
  HKQuantityTypeIdentifierStepCount: "steps",
  HKQuantityTypeIdentifierRestingHeartRate: "resting_heart_rate",
  HKQuantityTypeIdentifierHeartRateVariabilitySDNN: "hrv_sdnn",
  HKCategoryTypeIdentifierSleepAnalysis: "sleep_minutes",
};

export function parseAppleHealthXml(xml: string): Metric[] {
  const out: Metric[] = [];
  const re = /<Record\b([^>]*?)\/>/g;
  const attr = (s: string, name: string) => {
    const m = s.match(new RegExp(`${name}="([^"]*)"`));
    return m ? m[1] : "";
  };
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const a = m[1];
    const type = attr(a, "type");
    const mapped = TYPE_MAP[type];
    if (!mapped) continue;
    const startDate = attr(a, "startDate");
    const endDate = attr(a, "endDate");
    const unit = attr(a, "unit") || null;
    const source = attr(a, "sourceName") || "apple_health";
    let value = parseFloat(attr(a, "value"));
    if (mapped === "sleep_minutes") {
      const s = new Date(startDate).getTime();
      const e = new Date(endDate).getTime();
      if (!isFinite(s) || !isFinite(e)) continue;
      value = Math.max(0, (e - s) / 60000);
    }
    if (!isFinite(value)) continue;
    out.push({
      metric_type: mapped,
      value,
      unit: mapped === "sleep_minutes" ? "min" : unit,
      recorded_at: startDate,
      end_at: endDate || null,
      source,
    });
  }
  return out;
}

export function parseCsv(text: string): Metric[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  const idx = (k: string) => headers.indexOf(k);
  const iType = idx("metric_type"),
    iVal = idx("value"),
    iUnit = idx("unit"),
    iRec = idx("recorded_at"),
    iEnd = idx("end_at"),
    iSrc = idx("source");
  const out: Metric[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length < 4) continue;
    const value = parseFloat(cols[iVal]);
    if (!isFinite(value)) continue;
    out.push({
      metric_type: cols[iType]?.trim(),
      value,
      unit: iUnit >= 0 ? cols[iUnit]?.trim() || null : null,
      recorded_at: cols[iRec]?.trim(),
      end_at: iEnd >= 0 ? cols[iEnd]?.trim() || null : null,
      source: iSrc >= 0 ? cols[iSrc]?.trim() || "csv" : "csv",
    });
  }
  return out;
}

// --- Local storage layer for imported metrics --------------------------------

const KEY = "ms.metrics";

export function loadImportedMetrics(): Metric[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function addImportedMetrics(records: Metric[]) {
  const existing = loadImportedMetrics();
  localStorage.setItem(KEY, JSON.stringify([...existing, ...records]));
  window.dispatchEvent(new Event("ms-storage"));
}

export function clearImportedMetrics() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("ms-storage"));
}

export async function importFromFile(file: File): Promise<Metric[]> {
  const text = await file.text();
  const records = file.name.toLowerCase().endsWith(".csv")
    ? parseCsv(text)
    : parseAppleHealthXml(text);
  if (records.length) addImportedMetrics(records);
  return records;
}
