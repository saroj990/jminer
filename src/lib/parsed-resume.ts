import type { ResumeData } from "@/types/resume";
import type { ParsedResumePayload } from "@/lib/parse-resume-local";

export type { ParsedResumePayload };

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function parsedPayloadToResumeData(parsed: ParsedResumePayload): ResumeData {
  return {
    personal: {
      fullName: parsed.personal.fullName || "",
      title: parsed.personal.title || "",
      email: parsed.personal.email || "",
      phone: parsed.personal.phone || "",
      location: parsed.personal.location || "",
      website: parsed.personal.website || "",
      linkedin: parsed.personal.linkedin || "",
      github: parsed.personal.github || "",
    },
    summary: parsed.summary || "",
    experiences:
      parsed.experiences.length > 0
        ? parsed.experiences.map((item) => ({ ...item, id: newId() }))
        : [
            {
              id: newId(),
              company: "",
              role: "",
              location: "",
              startDate: "",
              endDate: "",
              current: false,
              description: "",
            },
          ],
    education:
      parsed.education.length > 0
        ? parsed.education.map((item) => ({ ...item, id: newId() }))
        : [
            {
              id: newId(),
              school: "",
              degree: "",
              field: "",
              location: "",
              startDate: "",
              endDate: "",
              details: "",
            },
          ],
    skills:
      parsed.skills.length > 0
        ? parsed.skills.map((item) => ({ ...item, id: newId() }))
        : [{ id: newId(), category: "", skills: "" }],
    portfolio:
      parsed.portfolio.length > 0
        ? parsed.portfolio.map((item) => ({ ...item, id: newId() }))
        : [
            {
              id: newId(),
              name: "",
              url: "",
              description: "",
              technologies: "",
            },
          ],
  };
}
