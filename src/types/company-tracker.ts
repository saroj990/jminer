import { z } from "zod";

export const careersUrlSourceSchema = z.enum(["user", "search", "heuristic", ""]);

export const trackedCompanyInputSchema = z.object({
  name: z.string().min(1),
  websiteUrl: z.string().optional(),
  careersUrl: z.string().optional(),
  careersUrlSource: careersUrlSourceSchema.optional(),
  fetchIntervalMinutes: z.number().int().min(60).max(10080).optional(),
});

export type TrackedCompanyInput = z.infer<typeof trackedCompanyInputSchema>;

export const parsedCareersJobSchema = z.object({
  title: z.string(),
  jobUrl: z.string().optional(),
  locationText: z.string().optional(),
  snippet: z.string().optional(),
  techStack: z.array(z.string()).optional(),
});

export const parsedCareersPageSchema = z.object({
  jobs: z.array(parsedCareersJobSchema).default([]),
});

export type ParsedCareersJob = z.infer<typeof parsedCareersJobSchema>;

export const FETCH_INTERVAL_OPTIONS = [
  { minutes: 360, label: "Every 6 hours" },
  { minutes: 720, label: "Every 12 hours" },
  { minutes: 1440, label: "Every 24 hours" },
  { minutes: 4320, label: "Every 3 days" },
  { minutes: 10080, label: "Weekly" },
] as const;

export function intervalLabel(minutes: number): string {
  const hit = FETCH_INTERVAL_OPTIONS.find((o) => o.minutes === minutes);
  return hit?.label ?? `Every ${minutes} min`;
}