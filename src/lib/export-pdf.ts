import { jsPDF } from "jspdf";
import { formatDateRange, slugifyFilename } from "@/lib/format";
import type { ResumeData } from "@/types/resume";

const PAGE = { width: 612, height: 792 };
const MARGIN = { top: 48, right: 48, bottom: 48, left: 48 };
const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right;

const COLORS = {
  ink: [22, 58, 54] as [number, number, number],
  muted: [90, 115, 110] as [number, number, number],
  accent: [47, 111, 102] as [number, number, number],
  body: [36, 63, 59] as [number, number, number],
  rule: [31, 77, 70] as [number, number, number],
};

type PdfCursor = {
  doc: jsPDF;
  y: number;
};

function ensureSpace(cursor: PdfCursor, needed: number) {
  if (cursor.y + needed > PAGE.height - MARGIN.bottom) {
    cursor.doc.addPage();
    cursor.y = MARGIN.top;
  }
}

function wrapText(doc: jsPDF, text: string, fontSize: number, maxWidth: number) {
  doc.setFontSize(fontSize);
  return doc.splitTextToSize(text, maxWidth) as string[];
}

function drawCentered(
  cursor: PdfCursor,
  text: string,
  fontSize: number,
  color: [number, number, number],
  style: "normal" | "bold" = "normal",
  gap = 4,
) {
  const { doc } = cursor;
  doc.setFont("helvetica", style);
  doc.setFontSize(fontSize);
  doc.setTextColor(...color);
  const lines = wrapText(doc, text, fontSize, CONTENT_WIDTH);
  const lineHeight = fontSize * 1.25;
  ensureSpace(cursor, lines.length * lineHeight + gap);
  for (const line of lines) {
    doc.text(line, PAGE.width / 2, cursor.y, { align: "center" });
    cursor.y += lineHeight;
  }
  cursor.y += gap;
}

function drawSectionHeading(cursor: PdfCursor, title: string) {
  ensureSpace(cursor, 28);
  cursor.y += 10;
  const { doc } = cursor;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.ink);
  doc.text(title.toUpperCase(), MARGIN.left, cursor.y);
  cursor.y += 6;
  doc.setDrawColor(...COLORS.rule);
  doc.setLineWidth(1.2);
  doc.line(MARGIN.left, cursor.y, PAGE.width - MARGIN.right, cursor.y);
  cursor.y += 12;
}

function drawParagraph(
  cursor: PdfCursor,
  text: string,
  options?: {
    bold?: boolean;
    size?: number;
    color?: [number, number, number];
    indent?: number;
    gap?: number;
  },
) {
  const size = options?.size ?? 10;
  const color = options?.color ?? COLORS.body;
  const indent = options?.indent ?? 0;
  const gap = options?.gap ?? 4;
  const { doc } = cursor;

  doc.setFont("helvetica", options?.bold ? "bold" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(...color);

  const lines = wrapText(doc, text, size, CONTENT_WIDTH - indent);
  const lineHeight = size * 1.35;
  ensureSpace(cursor, lines.length * lineHeight + gap);

  for (const line of lines) {
    doc.text(line, MARGIN.left + indent, cursor.y);
    cursor.y += lineHeight;
  }
  cursor.y += gap;
}

function drawBullet(cursor: PdfCursor, text: string) {
  const size = 10;
  const { doc } = cursor;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(size);
  doc.setTextColor(...COLORS.body);

  const bulletIndent = 10;
  const textIndent = 18;
  const lines = wrapText(doc, text, size, CONTENT_WIDTH - textIndent);
  const lineHeight = size * 1.35;
  ensureSpace(cursor, lines.length * lineHeight + 2);

  doc.text("•", MARGIN.left + bulletIndent, cursor.y);
  for (let i = 0; i < lines.length; i += 1) {
    doc.text(lines[i], MARGIN.left + textIndent, cursor.y);
    cursor.y += lineHeight;
  }
  cursor.y += 2;
}

function drawRow(
  cursor: PdfCursor,
  left: string,
  right: string,
  leftBold = true,
) {
  const size = 10.5;
  const { doc } = cursor;
  ensureSpace(cursor, 16);

  doc.setFont("helvetica", leftBold ? "bold" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(...COLORS.ink);

  const rightWidth = right ? doc.getTextWidth(right) + 4 : 0;
  const leftMax = CONTENT_WIDTH - rightWidth - 8;
  const leftLines = wrapText(doc, left, size, Math.max(leftMax, 120));

  doc.text(leftLines[0], MARGIN.left, cursor.y);
  if (right) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.muted);
    doc.text(right, PAGE.width - MARGIN.right, cursor.y, { align: "right" });
  }

  cursor.y += size * 1.3;
  for (let i = 1; i < leftLines.length; i += 1) {
    doc.setFont("helvetica", leftBold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...COLORS.ink);
    doc.text(leftLines[i], MARGIN.left, cursor.y);
    cursor.y += size * 1.3;
  }
  cursor.y += 2;
}

