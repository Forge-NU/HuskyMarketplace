import test from "node:test";
import assert from "node:assert/strict";
import {
  afterAuthPath,
  friendlyAuthError,
  isNortheasternEmail,
  passwordError,
} from "../lib/auth.ts";

test("only Northeastern emails pass the frontend check", () => {
  assert.equal(isNortheasternEmail(" Student@Northeastern.edu "), true);
  assert.equal(isNortheasternEmail("student@gmail.com"), false);
  assert.equal(isNortheasternEmail("student@northeastern.edu.evil.com"), false);
});

test("passwordError enforces length, letters and numbers, and a match", () => {
  assert.match(passwordError("abc123", "abc123"), /at least 8/);
  assert.match(passwordError("abcdefgh", "abcdefgh"), /letter and one number/);
  assert.match(passwordError("12345678", "12345678"), /letter and one number/);
  assert.match(passwordError("husky2026", "husky2027"), /don't match/);
  assert.match(passwordError("a1" + "x".repeat(71), "a1" + "x".repeat(71)), /72/);
  assert.equal(passwordError("husky2026", "husky2026"), "");
});

test("passwordError counts bytes, not characters, against the bcrypt limit", () => {
  const emoji = "a1" + "🐺".repeat(18); // 2 + 72 bytes
  assert.match(passwordError(emoji, emoji), /72/);
});

test("friendlyAuthError maps Supabase codes to readable messages", () => {
  assert.equal(
    friendlyAuthError({ code: "invalid_credentials", message: "Invalid login credentials" }),
    "Wrong email or password.",
  );
  assert.match(friendlyAuthError({ code: "otp_expired" }), /expired/);
  assert.match(friendlyAuthError({ code: "over_email_send_rate_limit" }), /Wait a minute/);
  assert.equal(
    friendlyAuthError({ message: "Database error saving new user" }),
    "Use your @northeastern.edu email address.",
  );
  assert.equal(friendlyAuthError({ message: "Network down" }), "Network down");
  assert.match(friendlyAuthError(null), /Something went wrong/);
});

test("afterAuthPath sends incomplete profiles through setup", () => {
  assert.equal(afterAuthPath("/browse", true), "/browse");
  assert.equal(afterAuthPath("/browse", false), "/account/setup?next=%2Fbrowse");
  assert.equal(afterAuthPath("/sell", false), "/account/setup?next=%2F");
});
