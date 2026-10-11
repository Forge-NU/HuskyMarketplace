import imageCompression from "browser-image-compression";
import { throwIfDisallowedDynamic } from "next/dist/server/app-render/dynamic-rendering";

export type CompressOptions = {
  maxWidthOrHeight?: number;
  fileType?: "image/webp" | "image/jpeg" | "image/png";
  maxSizeMB?: number;
};

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

export async function compressImage(file: File, options?: CompressOptions): Promise<File> {
  if (isHeic(file)) {
    throw new Error("HEIC photos aren't supported yet. Please choose a JPEG, PNG, or WebP image.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (JPEG, PNG, or WebP).");
  }

  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  return await imageCompression(file, mergedOptions);
}
