import type { ParsedUpworkJob } from "@/types/upwork-lead";
import { extractJson } from "@/lib/ai/prompts";

export const UPWORK_PARSE_SYSTEM = `You extract structured data from OCR text of Upwork job posting screenshots.
The text may come from one or two images (job + client sidebar, then skills/activity). OCR may have typos or broken layout — infer carefully.
Merge all visible facts into one JSON object. Use null for unknown numbers.
Return ONLY valid JSON matching this schema (no markdown):
{
  "title": string,
  "postedAtText": string,
  "jobUrl": string,
  "description": string,
  "techStack": string[],
  "connectsRequired": number | null,
  "hourlyRateText": string,
  "durationText": string,
  "experienceLevel": string,
  "projectType": string,
  "client": {
    "displayName": string,
    "location": string,
    "rating": number | null,
    "reviewCount": number | null,
    "paymentVerified": boolean,
    "phoneVerified": boolean,
    "jobsPosted": number | null,
    "hireRatePercent": number | null,
    "totalSpentUsd": number | null,
    "hires": number | null,
    "activeHires": number | null,
    "avgHourlyPaid": number | null,
    "memberSince": string,
    "industry": string,
    "companySize": string,
    "recentHistoryNote": string
  },
  "activity": {
    "proposalsRange": string,
    "lastViewedByClient": string,
    "interviewing": number | null,
    "invitesSent": number | null,
    "unansweredInvites": number | null
  }
}
For client.displayName prefer company/industry label; if missing use "Client in {location}".
techStack = skill tags plus obvious stack from description.`;

export function buildUpworkParseFromOcrMessages(ocrText: string) {
  const user = `OCR TEXT FROM UPWORK SCREENSHOT(S):
${ocrText}

Return the merged JSON only.`;

  return [
    { role: "system" as const, content: UPWORK_PARSE_SYSTEM },
    { role: "user" as const, content: user },
  ];
}

export function buildUpworkAnalyzeMessages(lead: {
  title: string;
  description: string;
  techStack: string[];
  connectsRequired: number | null;
  hourlyRateText: string;
  durationText: string;
  experienceLevel: string;
  projectType: string;
  postedAtText: string;
  clientInfo: Record<string, unknown>;
  activity: Record<string, unknown>;
}) {
  const system = `You help a freelancer decide whether to spend Upwork Connects on a job proposal.
Score honestly using only the provided data. Do not invent client facts.
Return ONLY JSON:
{
  "engagementScore": number,
  "genuinenessScore": number,
  "recommendApply": boolean,
  "summary": string,
  "engagementFactors": string[],
  "riskFlags": string[],
  "creditWorthIt": "yes" | "maybe" | "no"
}
engagementScore (0-100): likelihood of client reading/replying/hiring (recent views, interviewing, spend history, hire rate, reviews).
genuinenessScore (0-100): looks like a real job vs scam/low-effort (verified payment, spend, coherent description, realistic budget).
creditWorthIt: whether connects cost is justified given competition and client quality.`;

  const user = `JOB:
Title: ${lead.title}
Posted: ${lead.postedAtText || "unknown"}
Connects required: ${lead.connectsRequired ?? "unknown"}
Rate: ${lead.hourlyRateText || "unknown"}
Duration: ${lead.durationText || "unknown"}
Experience: ${lead.experienceLevel || "unknown"}
Type: ${lead.projectType || "unknown"}
Skills: ${lead.techStack.join(", ") || "none"}

DESCRIPTION:
${lead.description}

CLIENT JSON:
${JSON.stringify(lead.clientInfo, null, 2)}

ACTIVITY JSON:
${JSON.stringify(lead.activity, null, 2)}`;

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}

export function parseUpworkExtractJson(text: string): ParsedUpworkJob {
  return extractJson<ParsedUpworkJob>(text);
}