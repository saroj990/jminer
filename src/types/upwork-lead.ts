import { z } from "zod";

export const upworkClientSchema = z.object({
  displayName: z.string().optional(),
  location: z.string().optional(),
  rating: z.number().nullable().optional(),
  reviewCount: z.number().nullable().optional(),
  paymentVerified: z.boolean().optional(),
  phoneVerified: z.boolean().optional(),
  jobsPosted: z.number().nullable().optional(),
  hireRatePercent: z.number().nullable().optional(),
  totalSpentUsd: z.number().nullable().optional(),
  hires: z.number().nullable().optional(),
  activeHires: z.number().nullable().optional(),
  avgHourlyPaid: z.number().nullable().optional(),
  memberSince: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  recentHistoryNote: z.string().optional(),
});

export const upworkActivitySchema = z.object({
  proposalsRange: z.string().optional(),
  lastViewedByClient: z.string().optional(),
  interviewing: z.number().nullable().optional(),
  invitesSent: z.number().nullable().optional(),
  unansweredInvites: z.number().nullable().optional(),
});

export const parsedUpworkJobSchema = z.object({
  title: z.string().default(""),
  postedAtText: z.string().optional(),
  jobUrl: z.string().optional(),
  description: z.string().default(""),
  techStack: z.array(z.string()).default([]),
  connectsRequired: z.number().nullable().optional(),
  hourlyRateText: z.string().optional(),
  durationText: z.string().optional(),
  experienceLevel: z.string().optional(),
  projectType: z.string().optional(),
  client: upworkClientSchema.optional(),
  activity: upworkActivitySchema.optional(),
});

export type ParsedUpworkJob = z.infer<typeof parsedUpworkJobSchema>;

export const upworkAnalysisSchema = z.object({
  engagementScore: z.number().min(0).max(100),
  genuinenessScore: z.number().min(0).max(100),
  recommendApply: z.boolean(),
  summary: z.string(),
  engagementFactors: z.array(z.string()).default([]),
  riskFlags: z.array(z.string()).default([]),
  creditWorthIt: z.enum(["yes", "maybe", "no"]),
});

export type UpworkAnalysis = z.infer<typeof upworkAnalysisSchema>;

export const upworkLeadInputSchema = z.object({
  title: z.string().min(1),
  jobUrl: z.string().optional(),
  postedAtText: z.string().optional(),
  description: z.string().optional(),
  techStack: z.array(z.string()).optional(),
  connectsRequired: z.number().int().nullable().optional(),
  hourlyRateText: z.string().optional(),
  durationText: z.string().optional(),
  experienceLevel: z.string().optional(),
  projectType: z.string().optional(),
  clientName: z.string().optional(),
  clientInfo: upworkClientSchema.optional(),
  activity: upworkActivitySchema.optional(),
  notes: z.string().optional(),
  status: z.enum(["interested", "applied", "skipped"]).optional(),
});

export function clientDisplayName(client?: z.infer<typeof upworkClientSchema>): string {
  if (!client) return "Unknown client";
  if (client.displayName?.trim()) return client.displayName.trim();
  const parts = [client.location, client.industry].filter(Boolean);
  return parts.join(" · ") || "Unknown client";
}