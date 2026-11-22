import type { SupabaseClient } from "@supabase/supabase-js";

export type UploadErrorKind =
  | "too-large"
  | "wrong-type"
  | "not-allowed"
  | "unknown";

export class UploadError extends Error {
  kind: UploadErrorKind;

  constructor(kind: UploadErrorKind, message: string) {
    super(message);
    this.kind = kind;
    this.name = "UploadError";
  }
}

export async function uploadFile(
  client: SupabaseClient,
  bucket: string,
  path: string,
  file: File,
): Promise<string> {
  const { error } = await client.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (!error) {
    return path;
  }
  // A retry can reach an upload whose successful response was lost. Keep the
  // original path and never overwrite it; other 400 errors must still fail.
  if (
    error.statusCode === "409" ||
    (error.statusCode === "400" &&
      (("code" in error && error.code === "ResourceAlreadyExists") ||
        error.message === "The resource already exists" ||
        error.message === "Asset Already Exists"))
  ) {
    return path;
  }
  throw new UploadError(errorType(error.statusCode), error.message);
}

function errorType(statusCode: string | undefined): UploadErrorKind {
  switch (statusCode) {
    case "413":
      return "too-large";
    case "415":
      return "wrong-type";
    case "403":
    case "401":
      return "not-allowed";
    default:
      return "unknown";
  }
}
