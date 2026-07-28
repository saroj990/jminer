import type { ResumeData } from "@/types/resume";

export type ParsedResumePayload = {
  personal: ResumeData["personal"];
  summary: string;
  experiences: Array<Omit<ResumeData["experiences"][number], "id">>;
  education: Array<Omit<ResumeData["education"][number], "id">>;
  skills: Array<Omit<ResumeData["skills"][number], "id">>;
  portfolio: Array<Omit<ResumeData["portfolio"][number], "id">>;
};

type SectionKey =
  | "header"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "portfolio"
  | "other";

const SECTION_DEFS: Array<{
  key: Exclude<SectionKey, "header" | "other">;
  label: RegExp;
}> = [
  {
    key: "summary",
    label:
      /^(?:professional\s+)?(?:summary|profile|objective|about(?:\s+me)?|career\s+summary|overview)$/i,
  },
  {
    key: "experience",
    label:
      /^(?:work\s+)?(?:experience|employment|work\s+history|professional\s+experience|career\s+history)$/i,
  },
  {
    key: "education",
    label: /^(?:education|academic(?:\s+background)?|academics|qualifications)$/i,
  },
  {
    key: "skills",
    label:
      /^(?:technical\s+)?skills$|^(?:core\s+)?(?:skills|competencies|strengths)$|^competencies$|^technologies$|^tech\s+stack$|^tools$/i,
  },
  {
    key: "portfolio",
    label: /^(?:personal\s+|selected\s+|key\s+)?projects$|^portfolio$|^side\s+projects$/i,
  },
];

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{3,4}(?:\s*(?:x|ext\.?)\s*\d+)?/i;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_./%-]+/i;
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9_.%-]+/i;
const WEB_URL_RE =
  /(?:https?:\/\/|www\.)[^\s|,;)]+|linkedin\.com\/in\/[^\s|,;)]+|github\.com\/[^\s|,;)]+|(?:[a-z0-9-]+\.)+(?:com|dev|io|co|app|me|net|org|ai|xyz)(?:\/[^\s|,;)]*)?/i;

const MONTH =
  "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
const DATE_TOKEN = `(?:${MONTH}\\.?\\s+\\d{4}|\\d{1,2}[/-]\\d{4}|\\d{4}(?:[/-]\\d{1,2})?)`;
const DATE_RANGE_RE = new RegExp(
  `(${DATE_TOKEN})\\s*(?:–|-|—|to)\\s*(${DATE_TOKEN}|Present|Current|Now|Today)`,
  "i",
);

const MONTH_MAP: Record<string, string> = {
  jan: "01",
  january: "01",
  feb: "02",
  february: "02",
  mar: "03",
  march: "03",
  apr: "04",
  april: "04",
  may: "05",
  jun: "06",
  june: "06",
  jul: "07",
  july: "07",
  aug: "08",
  august: "08",
  sep: "09",
  sept: "09",
  september: "09",
  oct: "10",
  october: "10",
  nov: "11",
  november: "11",
  dec: "12",
  december: "12",
};

const ROLE_HINT =
  /\b(engineer|developer|manager|director|lead|architect|designer|analyst|consultant|intern|founder|ceo|cto|coo|product(?:\s+manager)?|scientist|specialist|coordinator|administrator|officer|associate|principal|staff|senior|junior|head|vp|vice\s+president|president|teacher|professor|researcher|sde|swe)\b/i;

const DEGREE_HINT =
  /\b(b\.?\s?s\.?|b\.?\s?a\.?|b\.?\s?e\.?|b\.?\s?tech|m\.?\s?s\.?|m\.?\s?a\.?|m\.?\s?eng|m\.?\s?tech|mba|ph\.?\s?d\.?|doctorate|bachelor'?s?|master'?s?|associate|diploma|high\s+school)\b/i;

const SCHOOL_HINT =
  /\b(university|college|institute|school|academy|polytechnic)\b/i;

