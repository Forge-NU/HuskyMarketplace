import test from "node:test";
import assert from "node:assert/strict";
import {
  sessionCookieOptions,
  browserCookies,
} from "../lib/supabase/session.ts";
test("unremembered sessions remove expiry while retaining security options", () => {
  const options = {
    maxAge: 999,
    expires: new Date(),
    secure: true,
    sameSite: "lax",
    path: "/",
  };
  assert.deepEqual(sessionCookieOptions(options, false), {
    secure: true,
    sameSite: "lax",
    path: "/",
  });
  assert.equal(options.maxAge, 999);
});
test("remembered sessions retain expiry; sign out retains cookie deletion", () => {
  const options = { maxAge: 999, secure: true };
  assert.deepEqual(sessionCookieOptions(options, true), options);
  assert.equal(sessionCookieOptions({ maxAge: 0, path: "/" }, false).maxAge, 0);
});

test("malformed unrelated cookies do not break login", () => {
  assert.deepEqual(browserCookies("bad=%XX; session=hello%3Dworld; "), [
    { name: "session", value: "hello=world" },
  ]);
  assert.deepEqual(browserCookies(""), []);
  assert.equal(sessionCookieOptions({ maxAge: -1 }, false).maxAge, -1);
});
