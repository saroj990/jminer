import {
  JOB_SOURCE_LABELS,
  jobApplicationSourceSchema,
} from "@/types/job-application";
import type { z } from "zod";

type JobApplicationSource = z.infer<typeof jobApplicationSourceSchema>;

export function applicationJobDescription(input: {
  title: string;
  description: string;
  techStack: string[];
  jobSource: string;
}): string {
  const source = (input.jobSource in JOB_SOURCE_LABELS
    ? JOB_SOURCE_LABELS[input.jobSource as JobApplicationSource]
    : input.jobSource) as string;

  const parts = [
    input.title.trim(),
    `Source: ${source}`,
    input.techStack.length ? `Required skills: ${input.techStack.join(", ")}` : "",
    input.description.trim(),
  ].filter(Boolean);
  return parts.join("\n\n");
}