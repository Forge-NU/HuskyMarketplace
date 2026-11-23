import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(
  new URL("../app/api/auth/device/route.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

function deviceRoute({ enabled = false, probe, rpc }) {
  const exports = {};
  const modules = {
    "node:crypto": { randomBytes: () => Buffer.alloc(32, 1) },
    "next/headers": {
      cookies: async () => ({ get: () => undefined, set() {} }),
    },
    "next/server": {
      NextResponse: {
        json: (body, init = {}) => ({ body, status: init.status ?? 200 }),
      },
    },
    "@/lib/supabase/server": {
      createClient: async () => ({
        auth: {
          getUser: async () => ({ data: { user: { id: "student" } } }),
          getClaims: async () => ({ data: { claims: { amr: [] } } }),
        },
        from: () => ({
          select: () => ({ eq: () => ({ maybeSingle: async () => probe }) }),
        }),
        rpc: async () => rpc,
      }),
    },
    "@/lib/auth/device": { recentEmailProof: () => false },
  };
  new Function("require", "exports", "process", compiled)(
    (name) => modules[name],
    exports,
    { env: { DEVICE_VERIFICATION_ENABLED: enabled ? "true" : undefined } },
  );
  return () =>
    exports.POST({
      headers: { get: () => "https://example.test" },
      nextUrl: { origin: "https://example.test", protocol: "https:" },
    });
}

test("device checks off: a readable profile means checks are off everywhere", async () => {
  const post = deviceRoute({
    probe: { data: { user_id: "student" }, error: null },
  });
  assert.deepEqual(await post(), { body: { enabled: false }, status: 200 });
});

test("device checks off: a missing profile reports the setting mismatch", async () => {
  const result = await deviceRoute({ probe: { data: null, error: null } })();
  assert.equal(result.status, 500);
  assert.match(result.body.error, /DEVICE_VERIFICATION_ENABLED=true/);
});

test("device checks off: a failed profile read is a retryable outage, not a mismatch", async () => {
  const result = await deviceRoute({
    probe: { data: null, error: { message: "fetch failed" } },
  })();
  assert.equal(result.status, 503);
  assert.doesNotMatch(result.body.error, /DEVICE_VERIFICATION_ENABLED/);
});

test("device checks on: a failed RPC is retryable and does not ask for a code", async () => {
  const result = await deviceRoute({
    enabled: true,
    rpc: { data: null, error: { message: "fetch failed" } },
  })();
  assert.equal(result.status, 503);
  assert.equal(result.body.needsCode, undefined);
});

test("device checks on: an unverified device asks for a code", async () => {
  const result = await deviceRoute({
    enabled: true,
    rpc: { data: false, error: null },
  })();
  assert.deepEqual(result, { body: { needsCode: true }, status: 403 });
});

test("device codes use an email that does not read as a password reset", () => {
  // Device checks send the recovery email (see UIAuth), so its copy must fit both uses.
  const email = readFileSync(
    new URL("../../../supabase/templates/recovery.html", import.meta.url),
    "utf8",
  );
  assert.match(email, /\{\{ \.Token \}\}/);
  assert.doesNotMatch(email, /reset your password/i);
  assert.doesNotMatch(email, /password reset page/i);
  assert.match(email, /new browser/);
});
