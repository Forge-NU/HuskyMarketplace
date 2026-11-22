import type { SupabaseClient } from "@supabase/supabase-js";

const EXISTING_ACCOUNT =
  "If you already have an account, log in or reset your password. You can also use a different Northeastern email.";

export async function requestSignup(
  auth: SupabaseClient["auth"],
  email: string,
  password: string,
) {
  const { data, error } = await auth.signUp({ email, password });
  if (error?.code === "user_already_exists" || error?.code === "email_exists")
    throw new Error(EXISTING_ACCOUNT);
  if (error) throw error;
  if (data.session) {
    const signedOut = await auth.signOut({ scope: "local" });
    if (signedOut.error) throw signedOut.error;
    throw new Error(
      "Email confirmation isn’t configured yet. Please try again once setup is complete.",
    );
  }
  if (!data.user)
    throw new Error(
      "We couldn’t request your verification email. Please retry.",
    );
  if (data.user.identities?.length === 0) throw new Error(EXISTING_ACCOUNT);
}
