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
  const personal = parsed?.personal ?? {
    fullName: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    linkedin: "",
    github: "",
  };
  const experiences = Array.isArray(parsed?.experiences) ? parsed.experiences : [];
  const education = Array.isArray(parsed?.education) ? parsed.education : [];
  const skills = Array.isArray(parsed?.skills) ? parsed.skills : [];
  const portfolio = Array.isArray(parsed?.portfolio) ? parsed.portfolio : [];

  return {
    personal: {
      fullName: personal.fullName || "",
      title: personal.title || "",
      email: personal.email || "",
      phone: personal.phone || "",
      location: personal.location || "",
      website: personal.website || "",
      linkedin: personal.linkedin || "",
      github: personal.github || "",
    },
    summary: parsed?.summary || "",
    experiences:
      experiences.length > 0
        ? experiences.map((item) => ({ ...item, id: newId() }))
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
      education.length > 0
        ? education.map((item) => ({ ...item, id: newId() }))
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
      skills.length > 0
        ? skills.map((item) => ({ ...item, id: newId() }))
        : [{ id: newId(), category: "", skills: "" }],
    portfolio:
      portfolio.length > 0
        ? portfolio.map((item) => ({ ...item, id: newId() }))
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
