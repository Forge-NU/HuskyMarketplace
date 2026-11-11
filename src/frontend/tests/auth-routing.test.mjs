import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../proxy.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

function routing(signedIn) {
  const exports = {};
  function response(url) {
    return { url, cookies: { getAll: () => [], set() {} } };
  }
  const modules = {
    "next/server": {
      NextResponse: { next: () => response(), redirect: response },
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
  new Function("require", "exports", compiled)(
    (name) => modules[name],
    exports,
  );
  return async (path) => {
    const result = await exports.proxy({
      nextUrl: {
        pathname: new URL(path, "https://example.test").pathname,
        clone: () => new URL(path, "https://example.test"),
      },
      cookies: { getAll: () => [], set() {} },
    });
    return result.url ? result.url.pathname + result.url.search : null;
  };
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
