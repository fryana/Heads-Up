// Mock Apple Health data. Shape mirrors HealthKit samples so the iOS
// developer has the expected contract to swap in real HealthKit queries
// (HKCategoryTypeIdentifier.sleepAnalysis, HKQuantityTypeIdentifier.heartRate,
// HKQuantityTypeIdentifier.stepCount).
export type HealthDay = {
  date: string; // YYYY-MM-DD
  hours: number;
  quality: number; // 0-100 sleep score
  restingHr: number; // bpm
  steps: number;
  hrv: number; // ms (HRV SDNN) — lower = more stress
};

export type SleepNight = HealthDay; // back-compat alias

function gen(days: number): HealthDay[] {
  const out: HealthDay[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const seed = (d.getDate() * 13 + d.getMonth() * 7) % 100;
    const hours = 5 + (seed % 50) / 10;
    const quality = Math.round(35 + ((seed * 1.3) % 60));
    const restingHr = Math.round(55 + ((seed * 0.7) % 20)); // 55-75
    const steps = Math.round(2500 + ((seed * 137) % 11000)); // 2.5k-13.5k
    const hrv = Math.round(28 + ((seed * 1.9) % 55)); // 28-83 ms
    out.push({
      date: d.toISOString().slice(0, 10),
      hours: +hours.toFixed(1),
      quality,
      restingHr,
      steps,
      hrv,
    });
  }
  return out;
}

export const sleep7 = gen(7);
export const sleep30 = gen(30);
export const health7 = sleep7;
export const health30 = sleep30;

export function todaysSleep(): HealthDay {
  return sleep7[sleep7.length - 1];
}
export const todaysHealth = todaysSleep;

// Pain-risk score (0-100) blending the three Apple Health signals.
// Lower sleep quality, elevated resting HR (stress proxy), and very low
// or very high step counts each nudge risk up. Tuned for prototype demo.
export function painRisk(d: HealthDay): { score: number; level: "low" | "moderate" | "high"; drivers: string[] } {
  const sleepPenalty = Math.max(0, 70 - d.quality) * 0.6; // 0-42
  const hrPenalty = Math.max(0, d.restingHr - 60) * 1.4; // 0 at <=60, ~21 at 75
  const stepsDelta = Math.abs(d.steps - 8000);
  const stepsPenalty = Math.min(20, stepsDelta / 400); // 0-20
  const raw = sleepPenalty + hrPenalty + stepsPenalty;
  const score = Math.min(100, Math.round(raw));
  const drivers: string[] = [];
  if (sleepPenalty > 10) drivers.push("low sleep quality");
  if (hrPenalty > 8) drivers.push("elevated resting heart rate");
  if (stepsPenalty > 8) drivers.push(d.steps < 8000 ? "low activity" : "intense activity");
  const level: "low" | "moderate" | "high" = score < 30 ? "low" : score < 60 ? "moderate" : "high";
  return { score, level, drivers };
}
