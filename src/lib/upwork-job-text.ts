/** Build a single job-description block for ATS/tailor from a stored Upwork lead. */
export function upworkLeadJobDescription(input: {
  title: string;
  description: string;
  techStack: string[];
  experienceLevel?: string;
  projectType?: string;
}): string {
  const parts = [
    input.title.trim(),
    input.experienceLevel?.trim() ? `Experience level: ${input.experienceLevel.trim()}` : "",
    input.projectType?.trim() ? `Project type: ${input.projectType.trim()}` : "",
    input.techStack.length ? `Required skills: ${input.techStack.join(", ")}` : "",
    input.description.trim(),
  ].filter(Boolean);
  return parts.join("\n\n");
}