function normalizeLine(line: string) {
  return line
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

const SECTION_BREAK_RE =
  /Professional Summary|Career Summary|Work Experience|Professional Experience|Work History|Technical Skills|Core Skills|Core Strengths|Selected Projects|Personal Projects|Key Projects|Side Projects|Summary|Profile|Objective|About Me|Experience|Employment|Education|Skills|Projects|Portfolio|Certifications|Awards|Strengths/gi;

/**
 * Only break flattened text before section headings — never before dates
 * (dates usually sit at the end of a job header line).
 */
function reflowResumeText(raw: string): string {
  let text = raw.replace(/\r\n/g, "\n");

  text = text.replace(
    new RegExp(`(?<=\\S)\\s+(?=(?:${SECTION_BREAK_RE.source})\\b)`, "gi"),
    "\n",
  );

  // Bullets glued on one line
  text = text.replace(/(?<=\S)\s*([•·●▪‣➢])\s+/g, "\n$1 ");
  text = text.replace(/(?<=[.!?])\s+(?=[•·●▪‣➢*-]\s)/g, "\n");

  return text;
}

function toLines(text: string) {
  const rawLines = reflowResumeText(text)
    .split("\n")
    .map(normalizeLine)
    .filter(Boolean);

  // Split "EXPERIENCE Product Manager Acme…" into heading + remainder
  const lines: string[] = [];
  for (const line of rawLines) {
    const match = line.match(
      new RegExp(
        `^(${SECTION_BREAK_RE.source})\\b(?:\\s*[:\\-|—–]\\s*|\\s+)(.+)$`,
        "i",
      ),
    );
    const heading = match?.[1]?.trim() ?? "";
    // Avoid splitting product names (portFolio — …) that case-insensitively
    // look like the "Portfolio" section heading.
    const isProductName = /[a-z][A-Z]/.test(heading);
    if (
      match &&
      !isProductName &&
      cleanSectionLabel(heading).length <= 40 &&
      (heading === heading.toUpperCase() || heading.split(/\s+/).length <= 3)
    ) {
      lines.push(heading);
      lines.push(match[2].trim());
    } else {
      lines.push(line);
    }
  }
  return lines;
}

function cleanSectionLabel(line: string) {
  return line
    .toLowerCase()
    .replace(/^[\d.)\s]+/, "")
    .replace(/[:|•·\-–—_/]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function detectSection(line: string): Exclude<SectionKey, "header" | "other"> | null {
  const cleaned = cleanSectionLabel(line);
  if (!cleaned || cleaned.length > 48) return null;

  // Product names like "portFolio" must not be treated as section headings
  const firstToken = line.trim().split(/\s+/)[0] ?? "";
  if (/[a-z][A-Z]/.test(firstToken)) return null;

  const wordCount = cleaned.split(" ").length;
  const isHeadingLike =
    wordCount <= 5 &&
    (line === line.toUpperCase() ||
      /^[A-Z][A-Za-z0-9/&\s-]{0,46}$/.test(line) ||
      cleaned.length <= 28);

  if (!isHeadingLike) return null;

  for (const { key, label } of SECTION_DEFS) {
    if (label.test(cleaned)) return key;
  }
  return null;
}

function toYearMonth(raw: string): string {
  const value = raw.trim().toLowerCase().replace(/\./g, "");
  if (/^(present|current|now|today)$/i.test(value)) return "";

  const monthYear = value.match(
    /^(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{4})$/i,
  );
  if (monthYear) {
    const key = monthYear[1].toLowerCase();
    const month =
      MONTH_MAP[key] ?? MONTH_MAP[key.slice(0, 3)] ?? "01";
    return `${monthYear[2]}-${month}`;
  }

  const mmYyyy = value.match(/^(\d{1,2})[/-](\d{4})$/);
  if (mmYyyy) return `${mmYyyy[2]}-${mmYyyy[1].padStart(2, "0")}`;

  const yyyyMm = value.match(/^(\d{4})[/-](\d{1,2})$/);
  if (yyyyMm) return `${yyyyMm[1]}-${yyyyMm[2].padStart(2, "0")}`;

  const yyyy = value.match(/^(\d{4})$/);
  if (yyyy) return `${yyyy[1]}-01`;
  return "";
}

function parseDateRange(line: string) {
  const match = line.match(DATE_RANGE_RE);
  if (!match) return null;
  const startDate = toYearMonth(match[1]);
  const endRaw = match[2];
  const current = /^(present|current|now|today)$/i.test(endRaw);
  const endDate = current ? "" : toYearMonth(endRaw);
  return { startDate, endDate, current, matched: match[0] };
}

/** Split job/education header fields without breaking "University of California, Berkeley". */
function splitHeaderParts(line: string) {
  return line
    .split(/\s+\|\s+|\s+[•·]\s+|\s+[-–—]\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function isBullet(line: string) {
  return /^([•·●▪‣➢★☆]|[-*–—]|\d+[.)])\s+/.test(line);
}

function stripBullet(line: string) {
  return line.replace(/^([•·●▪‣➢★☆]|[-*–—]|\d+[.)])\s+/, "").trim();
}

function looksLikeLocation(value: string) {
  if (EMAIL_RE.test(value) || LINKEDIN_RE.test(value) || GITHUB_RE.test(value)) {
    return false;
  }
  return (
    /,\s*[A-Za-z]/.test(value) ||
    /\b(remote|hybrid|onsite|on-site)\b/i.test(value) ||
    /\b[A-Z]{2}\b/.test(value)
  );
}

function stripContacts(line: string) {
  return line
    .replace(EMAIL_RE, " ")
    .replace(LINKEDIN_RE, " ")
    .replace(GITHUB_RE, " ")
    .replace(PHONE_RE, " ")
    .replace(WEB_URL_RE, " ")
    .replace(/\s*[|•·]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstMatch(text: string, re: RegExp) {
  return text.match(re)?.[0] ?? "";
}

function normalizeUrl(url: string) {
  if (!url) return "";
  const cleaned = url.replace(/[.,;)+]+$/, "");
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  return `https://${cleaned}`;
}

function collectSections(lines: string[]) {
  const sections: Record<SectionKey, string[]> = {
    header: [],
    summary: [],
    experience: [],
    education: [],
    skills: [],
    portfolio: [],
    other: [],
  };

  let current: SectionKey = "header";
  for (const line of lines) {
    const section = detectSection(line);
    if (section) {
      current = section;
      continue;
    }
    sections[current].push(line);
  }
  return sections;
}

function isLikelyNewJob(line: string, previous: string[]) {
  if (isBullet(line) || detectSection(line)) return false;
  if (line.length > 160) return false;

  const hasDate = Boolean(parseDateRange(line));
  const hasRole = ROLE_HINT.test(line);
  const hasAt = /\bat\b/i.test(line);
  const prevHadBullets = previous.some(isBullet);
  const prevHadDate = previous.some((l) => Boolean(parseDateRange(l)));

  if ((hasDate || hasRole || hasAt) && (prevHadBullets || (prevHadDate && previous.length >= 2))) {
    return true;
  }

  if (hasDate && hasRole && previous.length > 0) return true;

  // Company-only line after bullets (next lines usually role + dates)
  if (
    prevHadBullets &&
    !hasDate &&
    !isBullet(line) &&
    line.length <= 60 &&
    !ROLE_HINT.test(line) &&
    !looksLikeLocation(line)
  ) {
    return true;
  }

  return false;
}

/**
 * Prefer date-anchored splitting: each date-range line starts (or completes) a job entry.
 */
function splitExperienceBlocks(lines: string[]) {
  const dateIndexes = lines
    .map((line, idx) => (parseDateRange(line) ? idx : -1))
    .filter((idx) => idx >= 0);

  if (dateIndexes.length >= 2) {
    const blocks: string[][] = [];
    // For each date, take preceding non-bullet lines as header (up to 2) plus following bullets until next header
    const starts: number[] = dateIndexes.map((dateIdx) => {
      let start = dateIdx;
      let taken = 0;
      for (let i = dateIdx - 1; i >= 0 && taken < 2; i -= 1) {
        if (isBullet(lines[i]) || detectSection(lines[i])) break;
        // Don't cross into previous date's territory
        if (parseDateRange(lines[i]) && i !== dateIdx) break;
        start = i;
        taken += 1;
      }
      return start;
    });

    // Unique monotonic starts
    const uniqueStarts = [...new Set(starts)].sort((a, b) => a - b);
    for (let i = 0; i < uniqueStarts.length; i += 1) {
      const from = uniqueStarts[i];
      const to = i + 1 < uniqueStarts.length ? uniqueStarts[i + 1] : lines.length;
      const block = lines.slice(from, to);
      if (block.length) blocks.push(block);
    }
    return blocks;
  }

  const blocks: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (current.length && isLikelyNewJob(line, current)) {
      blocks.push(current);
      current = [line];
      continue;
    }
    current.push(line);
  }
  if (current.length) blocks.push(current);
  return blocks;
}

function parseExperienceBlock(lines: string[]) {
  if (!lines.length) return null;

  let role = "";
  let company = "";
  let location = "";
  let startDate = "";
  let endDate = "";
  let current = false;

  // Find the date line — meta is that line plus up to 2 lines above
  const dateIdx = lines.findIndex((line) => Boolean(parseDateRange(line)));
  const metaStart = dateIdx >= 0 ? Math.max(0, dateIdx - 2) : 0;
  const metaEnd = dateIdx >= 0 ? dateIdx + 1 : Math.min(3, lines.length);
  const metaLines = lines
    .slice(metaStart, metaEnd)
    .filter((line) => !isBullet(line));

  for (const line of metaLines) {
    const info = parseDateRange(line);
    if (info && !startDate) {
      startDate = info.startDate;
      endDate = info.endDate;
      current = info.current;
    }
  }

  const headerBits = metaLines
    .map((line) => line.replace(DATE_RANGE_RE, "").replace(/\s*[|•·]\s*$/g, "").trim())
    .filter(Boolean);

  // Single combined header
  if (headerBits.length === 1 || (headerBits.length >= 1 && splitHeaderParts(headerBits[0]).length >= 2)) {
    const primary = headerBits[0];
    const atMatch = primary.match(/^(.+?)\s+at\s+(.+)$/i);
    if (atMatch) {
      role = atMatch[1].trim();
      company = atMatch[2].trim();
    } else {
      const parts = splitHeaderParts(primary);
      if (parts.length >= 2) {
        const [a, b, ...rest] = parts;
        if (ROLE_HINT.test(a) || !ROLE_HINT.test(b)) {
          role = a;
          company = b;
        } else {
          company = a;
          role = b;
        }
        location = rest.find((part) => looksLikeLocation(part)) ?? "";
      } else if (parts[0]) {
        if (ROLE_HINT.test(parts[0])) role = parts[0];
        else company = parts[0];
      }
    }
  }

  // Multi-line: Company / Role / Dates  OR  Role / Company / Dates
  if (headerBits.length >= 2) {
    const a = headerBits[0];
    const b = headerBits[1];
    const c = headerBits[2];
    if (!role && !company) {
      if (ROLE_HINT.test(a) && !ROLE_HINT.test(b)) {
        role = a;
        company = b;
      } else if (!ROLE_HINT.test(a) && ROLE_HINT.test(b)) {
        company = a;
        role = b;
      } else if (ROLE_HINT.test(a)) {
        role = a;
        company = b;
      } else {
        company = a;
        role = b;
      }
    } else {
      // Fill missing from remaining bits
      for (const part of headerBits.slice(1)) {
        if (looksLikeLocation(part) && !location) location = part;
        else if (!company && !ROLE_HINT.test(part)) company = part;
        else if (!role && ROLE_HINT.test(part)) role = part;
      }
    }
    if (c && looksLikeLocation(c) && !location) location = c;
  }

  // Pull Remote out of company
  if (!location && /\|\s*remote\b/i.test(company)) {
    location = "Remote";
    company = company.replace(/\s*\|\s*remote\b/i, "").trim();
  }

  const descStart = Math.max(metaEnd, dateIdx >= 0 ? dateIdx + 1 : metaLines.length);
  const description = lines
    .slice(descStart)
    .filter((line) => !detectSection(line))
    // Don't swallow next job's company-only line when date-anchored split failed
    .filter((line, idx, arr) => {
      if (idx !== arr.length - 1) return true;
      return isBullet(line) || line.length > 60 || ROLE_HINT.test(line) || Boolean(parseDateRange(line));
    })
    .map(stripBullet)
    .filter(Boolean)
    .join("\n");

  if (!role && !company && !description) return null;

  if (role && company && !ROLE_HINT.test(role) && ROLE_HINT.test(company)) {
    const tmp = role;
    role = company;
    company = tmp;
  }

  // "Product Manager Acme Corp" on one field
  if (role && !company) {
    const splitRole = role.match(
      /^(.+?\b(?:engineer|developer|manager|director|lead|architect|designer|analyst|consultant|intern|founder|specialist|officer|associate|scientist|researcher|sde|swe))\s+(.+)$/i,
    );
    if (splitRole && !ROLE_HINT.test(splitRole[2]) && splitRole[2].length <= 60) {
      role = splitRole[1].trim();
      company = splitRole[2].trim();
    }
  }

  return {
    company: company.replace(/\s*\|\s*$/, "").trim(),
    role: role.replace(/\s*\|\s*$/, "").trim(),
    location: location.replace(/\s*[|]+\s*$/, "").trim(),
    startDate,
    endDate,
    current,
    description,
  };
}

function splitEducationBlocks(lines: string[]) {
  const blocks: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    const startsNew =
      current.length > 0 &&
      !isBullet(line) &&
      (SCHOOL_HINT.test(line) || DEGREE_HINT.test(line)) &&
      (current.some(isBullet) ||
        current.some((l) => SCHOOL_HINT.test(l) || DEGREE_HINT.test(l)));

    if (startsNew) {
      blocks.push(current);
      current = [line];
      continue;
    }
    current.push(line);
  }
  if (current.length) blocks.push(current);
  return blocks;
}

function parseEducationBlock(lines: string[]) {
  if (!lines.length) return null;

  let school = "";
  let degree = "";
  let field = "";
  let location = "";
  let startDate = "";
  let endDate = "";

  const meta: string[] = [];
  for (const line of lines) {
    if (isBullet(line)) break;
    if (meta.length >= 3) break;
    meta.push(line);
  }

  for (const line of meta) {
    const dateInfo = parseDateRange(line);
    if (dateInfo && !startDate) {
      startDate = dateInfo.startDate;
      endDate = dateInfo.endDate;
    }
  }

  const primary = meta
    .map((l) => l.replace(DATE_RANGE_RE, "").replace(/\s*[|]+\s*$/g, "").trim())
    .filter(Boolean);
  const parts = primary.flatMap((line) => splitHeaderParts(line));

  for (const part of parts) {
    const cleaned = part.replace(/\s*[|]+\s*$/g, "").trim();
    if (!cleaned) continue;
    if (!school && SCHOOL_HINT.test(cleaned)) school = cleaned;
    else if (!degree && DEGREE_HINT.test(cleaned)) {
      const bits = cleaned.split(/\bin\b/i).map((b) => b.trim());
      degree = bits[0];
      field = bits.slice(1).join(" in ").trim();
    } else if (!location && looksLikeLocation(cleaned) && !SCHOOL_HINT.test(cleaned)) {
      location = cleaned;
    } else if (!school) school = cleaned;
    else if (!degree) {
      if (DEGREE_HINT.test(cleaned)) {
        const bits = cleaned.split(/\bin\b/i).map((b) => b.trim());
        degree = bits[0];
        field = bits.slice(1).join(" in ").trim();
      } else if (!field) field = cleaned;
    } else if (!field) field = cleaned;
  }

  if (!school && primary[0]) school = primary[0];

  // "Stanford University MBA" / "IIT Bombay B.Tech"
  if (school && !degree) {
    const deg = school.match(
      /^(.*?)\s+((?:B\.?\s?S\.?|B\.?\s?A\.?|B\.?\s?E\.?|B\.?\s?Tech|M\.?\s?S\.?|M\.?\s?A\.?|MBA|Ph\.?\s?D\.?|Bachelor'?s?|Master'?s?|B\.?Tech|M\.?Tech)(?:\s+in\s+.+)?)$/i,
    );
    if (deg && (SCHOOL_HINT.test(deg[1]) || deg[1].split(/\s+/).length <= 4)) {
      school = deg[1].trim();
      const bits = deg[2].split(/\bin\b/i).map((b) => b.trim());
      degree = bits[0];
      field = field || bits.slice(1).join(" in ").trim();
    }
  }

  const details = lines
    .slice(meta.length)
    .map(stripBullet)
    .filter(Boolean)
    .join(" · ");

  if (!school && !degree && !details) return null;

  return {
    school,
    degree,
    field,
    location: location.replace(/\s*[|]+\s*$/g, "").trim(),
    startDate,
    endDate,
    details,
  };
}

function parseSkills(lines: string[]) {
  if (!lines.length) return [];

  const categorized = lines
    .map((line) => {
      const cleaned = stripBullet(line);
      const match = cleaned.match(/^([^:]{2,48}):\s*(.+)$/);
      if (!match) return null;
      return {
        category: match[1].trim(),
        skills: match[2]
          .replace(/\s*[|•·]\s*/g, ", ")
          .replace(/\s{2,}/g, " ")
          .trim(),
      };
    })
    .filter(Boolean) as Array<{ category: string; skills: string }>;

  if (categorized.length > 0) return categorized;

  const skills = lines
    .map(stripBullet)
    .join(", ")
    .replace(/\s*[|•·]\s*/g, ", ")
    .replace(/,\s*,+/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return skills ? [{ category: "Skills", skills }] : [];
}

function isTechStackLine(line: string) {
  const cleaned = stripBullet(line).replace(/^tech(?:nologies|stack)?\s*:?\s*/i, "");
  const parts = cleaned.split(/,\s*/).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 3) return false;
  const techish = parts.filter(
    (part) =>
      part.length <= 28 &&
      !/[.!?]$/.test(part) &&
      !/^(building|built|implemented|applied|shipped|created|developed|integrated)\b/i.test(
        part,
      ),
  );
  return techish.length >= Math.ceil(parts.length * 0.7);
}

function isDescriptionVerbLine(line: string) {
  return /^(building|built|implementing|implemented|applied|shipped|created|developed|integrated|designed|maintaining|maintain)\b/i.test(
    stripBullet(line),
  );
}

function isWrapContinuation(line: string) {
  if (!line) return false;
  if (!/^[a-z(]/.test(line)) return false;
  const first = line.split(/\s+/)[0] ?? "";
  // Product names like portFolio / iPhone are not wrap leftovers
  if (/[a-z][A-Z]/.test(first)) return false;
  if (/[—–]/.test(line)) return false;
  return true;
}

/**
 * True for real project titles like:
 * "Network Topology — Electricity Distribution GIS Platform"
 * "NutriAI Offline-First Nutrition Tracker"
 * "portFolio — AI-Assisted Resume Builder and CMS"
 * Not for wrapped bullet leftovers ("graphs for upstream…").
 */
function isProjectTitleLine(line: string) {
  if (!line || isBullet(line) || isTechStackLine(line) || detectSection(line)) {
    return false;
  }
  if (isWrapContinuation(line)) return false;
  if (/^[.,;:]/.test(line)) return false;

  // Em/en dash title pattern is the strongest signal for this resume style
  if (/[—–]/.test(line) && line.length <= 120) return true;

  // Finished sentence → description, not a title
  if (/[.!?]$/.test(line) && !/[—–]/.test(line)) return false;

  // Leading description verbs without a product-style name
  const first = line.split(/\s+/)[0] ?? "";
  if (isDescriptionVerbLine(line) && !/[a-z][A-Z]/.test(first) && !/[A-Z]{2,}/.test(first)) {
    return false;
  }

  // Short product / title-case heading without being a comma list
  if (line.length <= 100 && !/,.*,.*,/.test(line) && /^[A-Za-z]/.test(line)) {
    if (/[a-z][A-Z]/.test(first) || /[A-Z]{2,}/.test(first)) return true;
    if (/^[A-Z]/.test(line) && line.split(/\s+/).length <= 8 && !isDescriptionVerbLine(line)) {
      return true;
    }
  }

  return false;
}

function splitPortfolioBlocks(lines: string[]) {
  const blocks: string[][] = [];
  let current: string[] = [];

  const flush = () => {
    if (current.length) blocks.push(current);
    current = [];
  };

  for (const line of lines) {
    // Stop if a new section heading leaked into portfolio lines
    if (detectSection(line)) {
      flush();
      continue;
    }

    if (!current.length) {
      current.push(line);
      continue;
    }

    if (
      isBullet(line) ||
      isTechStackLine(line) ||
      isWrapContinuation(line) ||
      isDescriptionVerbLine(line)
    ) {
      current.push(line);
      continue;
    }

    if (isProjectTitleLine(line)) {
      flush();
      current.push(line);
      continue;
    }

    current.push(line);
  }

  flush();
  return blocks;
}

function mergeWrappedLines(lines: string[]) {
  const merged: string[] = [];
  for (const line of lines) {
    const prev = merged[merged.length - 1];
    if (prev && isWrapContinuation(line)) {
      merged[merged.length - 1] = `${prev} ${line}`.replace(/\s+/g, " ").trim();
      continue;
    }
    // "PDF," + "Word, and JSON." style wraps after trailing comma/colon
    if (
      prev &&
      !isBullet(line) &&
      !isProjectTitleLine(line) &&
      !isTechStackLine(line) &&
      /[,:]$/.test(prev)
    ) {
      merged[merged.length - 1] = `${prev} ${line}`.replace(/\s+/g, " ").trim();
      continue;
    }
    merged.push(line);
  }
  return merged;
}

function parsePortfolioBlock(lines: string[]) {
  if (!lines.length) return null;

  const merged = mergeWrappedLines(lines);
  const all = merged.join("\n");
  const url =
    firstMatch(all, /(?:https?:\/\/|www\.)[^\s|,;)]+/i) ||
    firstMatch(all, /github\.com\/[^\s|,;)]+/i) ||
    "";

  const header = merged[0] ?? "";
  let name = header.replace(WEB_URL_RE, "").replace(/\s+/g, " ").trim();
  if (!name || /^https?:/i.test(name)) name = "Project";

  const rest = merged.slice(1);
  let technologies = "";
  const descriptionLines: string[] = [];

  for (const line of rest) {
    const cleaned = stripBullet(
      line
        .replace(/(?:https?:\/\/|www\.)[^\s|,;)]+/gi, "")
        .replace(/github\.com\/[^\s|,;)]+/gi, "")
        .trim(),
    );
    if (!cleaned) continue;

    if (!technologies && (isTechStackLine(cleaned) || /^tech(?:nologies|stack)?\s*:/i.test(cleaned))) {
      technologies = cleaned.replace(/^tech(?:nologies|stack)?\s*:?\s*/i, "").trim();
      continue;
    }

    descriptionLines.push(cleaned);
  }

  if (!technologies && descriptionLines[0] && isTechStackLine(descriptionLines[0])) {
    technologies = descriptionLines.shift() ?? "";
  }

  const description = descriptionLines.join("\n").trim();
  if (!name && !description && !technologies) return null;

  // Drop sentence-fragment "projects"
  if (isWrapContinuation(name)) return null;
  if (/[.!?]$/.test(name) && !/[—–]/.test(name) && !description && !technologies) {
    return null;
  }
  // Drop bare section leftovers / empty shells
  if (!description && !technologies && name.split(/\s+/).length <= 2 && !/[—–]/.test(name)) {
    return null;
  }

  return {
    name,
    url: normalizeUrl(url),
    description,
    technologies,
  };
}

