import test from "node:test";
import assert from "node:assert/strict";
import {
  profilePhotoPath,
  loadProfilePhoto,
  saveProfilePhoto,
  removeProfilePhoto,
} from "../lib/profile/photo.ts";
const owner = "a1111111-1111-4111-8111-111111111111";
const other = "b2222222-2222-4222-8222-222222222222";
function fixture() {
  const calls = [];
  const state = {
    userId: owner,
    uploadError: null,
    signedError: null,
    removeError: null,
  };
  const client = {
    auth: {
      getUser: async () => ({
        data: { user: { id: state.userId } },
        error: null,
      }),
    },
    storage: {
      from(bucket) {
        assert.equal(bucket, "profile-photos");
        return {
          upload: async (...args) => {
            calls.push(["upload", ...args]);
            return { error: state.uploadError };
          },
          createSignedUrl: async (...args) => {
            calls.push(["sign", ...args]);
            return {
              data: { signedUrl: "https://example.test/avatar?token=fixture" },
              error: state.signedError,
            };
          },
          remove: async (...args) => {
            calls.push(["remove", ...args]);
            return { error: state.removeError };
          },
        };
      },
    },
  };
  return { client, calls, state };
}
const photo = () => new File(["fixture"], "photo.webp", { type: "image/webp" });
test("photo paths use account UUIDs and cannot escape the owner folder", () => {
  assert.equal(profilePhotoPath(owner), `${owner}/avatar.webp`);
  for (const id of ["../other", "", "owner/avatar.webp"])
    assert.throws(() => profilePhotoPath(id));
});
test("photo saves use an authenticated upsert with no public URL or metadata", async () => {
  const f = fixture();
  assert.match(
    await saveProfilePhoto(f.client, owner, photo()),
    /token=fixture/,
  );
  const upload = f.calls.find((c) => c[0] === "upload");
  assert.equal(upload[1], `${owner}/avatar.webp`);
  assert.deepEqual(upload[3], {
    contentType: "image/webp",
    cacheControl: "0",
    upsert: true,
  });
  assert.deepEqual(f.calls.find((c) => c[0] === "sign").slice(1), [
    `${owner}/avatar.webp`,
    600,
  ]);
});
test("changed accounts cannot upload or remove another account's photo", async () => {
  const f = fixture();
  f.state.userId = other;
  await assert.rejects(
    () => saveProfilePhoto(f.client, owner, photo()),
    /session changed/,
  );
  await assert.rejects(
    () => removeProfilePhoto(f.client, owner),
    /session changed/,
  );
  assert.deepEqual(f.calls, []);
});
test("wrong type, empty and oversized photos are rejected before any write", async () => {
  const f = fixture();
  for (const file of [
    new File(["png"], "x.png", { type: "image/png" }),
    new File([], "x.webp", { type: "image/webp" }),
    new File([new Uint8Array(262145)], "x.webp", { type: "image/webp" }),
  ])
    await assert.rejects(
      () => saveProfilePhoto(f.client, owner, file),
      /256 KB/,
    );
  assert.deepEqual(f.calls, []);
});
test("missing optional photos fall back while server errors remain errors", async () => {
  const f = fixture();
  f.state.signedError = { message: "Object not found", status: 404 };
  assert.equal(await loadProfilePhoto(f.client, owner), null);
  f.state.signedError = { message: "Service unavailable", status: 503 };
  await assert.rejects(
    () => loadProfilePhoto(f.client, owner),
    /could not load/,
  );
});
test("an upload failure can retry the same path without creating orphan files", async () => {
  const f = fixture();
  f.state.uploadError = { message: "Network failed" };
  await assert.rejects(
    () => saveProfilePhoto(f.client, owner, photo()),
    /Retry/,
  );
  assert.equal(
    f.calls.some((c) => c[0] === "sign"),
    false,
  );
  f.state.uploadError = null;
  await saveProfilePhoto(f.client, owner, photo());
  const uploads = f.calls.filter((c) => c[0] === "upload");
  assert.equal(uploads[0][1], uploads[1][1]);
});
test("missing photo storage reports the deployment dependency", async () => {
  const f = fixture();
  f.state.uploadError = { message: "Bucket not found" };
  await assert.rejects(
    () => saveProfilePhoto(f.client, owner, photo()),
    /not available yet/,
  );
});
test("removal targets only the owner's fixed photo and reports failures", async () => {
  const f = fixture();
  await removeProfilePhoto(f.client, owner);
  assert.deepEqual(f.calls[0], ["remove", [`${owner}/avatar.webp`]]);
  f.state.removeError = { message: "Offline" };
  await assert.rejects(
    () => removeProfilePhoto(f.client, owner),
    /could not be removed/,
  );
});
