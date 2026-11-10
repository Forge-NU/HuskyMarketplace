export const NU_DOMAIN = "northeastern.edu";

/** Length of the codes Supabase emails for signup confirmation and password reset. */
export const OTP_LENGTH = 8;

/** Supabase hashes passwords with bcrypt, which ignores bytes past 72. */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

/** Frontend check only. The real gate is the handle_new_user trigger in the Supabase migrations. */
export function isNortheasternEmail(email: string) {
  return email.trim().toLowerCase().endsWith(`@${NU_DOMAIN}`);
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

/** Returns an error message for a new password, or "" when it is acceptable. */
export function passwordError(password: string, confirm: string) {
  if (password.length < PASSWORD_MIN)
    return `Use at least ${PASSWORD_MIN} characters for your password.`;
  if (new TextEncoder().encode(password).length > PASSWORD_MAX)
    return `Keep your password under ${PASSWORD_MAX} characters.`;
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))
    return "Include at least one letter and one number.";
  if (password !== confirm) return "Passwords don't match.";
  return "";
}

type AuthErrorLike = { code?: string; message?: string; status?: number };

/** Turns Supabase Auth errors into messages a student can act on. */
export function friendlyAuthError(error: AuthErrorLike | null | undefined) {
  if (!error) return "Something went wrong. Please try again.";
  const message = error.message ?? "";
  switch (error.code) {
    case "invalid_credentials":
      return "Wrong email or password.";
    case "email_not_confirmed":
      return "Verify your email before signing in.";
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists. Log in instead.";
    case "weak_password":
      return "Choose a stronger password.";
    case "same_password":
      return "Choose a password you haven't used for this account.";
    case "otp_expired":
      return "That code is wrong or expired. Request a new one.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Wait a minute and try again.";
    case "signup_disabled":
      return "New accounts are paused right now.";
  }
  // handle_new_user rejects non-Northeastern emails, which surfaces as a generic database error.
  if (/database error saving new user/i.test(message))
    return "Use your @northeastern.edu email address.";
  return message || "Something went wrong. Please try again.";
}

/** Where to go after signing in: account setup first when the profile is incomplete. */
export function afterAuthPath(dest: string, profileIsComplete: boolean) {
  if (profileIsComplete) return dest;
  return `/account/setup?next=${encodeURIComponent(dest === "/sell" ? "/" : dest)}`;
}
