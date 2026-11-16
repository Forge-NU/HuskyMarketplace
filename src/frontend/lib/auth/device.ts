export function recentEmailProof(
  claims: { amr?: unknown },
  now = Date.now() / 1000,
) {
  if (!Array.isArray(claims.amr)) return false;
  return claims.amr.some((entry: unknown) => {
    if (!entry || typeof entry !== "object") return false;
    const { method, timestamp } = entry as {
      method?: string;
      timestamp?: unknown;
    };
    return (
      ["otp", "email/signup", "recovery"].includes(method || "") &&
      typeof timestamp === "number" &&
      timestamp >= now - 600 &&
      timestamp <= now + 30
    );
  });
}
