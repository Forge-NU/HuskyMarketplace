import test from "node:test";
import assert from "node:assert/strict";
import {
  validatePassword,
  isNortheasternEmail,
  authMessage,
} from "../lib/auth.ts";
test("registration rejects malformed and outside-school addresses", () => {
  for (const email of [
    "@northeastern.edu",
    "a@@northeastern.edu",
    "a b@northeastern.edu",
    "a@other.edu",
  ])
    assert.equal(isNortheasternEmail(email), false);
  assert.equal(isNortheasternEmail(" Student@Northeastern.edu "), true);
});
test("password validation accepts passphrases and rejects mismatch and excess bytes", () => {
  assert.doesNotThrow(() =>
    validatePassword("long unique passphrase", "long unique passphrase"),
  );
  assert.throws(() => validatePassword("short", "short"));
  assert.throws(() => validatePassword("password one", "password two"));
  assert.throws(() => validatePassword("é".repeat(37), "é".repeat(37)));
});
test("expired codes and rate limits have actionable messages", () => {
  assert.match(authMessage({ code: "otp_expired" }), /new code/);
  assert.match(authMessage({ code: "over_email_send_rate_limit" }), /wait/);
});

import { recentEmailProof } from "../lib/auth/device.ts";
test("remembered credentials rotate only after recent email proof", () => {
  assert.equal(
    recentEmailProof({ amr: [{ method: "otp", timestamp: 1000 }] }, 1001),
    true,
  );
  assert.equal(
    recentEmailProof({ amr: [{ method: "password", timestamp: 1000 }] }, 1001),
    false,
  );
  assert.equal(
    recentEmailProof({ amr: [{ method: "otp", timestamp: 1 }] }, 1001),
    false,
  );
  assert.equal(
    recentEmailProof({ amr: [{ method: "otp", timestamp: 2000 }] }, 1001),
    false,
  );
  assert.equal(
    recentEmailProof({ amr: [{ method: "otp", timestamp: "1000" }] }, 1001),
    false,
  );
  assert.equal(recentEmailProof({ amr: "otp" }, 1001), false);
});
