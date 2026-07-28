"use client";

import { MonthYearPicker } from "@/components/month-year-picker";
import { AddButton, EntryCard, SectionCard, TextArea, TextField } from "@/components/ui";
import { WriteWithAiButton } from "@/components/write-with-ai-button";
import { useResumeStore } from "@/store/resume-store";

export function PersonalSection() {
  const personal = useResumeStore((s) => s.resume.personal);
  const setPersonal = useResumeStore((s) => s.setPersonal);

  return (
    <SectionCard
      title="Personal details"
      description="How you want to appear at the top of the resume."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Full name"
          value={personal.fullName}
          onChange={(e) => setPersonal({ fullName: e.target.value })}
          placeholder="Alex Morgan"
        />
        <TextField
          label="Professional title"
          value={personal.title}
          onChange={(e) => setPersonal({ title: e.target.value })}
          placeholder="Senior Software Engineer"
        />
        <TextField
          label="Email"
          type="email"
          value={personal.email}
          onChange={(e) => setPersonal({ email: e.target.value })}
          placeholder="you@email.com"
        />
        <TextField
          label="Phone"
          value={personal.phone}
          onChange={(e) => setPersonal({ phone: e.target.value })}
          placeholder="+1 (555) 000-0000"
        />
        <TextField
          label="Location"
          value={personal.location}
          onChange={(e) => setPersonal({ location: e.target.value })}
          placeholder="City, Country"
        />
        <TextField
          label="Website"
          value={personal.website}
          onChange={(e) => setPersonal({ website: e.target.value })}
          placeholder="yoursite.dev"
        />
        <TextField
          label="LinkedIn"
          value={personal.linkedin}
          onChange={(e) => setPersonal({ linkedin: e.target.value })}
          placeholder="linkedin.com/in/you"
        />
        <TextField
          label="GitHub"
          value={personal.github}
          onChange={(e) => setPersonal({ github: e.target.value })}
          placeholder="github.com/you"
        />
      </div>
    </SectionCard>
  );
}

export function SummarySection() {
  const summary = useResumeStore((s) => s.resume.summary);
  const setSummary = useResumeStore((s) => s.setSummary);

  return (
    <SectionCard
      title="Professional summary"
      description="A short pitch of your strengths and focus."
    >
      <TextArea
        label="Summary"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="Product-minded engineer with..."
        rows={4}
        className="sm:col-span-2"
      />
      <WriteWithAiButton
        fieldType="summary"
        value={summary}
        onApply={setSummary}
        context="Professional resume summary"
      />
    </SectionCard>
  );
}

export function ExperienceSection() {
  const experiences = useResumeStore((s) => s.resume.experiences);
  const addExperience = useResumeStore((s) => s.addExperience);
  const updateExperience = useResumeStore((s) => s.updateExperience);
  const removeExperience = useResumeStore((s) => s.removeExperience);

  return (
    <SectionCard
      title="Work experience"
      description="Roles, impact, and outcomes. One bullet per line."
      action={<AddButton onClick={addExperience} label="+ Add role" />}
    >
      {experiences.map((item, index) => (
        <EntryCard
          key={item.id}
          title={`Role ${index + 1}`}
          onRemove={
            experiences.length > 1 ? () => removeExperience(item.id) : undefined
          }
        >
          <TextField
            label="Job title"
            value={item.role}
            onChange={(e) => updateExperience(item.id, { role: e.target.value })}
          />
          <TextField
            label="Company"
            value={item.company}
            onChange={(e) =>
              updateExperience(item.id, { company: e.target.value })
            }
          />
          <TextField
            label="Location"
            value={item.location}
            onChange={(e) =>
              updateExperience(item.id, { location: e.target.value })
            }
          />
          <div className="flex items-end gap-3">
            <label className="mb-2 flex items-center gap-2 text-sm text-[var(--ink)]">
              <input
                type="checkbox"
                checked={item.current}
                onChange={(e) =>
                  updateExperience(item.id, {
                    current: e.target.checked,
                    endDate: e.target.checked ? "" : item.endDate,
                  })
                }
                className="accent-[var(--accent)]"
              />
              Current role
            </label>
          </div>
          <MonthYearPicker
            label="Start date"
            value={item.startDate}
            onChange={(value) => updateExperience(item.id, { startDate: value })}
            hint="Month and year"
          />
          <MonthYearPicker
            label="End date"
            value={item.endDate}
            disabled={item.current}
            onChange={(value) => updateExperience(item.id, { endDate: value })}
            hint={item.current ? "Hidden while current role is checked" : "Month and year"}
          />
          <TextArea
            label="Highlights"
            hint="One achievement per line"
            value={item.description}
            onChange={(e) =>
              updateExperience(item.id, { description: e.target.value })
            }
            className="sm:col-span-2"
            rows={4}
          />
          <div className="sm:col-span-2">
            <WriteWithAiButton
              fieldType="experience_bullets"
              value={item.description}
              onApply={(text) =>
                updateExperience(item.id, { description: text })
              }
              context={`Role: ${item.role || "n/a"}; Company: ${item.company || "n/a"}; Location: ${item.location || "n/a"}`}
            />
          </div>
        </EntryCard>
      ))}
    </SectionCard>
  );
}

