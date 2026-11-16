"use client";

/** Browser OCR — avoids Next server bundling tesseract workers. */
export async function ocrImageFiles(files: File[]): Promise<string> {
  if (!files.length) return "";

  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const parts: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const { data } = await worker.recognize(files[i]);
      const text = data.text?.trim() ?? "";
      if (text) {
        parts.push(
          files.length > 1 ? `--- SCREENSHOT ${i + 1} ---\n${text}` : text,
        );
      }
    }
    return parts.join("\n\n");
  } finally {
    await worker.terminate();
  }
}