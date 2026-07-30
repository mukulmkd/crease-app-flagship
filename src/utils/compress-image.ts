/**
 * Compress an image file aggressively for payment screenshot upload.
 * Keeps legibility while staying under storage limits.
 */
export async function compressImageForUpload(
  file: File,
  maxBytes = 400_000,
): Promise<Blob> {
  if (!file.type.startsWith("image/") && !isLikelyImageFile(file)) {
    throw new Error("Screenshot must be an image");
  }

  const bitmap = await decodeImageBitmap(file);
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
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not process image");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvasToJpegBlob(canvas, maxBytes);
}

/**
 * Square-crop + resize + compress for profile avatars (public `avatars` bucket).
 * Accepts gallery/camera photos from any device; always outputs JPEG ≤ maxBytes.
 */
export async function compressAvatarForUpload(
  file: File,
  maxBytes = 200_000,
  maxEdge = 512,
): Promise<Blob> {
  if (!file.type.startsWith("image/") && !isLikelyImageFile(file)) {
    throw new Error("Photo must be an image");
  }

  const bitmap = await decodeImageBitmap(file);
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    if (side < 1) {
      throw new Error("Could not read that photo");
    }

    const sx = Math.floor((bitmap.width - side) / 2);
    const sy = Math.floor((bitmap.height - side) / 2);
    // Always downscale large gallery photos; leave tiny images as-is (still square).
    const out = Math.min(side, maxEdge);

    const canvas = document.createElement("canvas");
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process image");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, out, out);

    return canvasToJpegBlob(canvas, maxBytes);
  } finally {
    bitmap.close();
  }
}

function isLikelyImageFile(file: File): boolean {
  // Some mobile galleries omit MIME type or use empty string for HEIC/JPEG.
  if (file.type === "" || file.type === "application/octet-stream") {
    return /\.(jpe?g|png|webp|gif|heic|heif|avif|bmp)$/i.test(file.name);
  }
  return false;
}

/**
 * Decode with EXIF orientation when supported; fall back to HTMLImageElement.
 */
async function decodeImageBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
  } catch {
    // Older WebViews / HEIC edge cases — try without orientation options.
    try {
      return await createImageBitmap(file);
    } catch {
      return decodeViaImageElement(file);
    }
  }
}

async function decodeViaImageElement(file: File): Promise<ImageBitmap> {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(
          new Error(
            "Could not read that photo. Try a JPEG or PNG from your gallery.",
          ),
        );
      img.src = url;
    });
    return await createImageBitmap(image);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  maxBytes: number,
): Promise<Blob> {
  let quality = 0.82;
  let blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );

  // If still too large, step quality down; then shrink canvas if needed.
  while (blob && blob.size > maxBytes && quality > 0.4) {
    quality -= 0.1;
    blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
  }

  if (blob && blob.size > maxBytes && canvas.width > 256) {
    const scale = Math.sqrt(maxBytes / blob.size);
    const next = Math.max(
      256,
      Math.floor(canvas.width * Math.min(scale, 0.85)),
    );
    const resized = document.createElement("canvas");
    resized.width = next;
    resized.height = next;
    const ctx = resized.getContext("2d");
    if (!ctx) throw new Error("Could not compress image");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(canvas, 0, 0, next, next);
    return canvasToJpegBlob(resized, maxBytes);
  }

  if (!blob) throw new Error("Could not compress image");
  return blob;
}
