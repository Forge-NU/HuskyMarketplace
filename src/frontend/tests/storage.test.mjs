import test from "node:test";
import assert from "node:assert/strict";
import { UploadError, uploadFile } from "../lib/storage/uploadFile.ts";

const bucket = "listing-photos";
const path = "user/listing/photo.webp";
const file = new File(["fake image bytes"], "photo.webp", {
  type: "image/webp",
});
function fakeClient(error) {
  const calls = [];
  const client = {
    storage: {
      from(bucket) {
        return {
          upload(path, file, options) {
            calls.push({ bucket, path, options });
            return Promise.resolve({
              data: error ? null : { path },
              error: error ?? null,
            });
          },
        };
      },
    },
  };
  return { client, calls };
}

test("returns path and uploads with file's type with no overwrite", async () => {
  const { client, calls } = fakeClient();
  const result = await uploadFile(client, bucket, path, file);
  assert.equal(result, path);
  assert.deepEqual(calls, [
    {
      path: path,
      bucket: bucket,
      options: { contentType: "image/webp", upsert: false },
    },
  ]);
});

test("409 (already uploaded) doesn't throw and returns path", async () => {
  const { client } = fakeClient({
    statusCode: "409",
    message: "The file already exists",
  });
  const result = await uploadFile(client, bucket, path, file);
  assert.equal(result, path);
});

test("maps storage errors to the matching upload error kind", async () => {
  for (const [statusCode, kind] of [
    ["413", "too-large"],
    ["415", "wrong-type"],
    ["403", "not-allowed"],
    ["401", "not-allowed"],
    ["500", "unknown"],
    [undefined, "unknown"],
  ]) {
    const { client } = fakeClient({ statusCode, message: "storage error" });
    await assert.rejects(
      uploadFile(client, bucket, path, file),
      (err) => err instanceof UploadError && err.kind === kind,
    );
  }
});
