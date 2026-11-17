import type { SupabaseClient } from "@supabase/supabase-js";

export const DEVICE_CODE_SENT = "husky_device_code_sent";
export const DEVICE_CODE_RESEND_SECONDS = 180;

export class DeviceSessionExpiredError extends Error {
  constructor() {
    super("Your session expired. Log in to continue.");
    this.name = "DeviceSessionExpiredError";
  }
}

export function hasRequestedCode(sentAt: string | null, now = Date.now()) {
  const sent = Number(sentAt);
  return sentAt !== null && Number.isFinite(sent) && sent > 0 && sent <= now;
}

export function codeCooldown(sentAt: string | null, now = Date.now()) {
  const sent = Number(sentAt);
  if (!hasRequestedCode(sentAt, now)) return 0;
  return Math.max(
    0,
    Math.ceil((sent + DEVICE_CODE_RESEND_SECONDS * 1000 - now) / 1000),
  );
}

export async function requestDeviceCode(client: SupabaseClient) {
  const { data, error } = await client.auth.getUser();
  if (error && (!error.status || error.status >= 500))
    throw new Error("We couldn’t check your session. Please try again.");
  if (error || !data.user?.email) throw new DeviceSessionExpiredError();
  const sent = await client.auth.signInWithOtp({
    email: data.user.email,
    options: { shouldCreateUser: false },
  });
  if (sent.error) throw sent.error;
  return data.user.email;
}
