const MAX_HTML_BYTES = 1_500_000;
const MAX_TEXT_CHARS = 48_000;
const MAX_LINKS = 120;

export function stripHtmlToText(html: string): string {
  let s = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  s = s.replace(/<[^>]+>/g, " ");
  s = s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
  return s.slice(0, MAX_TEXT_CHARS);
}

export function extractLinks(html: string, baseUrl: string): string[] {
  const hrefRe = /href\s*=\s*["']([^"']+)["']/gi;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const base = new URL(baseUrl);
  while ((m = hrefRe.exec(html)) !== null) {
    if (out.length >= MAX_LINKS) break;
    const href = m[1].trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("javascript:")) {
      continue;
    }
    try {
      const abs = new URL(href, base).toString();
      if (abs.startsWith("http")) out.push(abs);
    } catch {
      /* skip */
    }
  }
  return [...new Set(out)];
}

export async function fetchCareersHtml(careersUrl: string): Promise<string> {
  const res = await fetch(careersUrl, {
    headers: {
      "User-Agent":
        "portFolioCareerBot/1.0 (+https://localhost; job-matching for signed-in user)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(30_000),
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching careers page`);
  }
  const buf = await res.arrayBuffer();
  if (buf.byteLength > MAX_HTML_BYTES) {
    throw new Error("Careers page too large to parse");
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(buf);
}

export function resolveJobUrl(jobUrl: string, baseUrl: string): string {
  const u = jobUrl.trim();
  if (!u) return "N/A";
  if (/^https?:\/\//i.test(u)) return u;
  try {
    return new URL(u, baseUrl).toString();
  } catch {
    return "N/A";
  }
}