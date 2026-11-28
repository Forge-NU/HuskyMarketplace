import test from "node:test";
import assert from "node:assert/strict";
import {
  codeCooldown,
  cooldownRemaining,
  checkDeviceSession,
  hasRequestedCode,
  requestDeviceCode,
  DeviceSessionExpiredError,
} from "../lib/auth/device-code.ts";

test("device checks distinguish a code challenge from a temporary failure", async () => {
  const response = (status, body) => async (path, options) => {
    assert.equal(path, "/api/auth/device");
    assert.deepEqual(options, { method: "POST" });
    return new Response(JSON.stringify(body), { status });
  };
  assert.equal(
    await checkDeviceSession(response(200, { verified: true })),
    true,
  );
  assert.equal(
    await checkDeviceSession(response(403, { needsCode: true })),
    false,
  );
  await assert.rejects(
    () => checkDeviceSession(response(401, {})),
    DeviceSessionExpiredError,
  );
  await assert.rejects(
    () => checkDeviceSession(response(503, { error: "Please retry." })),
    /Please retry/,
  );
  await assert.rejects(() => checkDeviceSession(response(200, {})), /retry/);
  await assert.rejects(() => checkDeviceSession(response(200, null)), /retry/);
  await assert.rejects(
    () => checkDeviceSession(response(503, { needsCode: true })),
    /retry/,
  );
  await assert.rejects(
    () =>
      checkDeviceSession(
        async () => new Response("Unavailable", { status: 502 }),
      ),
    /retry/,
  );
});

test("retrying a failed device check can reuse the authenticated session", async () => {
  let attempts = 0;
  const request = async () => {
    attempts += 1;
    return new Response(
      JSON.stringify(
        attempts === 1
          ? { error: "Temporarily unavailable" }
          : { verified: true },
      ),
      { status: attempts === 1 ? 503 : 200 },
    );
  };
  await assert.rejects(
    () => checkDeviceSession(request),
    /Temporarily unavailable/,
  );
  assert.equal(await checkDeviceSession(request), true);
  assert.equal(attempts, 2);
});

test("resend catches up after the browser pauses background timers", () => {
  const deadline = 181_000;
  assert.equal(cooldownRemaining(deadline, 1000), 180);
  assert.equal(cooldownRemaining(deadline, 121_000), 60);
  assert.equal(cooldownRemaining(deadline, 601_000), 0);
  assert.equal(cooldownRemaining(61_000, 61_001), 0);
});

test("device email is sent only to the authenticated account without creating a user", async () => {
  let sent;
  const client = {
    auth: {
      getUser: async () => ({
        data: { user: { email: "fixture@northeastern.edu" } },
        error: null,
      }),
      signInWithOtp: async (args) => {
        sent = args;
        return { error: null };
      },
    },
  };
  assert.equal(await requestDeviceCode(client), "fixture@northeastern.edu");
  assert.deepEqual(sent, {
    email: "fixture@northeastern.edu",
    options: { shouldCreateUser: false },
  });
});
test("failed sends and expired sessions do not report that a code was sent", async () => {
  const error = { code: "over_email_send_rate_limit" };
  const client = {
    auth: {
      getUser: async () => ({
        data: { user: { email: "fixture@northeastern.edu" } },
        error: null,
      }),
      signInWithOtp: async () => ({ error }),
    },
  };
  await assert.rejects(
    () => requestDeviceCode(client),
    (e) => e === error,
  );
  client.auth.getUser = async () => ({ data: { user: null }, error: null });
  await assert.rejects(
    () => requestDeviceCode(client),
    DeviceSessionExpiredError,
  );
});
test("refreshing a code screen keeps the resend cooldown without treating it as verification", () => {
  assert.equal(codeCooldown("1000", 1000), 180);
  assert.equal(codeCooldown("1000", 31_000), 150);
  assert.equal(codeCooldown("1000", 61_000), 120);
  assert.equal(codeCooldown("1000", 180_001), 1);
  assert.equal(codeCooldown("1000", 181_000), 0);
  for (const value of [null, "bad", "999999999"])
    assert.equal(codeCooldown(value, 61_000), 0);
});
test("refreshing after the cooldown does not automatically invalidate the pending email code", () => {
  assert.equal(hasRequestedCode("1000", 241_000), true);
  assert.equal(codeCooldown("1000", 241_000), 0);
  for (const value of [null, "", "bad", "-10", "999999999"])
    assert.equal(hasRequestedCode(value, 121_000), false);
});
