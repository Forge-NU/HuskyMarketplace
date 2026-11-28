import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { chromium, expect } from "playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

// All accounts, mail and listings in this walkthrough belong to local Supabase.
function localURL(value) {
  const url = new URL(value);
  assert.ok(
    url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname) &&
      !url.username &&
      !url.password,
    "Listing tests only accept local URLs",
  );
  return url.origin;
}
const base = localURL(process.env.LISTING_TEST_URL ?? "http://127.0.0.1:3007");
const api = localURL(
  process.env.LISTING_TEST_SUPABASE_URL ?? "http://127.0.0.1:54321",
);
const mail = localURL(
  process.env.LISTING_TEST_MAIL_URL ?? "http://127.0.0.1:54324",
);
const key = process.env.LISTING_TEST_ANON_KEY;
assert.ok(key, "Set LISTING_TEST_ANON_KEY to the local public key");
let checks = 0;
function passed(label) {
  console.log(`PASS ${++checks}: ${label}`);
}
async function student() {
  const client = createClient(api, key, { auth: { persistSession: false } });
  const suffix = randomUUID().replaceAll("-", "").slice(0, 16);
  const email = `listing_${suffix}@northeastern.edu`;
  const signup = await client.auth.signUp({
    email,
    password: `Local-only-${randomUUID()}`,
    options: { data: { display_name: "Local listing student" } },
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
    .update({ username: `listing_${suffix}` })
    .eq("user_id", verified.data.user.id);
  assert.ifError(profile.error);
  return { client, user: verified.data.user, session: verified.data.session };
}
const owner = await student();
const other = await student();
const browser = await chromium.launch();
const contexts = [];
async function screenshot(page, name) {
  const directory = process.env.LISTING_TEST_SCREENSHOT_DIR;
  if (!directory) return;
  await mkdir(directory, { recursive: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: join(directory, name), fullPage: true });
}
async function pageFor(account, viewport) {
  const context = await browser.newContext({ viewport });
  contexts.push(context);
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    return [base, api].includes(url.origin) ? route.continue() : route.abort();
  });
  let cookies = [];
  const client = createServerClient(api, key, {
    cookies: {
      getAll: () => cookies,
      setAll: (values) => {
        cookies = values;
      },
    },
  });
  const result = await client.auth.setSession(account.session);
  assert.ifError(result.error);
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
const photo = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4CAIAAAC2BqGFAAAACXBIWXMAAAPoAAAD6AG1e1JrAAABmUlEQVR4nO3UQW0EARTD0IFQJOYPYWCVQK/dfK2eFASW4+f9yd7/h/Cg/H5ENaADum96G6MDurmGjG4OTjq6OY0O6OYaMro5OOno5jQ6oJtryOjm4KSjm9PogG6uIaObg5OObk6jA7q5hoxuDk46ujmNDujmGjK6OTjp6OY0OqCba8jo5uCko5vT6IBuriGjm4OTjm5OowO6uYaMbg5OOro5jQ7o5hoyujk46ejmNDqgm2vI6ObgpKOb0+iAbq4ho5uDk45uTqMDurmGjG4OTjq6OY0O6OYaMro5OOno5jQ6oJtryOjm4KSjm9PogG6uIaObg5OObk6jA7q5hoxuDk46ujmNDujmGjK6OTjp6OY0OqCba8jo5uCko5vT6IBuriGjm4OTjm5OowO6uYaMbg5OOro5jQ7o5hoyujk46ejmNDqgm2vI6ObgpKOb0+iAbq4ho5uDk45uTqMDurmGjG4OTjq6OY0O6OYaMro5OOno5jQ6oJtryOjm4KSjm9PogG6uIaObg5OObk6jA7q5hoxuDk46mjP9c7+ixpTYnMYFbwAAAABJRU5ErkJggg==",
  "base64",
);
const image = {
  name: "local-listing.png",
  mimeType: "image/png",
  buffer: photo,
};
const title = `Local listing ${randomUUID().slice(0, 8)}`;
let id;
try {
  const p = await pageFor(owner, { width: 1280, height: 1000 });
  const main = p.locator("main");
  await p.goto(`${base}/my-listings`);
  await expect(main.getByText("Your next listing starts here.")).toBeVisible();
  await main
    .getByRole("link", { name: "Create a listing →", exact: true })
    .click();
  await expect(p.locator("#title")).toBeEnabled();
  const submit = main.getByRole("button", { name: "Submit for moderation" });
  const save = main.getByRole("button", {
    name: "Save draft & photos",
    exact: true,
  });
  await expect(submit).toBeDisabled();
  await p.locator("#title").fill(title);
  await p.getByLabel("Price (USD)").fill("0");
  const options = await p.getByLabel("Category").locator("option").all();
  await p
    .getByLabel("Category")
    .selectOption(await options[1].getAttribute("value"));
  await p.getByLabel("Condition").selectOption("Good");
  await p.getByLabel("General pickup area").fill("Boston");
  await p
    .locator("#description")
    .fill("Synthetic local listing for the browser walkthrough.");
  await save.click();
  await expect(main.getByRole("alert")).toContainText("Add at least one photo");
  passed("missing photos prevent saving or submission");
  await p.locator("#photos").setInputFiles({
    name: "unsupported.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg/>"),
  });
  await expect(main.getByRole("alert")).toContainText(
    "Choose JPEG, PNG, or WebP",
  );
  passed("unsupported photos are rejected");
  await p.locator("#photos").setInputFiles(Array(6).fill(image));
  await expect(main.getByRole("alert")).toContainText("at most five");
  passed("the five-photo limit is enforced");
  await p.locator("#photos").setInputFiles([image, image]);
  await expect(
    main.getByRole("button", { name: "Remove", exact: true }),
  ).toHaveCount(2);
  const uploadedPaths = [];
  let loseUploadResponse = true;
  await p.route(`${api}/storage/v1/object/listing-photos/**`, async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    uploadedPaths.push(route.request().url());
    if (loseUploadResponse) {
      loseUploadResponse = false;
      const response = await route.fetch();
      assert.ok(response.ok(), "Original upload reached local storage");
      return route.fulfill({
        status: 503,
        json: { message: "Injected lost upload response" },
      });
    }
    return route.continue();
  });
  await save.click();
  await expect(main.getByRole("alert")).toContainText("Photo upload failed");
  id = new URL(p.url()).searchParams.get("edit");
  assert.match(id, /^[0-9a-f-]{36}$/);
  await expect(submit).toBeDisabled();
  const ownDraft = await owner.client
    .from("listings")
    .select("status")
    .eq("id", id)
    .single();
  assert.equal(ownDraft.data.status, "draft");
  passed("lost upload response keeps a private draft and a recoverable URL");
  await save.click();
  await expect(main.getByRole("status")).toContainText(
    "Draft and photos saved privately",
  );
  assert.equal(uploadedPaths[0], uploadedPaths[1]);
  const attached = await owner.client
    .from("listing_photos")
    .select("photo_url")
    .eq("listing_id", id);
  assert.equal(attached.data.length, 2);
  assert.ok(attached.data.every((row) => row.photo_url.endsWith(".webp")));
  passed(
    "retry reuses the upload path and attaches two compressed WebP photos once",
  );
  await p.locator("#photos").setInputFiles(image);
  await expect(
    main.getByRole("button", { name: "Remove", exact: true }),
  ).toHaveCount(1);
  await main.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(p.locator('img[alt^="Selected photo"]')).toHaveCount(2);
  await expect(submit).toBeDisabled();
  passed("a newly selected photo can be removed after saving");
  await p.reload();
  await expect(p.locator("#title")).toHaveValue(title);
  await expect(submit).toBeEnabled();
  passed("refresh restores the same saved draft and attached photos");
  await p.locator("#title").fill(`${title} edited`);
  await expect(submit).toBeDisabled();
  await save.click();
  await expect(submit).toBeEnabled();
  await p.reload();
  await expect(p.locator("#title")).toHaveValue(`${title} edited`);
  const drafts = await owner.client
    .from("listings")
    .select("id")
    .eq("seller_id", owner.user.id);
  assert.equal(drafts.data.length, 1);
  await screenshot(p, "draft-desktop.jpg");
  passed("draft edits survive refresh and must save before submission");
  await p
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Sell", exact: true })
    .click();
  await expect(p.locator("#title")).toHaveValue("");
  await p.goto(`${base}/sell?edit=${id}`);
  await expect(p.locator("#title")).toHaveValue(`${title} edited`);
  passed("Sell starts a fresh form without losing the saved draft");
  const b = await pageFor(other, { width: 390, height: 844 });
  await b.goto(`${base}/item/${id}`);
  await expect(
    b.locator("main").getByRole("heading", { name: "Listing unavailable." }),
  ).toBeVisible();
  await b.goto(`${base}/sell?edit=${id}`);
  await expect(b.locator("main").getByRole("alert")).toContainText(
    "Only your private drafts",
  );
  await expect(b.locator("#title")).toBeDisabled();
  for (const [name, args] of [
    [
      "save_listing_draft",
      {
        p_id: id,
        p_details: {
          title: "Other student's edit",
          description: "Not permitted",
          price: 1,
          category_id: await p.getByLabel("Category").inputValue(),
          condition: "Good",
          location: "Boston",
        },
      },
    ],
    ["delete_listing", { p_id: id }],
    ["submit_listing", { p_id: id }],
  ]) {
    assert.ok(
      (await other.client.rpc(name, args)).error,
      `${name} enforces ownership`,
    );
  }
  const forbidden = await other.client.storage
    .from("listing-photos")
    .upload(`${owner.user.id}/${id}/${randomUUID()}.webp`, photo, {
      contentType: "image/webp",
    });
  assert.ok(forbidden.error);
  passed(
    "a second student cannot read, edit, submit, delete or upload to a private draft",
  );
  let loseSubmitResponse = true;
  await p.route(`${api}/rest/v1/rpc/submit_listing`, async (route) => {
    if (!loseSubmitResponse) return route.continue();
    loseSubmitResponse = false;
    const response = await route.fetch();
    assert.ok(response.ok());
    return route.fulfill({
      status: 503,
      json: { message: "Injected lost submit response" },
    });
  });
  await submit.click();
  await expect(main.getByRole("alert")).toContainText(
    "Could not confirm submission",
  );
  await submit.click();
  await expect(main.getByRole("status")).toContainText(
    "Submitted for moderation",
  );
  const approved = await other.client
    .from("listings")
    .select("status")
    .eq("id", id)
    .single();
  assert.equal(approved.data.status, "approved");
  passed(
    "submission retry is idempotent; approval comes from the existing backend trigger",
  );
  await main.getByRole("link", { name: "View submission →" }).click();
  await expect(
    main.getByRole("heading", { name: `${title} edited`, exact: true }),
  ).toBeVisible();
  passed("returning to My listings shows the new submission");
  await b.goto(`${base}/browse?q=${encodeURIComponent(title)}`);
  await b
    .locator("main")
    .getByRole("heading", { name: `${title} edited`, exact: true })
    .click();
  await expect(
    b
      .locator("main")
      .getByRole("heading", { name: `${title} edited`, exact: true }),
  ).toBeVisible();
  await expect(
    b.locator("main").getByRole("button", { name: "Delete listing" }),
  ).toHaveCount(0);
  await b.locator("main").getByRole("button", { name: "View photo 2" }).click();
  await expect
    .poll(() =>
      b
        .locator("main img")
        .first()
        .evaluate((img) => img.complete && img.naturalWidth > 0),
    )
    .toBe(true);
  assert.equal(
    await b.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
  );
  passed(
    "approved listing and both signed photos load for another student on mobile",
  );
  await screenshot(b, "item-mobile.jpg");
  let failSigning = true;
  await b.route(`${api}/storage/v1/object/sign/listing-photos`, (route) => {
    if (!failSigning) return route.continue();
    failSigning = false;
    return route.fulfill({
      status: 503,
      json: { message: "Injected signing failure" },
    });
  });
  await b.reload();
  await b.locator("main").getByRole("button", { name: "Retry photos" }).click();
  await expect(
    b.locator("main").getByRole("button", { name: "View photo 2" }),
  ).toBeVisible();
  passed("photo signing errors keep the listing visible and can retry");
  await p.route(`${api}/rest/v1/listings?**`, async (route) => {
    const response = await route.fetch();
    const record = await response.json();
    // UI fixture only: actual blocked-state permissions are covered by pgTAP.
    const blocked = Array.isArray(record)
      ? record.map((row) => ({ ...row, status: "blocked" }))
      : { ...record, status: "blocked" };
    return route.fulfill({ response, json: blocked });
  });
  await p.goto(`${base}/item/${id}`);
  await expect(
    main.getByText("Status: blocked", { exact: false }),
  ).toBeVisible();
  await expect(
    main.getByRole("button", { name: "Delete listing" }),
  ).toHaveCount(0);
  await expect(
    main.getByRole("link", { name: "Edit draft / submit" }),
  ).toHaveCount(0);
  await p.unroute(`${api}/rest/v1/listings?**`);
  passed(
    "blocked-state UI explains the restriction without offering edit or delete",
  );
  await p.goto(`${base}/sell?edit=${id}`);
  await expect(main.getByRole("alert")).toContainText(
    "Only your private drafts",
  );
  await expect(p.locator("#title")).toBeDisabled();
  passed("approved content cannot be reopened for draft editing");
  assert.ok(
    (await owner.client.rpc("save_listing_draft", { p_id: id, p_details: {} }))
      .error,
  );
  const beforeDelete = await owner.client.storage
    .from("listing-photos")
    .createSignedUrl(attached.data[0].photo_url, 60);
  await owner.client.storage
    .from("listing-photos")
    .remove([attached.data[0].photo_url]);
  assert.equal((await fetch(beforeDelete.data.signedUrl)).status, 200);
  assert.ok(
    (
      await owner.client.storage
        .from("listing-photos")
        .upload(attached.data[0].photo_url, photo, {
          contentType: "image/webp",
          upsert: true,
        })
    ).error,
  );
  passed(
    "submitted photos cannot be deleted or replaced through student storage access",
  );
  await p.goto(`${base}/item/${id}`);
  await main
    .getByRole("button", { name: "Delete listing", exact: true })
    .click();
  await main.getByRole("button", { name: "Keep listing" }).click();
  await expect(
    main.getByRole("button", { name: "Yes, delete", exact: true }),
  ).toHaveCount(0);
  passed("canceling deletion keeps the listing");
  let failDelete = true;
  await p.route(`${api}/rest/v1/rpc/delete_listing`, async (route) => {
    if (!failDelete) return route.continue();
    failDelete = false;
    return route.fulfill({
      status: 503,
      json: { message: "Injected deletion failure" },
    });
  });
  await main
    .getByRole("button", { name: "Delete listing", exact: true })
    .click();
  await main.getByRole("button", { name: "Yes, delete", exact: true }).click();
  await expect(
    main.getByRole("alert").filter({ hasText: "Could not confirm deletion" }),
  ).toBeVisible();
  assert.ok(
    (await owner.client.from("listings").select("id").eq("id", id).single())
      .data,
  );
  await main.getByRole("button", { name: "Yes, delete", exact: true }).click();
  await expect(main.getByRole("status")).toContainText("Listing deleted");
  await main.getByRole("link", { name: "My listings", exact: true }).click();
  await expect(main.getByText("Your next listing starts here.")).toBeVisible();
  await b.reload();
  await expect(
    b.locator("main").getByRole("heading", { name: "Listing unavailable." }),
  ).toBeVisible();
  passed(
    "failed deletion can retry; confirmed deletion makes the item unavailable to both students",
  );
  console.log(`${checks} listing walkthrough checks passed`);
} finally {
  if (id) await owner.client.rpc("delete_listing", { p_id: id });
  await Promise.all(contexts.map((context) => context.close()));
  await browser.close();
}
