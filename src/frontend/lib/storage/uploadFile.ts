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
  // 409 indicates file already exists. This happens when a retry resends an
  // upload whose first attempt succeeded but the response was lost. The callers
  // use unique paths and upsert is off, so an existing file is the same exact upload.
  if (error.statusCode === "409") {
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
