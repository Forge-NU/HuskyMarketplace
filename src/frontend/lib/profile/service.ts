import type { SupabaseClient } from "@supabase/supabase-js";
import {
  validateProfile,
  validateBio,
  validateSchoolDetails,
  type AccountProfile,
} from "./model.ts";
export async function loadProfile(
  client: SupabaseClient,
): Promise<AccountProfile> {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user)
    throw new Error("Please sign in to set up your account.");
  const user = data.user;
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("username, display_name, bio, campus_area")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileError || !profile)
    throw new Error("Your profile could not load. Please retry.");
  return {
    userId: user.id,
    email: user.email ?? "",
    emailVerified: Boolean(user.email_confirmed_at),
    username: profile.username,
    campus:
      typeof user.user_metadata.campus === "string"
        ? user.user_metadata.campus
        : "",
    schoolYear:
      typeof user.user_metadata.school_year === "string"
        ? user.user_metadata.school_year
        : "",
    displayName: profile.display_name ?? "",
    bio: profile.bio ?? "",
    area: profile.campus_area ?? "",
  };
}
export async function saveProfile(
  client: SupabaseClient,
  profile: AccountProfile,
) {
  const fields = validateProfile(profile.username, profile.displayName);
  validateSchoolDetails(profile.campus, profile.schoolYear);
  const bio = validateBio(profile.bio ?? "");
  const { data, error } = await client.auth.getUser();
  if (error || !data.user || data.user.id !== profile.userId)
    throw new Error("Your session changed. Sign in again before saving.");
  const { data: saved, error: saveError } = await client
    .from("profiles")
    .update({
      username: fields.username,
      display_name: fields.displayName,
      bio: bio || null,
      campus_area: profile.area || null,
    })
    .eq("user_id", data.user.id)
    .select("username")
    .single();
  if (saveError?.code === "23505")
    throw new Error("That username is taken. Try another one.");
  if (saveError || !saved)
    throw new Error("Your profile could not be saved. Please retry.");
  const schoolDetails: Record<string, string> = {};
  if (
    profile.campus !== undefined &&
    profile.campus !== data.user.user_metadata.campus
  )
    schoolDetails.campus = profile.campus;
  if (
    profile.schoolYear !== undefined &&
    profile.schoolYear !== data.user.user_metadata.school_year
  )
    schoolDetails.school_year = profile.schoolYear;
  if (Object.keys(schoolDetails).length) {
    const { error: metadataError } = await client.auth.updateUser({
      data: schoolDetails,
    });
    if (metadataError)
      throw new Error(
        "Profile saved, but your campus or school year could not be saved. Please retry to finish.",
      );
  }
  return {
    ...profile,
    ...fields,
    bio,
    emailVerified: Boolean(data.user.email_confirmed_at),
  };
}
