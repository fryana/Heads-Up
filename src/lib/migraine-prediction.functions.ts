import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway";

const PredictionSchema = z.object({
  score: z.number().min(0).max(100),
  level: z.enum(["low", "moderate", "high"]),
  drivers: z.array(z.string()).max(3),
  summary: z.string().max(140),
});

type MigrainePrediction = z.infer<typeof PredictionSchema>;

const InputSchema = z.object({
  days: z
    .array(
      z.object({
        date: z.string(),
        hours: z.number(),
        quality: z.number(),
        hrv: z.number(),
        steps: z.number(),
      }),
    )
    .min(1)
    .max(7),
  recentEpisodes: z
    .array(
      z.object({
        date: z.string(),
        intensity: z.number(),
        durationMinutes: z.number(),
        triggers: z.array(z.string()).optional(),
      }),
    )
    .max(20)
    .optional(),
});

const clampScore = (score: number) => Math.max(0, Math.min(100, Math.round(score)));

const fallbackPrediction = (
  days: z.infer<typeof InputSchema>["days"],
  recentEpisodes: z.infer<typeof InputSchema>["recentEpisodes"] = [],
): MigrainePrediction => {
  const today = days.at(-1) ?? days[0];
  const avgSteps = days.reduce((sum, day) => sum + day.steps, 0) / days.length;
  const sleepPenalty = Math.max(0, (7.5 - today.hours) * 9);
  const qualityPenalty = Math.max(0, 70 - today.quality) * 0.45;
  const hrvPenalty = Math.max(0, 55 - today.hrv) * 0.55;
  const activityPenalty = Math.min(18, Math.abs(today.steps - avgSteps) / 450);

  // Recent migraine episodes raise short-term risk.
  const now = Date.now();
  const episodePenalty = (recentEpisodes ?? []).reduce((sum, ep) => {
    const ageDays = Math.max(0, (now - new Date(ep.date).getTime()) / 86_400_000);
    if (ageDays > 7) return sum;
    const recency = Math.max(0, 1 - ageDays / 7); // 1 today → 0 at 7d
    return sum + ep.intensity * 2.2 * recency;
  }, 0);

  const score = clampScore(
    18 + sleepPenalty + qualityPenalty + hrvPenalty + activityPenalty + episodePenalty,
  );
  const level = score >= 67 ? "high" : score >= 34 ? "moderate" : "low";
  const drivers = [
    today.hours < 7 ? "short sleep" : null,
    today.quality < 70 ? "lower sleep quality" : null,
    today.hrv < 55 ? "lower HRV" : null,
    Math.abs(today.steps - avgSteps) > 2500 ? "activity variance" : null,
    episodePenalty > 6 ? "recent episodes" : null,
  ].filter((driver): driver is string => Boolean(driver)).slice(0, 3);

  return {
    score,
    level,
    drivers,
    summary: `Estimated ${level} risk from recent sleep, HRV, activity, and logged episodes.`,
  };
};

export const predictMigraineScore = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return fallbackPrediction(data.days, data.recentEpisodes);

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const episodesBlock = (data.recentEpisodes ?? []).length
      ? `\nRecent logged migraine episodes (last 7 days):\n${(data.recentEpisodes ?? [])
          .map(
            (e) =>
              `- ${e.date}: intensity ${e.intensity}/10, ${e.durationMinutes}m${
                e.triggers && e.triggers.length ? `, triggers: ${e.triggers.join(", ")}` : ""
              }`,
          )
          .join("\n")}`
      : "\nNo migraine episodes logged in the last 7 days.";

    const prompt = `You are a migraine-risk model. Predict TODAY's migraine risk on a 0-100 scale
using the past 3 days of Apple Health signals AND recently logged migraine episodes.
Lower sleep hours/quality, low HRV (stress), unusually low or high steps, and frequent or
intense recent episodes each elevate risk.

Data (oldest -> today):
${data.days
  .map(
    (d) =>
      `- ${d.date}: sleep ${d.hours}h (quality ${d.quality}/100), HRV ${d.hrv}ms, steps ${d.steps}`,
  )
  .join("\n")}
${episodesBlock}

Return only a valid JSON object with this exact shape:
{"score": number, "level": "low" | "moderate" | "high", "drivers": string[], "summary": string}`;

    try {
      const { object } = await generateObject({
        model,
        prompt,
        schema: PredictionSchema,
      });

      return object;
    } catch (error) {
      console.error("Migraine prediction AI failed, using fallback", error);
      return fallbackPrediction(data.days, data.recentEpisodes);
    }
  });
