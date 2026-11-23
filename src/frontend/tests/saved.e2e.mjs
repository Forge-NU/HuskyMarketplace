import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { chromium, expect } from "playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { setSaved, loadSavedPage } from "../lib/saved/service.ts";

// All accounts, mail and saves in this walkthrough belong to local Supabase.
function localURL(value) {
  const url = new URL(value);
  assert.ok(
    url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname) &&
      !url.username &&
      !url.password,
    "Saved tests only accept local URLs",
  );
  return url.origin;
}
const base = localURL(process.env.SAVED_TEST_URL ?? "http://127.0.0.1:3012");
const api = localURL(
  process.env.SAVED_TEST_SUPABASE_URL ?? "http://127.0.0.1:54321",
);
const mail = localURL(
  process.env.SAVED_TEST_MAIL_URL ?? "http://127.0.0.1:54324",
);
const key = process.env.SAVED_TEST_ANON_KEY;
assert.ok(key, "Set SAVED_TEST_ANON_KEY to the local public key");
let checks = 0;
function passed(label) {
  console.log(`PASS ${++checks}: ${label}`);
}
async function student() {
  const client = createClient(api, key, { auth: { persistSession: false } });
  const suffix = randomUUID().replaceAll("-", "").slice(0, 16);
  const email = `saved_${suffix}@northeastern.edu`;
  const password = `Local-only-${randomUUID()}`;
  const signup = await client.auth.signUp({
    email,
    password,
    options: { data: { display_name: "Local saved student" } },
  });
  assert.ifError(signup.error);
  let token;
  for (let attempt = 0; attempt < 40; attempt++) {
    const inbox = await fetch(`${mail}/api/v1/messages`).then((r) => r.json());
    const message = inbox.messages.find((m) =>
      m.To.some((to) => to.Address === email),
    );
    if (message) {
      const body = await fetch(`${mail}/api/v1/message/${message.ID}`).then(
        (r) => r.json(),
      );
      token = `${body.Text} ${body.HTML}`.match(/\b\d{8}\b/)?.[0];
      if (token) break;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(token, "Local signup code arrived in Mailpit");
  const verified = await client.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });
  assert.ifError(verified.error);
  const device = await client.rpc("confirm_device_session", {
    p_token: randomBytes(32).toString("hex"),
    p_remember: false,
  });
  assert.ifError(device.error);
  assert.equal(device.data, true);
  const profile = await client
    .from("profiles")
    .update({ username: `saved_${suffix}` })
    .eq("user_id", verified.data.user.id);
  assert.ifError(profile.error);
  return {
    client,
    user: verified.data.user,
    session: verified.data.session,
    email,
    password,
  };
}

const owner = await student(),
  buyer = await student();
const browser = await chromium.launch();
const contexts = [],
  listingIds = [];
