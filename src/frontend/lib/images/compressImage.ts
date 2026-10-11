import imageCompression from "browser-image-compression";

export type CompressOptions = {
  maxWidthOrHeight?: number;
  fileType?: "image/webp" | "image/jpeg" | "image/png";
  maxSizeMB?: number;
};

// 500KB keeps us within Supabase's 1 GB free storage
// 1600px is the largest size needed on the current UI with Retina screen.
// Free to adjust maxWidthOrHeight in the future if full-screen images added.
const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxWidthOrHeight: 1600,
  fileType: "image/webp",
  maxSizeMB: 0.5,
};

function isHeic(file: File): boolean {
  const name = file.name.toLowerCase();

  return file.type === "image/heic" ||
    file.type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif");
}

/**
 * Compresses an image in the browser before it's uploaded to save space on listing photos and profile
 *  pictures.
 *
 * If called with no options, shrinks image so longest side is at most 1600px, converts it to WebP,
 *  and tries to compress to 500KB.
 *
 * @param file The image to compress (usually JPEG, PNG, or WebP)
 * @param options Overrides for the defaults. Only pass what you want to change,
 *  e.g. `{ maxSizeMB: 0.2 }` for smaller profile pictures.
 * @returns compressed image. WebP by default.
 * @throws If the file is HEIC because conversion is not supported yet, and browsers other than Safari can't
 *  decode it.
 * @throws If file is not an image type.
 * @throws If the library fails to process the image.
 */
export async function compressImage(file: File, options?: CompressOptions): Promise<File> {
  if (isHeic(file)) {
    throw new Error("HEIC photos aren't supported yet. Please choose a JPEG, PNG, or WebP image.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (JPEG, PNG, or WebP).");
  }

  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  try {
    return await imageCompression(file, mergedOptions);
  } catch (error) {
    throw new Error("This image couldn't be processed. Please choose a different JPEG, PNG, or WebP image.", { cause: error });
  }
}
