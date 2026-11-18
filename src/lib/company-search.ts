export type SearchResult = {
  title: string;
  link: string;
  snippet: string;
  score: number;
};

const CAREER_PATH_RE =
  /\/(careers?|jobs?|join-us|join|opportunities|work-with-us|talent)/i;

const CAREER_TEXT_RE = /career|job opening|we.?re hiring|join our team/i;

function domainFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function scoreCareersCandidate(link: string, title: string, snippet: string): number {
  let score = 0;
  if (CAREER_PATH_RE.test(link)) score += 40;
  if (CAREER_TEXT_RE.test(title)) score += 20;
  if (CAREER_TEXT_RE.test(snippet)) score += 10;
  if (/greenhouse|lever|workday|ashby|icims/i.test(link)) score += 15;
  return score;
}

export async function serpSearchCareers(
  companyName: string,
  websiteUrl?: string,
): Promise<SearchResult[]> {
  const key = process.env.SERPAPI_API_KEY?.trim();
  if (!key) {
    throw new Error("SERPAPI_API_KEY is not configured in .env");
  }

  const domain = websiteUrl && websiteUrl !== "N/A" ? domainFromUrl(websiteUrl) : null;
  const q = domain
    ? `site:${domain} (careers OR jobs OR opportunities)`
    : `"${companyName}" careers jobs`;

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", q);
  url.searchParams.set("num", "10");
  url.searchParams.set("api_key", key);

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(25_000) });
  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`SerpAPI error: ${raw.slice(0, 200) || res.statusText}`);
  }

  const data = JSON.parse(raw) as {
    organic_results?: Array<{ title?: string; link?: string; snippet?: string }>;
  };

  const organic = data.organic_results ?? [];
  const ranked: SearchResult[] = organic
    .filter((r) => r.link && /^https?:\/\//i.test(r.link))
    .map((r) => ({
      title: r.title ?? "",
      link: r.link!,
      snippet: r.snippet ?? "",
      score: scoreCareersCandidate(r.link!, r.title ?? "", r.snippet ?? ""),
    }))
  .sort((a, b) => b.score - a.score);

  return ranked;
}

export function pickBestCareersUrl(results: SearchResult[]): {
  url: string;
  source: "search" | "heuristic";
  candidates: SearchResult[];
} | null {
  if (!results.length) return null;
  const best = results[0];
  if (best.score < 15) return null;
  return {
    url: best.link,
    source: best.score >= 40 ? "heuristic" : "search",
    candidates: results.slice(0, 5),
  };
}