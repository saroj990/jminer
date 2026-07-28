import type { ResumeData } from "@/types/resume";
import type { profileInclude } from "@/lib/api";
import type { Prisma } from "@prisma/client";

type FullProfile = Prisma.ProfileGetPayload<{ include: typeof profileInclude }>;

export function profileToResumeData(profile: FullProfile): ResumeData {
  const skillGroups = new Map<string, string[]>();
  for (const skill of profile.skills) {
    const cat = skill.category || "Skills";
    const list = skillGroups.get(cat) ?? [];
    if (skill.name) list.push(skill.name);
    skillGroups.set(cat, list);
  }

  return {
    personal: {
      fullName: profile.fullName,
      title: profile.headline,
      email: profile.email,
      phone: profile.phone,
      location: profile.address,
      website: profile.website || profile.portfolio,
      linkedin: profile.linkedin,
      github: profile.github,
    },
    summary: profile.summary,
    experiences: profile.experiences.map((item) => ({
      id: item.id,
      company: item.company,
      role: item.role,
      location: item.location,
      startDate: item.startDate,
      endDate: item.endDate,
      current: item.current,
      description:
        item.achievements.trim() ||
        item.description.trim() ||
        [item.technologies && `Tech: ${item.technologies}`].filter(Boolean).join("\n"),
    })),
    education: profile.education.map((item) => ({
      id: item.id,
      school: item.institution,
      degree: item.degree,
      field: item.field,
      location: item.location,
      startDate: item.startDate,
      endDate: item.endDate,
      details: [item.grade && `Grade: ${item.grade}`, item.description, item.achievements]
        .filter(Boolean)
        .join(" · "),
    })),
    skills: Array.from(skillGroups.entries()).map(([category, names], index) => ({
      id: `skill-group-${index}`,
      category,
      skills: names.join(", "),
    })),
    portfolio: profile.projects.map((item) => ({
      id: item.id,
      name: item.name,
      url: item.liveUrl || item.githubUrl,
      description: [item.description, item.impact].filter(Boolean).join(" "),
      technologies: item.technologies,
    })),
  };
}
