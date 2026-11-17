import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recentEmailProof } from "@/lib/auth/device";
const DEVICE_COOKIE = "husky_device";
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  if (process.env.DEVICE_VERIFICATION_ENABLED !== "true")
    return NextResponse.json({ enabled: false });
  const client = await createClient();
  const { data, error } = await client.auth.getUser();
  if (error && (!error.status || error.status >= 500))
    return NextResponse.json(
      { error: "Device verification is unavailable. Please retry." },
      { status: 503 },
    );
  if (error || !data.user)
    return NextResponse.json(
      { error: "Your session expired. Log in to continue." },
      { status: 401 },
    );
  const session = await client.rpc("device_session_verified");
  if (session.error)
    return NextResponse.json(
      { error: "Device verification is unavailable. Please retry." },
      { status: 503 },
    );
  if (session.data === true) return NextResponse.json({ verified: true });
  const store = await cookies();
  const previous = store.get(DEVICE_COOKIE)?.value;
  const verifiedClaims = await client.auth.getClaims();
  // Rotate after an email challenge, including when another student uses this browser.
  const freshProof =
    !verifiedClaims.error &&
    verifiedClaims.data?.claims &&
    recentEmailProof(verifiedClaims.data.claims);
  const token =
    !freshProof && previous && /^[a-f0-9]{64}$/.test(previous)
      ? previous
      : randomBytes(32).toString("hex");
  const remember = store.get("husky_keep_signed_in")?.value === "yes";
  const result = await client.rpc("confirm_device_session", {
    p_token: token,
    p_remember: remember,
  });
  if (result.error)
    return NextResponse.json(
      { error: "Device verification is unavailable. Please retry." },
      { status: 503 },
    );
  if (result.data !== true)
    return NextResponse.json({ needsCode: true }, { status: 403 });
  if (remember)
    store.set(DEVICE_COOKIE, token, {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 2592000,
    });
  return NextResponse.json({ verified: true });
}
