export const NU_DOMAIN = "northeastern.edu";

/** Frontend check only. The real gate is the before-user-created hook in the Supabase migration. */
export function isNortheasternEmail(email: string) {
  return /^[^\s@]+@northeastern\.edu$/i.test(email.trim());
}

/** Only allow same-site paths as a post-login redirect, so ?next= can't send users off-site. */
export function safeNext(next: string | null) {
  return next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !/[\\\x00-\x1f\x7f]/.test(next)
    ? next
    : "/";
}

export function validatePassword(password: string, confirmation: string) {
  if (password.length < 8)
    throw new Error("Use at least 8 characters for your password.");
  if (new TextEncoder().encode(password).length > 72)
    throw new Error("Keep your password to 72 bytes or fewer.");
  if (password !== confirmation) throw new Error("Your passwords don’t match.");
}
export function authMessage(error: unknown) {
  const value = error as { code?: string; message?: string };
  switch (value?.code) {
    case "invalid_credentials":
      return "Email or password isn’t right. Used email codes before? Reset your password to create one.";
    case "otp_expired":
      return "That code is incorrect or expired. Request a new code.";
    case "over_email_send_rate_limit":
      return "Email sending limit reached. Please wait before requesting another code; it may take longer than a minute to reset.";
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a minute and try again.";
    case "email_not_confirmed":
      return "Confirm your email before signing in.";
  }
  return value?.message || "We couldn’t connect. Please try again.";
}
