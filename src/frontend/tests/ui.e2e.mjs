import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { chromium, webkit, expect } from "playwright/test";

const require = createRequire(import.meta.url);
function localURL(value) {
  const url = new URL(value);
  assert.ok(
    url.protocol === "http:" &&
      ["127.0.0.1", "localhost"].includes(url.hostname) &&
      !url.username &&
      !url.password,
    "UI checks only accept local URLs",
  );
  return url.origin;
}
const base = localURL(process.env.UI_TEST_URL ?? "http://127.0.0.1:3008");
const api = localURL(
  process.env.UI_TEST_SUPABASE_URL ?? "http://127.0.0.1:54321",
);
const state = process.env.UI_TEST_STATE;
const item = process.env.UI_TEST_ITEM_ID;
assert.ok(
  state,
  "Set UI_TEST_STATE to a synthetic local student's browser state",
);
assert.match(
  item ?? "",
  /^[0-9a-f-]{36}$/i,
  "Set UI_TEST_ITEM_ID to a local fixture",
);
const engine = process.env.UI_TEST_BROWSER ?? "chromium";
assert.ok(["chromium", "webkit"].includes(engine), "Choose chromium or webkit");
const browser = await (engine === "webkit" ? webkit : chromium).launch();
const privateRoutes = [
  "/",
  "/browse",
  "/sell",
  "/my-listings",
  "/account",
  "/account/setup",
  "/saved",
  "/messages",
  "/messages?tab=offers&offer=1",
  "/moving",
  "/demo/item/1",
  "/seller/1",
  `/item/${item}`,
  "/listings/1",
];
const publicRoutes = [
  "/login",
  "/signup",
  "/forgot-password",
  "/verify",
  "/reset-password",
  "/terms",
  "/privacy",
  "/safety",
  "/credits",
];
let pages = 0,
  layouts = 0;
try {
  for (const signedIn of [true, false]) {
    const context = await browser.newContext({
      storageState: signedIn ? state : undefined,
      viewport: { width: 1280, height: 900 },
    });
    await context.route("**/*", (route) => {
      const request = route.request();
      const url = new URL(request.url());
      return [base, api].includes(url.origin) ||
        request.resourceType() === "image"
        ? route.continue()
        : route.abort();
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      sessionStorage.setItem(
        "husky_registration_email",
        "local_qa@northeastern.edu",
      );
    });
    for (const path of signedIn ? privateRoutes : publicRoutes) {
      await page.goto(`${base}${path}`);
      assert.equal(new URL(page.url()).pathname, path.split("?")[0], path);
      await expect(page.locator("main")).toHaveCount(1);
      if (path.startsWith("/account"))
        await expect(page.locator("#display-name")).toBeVisible();
      if (path === "/sell") await expect(page.locator("#title")).toBeEnabled();
      if (path.startsWith("/item/"))
        await expect(page.locator("main h1")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
      const violations = await page.evaluate(async () => {
        const result = await window.axe.run(document, {
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
          },
        });
        return result.violations.map((v) => ({
          id: v.id,
          targets: v.nodes.map((n) => n.target),
        }));
      });
      assert.deepEqual(violations, [], `${engine} ${path}: accessibility`);
      const internalLinks = await page
        .locator("a[href]")
        .evaluateAll((links) =>
          links
            .map((link) => link.getAttribute("href"))
            .filter((href) =>
              /^\/(team-browse|test-compression|email-preview)(\/|\?|$)/.test(
                href,
              ),
            ),
        );
      assert.deepEqual(internalLinks, [], `${path}: internal links`);
      for (const width of [320, 390, 640, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          true,
          `${engine} ${path}: horizontal overflow at ${width}`,
        );
        layouts++;
      }
      await page.setViewportSize({ width: 1280, height: 900 });
      // Safari on macOS uses Option-Tab to include links in keyboard navigation.
      await page.keyboard.press(
        engine === "webkit" && process.platform === "darwin"
          ? "Alt+Tab"
          : "Tab",
      );
      await expect(
        page.getByRole("link", { name: "Skip to content" }),
      ).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.locator("#main-content")).toBeFocused();
      console.log(
        `PASS ${engine} ${path}: accessibility, reflow, links and skip navigation`,
      );
      pages++;
    }
    await context.close();
  }
  console.log(
    `${engine}: ${pages} page variants and ${layouts} layout checks passed`,
  );
} finally {
  await browser.close();
}
