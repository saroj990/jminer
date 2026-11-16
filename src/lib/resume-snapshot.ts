import type { ResumeData } from "@/types/resume";

export function parseResumeSnapshot(snapshot: string | undefined): ResumeData | null {
  if (!snapshot?.trim()) return null;
  try {
    const data = JSON.parse(snapshot) as Partial<ResumeData> & { resume?: ResumeData };
    const candidate = data.resume ?? data;
    if (
      candidate &&
      typeof candidate === "object" &&
      "personal" in candidate &&
      "experiences" in candidate
    ) {
      return candidate as ResumeData;
    }
  } catch {
    return null;
  }
  return null;
}