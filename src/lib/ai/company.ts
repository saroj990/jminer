import { extractJson } from "@/lib/ai/prompts";
import { parsedCareersPageSchema, type ParsedCareersJob } from "@/types/company-tracker";

export function buildCompanyCareersParseMessages(input: {
  companyName: string;
  careersUrl: string;
  pageText: string;
  links: string[];
}) {
  const system = `You extract open job postings from text copied from a company careers page.
Return ONLY valid JSON:
{
  "jobs": [
    {
      "title": string,
      "jobUrl": string,
      "locationText": string,
      "snippet": string,
      "techStack": string[]
    }
  ]
}
Rules:
- Include only real job roles (ignore navigation, benefits blurbs, unrelated links).
- jobUrl must be from the LINKS list when possible; use full https URLs.
- techStack: skills mentioned in title/snippet (may be empty).
- If no jobs visible, return {"jobs": []}.`;

  const linkBlock = input.links.slice(0, 80).join("\n");
  const user = `COMPANY: ${input.companyName}
CAREERS URL: ${input.careersUrl}

PAGE TEXT (truncated):
${input.pageText.slice(0, 36_000)}

LINKS ON PAGE:
${linkBlock}

Return JSON only.`;

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}

export function parseCareersPageJson(text: string): ParsedCareersJob[] {
  const parsed = parsedCareersPageSchema.parse(extractJson(text));
  return parsed.jobs.filter((j) => j.title?.trim());
}