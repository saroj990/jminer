import { z } from "zod";

/** Coerce LLM quirks (null, numbers, arrays) into plain strings. */
export function asString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => asString(item))
      .filter(Boolean)
      .join("\n");
  }
  if (typeof value === "object") {
    // e.g. { text: "..." } or bullet objects
    const record = value as Record<string, unknown>;
    if (typeof record.text === "string") return record.text;
    if (typeof record.description === "string") return record.description;
    if (Array.isArray(record.bullets)) return asString(record.bullets);
    if (Array.isArray(record.items)) return asString(record.items);
  }
  return "";
}

function asBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return /^(true|yes|y|1|present|current)$/i.test(value.trim());
  }
  if (typeof value === "number") return value === 1;
  return false;
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function normalizeDate(value: unknown): string {
  const raw = asString(value).trim();
  if (!raw) return "";
  if (/^(present|current|now|ongoing)$/i.test(raw)) return "";
  const yyyyMm = raw.match(/^(\d{4})-(\d{1,2})$/);
  if (yyyyMm) return `${yyyyMm[1]}-${yyyyMm[2].padStart(2, "0")}`;
  const yyyy = raw.match(/^(\d{4})$/);
  if (yyyy) return `${yyyy[1]}-01`;
  return raw.slice(0, 32);
}

