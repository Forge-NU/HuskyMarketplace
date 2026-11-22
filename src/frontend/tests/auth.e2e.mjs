import { chromium } from "playwright";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const app = new URL(process.env.AUTH_TEST_BASE_URL || "http://127.0.0.1:3004");
assert(
  ["localhost", "127.0.0.1", "[::1]"].includes(app.hostname) &&
    app.protocol === "http:" &&
    app.pathname === "/" &&
    !app.search &&
    !app.hash &&
    !app.username &&
    !app.password,
  "AUTH_TEST_BASE_URL must be a local HTTP origin",
);
const base = app.origin;
function localService(value) {
  const url = new URL(value);
  assert(
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) &&
      url.protocol === "http:" &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash &&
      !url.username &&
      !url.password,
    "Auth test services must use local HTTP origins",
  );
  return url.origin;
}
const mailbox = localService(
  process.env.AUTH_TEST_MAILBOX_URL || "http://127.0.0.1:54324",
);
const api = localService(
  process.env.AUTH_TEST_API_URL ||
    process.env.SUPABASE_URL ||
    "http://127.0.0.1:54321",
);
const email = `auth_flow_${Date.now()}@northeastern.edu`;
const password = `Local-only-${randomUUID()}`;
const newPassword = `Local-reset-${randomUUID()}`;
const results = [];
function pass(name) {
  results.push(name);
  console.log("PASS " + name);
}
async function codeAfter(before, address = email) {
  for (let i = 0; i < 40; i++) {
    const data = await fetch(mailbox + "/api/v1/messages").then((r) =>
      r.json(),
    );
    const m = data.messages.find(
      (m) => m.To.some((t) => t.Address === address) && !before.has(m.ID),
    );
    if (m) {
      const body = await fetch(`${mailbox}/api/v1/message/${m.ID}`).then((r) =>
        r.json(),
      );
      const code = (body.Text + " " + body.HTML).match(/\b\d{8}\b/);
      if (code) return code[0];
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("No eight-digit code in isolated test mailbox");
}
async function messageIds() {
  const d = await fetch(mailbox + "/api/v1/messages").then((r) => r.json());
  return new Set(d.messages.map((m) => m.ID));
}
async function signin(page, pw, remember = true) {
  await page.goto(base + "/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(pw);
  await page
    .getByLabel("Keep me signed in on this device")
    .setChecked(remember);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
}
async function signup(page, pw = password) {
  await page.goto(base + "/signup");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(pw);
  await page.locator("#confirmation").fill(pw);
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
}
async function signout(page) {
  await page.goto(base + "/account");
  await page
    .getByRole("button", { name: "Sign out", exact: true })
    .first()
    .click();
  await page.waitForURL(base + "/login");
}
async function choosePhoto(page, color) {
  const png = await page.evaluate((fill) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 80;
    const context = canvas.getContext("2d");
    context.fillStyle = fill;
    context.fillRect(0, 0, 80, 80);
    return canvas.toDataURL("image/png").split(",")[1];
  }, color);
  await page.locator('input[type="file"]').setInputFiles({
    name: "local-avatar.png",
    mimeType: "image/png",
    buffer: Buffer.from(png, "base64"),
  });
  await page
    .getByText("Photo ready. Save your profile to upload it.", { exact: true })
    .waitFor();
}
async function waitForAvatar(page) {
  await page.waitForFunction(() => {
    const image = document.querySelector('a[aria-label="My account"] img');
    return image?.complete && image.naturalWidth > 0;
  });
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  const external = [];
  async function localContext(options = {}) {
    const c = await browser.newContext(options);
    await c.route("**/*", async (route) => {
      const origin = new URL(route.request().url()).origin;
      if (![app.origin, api, mailbox].includes(origin)) {
        if (route.request().resourceType() !== "image") external.push(origin);
        await route.abort();
        return;
      }
      await route.continue();
    });
    return c;
  }
  const context = await localContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    const publicKey =
      process.env.AUTH_TEST_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    assert(
      publicKey,
      "Pass the local public key as AUTH_TEST_ANON_KEY or SUPABASE_ANON_KEY",
    );
    const localAuth = createClient(api, publicKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const outside = await localAuth.auth.signUp({
      email: `outside_${Date.now()}@example.invalid`,
      password,
    });
    assert(outside.error);
    assert.equal(outside.data.session, null);
    pass("Supabase rejects outside-school signup without relying on the form");
    let before = await messageIds();
    await page.goto(base + "/signup");
    const configured = await context.request.post(base + "/api/auth/device", {
      headers: { origin: app.origin },
    });
    assert.equal(
      configured.status(),
      401,
      "Run the test app with DEVICE_VERIFICATION_ENABLED=true",
    );
    assert.equal(
      external.length,
      0,
      "Rebuild the test app with the local Supabase URL/key",
    );
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.locator("#confirmation").fill(password);
    await page.getByRole("checkbox").check();
    await page.route(
      "**/auth/v1/signup",
      (route) =>
        route.fulfill({
          status: 429,
          contentType: "application/json",
          body: JSON.stringify({
            code: "over_email_send_rate_limit",
            msg: "Email sending limit reached",
          }),
        }),
      { times: 1 },
    );
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await page.getByRole("main").getByRole("alert").waitFor();
    assert.equal(new URL(page.url()).pathname, "/signup");
    assert.deepEqual(await messageIds(), before);
    pass("Failed signup send stays retryable and does not promise an email");
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await page.waitForURL(base + "/verify");
    pass("Signup requests email confirmation");
    await page.getByRole("button", { name: /^Resend in / }).waitFor();
    assert.equal(
      await page.getByRole("button", { name: /^Resend in / }).isDisabled(),
      true,
    );
    const signupMessages = await messageIds();
    await page.reload();
    await page.getByRole("button", { name: /^Resend in / }).waitFor();
    assert.deepEqual(await messageIds(), signupMessages);
    pass(
      "Signup resend cooldown survives refresh without sending another email",
    );
    await new Promise((r) => setTimeout(r, 1200));
    before = await messageIds();
    await signup(page);
    await page.waitForURL(base + "/verify");
    await codeAfter(before);
    pass("Existing unconfirmed signup requests a new verification code");
    await page.goto(base + "/");
    await page.waitForURL(base + "/login");
    pass("Unconfirmed signup cannot open Home");
    await page.goto(base + "/verify");
    const signupCode = await codeAfter(before);
    await page
      .locator("#code")
      .fill(signupCode === "00000000" ? "11111111" : "00000000");
    await page
      .getByRole("button", { name: "Confirm email", exact: true })
      .click();
    await page.getByRole("main").getByRole("alert").waitFor();
    assert.equal(new URL(page.url()).pathname, "/verify");
    pass("Wrong signup code leaves the account unverified");
    await page.locator("#code").fill(signupCode);
    await page
      .getByRole("button", { name: "Confirm email", exact: true })
      .click();
    await page.waitForURL(base + "/account/setup");
    pass("Signup code verifies account and opens setup");
    const reused = await localAuth.auth.verifyOtp({
      email,
      token: signupCode,
      type: "email",
    });
    assert(reused.error);
    pass("An already consumed signup code cannot create another session");
    const sessionCookies = (await context.cookies()).filter((c) =>
      c.name.startsWith("sb-"),
    );
    assert(sessionCookies.length > 0);
    assert(sessionCookies.every((c) => c.expires === -1));
    pass(
      "Without Keep me signed in, Auth cookies last only for the browser session",
    );
    await page.locator("#display-name").fill("Local Test Student");
    await page.locator("#username").fill(`test_${Date.now()}`);
    await page.locator("#campus").selectOption("Boston");
    await page.locator("#schoolYear").selectOption("Second year");
    await choosePhoto(page, "#c8102e");
    pass("Setup compresses a selected PNG profile photo");
    await page.route(
      "**/storage/v1/object/profile-photos/**",
      (route) =>
        route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            statusCode: "503",
            error: "Unavailable",
            message: "Temporary upload failure",
          }),
        }),
      { times: 1 },
    );
    await page
      .getByRole("button", { name: "Save and explore", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: "Profile details saved." })
      .waitFor();
    assert.equal(new URL(page.url()).pathname, "/account/setup");
    pass("A failed photo upload preserves profile fields and supports retry");
    await page
      .getByRole("button", { name: "Save and explore", exact: true })
      .click();
    await page.waitForURL(base + "/");
    pass("Name, username, campus and year save; setup opens Home");
    await waitForAvatar(page);
    pass("Saved setup photo appears in the header");
    await page.goto(base + "/account");
    await page.locator("#display-name").waitFor();
    assert.match(await page.locator("body").innerText(), /Email verified/);
    assert.equal(
      await page.locator("#display-name").inputValue(),
      "Local Test Student",
    );
    pass("Account reload preserves profile and verified email");
    const accountPhoto = page
      .getByRole("button", { name: "Choose a profile photo", exact: true })
      .locator("img");
    await accountPhoto.waitFor();
    const firstPhoto = await accountPhoto.getAttribute("src");
    assert.equal(new URL(firstPhoto).origin, api);
    const firstBytes = await (await context.request.get(firstPhoto)).body();
    pass("Profile photo persists after account reload");
    await choosePhoto(page, "#3366aa");
    await page
      .getByRole("button", { name: "Save profile", exact: true })
      .click();
    await page.getByText("Profile saved.", { exact: true }).waitFor();
    await page.reload();
    await accountPhoto.waitFor();
    const replacement = await accountPhoto.getAttribute("src");
    assert.equal(new URL(replacement).origin, api);
    const replacementBytes = await (
      await context.request.get(replacement)
    ).body();
    assert.notDeepEqual(firstBytes, replacementBytes);
    pass("Replacing a photo persists the new compressed image");
    await page
      .getByRole("button", { name: "Remove photo", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Save profile", exact: true })
      .click();
    await page.getByText("Profile saved.", { exact: true }).waitFor();
    await page.reload();
    await page.locator("#display-name").waitFor();
    assert.equal(await accountPhoto.count(), 0);
    pass("Removing a photo restores the default avatar after reload");
    await signout(page);
    before = await messageIds();
    await signup(page, `Local-other-${randomUUID()}`);
    await page
      .getByRole("alert")
      .filter({ hasText: "log in or reset your password" })
      .waitFor();
    assert.equal(new URL(page.url()).pathname, "/signup");
    assert.deepEqual(await messageIds(), before);
    pass(
      "Existing confirmed signup stays on signup without promising or sending a code",
    );
    before = await messageIds();
    await signin(page, password, true);
    await page.waitForURL(base + "/verify-device");
    pass("Password login on unremembered browser requires a device code");
    const code = await codeAfter(before);
    await page
      .locator("#code")
      .fill(code === "00000000" ? "11111111" : "00000000");
    await page
      .getByRole("button", { name: "Verify this device", exact: true })
      .click();
    await page.getByRole("main").getByRole("alert").waitFor();
    assert.equal(new URL(page.url()).pathname, "/verify-device");
    pass("Wrong device code is rejected");
    const sent = await messageIds();
    await page.reload();
    await page
      .getByRole("button", { name: "Verify this device", exact: true })
      .waitFor();
    await page.waitForFunction(
      () => !document.querySelector("fieldset").disabled,
    );
    assert.deepEqual(await messageIds(), sent);
    pass("Refreshing a pending challenge does not request another code");
    await page.goto(base + "/");
    await page.waitForURL(base + "/verify-device");
    await page.waitForFunction(
      () => !document.querySelector("fieldset").disabled,
    );
    pass("Unverified device cannot open Home");
    let verificationRequests = 0;
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/auth/v1/verify")
        verificationRequests++;
    });
    await page.route(
      "**/api/auth/device",
      (route) =>
        route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: "Temporary device-check outage" }),
        }),
      { times: 1 },
    );
    await page.locator("#code").fill(await codeAfter(before));
    await page
      .getByRole("button", { name: "Verify this device", exact: true })
      .click();
    await page.getByRole("main").getByRole("alert").waitFor();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.waitForURL(base + "/");
    assert.equal(verificationRequests, 1);
    pass(
      "Accepted code survives a failed final device check without being reused",
    );
    pass("Email OTP authorizes the new device");
    let cookies = await context.cookies();
    let device = cookies.find((c) => c.name === "husky_device");
    assert(device && device.httpOnly && device.expires > Date.now() / 1000);
    pass("Remembered-device credential is HttpOnly and persistent");
    await signout(page);
    before = await messageIds();
    await signin(page, password, true);
    await page.waitForURL(base + "/");
    await new Promise((r) => setTimeout(r, 500));
    assert.deepEqual(await messageIds(), before);
    pass("Remembered browser logs back in without another email");
    const reopened = await localContext({
      storageState: {
        cookies: (await context.cookies()).filter((c) =>
          ["husky_device", "husky_keep_signed_in"].includes(c.name),
        ),
        origins: [],
      },
    });
    const reopenedPage = await reopened.newPage();
    before = await messageIds();
    await signin(reopenedPage, password, true);
    await reopenedPage.waitForURL(base + "/");
    assert.deepEqual(await messageIds(), before);
    await reopened.close();
    pass("Remembered credential works after reopening without an Auth session");
    const fresh = await localContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const p2 = await fresh.newPage();
    before = await messageIds();
    await signin(p2, password, true);
    await p2.waitForURL(base + "/verify-device");
    await codeAfter(before);
    pass("Clean browser requires and sends its own email challenge");
    assert(
      await p2.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    );
    pass("Mobile device verification fits without horizontal scrolling");
    await fresh.close();
    const tampered = await localContext({
      storageState: {
        cookies: [{ ...device, value: "f".repeat(64) }],
        origins: [],
      },
    });
    const tamperedPage = await tampered.newPage();
    await new Promise((r) => setTimeout(r, 1200));
    before = await messageIds();
    await signin(tamperedPage, password, true);
    await tamperedPage.waitForURL(base + "/verify-device");
    await codeAfter(before);
    pass("An invented remembered-device cookie cannot skip email verification");
    await tampered.close();
    await signout(page);
    await new Promise((r) => setTimeout(r, 1200));
    before = await messageIds();
    await page.goto(base + "/forgot-password");
    await page.locator("#email").fill(email);
    await page
      .getByRole("button", { name: "Send reset code", exact: true })
      .click();
    await page.waitForURL(base + "/reset-password");
    await page.getByRole("button", { name: /^Resend in / }).waitFor();
    assert.equal(
      await page.getByRole("button", { name: /^Resend in / }).isDisabled(),
      true,
    );
    const recoveryMessages = await messageIds();
    await page.reload();
    await page.getByRole("button", { name: /^Resend in / }).waitFor();
    assert.deepEqual(await messageIds(), recoveryMessages);
    pass(
      "Password-reset resend cooldown survives refresh without another email",
    );
    await page.locator("#code").fill(await codeAfter(before));
    await page.locator("#password").fill(newPassword);
    await page.locator("#confirmation").fill(newPassword);
    await page
      .getByRole("button", { name: "Save new password", exact: true })
      .click();
    await page.waitForURL(base + "/");
    pass("Password reset email code updates password and opens Home");
    await signout(page);
    await signin(page, password);
    await page.getByRole("main").getByRole("alert").waitFor();
    assert.equal(new URL(page.url()).pathname, "/login");
    pass("Old password is rejected after reset");
    before = await messageIds();
    await signin(page, newPassword);
    await page.waitForURL(base + "/");
    assert.deepEqual(await messageIds(), before);
    pass("New password works with remembered browser");
    await signout(page);
    before = await messageIds();
    await signin(page, newPassword, false);
    await page.waitForURL(base + "/");
    assert.deepEqual(await messageIds(), before);
    assert.equal(
      (await context.cookies()).some((c) => c.name === "husky_device"),
      false,
    );
    pass("Temporary sign-in stops remembering a previously trusted browser");
    await signout(page);
    before = await messageIds();
    await signin(page, newPassword, false);
    await page.waitForURL(base + "/verify-device");
    await codeAfter(before);
    pass("Signing in after opting out requires email verification again");
    const legacyEmail = `legacy_${Date.now()}@northeastern.edu`;
    const legacyHandle = `legacy_${Date.now()}`;
    before = await messageIds();
    const legacy = await localAuth.auth.signInWithOtp({
      email: legacyEmail,
      options: {
        data: { username: legacyHandle, display_name: "Local Legacy Student" },
      },
    });
    assert.equal(legacy.error, null);
    const confirmedLegacy = await localAuth.auth.verifyOtp({
      email: legacyEmail,
      token: await codeAfter(before, legacyEmail),
      type: "email",
    });
    assert.equal(confirmedLegacy.error, null);
    const legacyId = confirmedLegacy.data.user.id;
    await localAuth.auth.signOut({ scope: "local" });
    const legacyContext = await localContext();
    const legacyPage = await legacyContext.newPage();
    before = await messageIds();
    await legacyPage.goto(base + "/forgot-password");
    await legacyPage.locator("#email").fill(legacyEmail);
    await legacyPage
      .getByRole("button", { name: "Send reset code", exact: true })
      .click();
    await legacyPage.waitForURL(base + "/reset-password");
    await legacyPage
      .locator("#code")
      .fill(await codeAfter(before, legacyEmail));
    await legacyPage.locator("#password").fill(newPassword);
    await legacyPage.locator("#confirmation").fill(newPassword);
    await legacyPage
      .getByRole("button", { name: "Save new password", exact: true })
      .click();
    await legacyPage.waitForURL(base + "/");
    await legacyPage.goto(base + "/account");
    assert.equal(
      await legacyPage.locator("#username").inputValue(),
      legacyHandle,
    );
    const legacyLogin = await localAuth.auth.signInWithPassword({
      email: legacyEmail,
      password: newPassword,
    });
    assert.equal(legacyLogin.error, null);
    assert.equal(legacyLogin.data.user.id, legacyId);
    pass(
      "Passwordless account sets its first password without losing its profile or account ID",
    );
    await legacyContext.close();
    assert.deepEqual(errors, []);
    assert.deepEqual(external, [], "The test must not contact hosted services");
    console.log(`${results.length} local auth checks passed.`);
  } catch (error) {
    console.error("Auth check failed at", new URL(page.url()).pathname);
    console.error(
      await page.getByRole("main").getByRole("alert").allTextContents(),
    );
    throw error;
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
