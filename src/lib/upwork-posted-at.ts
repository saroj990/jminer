/** OCR capture instant used as “now” when Upwork says “posted X ago”. */
export function derivePostedAtFromRelativeText(
  postedAtText: string | undefined,
  reference: Date,
): Date | null {
  if (!postedAtText?.trim()) return null;

  const raw = postedAtText.trim();
  const s = raw.toLowerCase().replace(/\s+/g, " ");

  const result = new Date(reference.getTime());

  if (/\bjust\s+now\b/.test(s)) return result;

  if (/\byesterday\b/.test(s)) {
    result.setDate(result.getDate() - 1);
    return result;
  }

  const minMatch = s.match(/(\d+)\s*(?:min(?:ute)?s?)\s*ago/);
  if (minMatch) {
    result.setMinutes(result.getMinutes() - Number(minMatch[1]));
    return result;
  }

  const hourMatch = s.match(/(\d+)\s*(?:hours?|hrs?)\s*ago/);
  if (hourMatch) {
    result.setHours(result.getHours() - Number(hourMatch[1]));
    return result;
  }

  const dayMatch = s.match(/(\d+)\s*days?\s*ago/);
  if (dayMatch) {
    result.setDate(result.getDate() - Number(dayMatch[1]));
    return result;
  }

  const weekMatch = s.match(/(\d+)\s*weeks?\s*ago/);
  if (weekMatch) {
    result.setDate(result.getDate() - Number(weekMatch[1]) * 7);
    return result;
  }

  const monthMatch = s.match(/(\d+)\s*months?\s*ago/);
  if (monthMatch) {
    result.setMonth(result.getMonth() - Number(monthMatch[1]));
    return result;
  }

  const genericAgo = s.match(/(\d+)\s+([a-z]+)\s+ago/);
  if (genericAgo) {
    const n = Number(genericAgo[1]);
    const unit = genericAgo[2];
    if (unit.startsWith("min")) result.setMinutes(result.getMinutes() - n);
    else if (unit.startsWith("hour") || unit === "hr") result.setHours(result.getHours() - n);
    else if (unit.startsWith("day")) result.setDate(result.getDate() - n);
    else if (unit.startsWith("week")) result.setDate(result.getDate() - n * 7);
    else if (unit.startsWith("month")) result.setMonth(result.getMonth() - n);
    else return tryAbsoluteDate(raw);
    return result;
  }

  return tryAbsoluteDate(raw);
}

function tryAbsoluteDate(text: string): Date | null {
  const cleaned = text
    .replace(/^posted\s*(on)?\s*/i, "")
    .replace(/^posted\s*/i, "")
    .trim();
  const ms = Date.parse(cleaned);
  if (Number.isFinite(ms)) return new Date(ms);
  return null;
}

export function formatJobPostedAt(
  postedAtIso: string | null | undefined,
  postedAtText: string,
): string {
  if (postedAtIso) {
    const d = new Date(postedAtIso);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    }
  }
  return postedAtText.trim() || "—";
}

export const JOB_URL_NA = "N/A";

export function normalizeJobUrl(url?: string | null): string {
  const u = url?.trim();
  if (!u || u.toUpperCase() === JOB_URL_NA) return JOB_URL_NA;
  if (/^https?:\/\//i.test(u)) return u;
  return JOB_URL_NA;
}

export function isUsableJobUrl(url: string): boolean {
  return url !== JOB_URL_NA && /^https?:\/\//i.test(url);
}