function stripBulletPrefix(line: string) {
  return line
    .replace(/^[\s•●▪◦\-–—*]+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .trim();
}

/**
 * Turn collapsed LLM descriptions into newline-separated bullets.
 * Aims for at least `minLines` when the source text has enough content.
 */
export function toBulletLines(value: unknown, minLines = 3): string {
  const raw = asString(value).replace(/\r\n/g, "\n").trim();
  if (!raw) return "";

  let lines = raw
    .split(/\n+/)
    .flatMap((line) => line.split(/\s*[•●▪◦]\s+/))
    .flatMap((line) => {
      // " - foo - bar" style only when clearly list-like
      if (/\s[-–—]\s/.test(line) && line.length > 80) {
        return line.split(/\s[-–—]\s+/);
      }
      return [line];
    })
    .map(stripBulletPrefix)
    .filter(Boolean);

  // Semicolon-separated achievements
  if (lines.length === 1 && lines[0].includes(";")) {
    const parts = lines[0]
      .split(/\s*;\s*/)
      .map(stripBulletPrefix)
      .filter((part) => part.length > 8);
    if (parts.length > 1) lines = parts;
  }

  // Single paragraph → split into sentences so we keep multiple bullets
  if (lines.length < minLines && lines.length <= 2) {
    const joined = lines.join(" ");
    const sentences = joined
      .split(/(?<=[.!?])\s+(?=[A-Z(“"'])/)
      .map((part) => stripBulletPrefix(part.replace(/[.!?]+$/, "").trim()))
      .filter((part) => part.length > 8);
    if (sentences.length > lines.length) lines = sentences;
  }

  // Still one long line: soft-split on " and " / ", and " when chunks look like bullets
  if (lines.length === 1 && lines[0].length > 120) {
    const soft = lines[0]
      .split(/,\s+and\s+|;\s+and\s+|\s+and\s+(?=[A-Z])/)
      .map(stripBulletPrefix)
      .filter((part) => part.length > 12);
    if (soft.length >= Math.min(minLines, 2) && soft.length > 1) lines = soft;
  }

  // Deduplicate while preserving order
  const seen = new Set<string>();
  lines = lines.filter((line) => {
    const key = line.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return lines.join("\n");
}

function normalizeExperience(item: unknown) {
  const row = (item && typeof item === "object" ? item : {}) as Record<
    string,
    unknown
  >;
  const description = toBulletLines(
    row.description ?? row.highlights ?? row.bullets ?? row.achievements,
    3,
  );
  return {
    company: asString(row.company ?? row.organization ?? row.employer),
    role: asString(row.role ?? row.title ?? row.position ?? row.jobTitle),
    location: asString(row.location ?? row.city),
    startDate: normalizeDate(row.startDate ?? row.start ?? row.from),
    endDate: normalizeDate(row.endDate ?? row.end ?? row.to),
    current: asBoolean(row.current ?? row.isCurrent ?? row.present),
    description,
  };
}

function normalizeEducation(item: unknown) {
  const row = (item && typeof item === "object" ? item : {}) as Record<
    string,
    unknown
  >;
  return {
    school: asString(row.school ?? row.institution ?? row.university ?? row.college),
    degree: asString(row.degree ?? row.qualification),
    field: asString(row.field ?? row.major ?? row.fieldOfStudy),
    location: asString(row.location),
    startDate: normalizeDate(row.startDate ?? row.start ?? row.from),
    endDate: normalizeDate(row.endDate ?? row.end ?? row.to ?? row.graduationDate),
    details: asString(row.details ?? row.description ?? row.notes),
  };
}

function normalizeSkill(item: unknown) {
  if (typeof item === "string") {
    return { category: "Skills", skills: item };
  }
  const row = (item && typeof item === "object" ? item : {}) as Record<
    string,
    unknown
  >;
  const skillsValue = row.skills ?? row.items ?? row.list ?? row.keywords;
  const skills = Array.isArray(skillsValue)
    ? skillsValue.map(asString).filter(Boolean).join(", ")
    : asString(skillsValue);
  return {
    category: asString(row.category ?? row.name ?? row.group) || "Skills",
    skills,
  };
}

function normalizePortfolio(item: unknown) {
  const row = (item && typeof item === "object" ? item : {}) as Record<
    string,
    unknown
  >;
  return {
    name: asString(row.name ?? row.title ?? row.project),
    url: asString(row.url ?? row.link ?? row.github ?? row.liveUrl),
    description: toBulletLines(
      row.description ?? row.summary ?? row.bullets,
      2,
    ),
    technologies: Array.isArray(row.technologies)
      ? row.technologies.map(asString).filter(Boolean).join(", ")
      : asString(row.technologies ?? row.tech ?? row.stack ?? row.skills),
  };
}

/**
 * Normalize messy LLM JSON into the resume builder shape before Zod validation.
 */
export function normalizeParsedResume(raw: unknown) {
  const root =
    raw && typeof raw === "object"
      ? (raw as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  // Some models wrap payload: { resume: {...} } or { data: {...} }
  const data =
    root.personal || root.experiences || root.education
      ? root
      : ((root.resume ??
          root.data ??
          root.result ??
          root.parsed ??
          root) as Record<string, unknown>);

  const personalRaw =
    data.personal && typeof data.personal === "object"
      ? (data.personal as Record<string, unknown>)
      : data;

  const personal = {
    fullName: asString(
      personalRaw.fullName ?? personalRaw.name ?? personalRaw.full_name,
    ),
    title: asString(
      personalRaw.title ?? personalRaw.headline ?? personalRaw.role,
    ),
    email: asString(personalRaw.email),
    phone: asString(personalRaw.phone ?? personalRaw.mobile),
    location: asString(
      personalRaw.location ?? personalRaw.address ?? personalRaw.city,
    ),
    website: asString(
      personalRaw.website ?? personalRaw.portfolio ?? personalRaw.site,
    ),
    linkedin: asString(personalRaw.linkedin ?? personalRaw.linkedIn),
    github: asString(personalRaw.github),
  };

  let skillsSource = data.skills;
  // skills: ["TypeScript", "React"] → one group
  if (
    Array.isArray(skillsSource) &&
    skillsSource.every((item) => typeof item === "string")
  ) {
    skillsSource = [{ category: "Skills", skills: skillsSource.join(", ") }];
  }

  return {
    personal,
    summary: asString(data.summary ?? data.profile ?? data.objective),
    experiences: asArray(
      data.experiences ?? data.experience ?? data.workExperience,
    ).map(normalizeExperience),
    education: asArray(data.education ?? data.educations).map(normalizeEducation),
    skills: asArray(skillsSource).map(normalizeSkill),
    portfolio: asArray(
      data.portfolio ?? data.projects ?? data.personalProjects,
    ).map(normalizePortfolio),
  };
}

const str = z.string();
const bool = z.boolean();

export const parsedResumeSchema = z.object({
  personal: z.object({
    fullName: str,
    title: str,
    email: str,
    phone: str,
    location: str,
    website: str,
    linkedin: str,
    github: str,
  }),
  summary: str,
  experiences: z.array(
    z.object({
      company: str,
      role: str,
      location: str,
      startDate: str,
      endDate: str,
      current: bool,
      description: str,
    }),
  ),
  education: z.array(
    z.object({
      school: str,
      degree: str,
      field: str,
      location: str,
      startDate: str,
      endDate: str,
      details: str,
    }),
  ),
  skills: z.array(
    z.object({
      category: str,
      skills: str,
    }),
  ),
  portfolio: z.array(
    z.object({
      name: str,
      url: str,
      description: str,
      technologies: str,
    }),
  ),
});

export type NormalizedParsedResume = z.infer<typeof parsedResumeSchema>;
