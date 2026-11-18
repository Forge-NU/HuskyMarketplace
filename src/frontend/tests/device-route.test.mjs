import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { recentEmailProof } from "../lib/auth/device.ts";

const compiled = ts.transpileModule(
  readFileSync(
    new URL("../app/api/auth/device/route.ts", import.meta.url),
    "utf8",
  ),
  {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  },
).outputText;

function fixture({
  authenticated = true,
  authError = null,
  verified = false,
  rpcError = null,
  remembered = false,
  confirms = false,
  enabled = "true",
  proofMethod = "password",
} = {}) {
  const calls = [];
  const token = "a".repeat(64);
  const client = {
    auth: {
      getUser: async () => ({
        data: { user: authenticated ? { id: "fixture" } : null },
        error: authError,
      }),
      getClaims: async () => ({
        data: {
          claims: {
            amr: [{ method: proofMethod, timestamp: Date.now() / 1000 }],
          },
        },
        error: null,
      }),
    },
    rpc: async (name, args) => {
      calls.push([name, args]);
      return name === "device_session_verified"
        ? { data: verified, error: rpcError }
        : { data: confirms, error: null };
    },
  };
  const modules = {
    "node:crypto": { randomBytes: () => Buffer.alloc(32) },
    "next/headers": {
      cookies: async () => ({
        get: (name) =>
          remembered
            ? { value: name === "husky_device" ? token : "yes" }
            : undefined,
        set: (...args) => calls.push(["cookie", ...args]),
      }),
    },
    "next/server": {
      NextResponse: {
        json: (body, options) => ({ body, status: options?.status ?? 200 }),
      },
    },
    "@/lib/supabase/server": { createClient: async () => client },
    "@/lib/auth/device": { recentEmailProof },
  };
  const exports = {};
  new Function("require", "exports", "process", compiled)(
    (name) => modules[name],
    exports,
    { env: { DEVICE_VERIFICATION_ENABLED: enabled } },
  );
  return {
    calls,
    token,
    request: (origin = "https://fixture.invalid") =>
      exports.POST({
        headers: { get: () => origin },
        nextUrl: new URL("https://fixture.invalid/api/auth/device"),
      }),
  };
}

test("verified sessions continue without another email or remembered credential", async () => {
  const f = fixture({ verified: true });
  assert.deepEqual(await f.request(), {
    status: 200,
    body: { verified: true },
  });
  assert.deepEqual(
    f.calls.map((c) => c[0]),
    ["device_session_verified"],
  );
});
test("an unfamiliar password-only session still requires an email code", async () => {
  const f = fixture();
  assert.deepEqual(await f.request(), {
    status: 403,
    body: { needsCode: true },
  });
  assert.equal(
    f.calls.some((c) => c[0] === "cookie"),
    false,
  );
});
test("a remembered credential is checked by the database before continuing", async () => {
  const f = fixture({ remembered: true, confirms: true });
  assert.equal((await f.request()).status, 200);
  assert.deepEqual(f.calls.find((c) => c[0] === "confirm_device_session")[1], {
    p_token: f.token,
    p_remember: true,
  });
});
test("rejected remembered credentials cannot grant access or set a new trust cookie", async () => {
  const f = fixture({ remembered: true, confirms: false });
  assert.equal((await f.request()).status, 403);
  assert.equal(
    f.calls.some((call) => call[0] === "cookie"),
    false,
  );
});
test("recent email verification rotates a remembered credential securely", async () => {
  const f = fixture({ remembered: true, confirms: true, proofMethod: "otp" });
  assert.equal((await f.request()).status, 200);
  const saved = f.calls.find((call) => call[0] === "cookie");
  assert.equal(saved[1], "husky_device");
  assert.notEqual(saved[2], f.token);
  assert.match(saved[2], /^[a-f0-9]{64}$/);
  assert.deepEqual(saved[3], {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 2592000,
  });
});
test("a missing device setting is an error, not an implicit opt-out", async () => {
  for (const enabled of [undefined, "", "TRUE", "invalid"]) {
    const f = fixture({ enabled: enabled ?? "" });
    assert.equal((await f.request()).status, 503);
    assert.deepEqual(f.calls, []);
  }
  const disabled = fixture({ enabled: "false" });
  assert.deepEqual(await disabled.request(), {
    status: 200,
    body: { enabled: false },
  });
});
test("a database outage fails closed without logging out or claiming verification", async () => {
  const f = fixture({ rpcError: { message: "Offline" } });
  assert.equal((await f.request()).status, 503);
  assert.deepEqual(
    f.calls.map((c) => c[0]),
    ["device_session_verified"],
  );
});
test("cross-origin device requests are rejected before checking the session", async () => {
  const f = fixture();
  assert.equal((await f.request("https://other.invalid")).status, 403);
  assert.deepEqual(f.calls, []);
});
test("expired sessions require login while temporary Auth errors remain retryable", async () => {
  const expired = fixture({ authenticated: false });
  assert.equal((await expired.request()).status, 401);
  assert.deepEqual(expired.calls, []);
  const unavailable = fixture({
    authenticated: false,
    authError: { status: 503 },
  });
  assert.equal((await unavailable.request()).status, 503);
  assert.deepEqual(unavailable.calls, []);
});
