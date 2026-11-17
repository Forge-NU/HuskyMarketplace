import type { SupabaseClient } from "@supabase/supabase-js";

export const DEVICE_CODE_SENT = "husky_device_code_sent";

export function hasRequestedCode(sentAt: string | null, now = Date.now()) {
  const sent = Number(sentAt);
  return sentAt !== null && Number.isFinite(sent) && sent > 0 && sent <= now;
}

export function codeCooldown(sentAt: string | null, now = Date.now()) {
  const sent = Number(sentAt);
  if (!hasRequestedCode(sentAt, now)) return 0;
  return Math.max(0, Math.ceil((sent + 60_000 - now) / 1000));
}

export async function requestDeviceCode(client: SupabaseClient) {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user?.email)
    throw new Error("Please sign in again to verify your device.");
  const sent = await client.auth.signInWithOtp({
    email: data.user.email,
    options: { shouldCreateUser: false },
  });
  if (sent.error) throw sent.error;
  return data.user.email;
}
