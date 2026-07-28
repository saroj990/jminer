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
