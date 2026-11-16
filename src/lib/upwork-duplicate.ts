/** Normalized key: title + client + posted (case/spacing insensitive). */
export function upworkLeadDedupeKey(
  title: string,
  clientName: string,
  postedAtText: string,
): string {
  const norm = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  return [norm(title), norm(clientName), norm(postedAtText)].join("||");
}

export type UpworkLeadDedupeFields = {
  id: string;
  title: string;
  clientName: string;
  postedAtText: string;
};

export function isDuplicateUpworkLead(
  candidate: { title: string; clientName: string; postedAtText: string },
  existing: UpworkLeadDedupeFields,
): boolean {
  if (!candidate.title.trim()) return false;
  const key = upworkLeadDedupeKey(
    candidate.title,
    candidate.clientName,
    candidate.postedAtText,
  );
  const other = upworkLeadDedupeKey(
    existing.title,
    existing.clientName,
    existing.postedAtText,
  );
  return key === other;
}