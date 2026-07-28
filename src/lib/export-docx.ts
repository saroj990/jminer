import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { saveAs } from "file-saver";
import { formatDateRange, slugifyFilename } from "@/lib/format";
import type { ResumeData } from "@/types/resume";

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    border: {
      bottom: { color: "1F4D46", space: 1, style: "single", size: 12 },
    },
  });
}

function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 20, font: "Calibri" })],
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 40 },
    indent: { left: 288 },
    children: [
      new TextRun({ text: `• ${text}`, size: 20, font: "Calibri" }),
    ],
  });
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
          font: "Calibri",
          color: "163A36",
        }),
      ],
    }),
  );

  if (personal.title) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: personal.title,
            size: 22,
            font: "Calibri",
            color: "2F6F66",
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
    .filter(Boolean)
    .join("  ·  ");

  if (contact) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: contact, size: 18, font: "Calibri" })],
      }),
    );
  }

  if (summary.trim()) {
    children.push(sectionHeading("Summary"));
    children.push(bodyParagraph(summary.trim()));
  }

  const filledExperiences = experiences.filter(
    (item) => item.company || item.role || item.description,
  );
  if (filledExperiences.length) {
    children.push(sectionHeading("Experience"));
    for (const item of filledExperiences) {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 20 },
          children: [
            new TextRun({
              text: item.role || "Role",
              bold: true,
              size: 22,
              font: "Calibri",
            }),
            new TextRun({
              text: item.company ? `  ·  ${item.company}` : "",
              size: 22,
              font: "Calibri",
            }),
          ],
        }),
      );
      const meta = [
        formatDateRange(item.startDate, item.endDate, item.current),
        item.location,
      ]
        .filter(Boolean)
        .join("  ·  ");
      if (meta) children.push(bodyParagraph(meta));
      item.description
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((line) => children.push(bullet(line)));
    }
  }

  const filledEducation = education.filter(
    (item) => item.school || item.degree || item.field,
  );
  if (filledEducation.length) {
    children.push(sectionHeading("Education"));
    for (const item of filledEducation) {
      const title = [item.degree, item.field].filter(Boolean).join(" in ");
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 20 },
          children: [
            new TextRun({
              text: item.school || "School",
              bold: true,
              size: 22,
              font: "Calibri",
            }),
            new TextRun({
              text: title ? `  ·  ${title}` : "",
              size: 22,
              font: "Calibri",
            }),
          ],
        }),
      );
      const meta = [
        formatDateRange(item.startDate, item.endDate),
        item.location,
      ]
        .filter(Boolean)
        .join("  ·  ");
      if (meta) children.push(bodyParagraph(meta));
      if (item.details.trim()) children.push(bodyParagraph(item.details.trim()));
    }
  }

  const filledSkills = skills.filter((item) => item.category || item.skills);
  if (filledSkills.length) {
    children.push(sectionHeading("Skills"));
    for (const item of filledSkills) {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: item.category ? `${item.category}: ` : "",
              bold: true,
              size: 20,
              font: "Calibri",
            }),
            new TextRun({ text: item.skills, size: 20, font: "Calibri" }),
          ],
        }),
      );
    }
  }

  const filledPortfolio = portfolio.filter(
    (item) => item.name || item.description || item.url,
  );
  if (filledPortfolio.length) {
    children.push(sectionHeading("Portfolio"));
    for (const item of filledPortfolio) {
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 20 },
          children: [
            new TextRun({
              text: item.name || "Project",
              bold: true,
              size: 22,
              font: "Calibri",
            }),
            new TextRun({
              text: item.url ? `  ·  ${item.url}` : "",
              size: 18,
              font: "Calibri",
              color: "2F6F66",
            }),
          ],
        }),
      );
      if (item.description.trim()) children.push(bodyParagraph(item.description.trim()));
      if (item.technologies.trim()) {
        children.push(
          bodyParagraph(`Technologies: ${item.technologies.trim()}`),
        );
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${slugifyFilename(personal.fullName)}.docx`);
}
