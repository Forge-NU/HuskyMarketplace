import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "profile-photos";
export const PROFILE_PHOTO_UPDATED = "husky-profile-photo-updated";

export function profilePhotoPath(userId: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      userId,
    )
  )
    throw new Error("Your account could not be identified. Sign in again.");
  return `${userId}/avatar.webp`;
}

export async function loadProfilePhoto(client: SupabaseClient, userId: string) {
  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrl(profilePhotoPath(userId), 600);
  if (error) {
    if (
      error.status === 404 ||
      error.statusCode === "404" ||
      error.message === "Object not found" ||
      error.message === "Bucket not found"
    )
      return null;
    throw new Error("Your photo could not load. Please retry.");
  }
  if (!data?.signedUrl)
    throw new Error("Your photo could not load. Please retry.");
  return `${data.signedUrl}&v=${Date.now()}`;
}

async function checkOwner(client: SupabaseClient, userId: string) {
  const { data, error } = await client.auth.getUser();
  if (error || data.user?.id !== userId)
    throw new Error(
      "Your session changed. Sign in again before saving your photo.",
    );
}

export async function saveProfilePhoto(
  client: SupabaseClient,
  userId: string,
  photo: File,
) {
  if (photo.type !== "image/webp" || photo.size <= 0 || photo.size > 256 * 1024)
    throw new Error("Choose a compressed WebP photo up to 256 KB.");
  const path = profilePhotoPath(userId);
  await checkOwner(client, userId);
  const { error } = await client.storage.from(BUCKET).upload(path, photo, {
    contentType: "image/webp",
    cacheControl: "0",
    upsert: true,
  });
  if (error) {
    if (error.message === "Bucket not found")
      throw new Error(
        "Photo uploads are not available yet. Continue without a photo or try again later.",
      );
    throw new Error(
      "Your photo could not be saved. Retry or continue without a photo.",
    );
  }
  const url = await loadProfilePhoto(client, userId);
  if (!url)
    throw new Error(
      "Your photo was uploaded but could not load. Please retry.",
    );
  return url;
}

export async function removeProfilePhoto(
  client: SupabaseClient,
  userId: string,
) {
  const path = profilePhotoPath(userId);
  await checkOwner(client, userId);
  const { error } = await client.storage.from(BUCKET).remove([path]);
  if (error) throw new Error("Your photo could not be removed. Please retry.");
}
