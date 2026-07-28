export const TEMPLATES = [
  { id: "classic", label: "Classic", description: "Traditional single-column ATS-safe layout" },
  { id: "modern", label: "Modern", description: "Clean accent header with strong hierarchy" },
  { id: "minimal", label: "Minimal", description: "Sparse typography-focused layout" },
  { id: "ats", label: "ATS Friendly", description: "Maximum parseability, plain structure" },
  { id: "executive", label: "Executive", description: "Polished senior-leadership presentation" },
] as const;

export type TemplateId = (typeof TEMPLATES)[number]["id"];

export type ResumeConfig = {
  sectionOrder: string[];
  visibleSections: Record<string, boolean>;
  experienceIds: string[];
  educationIds: string[];
  projectIds: string[];
  skillIds: string[];
};

export const defaultResumeConfig = (): ResumeConfig => ({
  sectionOrder: [
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "certifications",
    "awards",
    "publications",
    "languages",
    "interests",
  ],
  visibleSections: {
    summary: true,
    experience: true,
    education: true,
    skills: true,
    projects: true,
    certifications: false,
    awards: false,
    publications: false,
    languages: false,
    interests: false,
  },
  experienceIds: [],
  educationIds: [],
  projectIds: [],
  skillIds: [],
});

export function parseResumeConfig(raw: string): ResumeConfig {
  try {
    const parsed = JSON.parse(raw) as Partial<ResumeConfig>;
    return { ...defaultResumeConfig(), ...parsed };
  } catch {
    return defaultResumeConfig();
  }
}
