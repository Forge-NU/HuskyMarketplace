import test from "node:test";
import assert from "node:assert/strict";
import { runCodeSteps } from "../lib/auth/code-steps.ts";

function steps(failFinishTimes = 0, withPassword = false) {
  const calls = [];
  let finishFailures = failFinishTimes;
  return {
    calls,
    steps: {
      verify: async () => calls.push("verify"),
      savePassword: withPassword
        ? async () => calls.push("savePassword")
        : undefined,
      finish: async () => {
        calls.push("finish");
        if (finishFailures-- > 0) throw new Error("device request failed");
      },
    },
  };
}

test("retrying after the device request fails does not reuse the consumed code", async () => {
  const { calls, steps: s } = steps(1);
  let progress = { verified: false, passwordSaved: false };
  const save = (p) => (progress = p);
  await assert.rejects(
    runCodeSteps(progress, s, save),
    /device request failed/,
  );
  assert.deepEqual(progress, { verified: true, passwordSaved: false });
  await runCodeSteps(progress, s, save);
  assert.deepEqual(calls, ["verify", "finish", "finish"]);
});

test("retrying a reset after the device request fails does not save the password twice", async () => {
  const { calls, steps: s } = steps(1, true);
  let progress = { verified: false, passwordSaved: false };
  const save = (p) => (progress = p);
  await assert.rejects(runCodeSteps(progress, s, save));
  assert.deepEqual(progress, { verified: true, passwordSaved: true });
  await runCodeSteps(progress, s, save);
  assert.deepEqual(calls, ["verify", "savePassword", "finish", "finish"]);
});

test("a rejected code leaves progress untouched so the user can try again", async () => {
  let progress = { verified: false, passwordSaved: false };
  await assert.rejects(
    runCodeSteps(
      progress,
      {
        verify: async () => {
          throw new Error("Token has expired or is invalid");
        },
        finish: async () => assert.fail("finish must not run"),
      },
      (p) => (progress = p),
    ),
  );
  assert.deepEqual(progress, { verified: false, passwordSaved: false });
});
