export function formatMonthYear(value: string): string {
  if (!value) return "";
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function formatDateRange(
  startDate: string,
  endDate: string,
  current?: boolean,
): string {
  const start = formatMonthYear(startDate);
  const end = current ? "Present" : formatMonthYear(endDate);
  if (start && end) return `${start} – ${end}`;
  return start || end || "";
}

export function slugifyFilename(name: string): string {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "resume";
}

/** Strip common list markers from the start of a line. */
export function cleanBulletLine(line: string): string {
  return line
    .replace(/^([•·●▪◦‣➢★☆]|[-*–—]|\d+[.)])\s+/, "")
    .trim();
}

/**
 * Split resume bullets that may be newline-separated OR jammed onto one
 * line with inline "•" markers (common after AI/local parse).
 */
export function splitBulletLines(text: string): string[] {
  if (!text?.trim()) return [];

  const parts = text
    .replace(/\r\n/g, "\n")
    .split(/\n+/)
    .flatMap((line) =>
      // Keep content before the first marker; split on subsequent markers
      line.split(/\s*[•●▪◦·‣]\s+/),
    )
    .map(cleanBulletLine)
    .filter(Boolean);

  // Deduplicate consecutive identical lines
  return parts.filter((line, index) => index === 0 || line !== parts[index - 1]);
}

/** Rewrite experience/portfolio descriptions so inline "•" become real newlines. */
export function normalizeResumeBulletFields<T extends {
  experiences: { description: string }[];
  portfolio: { description: string }[];
}>(resume: T): T {
  return {
    ...resume,
    experiences: resume.experiences.map((item) => ({
      ...item,
      description: splitBulletLines(item.description).join("\n"),
    })),
    portfolio: resume.portfolio.map((item) => ({
      ...item,
      description: splitBulletLines(item.description).join("\n"),
    })),
  };
}