function parsePersonal(headerLines: string[], fullText: string) {
  const email = firstMatch(fullText, EMAIL_RE);
  const linkedin = firstMatch(fullText, LINKEDIN_RE).replace(/[.,;)+]+$/, "");
  const github = firstMatch(fullText, GITHUB_RE).replace(/[.,;)+]+$/, "");
  const phone =
    fullText
      .match(new RegExp(PHONE_RE.source, "gi"))
      ?.find((value) => value.replace(/\D/g, "").length >= 10) ?? "";

  const isContactOnly = (line: string) => {
    const stripped = stripContacts(line);
    return !stripped || stripped.length < 2;
  };

  const useful = headerLines.filter((line) => !isContactOnly(line) && !detectSection(line));

  let fullName = "";
  let title = "";
  for (const line of useful.slice(0, 5)) {
    const cleaned = stripContacts(line);
    if (!cleaned) continue;
    if (!fullName && cleaned.length <= 70) {
      // Prefer a name-like line (few words, no job keywords) but accept first short line
      fullName = cleaned;
      continue;
    }
    if (fullName && !title && cleaned.length <= 100 && cleaned !== fullName) {
      if (looksLikeLocation(cleaned) && !ROLE_HINT.test(cleaned)) continue;
      title = cleaned;
      break;
    }
  }

  // "Jordan Lee Product Manager" → name + title
  if (fullName && ROLE_HINT.test(fullName)) {
    const idx = fullName.search(ROLE_HINT);
    if (idx > 2) {
      const maybeTitle = fullName.slice(idx).trim();
      const maybeName = fullName.slice(0, idx).trim();
      if (maybeName.split(/\s+/).length <= 4) {
        fullName = maybeName;
        if (!title) title = maybeTitle;
      }
    }
  }

  const location =
    useful
      .map(stripContacts)
      .find(
        (line) =>
          line &&
          line !== fullName &&
          line !== title &&
          looksLikeLocation(line),
      ) ?? "";

  // Website: prefer explicit personal domains, never email fragments
  const websiteCandidates =
    fullText.match(
      /(?:https?:\/\/|www\.)[^\s|,;)]+|(?:[a-z0-9-]+\.)+(?:dev|io|app|me|com|net|org|ai)(?:\/[^\s|,;)]*)?/gi,
    ) ?? [];
  const website =
    websiteCandidates
      .map((u) => u.replace(/[.,;)+]+$/, ""))
      .find(
        (url) =>
          !/linkedin\.com/i.test(url) &&
          !/github\.com/i.test(url) &&
          !email.toLowerCase().includes(url.toLowerCase()) &&
          !EMAIL_RE.test(url),
      ) ?? "";

  // If title accidentally captured location, clear it
  if (title && looksLikeLocation(title) && !ROLE_HINT.test(title)) {
    title = "";
  }

  return {
    fullName,
    title,
    email,
    phone,
    location,
    website: normalizeUrl(website),
    linkedin,
    github,
  };
}

