/**
 * Compress an image file aggressively for payment screenshot upload.
 * Keeps legibility while staying under storage limits.
 */
export async function compressImageForUpload(
  file: File,
  maxBytes = 400_000,
): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Screenshot must be an image");
  }

  const bitmap = await createImageBitmap(file);
  let width = bitmap.width;
  let height = bitmap.height;
  const maxEdge = 1280;
  if (width > maxEdge || height > maxEdge) {
    const scale = Math.min(maxEdge / width, maxEdge / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvasToJpegBlob(canvas, maxBytes);
}

/**
 * Square-crop + compress for profile avatars (public `avatars` bucket, 1MB cap).
 */
export async function compressAvatarForUpload(
  file: File,
  maxBytes = 200_000,
): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Photo must be an image");
  }

  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = Math.floor((bitmap.width - side) / 2);
  const sy = Math.floor((bitmap.height - side) / 2);
  const out = Math.min(side, 512);

  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, out, out);
  bitmap.close();

  return canvasToJpegBlob(canvas, maxBytes);
}

async function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  maxBytes: number,
): Promise<Blob> {
  let quality = 0.72;
  let blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );

  while (blob && blob.size > maxBytes && quality > 0.35) {
    quality -= 0.1;
    blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
  }

  if (!blob) throw new Error("Could not compress image");
  return blob;
}
