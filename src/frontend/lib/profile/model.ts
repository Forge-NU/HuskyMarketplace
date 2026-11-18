export type AccountProfile = {
  userId: string;
  email: string;
  emailVerified: boolean;
  username: string;
  displayName: string;
  area: string;
  bio: string;
  campus?: string;
  schoolYear?: string;
};
export function validateProfile(username: string, displayName: string) {
  const handle = username.trim().toLowerCase();
  const name = displayName.trim();
  if (!/^[a-z0-9_]{3,24}$/.test(handle))
    throw new Error(
      "Use 3–24 letters, numbers, or underscores for your username.",
    );
  if (/^husky_[0-9a-f]{18}$/.test(handle))
    throw new Error(
      "Choose a personal username instead of an automatic account handle.",
    );
  if (name.length < 2 || name.length > 60)
    throw new Error("Use 2–60 characters for your display name.");
  return { username: handle, displayName: name };
}
export function profileComplete(
  profile: Pick<AccountProfile, "username" | "displayName">,
) {
  try {
    validateProfile(profile.username, profile.displayName);
    return true;
  } catch {
    return false;
  }
}

export function validateBio(bio: string) {
  if (bio.length > 200)
    throw new Error("Keep your bio to 200 characters or fewer.");
  return bio.trim();
}

export const CAMPUSES = [
  "Boston",
  "Oakland",
  "London",
  "Other Northeastern campus",
];
export const SCHOOL_YEARS = [
  "First year",
  "Second year",
  "Third year",
  "Fourth year",
  "Fifth year or later",
  "Graduate student",
];
export function validateSchoolDetails(campus?: string, schoolYear?: string) {
  if (campus && !CAMPUSES.includes(campus))
    throw new Error("Choose a campus from the list.");
  if (schoolYear && !SCHOOL_YEARS.includes(schoolYear))
    throw new Error("Choose your school year from the list.");
}