export function EducationSection() {
  const education = useResumeStore((s) => s.resume.education);
  const addEducation = useResumeStore((s) => s.addEducation);
  const updateEducation = useResumeStore((s) => s.updateEducation);
  const removeEducation = useResumeStore((s) => s.removeEducation);

  return (
    <SectionCard
      title="Education"
      description="Degrees, certifications, and relevant coursework."
      action={<AddButton onClick={addEducation} label="+ Add school" />}
    >
      {education.map((item, index) => (
        <EntryCard
          key={item.id}
          title={`Education ${index + 1}`}
          onRemove={
            education.length > 1 ? () => removeEducation(item.id) : undefined
          }
        >
          <TextField
            label="School"
            value={item.school}
            onChange={(e) => updateEducation(item.id, { school: e.target.value })}
          />
          <TextField
            label="Degree"
            value={item.degree}
            onChange={(e) => updateEducation(item.id, { degree: e.target.value })}
            placeholder="B.S."
          />
          <TextField
            label="Field of study"
            value={item.field}
            onChange={(e) => updateEducation(item.id, { field: e.target.value })}
          />
          <TextField
            label="Location"
            value={item.location}
            onChange={(e) =>
              updateEducation(item.id, { location: e.target.value })
            }
          />
          <MonthYearPicker
            label="Start date"
            value={item.startDate}
            onChange={(value) => updateEducation(item.id, { startDate: value })}
            hint="Month and year"
          />
          <MonthYearPicker
            label="End date"
            value={item.endDate}
            onChange={(value) => updateEducation(item.id, { endDate: value })}
            hint="Month and year"
          />
          <TextArea
            label="Details"
            value={item.details}
            onChange={(e) =>
              updateEducation(item.id, { details: e.target.value })
            }
            className="sm:col-span-2"
            rows={2}
          />
          <div className="sm:col-span-2">
            <WriteWithAiButton
              fieldType="education_details"
              value={item.details}
              onApply={(text) => updateEducation(item.id, { details: text })}
              context={`School: ${item.school || "n/a"}; Degree: ${item.degree || "n/a"}; Field: ${item.field || "n/a"}`}
            />
          </div>
        </EntryCard>
      ))}
    </SectionCard>
  );
}

export function SkillsSection() {
  const skills = useResumeStore((s) => s.resume.skills);
  const addSkillGroup = useResumeStore((s) => s.addSkillGroup);
  const updateSkillGroup = useResumeStore((s) => s.updateSkillGroup);
  const removeSkillGroup = useResumeStore((s) => s.removeSkillGroup);

  return (
    <SectionCard
      title="Skills"
      description="Group skills by category for clearer scanning."
      action={<AddButton onClick={addSkillGroup} label="+ Add group" />}
    >
      {skills.map((item, index) => (
        <EntryCard
          key={item.id}
          title={`Skill group ${index + 1}`}
          onRemove={
            skills.length > 1 ? () => removeSkillGroup(item.id) : undefined
          }
        >
          <TextField
            label="Category"
            value={item.category}
            onChange={(e) =>
              updateSkillGroup(item.id, { category: e.target.value })
            }
            placeholder="Frontend"
          />
          <TextField
            label="Skills"
            value={item.skills}
            onChange={(e) =>
              updateSkillGroup(item.id, { skills: e.target.value })
            }
            placeholder="React, Next.js, TypeScript"
            className="sm:col-span-2"
          />
        </EntryCard>
      ))}
    </SectionCard>
  );
}

export function PortfolioSection() {
  const portfolio = useResumeStore((s) => s.resume.portfolio);
  const addPortfolio = useResumeStore((s) => s.addPortfolio);
  const updatePortfolio = useResumeStore((s) => s.updatePortfolio);
  const removePortfolio = useResumeStore((s) => s.removePortfolio);

  return (
    <SectionCard
      title="Portfolio"
      description="Projects, case studies, and links that show your work."
      action={<AddButton onClick={addPortfolio} label="+ Add project" />}
    >
      {portfolio.map((item, index) => (
        <EntryCard
          key={item.id}
          title={`Project ${index + 1}`}
          onRemove={
            portfolio.length > 1 ? () => removePortfolio(item.id) : undefined
          }
        >
          <TextField
            label="Project name"
            value={item.name}
            onChange={(e) => updatePortfolio(item.id, { name: e.target.value })}
          />
          <TextField
            label="URL"
            value={item.url}
            onChange={(e) => updatePortfolio(item.id, { url: e.target.value })}
            placeholder="https://"
          />
          <TextArea
            label="Description"
            value={item.description}
            onChange={(e) =>
              updatePortfolio(item.id, { description: e.target.value })
            }
            className="sm:col-span-2"
            rows={3}
          />
          <div className="sm:col-span-2">
            <WriteWithAiButton
              fieldType="portfolio_description"
              value={item.description}
              onApply={(text) =>
                updatePortfolio(item.id, { description: text })
              }
              context={`Project: ${item.name || "n/a"}; Technologies: ${item.technologies || "n/a"}; URL: ${item.url || "n/a"}`}
            />
          </div>
          <TextField
            label="Technologies"
            value={item.technologies}
            onChange={(e) =>
              updatePortfolio(item.id, { technologies: e.target.value })
            }
            className="sm:col-span-2"
          />
        </EntryCard>
      ))}
    </SectionCard>
  );
}
