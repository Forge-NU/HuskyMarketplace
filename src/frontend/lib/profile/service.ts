import type { SupabaseClient } from "@supabase/supabase-js";
import { validateProfile, type AccountProfile } from "./model.ts";
export async function loadProfile(
  client: SupabaseClient,
): Promise<AccountProfile> {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user)
    throw new Error("Please sign in to set up your account.");
  const user = data.user;
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("username")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileError || !profile)
    throw new Error("Your profile could not load. Please retry.");
  return {
    userId: user.id,
    email: user.email ?? "",
    username: profile.username,
    displayName:
      typeof user.user_metadata.display_name === "string"
        ? user.user_metadata.display_name
        : "",
    area:
      typeof user.user_metadata.campus_area === "string"
        ? user.user_metadata.campus_area
        : "",
  };
}
export async function saveProfile(
  client: SupabaseClient,
  profile: AccountProfile,
) {
  const fields = validateProfile(profile.username, profile.displayName);
  const { data, error } = await client.auth.getUser();
  if (error || !data.user || data.user.id !== profile.userId)
    throw new Error("Your session changed. Sign in again before saving.");
  const { data: saved, error: saveError } = await client
    .from("profiles")
    .update({ username: fields.username })
    .eq("user_id", data.user.id)
    .select("username")
    .single();
  if (saveError?.code === "23505")
    throw new Error("That username is taken. Try another one.");
  if (saveError || !saved)
    throw new Error("Your username could not be saved. Please retry.");
  // Editable presentation only. These values never authorize access or verification.
  const { error: metadataError } = await client.auth.updateUser({
    data: { display_name: fields.displayName, campus_area: profile.area },
  });
  if (metadataError)
    throw new Error(
      "Username saved, but your display name could not be saved. Please retry to finish.",
    );
  return { ...profile, ...fields };
}