async function pageFor(account, viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({ viewport });
  contexts.push(context);
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    return [base, api].includes(url.origin) ? route.continue() : route.abort();
  });
  let cookies = [];
  const ssr = createServerClient(api, key, {
    cookies: {
      getAll: () => cookies,
      setAll: (values) => {
        cookies = values;
      },
    },
  });
  assert.ifError((await ssr.auth.setSession(account.session)).error);
  await context.addCookies(
    cookies.map(({ name, value }) => ({
      name,
      value,
      domain: new URL(base).hostname,
      path: "/",
    })),
  );
  return context.newPage();
}
async function listing(number, submit = true) {
  const id = randomUUID();
  listingIds.push(id);
  const category = await owner.client
    .from("categories")
    .select("id")
    .limit(1)
    .single();
  assert.ifError(category.error);
  const saved = await owner.client.rpc("save_listing_draft", {
    p_id: id,
    p_details: {
      title: `Local saved item ${number}`,
      description: "Synthetic local listing for saved-item checks.",
      price: number,
      category_id: category.data.id,
      condition: "Good",
      location: "Boston",
    },
  });
  assert.ifError(saved.error);
  if (submit) {
    const photo = `${owner.user.id}/${id}/${randomUUID()}.webp`;
    const bytes = Buffer.from(
      "UklGRk4AAABXRUJQVlA4IEIAAABQBACdASpQAFAAPm02mUmkIqKhIUgAgA2JaQB2AAAT40aNGjRo0aNGjPwAAP7vdtf/52thiCpf/6FGyiaTAAAAAAA=",
      "base64",
    );
    assert.ifError(
      (
        await owner.client.storage
          .from("listing-photos")
          .upload(photo, bytes, { contentType: "image/webp" })
      ).error,
    );
    assert.ifError(
      (
        await owner.client.rpc("attach_listing_photo", {
          p_listing_id: id,
          p_path: photo,
          p_sort_order: 0,
        })
      ).error,
    );
    assert.ifError(
      (await owner.client.rpc("submit_listing", { p_id: id })).error,
    );
  }
  return id;
}
async function screenshot(page, name) {
  const directory = process.env.SAVED_TEST_SCREENSHOT_DIR;
  if (!directory) return;
  await mkdir(directory, { recursive: true });
  await page.screenshot({ path: join(directory, name), fullPage: true });
}
async function signInAgain(page, account) {
  await page.goto(base + "/account");
  await page
    .getByRole("button", { name: "Sign out", exact: true })
    .first()
    .click();
  await page.waitForURL(base + "/login");
  const before = await fetch(mail + "/api/v1/messages").then((r) => r.json());
  const old = new Set(before.messages.map((m) => m.ID));
  await page
    .getByLabel("Northeastern email", { exact: true })
    .fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.waitForURL(base + "/verify-device");
  let token;
  for (let i = 0; i < 40; i++) {
    const inbox = await fetch(mail + "/api/v1/messages").then((r) => r.json());
    const msg = inbox.messages.find(
      (m) => !old.has(m.ID) && m.To.some((to) => to.Address === account.email),
    );
    if (msg) {
      const body = await fetch(`${mail}/api/v1/message/${msg.ID}`).then((r) =>
        r.json(),
      );
      token = `${body.Text} ${body.HTML}`.match(/\b\d{8}\b/)?.[0];
      if (token) break;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  assert.ok(token, "Local device code arrived");
  await page.getByLabel("Verification code", { exact: true }).fill(token);
  await page
    .getByRole("button", { name: "Verify this device", exact: true })
    .click();
  await page.waitForURL(base + "/");
}
try {
  const first = await listing(1),
    second = await listing(2),
    hidden = await listing(3, false);
  const page = await pageFor(buyer);
  await page.goto(base + "/saved");
  await expect(
    page.getByText("No saved items yet.", { exact: false }),
  ).toBeVisible();
  passed("a new account has an empty live Saved page");

  await page.goto(base + "/browse");
  const save = page.getByRole("button", {
    name: "Save Local saved item 1",
    exact: true,
  });
  await expect(save).toBeEnabled();
  let holdNext = true,
    captured = false,
    release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route(api + "/rest/v1/saved_items**", async (route) => {
    const url = new URL(route.request().url());
    if (
      holdNext &&
      route.request().method() === "GET" &&
      url.searchParams.get("select") === "listing_id"
    ) {
      holdNext = false;
      const response = await route.fetch();
      captured = true;
      await gate;
      return route.fulfill({
        response,
        headers: { ...response.headers(), "x-husky-stale-read": "1" },
      });
    }
    return route.continue();
  });
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect.poll(() => captured).toBe(true);
  await save.click();
  await expect(
    page.getByRole("button", {
      name: "Unsave Local saved item 1",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  const oldResponse = page.waitForResponse(
    (response) => response.headers()["x-husky-stale-read"] === "1",
  );
  release();
  await oldResponse;
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("button", {
      name: "Unsave Local saved item 1",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.unroute(api + "/rest/v1/saved_items**");
  passed("a late background read cannot undo a successful save");
  await setSaved(buyer.client, first, buyer.user.id, true);
  const rows = await buyer.client
    .from("saved_items")
    .select("listing_id")
    .eq("user_id", buyer.user.id)
    .eq("listing_id", first);
  assert.ifError(rows.error);
  assert.equal(rows.data.length, 1);
  passed("Browse saves to Supabase and duplicate saves keep one row");

  const forged = await owner.client
    .from("saved_items")
    .insert({ user_id: buyer.user.id, listing_id: first });
  assert.equal(forged.error?.code, "42501");
  const otherRows = await owner.client
    .from("saved_items")
    .select("listing_id")
    .eq("user_id", buyer.user.id);
  assert.ifError(otherRows.error);
  assert.equal(otherRows.data.length, 0);
  const removed = await owner.client
    .from("saved_items")
    .delete()
    .eq("user_id", buyer.user.id)
    .select("listing_id");
  assert.ifError(removed.error);
  assert.equal(removed.data.length, 0);
  passed(
    "another account cannot read, create or delete the buyer's saved rows",
  );

  const fresh = createClient(api, key, { auth: { persistSession: false } });
  const anonymous = await fresh.from("saved_items").select("listing_id");
  assert.equal(anonymous.error?.code, "42501");
  assert.ifError(
    (
      await fresh.auth.signInWithPassword({
        email: buyer.email,
        password: buyer.password,
      })
    ).error,
  );
  const unverified = await fresh.from("saved_items").select("listing_id");
  assert.ifError(unverified.error);
  assert.equal(unverified.data.length, 0);
  const unverifiedSave = await fresh
    .from("saved_items")
    .insert({ user_id: buyer.user.id, listing_id: first });
  assert.equal(unverifiedSave.error?.code, "42501");
  passed("signed-out and unverified-device sessions cannot access saved items");

  await page.goto(base + `/item/${first}`);
  await expect(
    page.getByRole("button", {
      name: "Unsave Local saved item 1",
      exact: true,
    }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Unsave Local saved item 1", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Save Local saved item 1", exact: true }),
  ).toBeEnabled();
  await page.goto(base + "/saved");
  await expect(
    page.getByText("No saved items yet.", { exact: false }),
  ).toBeVisible();
  passed("detail-page removal updates the Saved page");

  await page.goto(base + "/");
  await page
    .getByRole("button", { name: "Save Local saved item 1", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Unsave Local saved item 1",
      exact: true,
    }),
  ).toBeEnabled();
  await setSaved(buyer.client, second, buyer.user.id, true);
  await page.goto(base + "/saved");
  await expect(
    page.getByRole("heading", { name: "Local saved item 1", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Local saved item 2", exact: true }),
  ).toBeVisible();
  await screenshot(page, "saved-desktop.jpg");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Local saved item 1", exact: true }),
  ).toBeVisible();
  passed("Home saves persist across navigation and refresh");

  const mobile = await pageFor(buyer, { width: 390, height: 844 });
  await mobile.goto(base + "/saved");
  await expect(
    mobile.getByRole("heading", { name: "Local saved item 1", exact: true }),
  ).toBeVisible();
  assert.ok(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await screenshot(mobile, "saved-mobile.jpg");
  passed("the same account's saves load in a separate mobile browser");

  assert.ifError(
    (
      await buyer.client
        .from("saved_items")
        .insert({ user_id: buyer.user.id, listing_id: hidden })
    ).error,
  );
  const unavailable = (await loadSavedPage(buyer.client, 1)).items.find(
    (row) => row.listing_id === hidden,
  );
  assert.equal(unavailable.listings, null);
  await page.goto(base + "/saved");
  await expect(
    page.getByRole("heading", { name: "Listing unavailable", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Local saved item 3", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Unsave unavailable listing", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Listing unavailable", exact: true }),
  ).toHaveCount(0);
  passed("hidden listings reveal no details and can be removed from saves");

  assert.ifError(
    (await owner.client.rpc("delete_listing", { p_id: second })).error,
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Local saved item 2", exact: true }),
  ).toHaveCount(0);
  passed("deleting a listing removes its saved reference");

  let failed = false;
  await page.route(api + "/rest/v1/saved_items**", (route) => {
    if (!failed && route.request().method() === "DELETE") {
      failed = true;
      return route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ message: "Injected local test failure" }),
      });
    }
    return route.continue();
  });
  await page
    .getByRole("button", { name: "Unsave Local saved item 1", exact: true })
    .click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Could not remove",
  );
  await expect(
    page.getByRole("heading", { name: "Local saved item 1", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Retry saved items", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Unsave Local saved item 1", exact: true })
    .click();
  await expect(
    page.getByText("No saved items yet.", { exact: false }),
  ).toBeVisible();
  await page.unroute(api + "/rest/v1/saved_items**");
  passed("failed removals keep the saved item and retry successfully");

  await page.goto(base + `/item/${first}`);
  failed = false;
  await page.route(api + "/rest/v1/saved_items**", (route) => {
    if (!failed && route.request().method() === "POST") {
      failed = true;
      return route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ message: "Injected failed save" }),
      });
    }
    return route.continue();
  });
  await page
    .getByRole("button", { name: "Save Local saved item 1", exact: true })
    .click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Could not save",
  );
  assert.equal((await loadSavedPage(buyer.client, 1)).count, 0);
  await page
    .getByRole("button", { name: "Retry saved items", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Save Local saved item 1", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Unsave Local saved item 1",
      exact: true,
    }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Unsave Local saved item 1", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Save Local saved item 1", exact: true }),
  ).toBeEnabled();
  await page.unroute(api + "/rest/v1/saved_items**");
  await page.goto(base + "/saved");
  passed("failed saves do not claim success and retry without a duplicate");

  failed = false;
  await page.route(api + "/rest/v1/saved_items**", (route) => {
    if (!failed && route.request().method() === "GET") {
      return route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          code: "42501",
          message: "Injected missing grants",
        }),
      });
    }
    return route.continue();
  });
  await page.reload();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "could not load",
  );
  await expect(
    page.getByText("No saved items yet.", { exact: false }),
  ).toHaveCount(0);
  failed = true;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByText("No saved items yet.", { exact: false }),
  ).toBeVisible();
  await page.unroute(api + "/rest/v1/saved_items**");
  passed(
    "missing grants show an error and retry without falling back to demo data",
  );

  const many = [first];
  for (let number = 4; number <= 28; number++) many.push(await listing(number));
  for (const id of many) await setSaved(buyer.client, id, buyer.user.id, true);
  await page.reload();
  await expect(page.locator("main article")).toHaveCount(24);
  await page.getByRole("link", { name: "Next", exact: true }).click();
  await expect(page.locator("main article")).toHaveCount(2);
  await expect(page.getByText("Page 2 of 2", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Previous", exact: true }).click();
  await expect(page.locator("main article")).toHaveCount(24);
  passed("saved items paginate in groups of 24 with real counts");

  await page.goto(base + "/demo/item/1");
  await page.getByRole("button", { name: "♡ Save", exact: true }).click();
  await page.goto(base + "/demo/saved");
  await expect(page.getByText("1 saved item", { exact: true })).toBeVisible();
  assert.equal((await loadSavedPage(buyer.client, 1)).count, 26);
  passed(
    "demo favorites remain browser-local and separate from real saved rows",
  );

  await signInAgain(page, buyer);
  await page.goto(base + "/saved");
  await expect(page.getByText("26 saved items", { exact: true })).toBeVisible();
  passed(
    "saves remain after real logout, password login and device verification",
  );
  await signInAgain(page, owner);
  await page.goto(base + "/saved");
  await expect(
    page.getByText("No saved items yet.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByText("26 saved items", { exact: true })).toHaveCount(
    0,
  );
  passed(
    "switching accounts in the same browser clears the previous student's saves",
  );
} finally {
  for (const context of contexts) await context.close();
  await browser.close();
  for (const id of listingIds)
    await owner.client.rpc("delete_listing", { p_id: id });
}
console.log(`${checks} saved-item walkthrough checks passed`);