/**
 * Heuristic resume structuring — runs fully in the browser, no AI.
 */
export function parseResumeTextLocal(rawText: string): ParsedResumePayload {
  const lines = toLines(rawText);
  const sections = collectSections(lines);
  const fullText = lines.join("\n");

  const personal = parsePersonal(sections.header, fullText);

  let experiences = splitExperienceBlocks(sections.experience)
    .map(parseExperienceBlock)
    .filter(Boolean) as ParsedResumePayload["experiences"];

  let education = splitEducationBlocks(sections.education)
    .map(parseEducationBlock)
    .filter(Boolean) as ParsedResumePayload["education"];

  let skills = parseSkills(sections.skills);

  let portfolio = splitPortfolioBlocks(sections.portfolio)
    .map(parsePortfolioBlock)
    .filter(Boolean) as ParsedResumePayload["portfolio"];

  let summary = sections.summary.join("\n").trim();

  const hasSections =
    sections.experience.length +
      sections.education.length +
      sections.skills.length +
      sections.portfolio.length +
      sections.summary.length >
    0;

  if (!hasSections) {
    // Attempt to salvage body content after contact header
    const bodyStart = Math.min(8, Math.max(2, lines.findIndex((l, i) => i > 0 && (ROLE_HINT.test(l) || parseDateRange(l) || detectSection(l)))));
    const body = lines.slice(bodyStart === -1 ? 3 : bodyStart);
    experiences = splitExperienceBlocks(body)
      .map(parseExperienceBlock)
      .filter((item) => item && (item.role || item.company || item.description)) as ParsedResumePayload["experiences"];
  }

  if (!summary && sections.other.length) {
    summary = sections.other.slice(0, 8).join("\n");
  }

  if (!skills.length) {
    const skillish = [...sections.other, ...sections.header]
      .filter((line) => /[:,]/.test(line) && line.split(/,|·|\|/).length >= 3)
      .slice(0, 8);
    skills = parseSkills(skillish);
  }

  // Drop empty / garbage experience rows
  experiences = experiences.filter(
    (item) => item.role || item.company || item.description.length > 20,
  );

  education = education.filter(
    (item) => item.school || item.degree || item.details,
  );

  return {
    personal,
    summary,
    experiences,
    education,
    skills,
    portfolio,
  };
}
