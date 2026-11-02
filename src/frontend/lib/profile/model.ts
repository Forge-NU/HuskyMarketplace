export type AccountProfile = {
  userId: string;
  email: string;
  username: string;
  displayName: string;
  area: string;
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
