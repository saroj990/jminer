import { createHash } from "crypto";

export function listingExternalKey(title: string, jobUrl: string): string {
  const url = jobUrl.trim();
  if (url && url !== "N/A" && /^https?:\/\//i.test(url)) {
    return createHash("sha256").update(url).digest("hex").slice(0, 32);
  }
  const blob = `${title.trim().toLowerCase()}|${url}`;
  return createHash("sha256").update(blob).digest("hex").slice(0, 32);
}