import imageCompression from "browser-image-compression";

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
