import {
  AlignmentType,
  BorderStyle,
  Document,
  LevelFormat,
  Packer,
  Paragraph,
  TabStopPosition,
  TabStopType,
  TextRun,
  convertInchesToTwip,
} from "docx";
import { formatDateRange, slugifyFilename, splitBulletLines } from "@/lib/format";
import type { ResumeData } from "@/types/resume";

const FONT = "Calibri";
const COLORS = {
  ink: "163A36",
  accent: "2F6F66",
  muted: "5A736E",
  body: "243F3B",
  rule: "1F4D46",
};

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 340, after: 160 },
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: 12,
        color: COLORS.rule,
        space: 6,
      },
    },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 22,
        font: FONT,
        color: COLORS.ink,
      }),
    ],
  });
}

function bodyParagraph(
  text: string,
  options?: { size?: number; color?: string; after?: number; before?: number },
) {
  return new Paragraph({
    spacing: {
      before: options?.before ?? 0,
      after: options?.after ?? 120,
    },
    children: [
      new TextRun({
        text,
        size: options?.size ?? 20,
        font: FONT,
        color: options?.color ?? COLORS.body,
      }),
    ],
  });
}

function bulletParagraph(text: string): Paragraph {
  return new Paragraph({
    numbering: { reference: "resume-bullets", level: 0 },
    spacing: { after: 80 },
    children: [
      new TextRun({
        text,
        size: 20,
        font: FONT,
        color: COLORS.body,
      }),
    ],
  });
}

