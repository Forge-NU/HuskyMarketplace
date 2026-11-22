import test from "node:test";
import assert from "node:assert/strict";
import { requestSignup } from "../lib/auth/signup.ts";

function fixture() {
  const calls = [];
  const response = {
    data: { user: { identities: [{ provider: "email" }] }, session: null },
    error: null,
  };
  const auth = {
    signUp: async (input) => {
      calls.push(["signup", input]);
      return response;
    },
    signOut: async (input) => {
      calls.push(["signout", input]);
      return { error: null };
    },
  };
  return { auth, calls, response };
}

test("a new or unconfirmed account can continue to email verification", async () => {
  const f = fixture();
  await requestSignup(
    f.auth,
    "student@northeastern.edu",
    "local fixture password",
  );
  assert.deepEqual(f.calls, [
    [
      "signup",
      { email: "student@northeastern.edu", password: "local fixture password" },
    ],
  ]);
});

test("an obfuscated existing account does not lead to a code that was never sent", async () => {
  const f = fixture();
  f.response.data.user.identities = [];
  await assert.rejects(
    requestSignup(f.auth, "student@northeastern.edu", "local fixture password"),
    /log in or reset your password/,
  );
  assert.equal(f.calls.length, 1);
});

test("send failures and missing signup results remain retryable errors", async () => {
  const f = fixture();
  const error = { code: "over_email_send_rate_limit" };
  f.response.error = error;
  await assert.rejects(
    requestSignup(f.auth, "student@northeastern.edu", "local fixture password"),
    (value) => value === error,
  );
  f.response.error = null;
  f.response.data.user = null;
  await assert.rejects(
    requestSignup(f.auth, "student@northeastern.edu", "local fixture password"),
    /couldn’t request/,
  );
});
test("explicit existing-account errors offer the same login and recovery options", async () => {
  for (const code of ["user_already_exists", "email_exists"]) {
    const f = fixture();
    f.response.error = { code, message: "User already registered" };
    await assert.rejects(
      requestSignup(
        f.auth,
        "student@northeastern.edu",
        "local fixture password",
      ),
      /log in or reset your password/,
    );
  }
});

test("signup signs out an unexpected auto-confirmed session instead of allowing access", async () => {
  const f = fixture();
  f.response.data.session = { access_token: "local fixture" };
  await assert.rejects(
    requestSignup(f.auth, "student@northeastern.edu", "local fixture password"),
    /Email confirmation isn’t configured/,
  );
  assert.deepEqual(f.calls.at(-1), ["signout", { scope: "local" }]);
});
