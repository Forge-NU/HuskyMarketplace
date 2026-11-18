import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { isDevelopmentRoute } from "../lib/routes.ts";

const source = readFileSync(new URL("../proxy.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

function routing(signedIn, environment = "development") {
  const exports = {};
  function response(url) {
    return { url, cookies: { getAll: () => [], set() {} } };
  }
  const modules = {
    "@/lib/routes": { isDevelopmentRoute },
    "@/lib/supabase/session": {
      PERSISTENCE_COOKIE: "husky_keep_signed_in",
      sessionCookieOptions: (options) => options,
    },
    "next/server": {
      NextResponse: class {
        constructor(_body, options) {
          this.status = options.status;
        }
        static next() {
          return response();
        }
        static redirect(url) {
          return response(url);
        }
      },
    },
    "@/lib/supabase/env": {
      supabaseEnv: () => ({ url: "https://example.test", anonKey: "fixture" }),
    },
    "@supabase/ssr": {
      createServerClient: () => ({
        auth: {
          getClaims: async () => ({
            data: { claims: signedIn ? { sub: "student" } : null },
          }),
        },
      }),
    },
  };
  new Function("require", "exports", "process", compiled)(
    (name) => modules[name],
    exports,
    { env: { NODE_ENV: environment } },
  );
  return async (path) => {
    const result = await exports.proxy({
      nextUrl: {
        pathname: new URL(path, "https://example.test").pathname,
        clone: () => new URL(path, "https://example.test"),
      },
      cookies: { getAll: () => [], set() {} },
    });
    return result.url
      ? result.url.pathname + result.url.search
      : (result.status ?? null);
  };
}

test("signed-out protected routes go to login without a saved destination", async () => {
  const visit = routing(false);
  for (const path of [
    "/",
    "/sell",
    "/my-listings",
    "/verify-device",
    "/account/setup?next=/my-listings",
  ]) {
    assert.equal(await visit(path), "/login");
  }
});
test("internal pages return 404 in production for signed-in and signed-out users", async () => {
  for (const signedIn of [true, false]) {
    const visit = routing(signedIn, "production");
    for (const path of [
      "/test-compression",
      "/email-preview",
      "/team-browse",
      "/test-compression/nested",
    ])
      assert.equal(await visit(path), 404);
  }
});
test("internal pages remain usable by signed-in developers", async () => {
  const visit = routing(true);
  for (const path of ["/test-compression", "/email-preview", "/team-browse"])
    assert.equal(await visit(path), null);
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
