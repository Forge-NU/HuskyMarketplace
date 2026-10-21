export const NU_DOMAIN = "northeastern.edu";

/** Frontend check only. The real gate is the before-user-created hook in the Supabase migration. */
export function isNortheasternEmail(email: string) {
  return email.trim().toLowerCase().endsWith(`@${NU_DOMAIN}`);
}

/** Only allow same-site paths as a post-login redirect, so ?next= can't send users off-site. */
export function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
