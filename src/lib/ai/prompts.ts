import type { ResumeData } from "@/types/resume";

export function buildTailorMessages(input: {
  resume: ResumeData;
  jobDescription: string;
}) {
  const system = `You are an expert resume coach. Rewrite resume content to better match a job description.
Rules:
- Never invent employers, degrees, or skills the candidate does not have.
- You may rephrase bullets, reorder emphasis, and highlight relevant existing skills.
- Keep achievements truthful and quantified when numbers already exist.
- Return ONLY valid JSON matching this schema:
{
  "summary": string,
  "experiences": [{ "id": string, "description": string }],
  "skillsHighlight": string[],
  "notes": string[]
}
description must be newline-separated bullet lines without leading bullets.`;

  const user = `JOB DESCRIPTION:
${input.jobDescription}

CURRENT RESUME JSON:
${JSON.stringify(input.resume, null, 2)}

Return tailored JSON only.`;

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}

export function buildAtsMessages(input: {
  resume: ResumeData;
  jobDescription: string;
}) {
  const system = `You are an ATS analyst. Score how well a resume matches a job description.
Return ONLY valid JSON:
{
  "score": number, // 0-100
  "matchedKeywords": string[],
  "missingKeywords": string[],
  "strengths": string[],
  "recommendations": string[]
}`;

  const user = `JOB DESCRIPTION:
${input.jobDescription}

RESUME:
${JSON.stringify(input.resume, null, 2)}`;

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}

export function buildCoverLetterMessages(input: {
  resume: ResumeData;
  jobDescription: string;
  company?: string;
  role?: string;
}) {
  const system = `You write concise, professional cover letters.
Return ONLY valid JSON:
{
  "subject": string,
  "body": string
}
Body should be 3-4 short paragraphs, no markdown.`;

  const user = `Company: ${input.company || "the company"}
Role: ${input.role || input.resume.personal.title || "the role"}

JOB DESCRIPTION:
${input.jobDescription}

CANDIDATE PROFILE:
${JSON.stringify(input.resume, null, 2)}`;

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}

export type WriteFieldType =
  | "summary"
  | "experience_bullets"
  | "education_details"
  | "portfolio_description";

export function buildWriteMessages(input: {
  fieldType: WriteFieldType;
  text: string;
  context?: string;
}) {
  const fieldGuidance: Record<WriteFieldType, string> = {
    summary:
      "Write a polished professional summary in 2-4 sentences. First person is fine but prefer concise third-person resume style without 'I'.",
    experience_bullets:
      "Rewrite as strong resume bullet points. Return newline-separated bullets WITHOUT leading dashes or bullets. Keep facts truthful; improve clarity and impact.",
    education_details:
      "Rewrite education details cleanly in 1-3 short lines or a compact sentence. Keep grades/honors if present.",
    portfolio_description:
      "Rewrite a clear project description in 1-3 sentences focusing on what it does, your role, and impact.",
  };

  const system = `You are a professional resume writer.
${fieldGuidance[input.fieldType]}
Rules:
- Do not invent employers, schools, metrics, or skills not supported by the input.
- Keep the candidate's meaning.
- Return ONLY valid JSON: { "text": string }`;

  const user = `FIELD: ${input.fieldType}
${input.context ? `CONTEXT:\n${input.context}\n` : ""}
CURRENT TEXT:
${input.text || "(empty — draft a strong starting version from context if possible)"}`;

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}

export function buildParseResumeMessages(rawText: string) {
  const system = `You convert raw resume text into structured JSON for a resume builder.
Return ONLY valid JSON matching this schema exactly:
{
  "personal": {
    "fullName": string,
    "title": string,
    "email": string,
    "phone": string,
    "location": string,
    "website": string,
    "linkedin": string,
    "github": string
  },
  "summary": string,
  "experiences": [{
    "company": string,
    "role": string,
    "location": string,
    "startDate": string,
    "endDate": string,
    "current": boolean,
    "description": string
  }],
  "education": [{
    "school": string,
    "degree": string,
    "field": string,
    "location": string,
    "startDate": string,
    "endDate": string,
    "details": string
  }],
  "skills": [{ "category": string, "skills": string }],
  "portfolio": [{
    "name": string,
    "url": string,
    "description": string,
    "technologies": string
  }]
}
Rules:
- Dates must be YYYY-MM when possible, else "".
- description for experiences must be newline-separated bullets without leading dashes.
- Do not invent facts not present in the source text.
- Use empty string or empty arrays when unknown.
- current=true only if clearly ongoing/present.`;

  const user = `RESUME TEXT:
${rawText.slice(0, 20000)}`;

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}

export function extractJson<T>(text: string): T {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI response did not contain JSON");
  }
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}
