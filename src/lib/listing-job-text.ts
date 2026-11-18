export function listingJobDescription(input: {
  title: string;
  descriptionSnippet: string;
  techStack: string[];
  locationText?: string;
  companyName?: string;
}): string {
  const parts = [
    input.title.trim(),
    input.companyName?.trim() ? `Company: ${input.companyName.trim()}` : "",
    input.locationText?.trim() ? `Location: ${input.locationText.trim()}` : "",
    input.techStack.length ? `Skills: ${input.techStack.join(", ")}` : "",
    input.descriptionSnippet.trim(),
  ].filter(Boolean);
  return parts.join("\n\n");
}