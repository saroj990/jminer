/** Shrink screenshots before upload (keeps requests under default body limits). */
export async function fileToCompressedBase64(
  file: File,
  maxWidth = 1400,
  quality = 0.82,
): Promise<{ mimeType: string; base64: string }> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are supported");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not compress image"))),
      "image/jpeg",
      quality,
    );
  });

  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return { mimeType: "image/jpeg", base64: btoa(binary) };
}