"use client";

import { memo, type ReactNode } from "react";
import { formatDateRange } from "@/lib/format";
import type { ResumeData } from "@/types/resume";

type Props = {
  resume: ResumeData;
};

export const ResumePreview = memo(function ResumePreview({ resume }: Props) {
  const { personal, summary, experiences, education, skills, portfolio } = resume;

  const contactBits = [
    personal.email,
    personal.phone,
    personal.location,
    personal.website,
    personal.linkedin,
    personal.github,
  ].filter(Boolean);

  const filledExperiences = experiences.filter(
    (item) => item.company || item.role || item.description,
  );
  const filledEducation = education.filter(
    (item) => item.school || item.degree || item.field,
  );
  const filledSkills = skills.filter((item) => item.category || item.skills);
  const filledPortfolio = portfolio.filter(
    (item) => item.name || item.description || item.url,
  );

  return (
    <article className="resume-sheet mx-auto w-full max-w-[8.5in] overflow-hidden rounded-xl bg-white text-[13px] leading-relaxed text-[#1a2e2b] shadow-[0_28px_70px_-40px_rgba(15,40,36,0.7)]">
      <header className="relative border-b-2 border-[#1f4d46] px-8 pb-5 pt-8 sm:px-10 sm:pt-9">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-[#1f7a6c]" />
        <h1 className="font-[family-name:var(--font-display)] text-[1.85rem] font-bold tracking-tight text-[#102824] sm:text-[2.05rem]">
          {personal.fullName || "Your Name"}
        </h1>
        {personal.title ? (
          <p className="mt-1 text-[0.95rem] font-semibold text-[#1f7a6c]">
            {personal.title}
          </p>
        ) : null}
        {contactBits.length ? (
          <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[0.78rem] text-[#3d5c57]">
            {contactBits.map((bit) => (
              <span key={bit}>{bit}</span>
            ))}
          </p>
        ) : null}
      </header>

      <div className="space-y-5 px-8 py-6 sm:px-10">
        {summary.trim() ? (
          <section>
            <SectionTitle>Summary</SectionTitle>
            <p className="text-[0.9rem] text-[#243f3b]">{summary}</p>
          </section>
        ) : null}

        {filledExperiences.length ? (
          <section>
            <SectionTitle>Experience</SectionTitle>
            <div className="space-y-4">
              {filledExperiences.map((item) => (
                <div key={item.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-[#102824]">
                      {item.role || "Role"}
                      {item.company ? (
                        <span className="font-normal text-[#3d5c57]">
                          {" "}
                          · {item.company}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-[0.78rem] text-[#5a736e]">
                      {formatDateRange(item.startDate, item.endDate, item.current)}
                      {item.location ? ` · ${item.location}` : ""}
                    </p>
                  </div>
                  {item.description.trim() ? (
                    <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[#243f3b]">
                      {item.description
                        .split("\n")
                        .map((line) => line.trim())
                        .filter(Boolean)
                        .map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {filledEducation.length ? (
          <section>
            <SectionTitle>Education</SectionTitle>
            <div className="space-y-3">
              {filledEducation.map((item) => {
                const title = [item.degree, item.field]
                  .filter(Boolean)
                  .join(" in ");
                return (
                  <div key={item.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-semibold text-[#102824]">
                        {item.school || "School"}
                        {title ? (
                          <span className="font-normal text-[#3d5c57]">
                            {" "}
                            · {title}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[0.78rem] text-[#5a736e]">
                        {formatDateRange(item.startDate, item.endDate)}
                        {item.location ? ` · ${item.location}` : ""}
                      </p>
                    </div>
                    {item.details.trim() ? (
                      <p className="mt-1 text-[#243f3b]">{item.details}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {filledSkills.length ? (
          <section>
            <SectionTitle>Skills</SectionTitle>
            <div className="space-y-1.5">
              {filledSkills.map((item) => (
                <p key={item.id} className="text-[#243f3b]">
                  {item.category ? (
                    <span className="font-semibold text-[#102824]">
                      {item.category}:{" "}
                    </span>
                  ) : null}
                  {item.skills}
                </p>
              ))}
            </div>
          </section>
        ) : null}

        {filledPortfolio.length ? (
          <section>
            <SectionTitle>Portfolio</SectionTitle>
            <div className="space-y-3">
              {filledPortfolio.map((item) => (
                <div key={item.id}>
                  <p className="font-semibold text-[#102824]">
                    {item.name || "Project"}
                    {item.url ? (
                      <span className="ml-2 font-normal text-[#1f7a6c]">
                        {item.url}
                      </span>
                    ) : null}
                  </p>
                  {item.description.trim() ? (
                    <p className="mt-0.5 text-[#243f3b]">{item.description}</p>
                  ) : null}
                  {item.technologies.trim() ? (
                    <p className="mt-0.5 text-[0.8rem] text-[#5a736e]">
                      {item.technologies}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </article>
  );
});

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2 border-b border-[#d5e4df] pb-1 font-[family-name:var(--font-body)] text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-[#102824]">
      {children}
    </h2>
  );
}
