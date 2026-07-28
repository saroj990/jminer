import mammoth from "mammoth";

function normalizeExtractedText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractTextFromDocx(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  const text = normalizeExtractedText(result.value || "");
  if (!text) throw new Error("Could not read text from this DOCX file.");
  return text;
}

type PdfTextItem = {
  str?: string;
  transform?: number[];
  width?: number;
  hasEOL?: boolean;
};

/**
 * Rebuild readable lines from PDF text items using X/Y positions.
 * Joining all tokens with spaces (old approach) destroyed section structure.
 */
function linesFromPdfItems(items: PdfTextItem[]): string[] {
  const usable = items
    .map((item) => {
      const str = (item.str ?? "").replace(/\s+/g, " ");
      const transform = item.transform ?? [];
      const x = transform[4] ?? 0;
      const y = transform[5] ?? 0;
      return { str, x, y, width: item.width ?? 0, hasEOL: Boolean(item.hasEOL) };
    })
    .filter((item) => item.str.trim().length > 0 || item.hasEOL);

  if (usable.length === 0) return [];

  // PDF Y grows upward; sort top-to-bottom, then left-to-right.
  usable.sort((a, b) => {
    const yDiff = b.y - a.y;
    if (Math.abs(yDiff) > 2.5) return yDiff;
    return a.x - b.x;
  });

  const lines: Array<{ y: number; parts: typeof usable }> = [];
  for (const item of usable) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(last.y - item.y) <= 2.8) {
      last.parts.push(item);
    } else {
      lines.push({ y: item.y, parts: [item] });
    }
  }

  return lines.map(({ parts }) => {
    parts.sort((a, b) => a.x - b.x);
    let line = "";
    let prevRight = -Infinity;
    for (const part of parts) {
      const gap = part.x - prevRight;
      if (line && gap > 1.2) {
        // Large horizontal gap often means a new column / date on the right
        line += gap > 18 ? " | " : " ";
      }
      line += part.str.trimEnd();
      prevRight = part.x + (part.width || part.str.length * 4);
      if (part.hasEOL) line += "\n";
    }
    return line.replace(/\s+\n/g, "\n").trim();
  }).filter(Boolean);
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const items = content.items as PdfTextItem[];
    pages.push(linesFromPdfItems(items).join("\n"));
  }

  const text = normalizeExtractedText(pages.join("\n\n"));
  if (!text) throw new Error("Could not read text from this PDF file.");
  return text;
}

export async function extractResumeText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const type = file.type;

  if (
    name.endsWith(".docx") ||
    type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractTextFromDocx(file);
  }

  if (name.endsWith(".pdf") || type === "application/pdf") {
    return extractTextFromPdf(file);
  }

  throw new Error("Please upload a PDF or DOCX file.");
}
