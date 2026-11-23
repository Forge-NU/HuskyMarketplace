import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../proxy.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

function routing(signedIn, device = {}) {
  const exports = {};
  const signOuts = [];
  function response(url) {
    return { url, cookies: { getAll: () => [], set() {} } };
  }
  class NextResponse {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status ?? 200;
      this.headers = init.headers ?? {};
      this.cookies = { getAll: () => [], set() {} };
    }
    static next() {
      return response();
    }
    static redirect(url) {
      return response(url);
    }
  }
  const modules = {
    "@/lib/supabase/session": {
      PERSISTENCE_COOKIE: "husky_keep_signed_in",
      sessionCookieOptions: (options) => options,
    },
    "next/server": { NextResponse },
    "@/lib/supabase/env": {
      supabaseEnv: () => ({ url: "https://example.test", anonKey: "fixture" }),
    },
    "@supabase/ssr": {
      createServerClient: () => ({
        auth: {
          getClaims: async () => ({
            data: { claims: signedIn ? { sub: "student" } : null },
          }),
          signOut: async (options) => {
            signOuts.push(options);
            return { error: null };
          },
        },
        rpc: async (name) => {
          assert.equal(name, "device_session_verified");
          return device.rpc ?? { data: true, error: null };
        },
      }),
    },
  };
  const env = device.enabled ? "true" : undefined;
  new Function("require", "exports", "process", compiled)(
    (name) => modules[name],
    exports,
    { env: { DEVICE_VERIFICATION_ENABLED: env } },
  );
  const visit = async (path) => {
    const result = await exports.proxy({
      nextUrl: {
        pathname: new URL(path, "https://example.test").pathname,
        clone: () => new URL(path, "https://example.test"),
      },
      cookies: { getAll: () => [], set() {} },
    });
    if (result.url) return result.url.pathname + result.url.search;
    return result.status === 503 ? 503 : null;
  };
  visit.signOuts = signOuts;
  return visit;
}

test("signed-out protected routes go to login without a saved destination", async () => {
  const visit = routing(false);
  for (const path of [
    "/",
    "/sell",
    "/my-listings",
    "/account/setup?next=/my-listings",
  ]) {
    assert.equal(await visit(path), "/login");
  }
});

test("signed-in login and signup routes always return Home", async () => {
  const visit = routing(true);
  assert.equal(await visit("/login?next=/my-listings"), "/");
  assert.equal(await visit("/signup?next=/sell"), "/");
});

test("public policy pages remain available without signing in", async () => {
  const visit = routing(false);
  for (const path of ["/terms", "/privacy", "/safety", "/credits"]) {
    assert.equal(await visit(path), null);
  }
});

test("verified devices reach protected routes", async () => {
  const visit = routing(true, { enabled: true });
  assert.equal(await visit("/my-listings"), null);
  assert.deepEqual(visit.signOuts, []);
});

test("unverified leftover sessions are signed out and sent to login", async () => {
  const visit = routing(true, {
    enabled: true,
    rpc: { data: false, error: null },
  });
  assert.equal(await visit("/my-listings"), "/login");
  assert.deepEqual(visit.signOuts, [{ scope: "local" }]);
});

test("a failed device check keeps the session and asks for a retry", async () => {
  const visit = routing(true, {
    enabled: true,
    rpc: { data: null, error: { message: "upstream connect error" } },
  });
  assert.equal(await visit("/my-listings"), 503);
  assert.equal(await visit("/"), 503);
  assert.deepEqual(visit.signOuts, []);
});
