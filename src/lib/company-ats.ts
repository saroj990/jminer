import type { ParsedCareersJob } from "@/types/company-tracker";

function snippetFromPlain(text: string, max = 400): string {
  const s = text.replace(/\s+/g, " ").trim();
  return s.length <= max ? s : `${s.slice(0, max)}…`;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${new URL(url).hostname}`);
  }
  return res.json() as Promise<T>;
}

function greenhouseSlugFromUrl(careersUrl: string): string | null {
  try {
    const u = new URL(careersUrl);
    if (!u.hostname.includes("greenhouse.io")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (!parts.length) return null;
    if (parts[0] === "v1" && parts[1] === "boards" && parts[2]) return parts[2];
    return parts[0];
  } catch {
    return null;
  }
}

function leverSlugFromUrl(careersUrl: string): string | null {
  try {
    const u = new URL(careersUrl);
    if (!u.hostname.includes("lever.co")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[0] ?? null;
  } catch {
    return null;
  }
}

function ashbySlugFromUrl(careersUrl: string): string | null {
  try {
    const u = new URL(careersUrl);
    if (!u.hostname.includes("ashbyhq.com")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[0] ?? null;
  } catch {
    return null;
  }
}

function slugsFromHtml(html: string): {
  greenhouse: string[];
  lever: string[];
  ashby: string[];
} {
  const greenhouse = new Set<string>();
  const lever = new Set<string>();
  const ashby = new Set<string>();

  for (const m of html.matchAll(/boards\.greenhouse\.io\/([a-zA-Z0-9_-]+)/gi)) {
    greenhouse.add(m[1]);
  }
  for (const m of html.matchAll(/boards-api\.greenhouse\.io\/v1\/boards\/([a-zA-Z0-9_-]+)/gi)) {
    greenhouse.add(m[1]);
  }
  for (const m of html.matchAll(/jobs\.lever\.co\/([a-zA-Z0-9_-]+)/gi)) {
    lever.add(m[1]);
  }
  for (const m of html.matchAll(/jobs\.ashbyhq\.com\/([a-zA-Z0-9_-]+)/gi)) {
    ashby.add(m[1]);
  }

  return {
    greenhouse: [...greenhouse],
    lever: [...lever],
    ashby: [...ashby],
  };
}

async function fetchGreenhouseJobs(boardSlug: string): Promise<ParsedCareersJob[]> {
  type GhJob = {
    title?: string;
    absolute_url?: string;
    location?: { name?: string };
    content?: string;
  };
  const data = await fetchJson<{ jobs?: GhJob[] }>(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardSlug)}/jobs`,
  );
  const jobs = data.jobs ?? [];
  return jobs
    .filter((j) => j.title)
    .map((j) => ({
      title: j.title!.trim(),
      jobUrl: j.absolute_url ?? "",
      locationText: j.location?.name?.trim() ?? "",
      snippet: j.content ? snippetFromPlain(stripTags(j.content)) : "",
      techStack: [] as string[],
    }));
}

async function fetchLeverJobs(siteSlug: string): Promise<ParsedCareersJob[]> {
  type LevJob = {
    text?: string;
    hostedUrl?: string;
    categories?: { location?: string };
    descriptionPlain?: string;
  };
  const data = await fetchJson<LevJob[]>(
    `https://api.lever.co/v0/postings/${encodeURIComponent(siteSlug)}?mode=json`,
  );
  return data
    .filter((j) => j.text)
    .map((j) => ({
      title: j.text!.trim(),
      jobUrl: j.hostedUrl ?? "",
      locationText: j.categories?.location?.trim() ?? "",
      snippet: j.descriptionPlain ? snippetFromPlain(j.descriptionPlain) : "",
      techStack: [] as string[],
    }));
}

async function fetchAshbyJobs(boardSlug: string): Promise<ParsedCareersJob[]> {
  type AshbyJob = {
    title?: string;
    jobUrl?: string;
    location?: string;
    descriptionPlain?: string;
  };
  const data = await fetchJson<{ jobs?: AshbyJob[] }>(
    `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(boardSlug)}`,
  );
  const jobs = data.jobs ?? [];
  return jobs
    .filter((j) => j.title)
    .map((j) => ({
      title: j.title!.trim(),
      jobUrl: j.jobUrl ?? "",
      locationText: j.location?.trim() ?? "",
      snippet: j.descriptionPlain ? snippetFromPlain(j.descriptionPlain) : "",
      techStack: [] as string[],
    }));
}

/**
 * Many careers pages are JS shells; Greenhouse, Lever, and Ashby expose public JSON APIs.
 */
export async function fetchJobsViaAts(
  careersUrl: string,
  html?: string,
): Promise<{ jobs: ParsedCareersJob[]; source: string } | null> {
  const attempts: Array<{ provider: string; slug: string; fetch: () => Promise<ParsedCareersJob[]> }> = [];

  const gh = greenhouseSlugFromUrl(careersUrl);
  if (gh) attempts.push({ provider: "greenhouse", slug: gh, fetch: () => fetchGreenhouseJobs(gh) });

  const lev = leverSlugFromUrl(careersUrl);
  if (lev) attempts.push({ provider: "lever", slug: lev, fetch: () => fetchLeverJobs(lev) });

  const ash = ashbySlugFromUrl(careersUrl);
  if (ash) attempts.push({ provider: "ashby", slug: ash, fetch: () => fetchAshbyJobs(ash) });

  if (html) {
    const embedded = slugsFromHtml(html);
    for (const slug of embedded.greenhouse) {
      if (!attempts.some((a) => a.provider === "greenhouse" && a.slug === slug)) {
        attempts.push({
          provider: "greenhouse",
          slug,
          fetch: () => fetchGreenhouseJobs(slug),
        });
      }
    }
    for (const slug of embedded.lever) {
      if (!attempts.some((a) => a.provider === "lever" && a.slug === slug)) {
        attempts.push({ provider: "lever", slug, fetch: () => fetchLeverJobs(slug) });
      }
    }
    for (const slug of embedded.ashby) {
      if (!attempts.some((a) => a.provider === "ashby" && a.slug === slug)) {
        attempts.push({ provider: "ashby", slug, fetch: () => fetchAshbyJobs(slug) });
      }
    }
  }

  for (const { provider, slug, fetch } of attempts) {
    try {
      const jobs = await fetch();
      if (jobs.length > 0) {
        return { jobs, source: `${provider}:${slug}` };
      }
    } catch {
      /* try next */
    }
  }

  return null;
}

export const JS_HEAVY_FETCH_HINT =
  "Page returned very little text — the site likely needs JavaScript. Try the direct Greenhouse, Lever, or Ashby board URL (e.g. boards.greenhouse.io/…, jobs.lever.co/…, jobs.ashbyhq.com/…), or a static HTML careers page.";