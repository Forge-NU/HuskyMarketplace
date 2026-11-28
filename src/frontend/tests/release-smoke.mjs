import assert from "node:assert/strict";

assert.ok(process.argv[2], "Usage: node tests/release-smoke.mjs APP_ORIGIN");
const app = new URL(process.argv[2]);
const local = ["localhost", "127.0.0.1", "[::1]"].includes(app.hostname);
assert.ok(
  (app.protocol === "https:" || (local && app.protocol === "http:")) &&
    app.pathname === "/" &&
    !app.username &&
    !app.password &&
    !app.search &&
    !app.hash,
  "Use an HTTPS app origin, or a local HTTP origin, without credentials or a path",
);

const internal = ["/test-compression", "/email-preview", "/team-browse"];
let checks = 0;
async function visit(path) {
  return fetch(new URL(path, app), {
    redirect: "manual",
    signal: AbortSignal.timeout(10000),
    headers: { Accept: "text/html" },
  });
}
function pass(path) {
  console.log("PASS " + path);
  checks++;
}

for (const path of [
  "/login",
  "/signup",
  "/verify",
  "/forgot-password",
  "/reset-password",
  "/terms",
  "/privacy",
  "/safety",
  "/credits",
]) {
  const response = await visit(path);
  assert.equal(response.status, 200, `${path} must load without signing in`);
  const html = await response.text();
  assert.match(html, /<main\b/, `${path} must render the app`);
  for (const [, href] of html.matchAll(/\bhref="([^"]+)"/g)) {
    const link = new URL(href, app);
    if (link.origin !== app.origin) continue;
    assert.ok(
      !internal.some(
        (route) =>
          link.pathname === route || link.pathname.startsWith(route + "/"),
      ),
      `${path} links to an internal test page`,
    );
  }
  pass(path);
}

for (const path of [
  "/",
  "/browse",
  "/sell",
  "/my-listings",
  "/account",
  "/account/setup?next=https://example.invalid",
  "/verify-device",
  "/saved",
  "/messages",
  "/moving",
]) {
  const response = await visit(path);
  assert.equal(response.status, 307, `${path} must require sign-in`);
  const location = response.headers.get("location");
  assert.ok(location, `${path} must provide a login redirect`);
  assert.equal(new URL(location, app).href, new URL("/login", app).href);
  await response.body?.cancel();
  pass(path);
}

for (const route of internal) {
  for (const path of [route, route + "/", route + "/nested"]) {
    let response = await visit(path);
    if (path === route + "/" && response.status === 308) {
      const location = response.headers.get("location");
      assert.ok(location, `${path} must provide its canonical URL`);
      assert.equal(new URL(location, app).href, new URL(route, app).href);
      await response.body?.cancel();
      response = await visit(route);
    }
    assert.equal(response.status, 404, `${path} must be hidden in production`);
    await response.body?.cancel();
    pass(path);
  }
}
console.log(`${checks} signed-out release checks passed for ${app.origin}`);
