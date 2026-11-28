import test from "node:test";
import assert from "node:assert/strict";
import { confirmEmail } from "../lib/auth/confirm-email.ts";

const input = {
  email: "fixture@northeastern.edu",
  code: "12345678",
  recovery: false,
  password: "fixture-password",
};

test("a failed final device check does not require consuming the email code again", async () => {
  let progress = { verified: false, passwordSaved: false };
  const calls = [];
  const auth = {
    verifyOtp: async (value) => {
      calls.push(value);
      return { error: null };
    },
  };
  const saveProgress = (value) => {
    progress = value;
  };
  await assert.rejects(async () => {
    await confirmEmail(auth, input, progress, saveProgress);
    throw new Error("Final device check unavailable");
  }, /Final device check/);
  await confirmEmail(auth, input, progress, saveProgress);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    email: input.email,
    token: input.code,
    type: "email",
  });
  assert.equal(progress.verified, true);
});

test("password reset retries only the unfinished step", async () => {
  let progress = { verified: false, passwordSaved: false };
  let verifications = 0;
  let updates = 0;
  const auth = {
    verifyOtp: async (value) => {
      assert.equal(value.type, "recovery");
      verifications += 1;
      return { error: null };
    },
    updateUser: async (value) => {
      assert.deepEqual(value, { password: input.password });
      updates += 1;
      return { error: updates === 1 ? new Error("Temporary failure") : null };
    },
  };
  const saveProgress = (value) => {
    progress = value;
  };
  const recovery = { ...input, recovery: true };
  await assert.rejects(
    () => confirmEmail(auth, recovery, progress, saveProgress),
    /Temporary failure/,
  );
  assert.deepEqual(progress, { verified: true, passwordSaved: false });
  await confirmEmail(auth, recovery, progress, saveProgress);
  assert.deepEqual(progress, { verified: true, passwordSaved: true });
  await confirmEmail(auth, recovery, progress, saveProgress);
  assert.equal(verifications, 1);
  assert.equal(updates, 2);
});

test("a rejected code never advances verification or changes a password", async () => {
  const failure = new Error("Incorrect code");
  const auth = {
    verifyOtp: async () => ({ error: failure }),
    updateUser: async () => {
      assert.fail("Password update must not run");
    },
  };
  await assert.rejects(
    () =>
      confirmEmail(
        auth,
        { ...input, recovery: true },
        { verified: false, passwordSaved: false },
        () => {
          assert.fail("Verification must not advance");
        },
      ),
    (error) => error === failure,
  );
});