/** Role/company on the left, dates on the right (matches preview/PDF). */
function entryHeader(left: string, right?: string): Paragraph {
  if (!right) {
    return new Paragraph({
      spacing: { before: 200, after: 60 },
      children: [
        new TextRun({
          text: left,
          bold: true,
          size: 22,
          font: FONT,
          color: COLORS.ink,
        }),
      ],
    });
  }

  return new Paragraph({
    spacing: { before: 200, after: 60 },
    tabStops: [
      {
        type: TabStopType.RIGHT,
        position: TabStopPosition.MAX,
      },
    ],
    children: [
      new TextRun({
        text: left,
        bold: true,
        size: 22,
        font: FONT,
        color: COLORS.ink,
      }),
      new TextRun({
        text: `\t${right}`,
        size: 18,
        font: FONT,
        color: COLORS.muted,
      }),
    ],
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Delay revoke so Safari can finish the download
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function exportResumeToDocx(resume: ResumeData): Promise<void> {
  const { personal, summary, experiences, education, skills, portfolio } = resume;
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: personal.fullName || "Your Name",
          bold: true,
          size: 36,
          font: FONT,
          color: COLORS.ink,
        }),
      ],
    }),
  );

  if (personal.title.trim()) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: personal.title.trim(),
            size: 22,
            font: FONT,
            color: COLORS.accent,
          }),
        ],
      }),
    );
  }

  const contact = [
    personal.email,
    personal.phone,
    personal.location,
    personal.website,
    personal.linkedin,
    personal.github,
  ]
    .map((value) => value.trim())
    .filter(Boolean)
    .join("  ·  ");

  if (contact) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        border: {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 12,
            color: COLORS.rule,
            space: 10,
          },
        },
        children: [
          new TextRun({
            text: contact,
            size: 18,
            font: FONT,
            color: COLORS.muted,
          }),
        ],
      }),
    );
  }

  if (summary.trim()) {
    children.push(sectionHeading("Summary"));
    for (const para of summary
      .trim()
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean)) {
      children.push(bodyParagraph(para, { after: 120 }));
    }
  }

  const filledExperiences = experiences.filter(
    (item) => item.company.trim() || item.role.trim() || item.description.trim(),
  );
  if (filledExperiences.length) {
    children.push(sectionHeading("Experience"));
    for (const item of filledExperiences) {
      const role = item.role.trim() || "Role";
      const company = item.company.trim();
      const left = company ? `${role} (${company})` : role;
      const right = [
        formatDateRange(item.startDate, item.endDate, item.current),
        item.location.trim(),
      ]
        .filter(Boolean)
        .join("  ·  ");
      children.push(entryHeader(left, right || undefined));
      for (const line of splitBulletLines(item.description)) {
        children.push(bulletParagraph(line));
      }
    }
  }

  const filledEducation = education.filter(
    (item) => item.school.trim() || item.degree.trim() || item.field.trim(),
  );
  if (filledEducation.length) {
    children.push(sectionHeading("Education"));
    for (const item of filledEducation) {
      const degreeField = [item.degree.trim(), item.field.trim()]
        .filter(Boolean)
        .join(" in ");
      const left = [item.school.trim() || "School", degreeField]
        .filter(Boolean)
        .join("  ·  ");
      const right = [
        formatDateRange(item.startDate, item.endDate),
        item.location.trim(),
      ]
        .filter(Boolean)
        .join("  ·  ");
      children.push(entryHeader(left, right || undefined));
      for (const line of splitBulletLines(item.details)) {
        children.push(bodyParagraph(line, { after: 60 }));
      }
    }
  }

  const filledSkills = skills.filter(
    (item) => item.category.trim() || item.skills.trim(),
  );
  if (filledSkills.length) {
    children.push(sectionHeading("Skills"));
    for (const item of filledSkills) {
      children.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            ...(item.category.trim()
              ? [
                  new TextRun({
                    text: `${item.category.trim()}: `,
                    bold: true,
                    size: 20,
                    font: FONT,
                    color: COLORS.ink,
                  }),
                ]
              : []),
            new TextRun({
              text: item.skills.trim(),
              size: 20,
              font: FONT,
              color: COLORS.body,
            }),
          ],
        }),
      );
    }
  }

  const filledPortfolio = portfolio.filter(
    (item) =>
      item.name.trim() ||
      item.description.trim() ||
      item.url.trim() ||
      item.technologies.trim(),
  );
  if (filledPortfolio.length) {
    children.push(sectionHeading("Portfolio"));
    for (const item of filledPortfolio) {
      children.push(
        new Paragraph({
          spacing: { before: 200, after: 60 },
          children: [
            new TextRun({
              text: item.name.trim() || "Project",
              bold: true,
              size: 22,
              font: FONT,
              color: COLORS.ink,
            }),
            ...(item.url.trim()
              ? [
                  new TextRun({
                    text: `  ·  ${item.url.trim()}`,
                    size: 18,
                    font: FONT,
                    color: COLORS.accent,
                  }),
                ]
              : []),
          ],
        }),
      );
      const descLines = splitBulletLines(item.description);
      if (descLines.length > 1) {
        for (const line of descLines) children.push(bulletParagraph(line));
      } else if (descLines.length === 1) {
        // Single sentence projects stay as a paragraph; multi-bullet text uses list above
        children.push(bodyParagraph(descLines[0], { after: 80 }));
      }
      if (item.technologies.trim()) {
        children.push(
          bodyParagraph(item.technologies.trim(), {
            size: 18,
            color: COLORS.muted,
            after: 140,
          }),
        );
      }
    }
  }

  if (children.length === 0) {
    throw new Error("Nothing to export. Add resume content first.");
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "resume-bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: {
                    left: convertInchesToTwip(0.28),
                    hanging: convertInchesToTwip(0.15),
                  },
                  spacing: { after: 80 },
                },
              },
            },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: {
          run: {
            font: FONT,
            size: 20,
          },
          paragraph: {
            spacing: {
              line: 276, // ~1.15 line spacing, closer to PDF readability
            },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.7),
              right: convertInchesToTwip(0.7),
              bottom: convertInchesToTwip(0.7),
              left: convertInchesToTwip(0.7),
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${slugifyFilename(personal.fullName || "resume")}.docx`);
}
