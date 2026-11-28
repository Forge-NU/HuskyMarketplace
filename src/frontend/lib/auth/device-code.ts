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
  return cooldownRemaining(sent + DEVICE_CODE_RESEND_SECONDS * 1000, now);
}

export function cooldownRemaining(until: number, now = Date.now()) {
  return Math.max(0, Math.ceil((until - now) / 1000));
}

export async function checkDeviceSession(request = fetch) {
  const response = await request("/api/auth/device", { method: "POST" });
  if (response.status === 401) throw new DeviceSessionExpiredError();
  const result = (await response.json().catch(() => ({}))) ?? {};
  if (response.ok && (result.verified === true || result.enabled === false))
    return true;
  if (response.status === 403 && result.needsCode === true) return false;
  throw new Error(result.error || "Unable to check this device. Please retry.");
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
