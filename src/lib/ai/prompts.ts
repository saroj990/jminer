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
  prompt?: string;
}) {
  const fieldGuidance: Record<WriteFieldType, string> = {
    summary:
      "Write a polished professional summary in 2-4 sentences. Prefer concise resume style without 'I'.",
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
- Follow the user's prompt when provided.
- Do not invent employers, schools, metrics, or skills not supported by the input or prompt.
- Keep the candidate's meaning unless the prompt asks to reframe.
- Return ONLY valid JSON: { "text": string }`;

  const user = `FIELD: ${input.fieldType}
${input.prompt?.trim() ? `USER PROMPT:\n${input.prompt.trim()}\n` : ""}
${input.context ? `CONTEXT:\n${input.context}\n` : ""}
CURRENT TEXT:
${input.text || "(empty — draft a strong starting version from context/prompt if possible)"}`;

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}

export function buildParseResumeMessages(rawText: string) {
  const system = `You convert raw resume text into structured JSON for a resume builder.
Return ONLY a single JSON object. No markdown. No commentary.
Use this exact shape (all values must be strings except current which is boolean):
{
  "personal": {
    "fullName": "",
    "title": "",
    "email": "",
    "phone": "",
    "location": "",
    "website": "",
    "linkedin": "",
    "github": ""
  },
  "summary": "",
  "experiences": [{
    "company": "",
    "role": "",
    "location": "",
    "startDate": "YYYY-MM",
    "endDate": "YYYY-MM",
    "current": false,
    "description": "First achievement from the resume\\nSecond achievement from the resume\\nThird achievement from the resume"
  }],
  "education": [{
    "school": "",
    "degree": "",
    "field": "",
    "location": "",
    "startDate": "",
    "endDate": "",
    "details": ""
  }],
  "skills": [{ "category": "", "skills": "a, b, c" }],
  "portfolio": [{
    "name": "",
    "url": "",
    "description": "",
    "technologies": ""
  }]
}
Rules:
- Output valid JSON only.
- Prefer YYYY-MM dates; use "" if unknown.
- Experience description is CRITICAL:
  - Must be a bulleted list as newline-separated lines (use \\n between lines).
  - Do NOT merge bullets into one paragraph or one line.
  - Keep at least 3 separate lines per job whenever the source resume has enough content.
  - Prefer copying distinct bullets/achievements from the resume; if the resume has 3+ bullets, keep at least 3.
  - If the resume only has 1–2 bullets for a job, keep those (do not invent new facts).
  - No leading dashes, bullets, or numbers on each line.
- Portfolio description: keep meaningful detail; prefer 2–3 short lines when source has them.
- Do not invent facts.
- Use "" or [] when unknown.
- current=true only if clearly ongoing.`;

  const user = `RESUME TEXT:
${rawText.slice(0, 14000)}

Remember: for every experience with enough source content, description must contain at least 3 newline-separated bullet lines copied from the resume (never one merged paragraph).`;

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}

export function extractJson<T>(text: string): T {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("AI response was empty");

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let candidate = fenced?.[1]?.trim() ?? trimmed;

  // Strip leading prose before first { or [
  const objStart = candidate.indexOf("{");
  const arrStart = candidate.indexOf("[");
  let start = -1;
  if (objStart === -1) start = arrStart;
  else if (arrStart === -1) start = objStart;
  else start = Math.min(objStart, arrStart);

  if (start === -1) throw new Error("AI response did not contain JSON");

  candidate = candidate.slice(start);
  const endObj = candidate.lastIndexOf("}");
  const endArr = candidate.lastIndexOf("]");
  const end = Math.max(endObj, endArr);
  if (end <= 0) throw new Error("AI response did not contain JSON");
  candidate = candidate.slice(0, end + 1);

  // Common local-LLM JSON issues
  candidate = candidate
    .replace(/,\s*([}\]])/g, "$1") // trailing commas
    .replace(/\u0000/g, "")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");

  try {
    return JSON.parse(candidate) as T;
  } catch {
    // Last resort: balance truncated object by closing braces
    let repaired = candidate;
    const opens = (repaired.match(/{/g) ?? []).length;
    const closes = (repaired.match(/}/g) ?? []).length;
    if (opens > closes) repaired += "}".repeat(opens - closes);
    const openArr = (repaired.match(/\[/g) ?? []).length;
    const closeArr = (repaired.match(/]/g) ?? []).length;
    if (openArr > closeArr) repaired += "]".repeat(openArr - closeArr);
    repaired = repaired.replace(/,\s*([}\]])/g, "$1");
    return JSON.parse(repaired) as T;
  }
}
