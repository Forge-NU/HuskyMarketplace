import type { SupabaseClient } from "@supabase/supabase-js";

type Progress = { verified: boolean; passwordSaved: boolean };

export async function confirmEmail(
  auth: SupabaseClient["auth"],
  input: { email: string; code: string; recovery: boolean; password: string },
  progress: Progress,
  onProgress: (progress: Progress) => void,
) {
  let current = progress;
  if (!current.verified) {
    const result = await auth.verifyOtp({
      email: input.email,
      token: input.code,
      type: input.recovery ? "recovery" : "email",
    });
    if (result.error) throw result.error;
    current = { ...current, verified: true };
    onProgress(current);
  }
  if (input.recovery && !current.passwordSaved) {
    const result = await auth.updateUser({ password: input.password });
    if (result.error) throw result.error;
    onProgress({ ...current, passwordSaved: true });
  }
}
