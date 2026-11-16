import { z } from "zod";

export const jobApplicationStatusSchema = z.enum([
  "draft",
  "applied",
  "interview",
  "rejected",
  "offer",
]);

export const jobApplicationSourceSchema = z.enum([
  "upwork",
  "linkedin",
  "company_site",
  "referral",
  "other",
]);

export const jobApplicationInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  jobUrl: z.string().optional(),
  jobSource: jobApplicationSourceSchema.optional(),
  techStack: z.array(z.string()).optional(),
  status: jobApplicationStatusSchema.optional(),
  appliedAt: z.string().datetime().nullable().optional(),
  notes: z.string().optional(),
  upworkLeadId: z.string().optional().nullable(),
});

export type JobApplicationInput = z.infer<typeof jobApplicationInputSchema>;

export const skillFitAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  matchedSkills: z.array(z.string()).default([]),
  missingSkills: z.array(z.string()).default([]),
  strongAreas: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  summary: z.string(),
});

export type SkillFitAnalysis = z.infer<typeof skillFitAnalysisSchema>;

export const JOB_SOURCE_LABELS: Record<
  z.infer<typeof jobApplicationSourceSchema>,
  string
> = {
  upwork: "Upwork",
  linkedin: "LinkedIn",
  company_site: "Company site",
  referral: "Referral",
  other: "Other",
};

export const APPLICATION_STATUS_LABELS: Record<
  z.infer<typeof jobApplicationStatusSchema>,
  string
> = {
  draft: "Draft",
  applied: "Applied",
  interview: "Interview",
  rejected: "Rejected",
  offer: "Offer",
};