export async function exportResumeToPdf(resume: ResumeData): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter",
  });

  const cursor: PdfCursor = { doc, y: MARGIN.top };
  const { personal, summary, experiences, education, skills, portfolio } = resume;

  drawCentered(
    cursor,
    personal.fullName || "Your Name",
    22,
    COLORS.ink,
    "bold",
    2,
  );

  if (personal.title) {
    drawCentered(cursor, personal.title, 12, COLORS.accent, "normal", 6);
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
    drawCentered(cursor, contact, 9, COLORS.muted, "normal", 8);
  }

  doc.setDrawColor(...COLORS.rule);
  doc.setLineWidth(1.5);
  doc.line(MARGIN.left, cursor.y, PAGE.width - MARGIN.right, cursor.y);
  cursor.y += 8;

  if (summary.trim()) {
    drawSectionHeading(cursor, "Summary");
    drawParagraph(cursor, summary.trim(), { size: 10.5, gap: 2 });
  }

  const filledExperiences = experiences.filter(
    (item) => item.company || item.role || item.description,
  );
  if (filledExperiences.length) {
    drawSectionHeading(cursor, "Experience");
    for (const item of filledExperiences) {
      const left = [item.role || "Role", item.company].filter(Boolean).join("  ·  ");
      const right = [
        formatDateRange(item.startDate, item.endDate, item.current),
        item.location,
      ]
        .filter(Boolean)
        .join("  ·  ");
      drawRow(cursor, left, right);
      item.description
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((line) => drawBullet(cursor, line));
      cursor.y += 4;
    }
  }

  const filledEducation = education.filter(
    (item) => item.school || item.degree || item.field,
  );
  if (filledEducation.length) {
    drawSectionHeading(cursor, "Education");
    for (const item of filledEducation) {
      const title = [item.degree, item.field].filter(Boolean).join(" in ");
      const left = [item.school || "School", title].filter(Boolean).join("  ·  ");
      const right = [formatDateRange(item.startDate, item.endDate), item.location]
        .filter(Boolean)
        .join("  ·  ");
      drawRow(cursor, left, right);
      if (item.details.trim()) {
        drawParagraph(cursor, item.details.trim(), { size: 10, gap: 6 });
      } else {
        cursor.y += 4;
      }
    }
  }

  const filledSkills = skills.filter((item) => item.category || item.skills);
  if (filledSkills.length) {
    drawSectionHeading(cursor, "Skills");
    for (const item of filledSkills) {
      const label = item.category ? `${item.category}: ` : "";
      ensureSpace(cursor, 14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.ink);
      const labelWidth = item.category ? doc.getTextWidth(label) : 0;
      if (item.category) {
        doc.text(label, MARGIN.left, cursor.y);
      }
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.body);
      const skillLines = wrapText(
        doc,
        item.skills,
        10,
        CONTENT_WIDTH - labelWidth,
      );
      doc.text(skillLines[0] ?? "", MARGIN.left + labelWidth, cursor.y);
      cursor.y += 13;
      for (let i = 1; i < skillLines.length; i += 1) {
        doc.text(skillLines[i], MARGIN.left, cursor.y);
        cursor.y += 13;
      }
      cursor.y += 2;
    }
  }

  const filledPortfolio = portfolio.filter(
    (item) => item.name || item.description || item.url,
  );
  if (filledPortfolio.length) {
    drawSectionHeading(cursor, "Portfolio");
    for (const item of filledPortfolio) {
      const left = item.name || "Project";
      drawRow(cursor, left, "", true);
      if (item.url) {
        drawParagraph(cursor, item.url, {
          size: 9,
          color: COLORS.accent,
          gap: 2,
        });
      }
      if (item.description.trim()) {
        drawParagraph(cursor, item.description.trim(), { size: 10, gap: 2 });
      }
      if (item.technologies.trim()) {
        drawParagraph(cursor, item.technologies.trim(), {
          size: 9,
          color: COLORS.muted,
          gap: 6,
        });
      }
    }
  }

  doc.save(`${slugifyFilename(personal.fullName)}.pdf`);
}
