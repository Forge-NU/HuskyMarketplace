import test from "node:test";
import assert from "node:assert/strict";
import {
  UUID,
  validateDetails,
  validatePhoto,
  priceLabel,
  photoPaths,
  isApproved,
  WORKFLOW_VERSION,
} from "../lib/listings/model.ts";
import {
  requireWorkflow,
  loadListings,
  loadListing,
  saveDraft,
  uploadPhotos,
  submitDraft,
  signedPhotos,
  deleteListing,
} from "../lib/listings/service.ts";
const id = "d806ce19-530a-4c15-b4f6-f209ad910453",
  seller = "6b13c715-a869-4023-8581-bcc12ccddc6c";
const fields = {
  title: "Desk chair",
  description: "A comfortable chair",
  price: "12.50",
  category_id: id,
  condition: "Good",
  location: "Ruggles",
};
// Fixtures only. No test connects to Supabase or writes shared data.
function fixture() {
  const calls = [];
  const state = {
    version: WORKFLOW_VERSION,
    rpcErrors: {},
    results: { submit_listing: "pending", delete_listing: true },
    uploadErrors: [],
    rows: [],
    queryError: null,
  };
  const query = {
    select(v) {
      calls.push(["select", v]);
      return this;
    },
    order(...v) {
      calls.push(["order", ...v]);
      return this;
    },
    eq(...v) {
      calls.push(["eq", ...v]);
      return this;
    },
    textSearch(...v) {
      calls.push(["textSearch", ...v]);
      return this;
    },
    maybeSingle() {
      return Promise.resolve({
        data: state.rows[0] ?? null,
        error: state.queryError,
      });
    },
    then(resolve, reject) {
      return Promise.resolve({
        data: state.rows,
        error: state.queryError,
      }).then(resolve, reject);
    },
  };
  const client = {
    auth: {
      getUser: async () => ({ data: { user: { id: seller } }, error: null }),
    },
    rpc: async (name, args) => {
      calls.push(["rpc", name, args]);
      return {
        data:
          name === "listing_workflow_version"
            ? state.version
            : (state.results[name] ?? true),
        error: state.rpcErrors[name] ?? null,
      };
    },
    from(name) {
      calls.push(["from", name]);
      return query;
    },
    storage: {
      from(bucket) {
        calls.push(["bucket", bucket]);
        return {
          upload: async (path, file, options) => {
            calls.push(["upload", path, options]);
            return { error: state.uploadErrors.shift() ?? null };
          },
          createSignedUrls: async (paths, ttl) => {
            calls.push(["sign", paths, ttl]);
            return {
              data: paths.map(() => ({
                signedUrl: "https://example.invalid/signed",
              })),
              error: null,
            };
          },
        };
      },
    },
  };
  return { client, calls, state };
}
test("UUIDs stay strings and prices distinguish null from zero", () => {
  assert.ok(UUID.test(id));
  assert.equal(UUID.test("123"), false);
  assert.equal(priceLabel(null), "Price not provided");
  assert.equal(priceLabel(0), "FREE");
});
test("required fields and money are validated without treating blank as free", () => {
  assert.equal(validateDetails(fields).price, 12.5);
  for (const price of ["", "-1", "1.001", "Infinity", "1e3", "1000000"])
    assert.throws(() => validateDetails({ ...fields, price }));
  for (const [key, value] of [
    ["title", "  "],
    ["description", ""],
    ["category_id", "2"],
    ["condition", "unknown"],
    ["location", ""],
  ])
    assert.throws(() => validateDetails({ ...fields, [key]: value }));
});
test("unsupported, empty and oversized files fail validation", () => {
  validatePhoto({ type: "image/jpeg", size: 300 });
  for (const f of [
    { type: "image/heic", size: 300 },
    { type: "image/svg+xml", size: 300 },
    { type: "image/png", size: 0 },
    { type: "image/png", size: 13 * 1024 * 1024 },
  ])
    assert.throws(() => validatePhoto(f));
});
test("only explicitly approved available records qualify", () => {
  for (const status of ["draft", "pending", "active", "blocked", "sold"])
    assert.equal(isApproved({ status, is_available: true }), false);
  assert.equal(isApproved({ status: "approved", is_available: false }), false);
  assert.equal(isApproved({ status: "approved", is_available: true }), true);
});
test("photo paths are ordered and constrained to listing owner", () => {
  const prefix = `${seller}/${id}/`;
  assert.deepEqual(
    photoPaths({
      id,
      seller_id: seller,
      listing_photos: [
        { photo_url: prefix + "b.webp", sort_order: 2 },
        { photo_url: "https://evil.invalid/image", sort_order: 0 },
        { photo_url: prefix + "a.webp", sort_order: 1 },
        { photo_url: prefix + "../x", sort_order: 0 },
      ],
    }),
    [prefix + "a.webp", prefix + "b.webp"],
  );
});
test("missing or incompatible workflow blocks reads and mutations", async () => {
  const f = fixture();
  f.state.version = null;
  await assert.rejects(() => loadListings(f.client));
  await assert.rejects(() => saveDraft(f.client, id, fields));
  await assert.rejects(() => submitDraft(f.client, id));
  assert.equal(
    f.calls.some((c) => c[0] === "from"),
    false,
  );
  assert.equal(
    f.calls.some((c) => c[1] === "save_listing_draft"),
    false,
  );
});
test("Browse query restricts status and availability; own query restricts owner", async () => {
  const f = fixture();
  await loadListings(f.client);
  assert.ok(
    f.calls.some(
      (c) => c[0] === "eq" && c[1] === "status" && c[2] === "approved",
    ),
  );
  assert.ok(
    f.calls.some(
      (c) => c[0] === "eq" && c[1] === "is_available" && c[2] === true,
    ),
  );
  f.calls.length = 0;
  await loadListings(f.client, true);
  assert.ok(
    f.calls.some(
      (c) => c[0] === "eq" && c[1] === "seller_id" && c[2] === seller,
    ),
  );
});
test("query errors reject without substituting fixtures; malformed detail ID does not query", async () => {
  const f = fixture();
  f.state.queryError = { message: "permission denied" };
  await assert.rejects(() => loadListings(f.client), /Could not load/);
  f.calls.length = 0;
  assert.equal(await loadListing(f.client, "1"), null);
  assert.equal(f.calls.length, 0);
});
test("save uses stable draft ID and never supplies approval or seller claims", async () => {
  const f = fixture();
  await saveDraft(f.client, id, fields);
  const call = f.calls.find((c) => c[1] === "save_listing_draft");
  assert.equal(call[2].p_id, id);
  assert.equal("status" in call[2].p_details, false);
  assert.equal("seller_id" in call[2].p_details, false);
});
test("failed attachment retries without uploading a second object", async () => {
  const f = fixture();
  const uploads = [
    {
      path: `${seller}/${id}/photo.webp`,
      file: new File(["photo"], "photo.webp", { type: "image/webp" }),
      order: 0,
      uploaded: false,
      attached: false,
    },
  ];
  f.state.rpcErrors.attach_listing_photo = { message: "network" };
  await assert.rejects(() => uploadPhotos(f.client, id, uploads));
  assert.equal(uploads[0].uploaded, true);
  assert.equal(uploads[0].attached, false);
  delete f.state.rpcErrors.attach_listing_photo;
  await uploadPhotos(f.client, id, uploads);
  assert.equal(f.calls.filter((c) => c[0] === "upload").length, 1);
  assert.equal(uploads[0].attached, true);
  assert.equal(
    f.calls.some((c) => c[1] === "submit_listing"),
    false,
  );
});
test("lost upload response accepts only immutable path conflict on retry", async () => {
  const f = fixture();
  const uploads = [
    {
      path: `${seller}/${id}/photo.webp`,
      file: new File(["x"], "photo.webp"),
      order: 0,
      uploaded: false,
      attached: false,
    },
  ];
  f.state.uploadErrors = [{ statusCode: "500" }, { statusCode: "409" }];
  await assert.rejects(() => uploadPhotos(f.client, id, uploads));
  await uploadPhotos(f.client, id, uploads);
  assert.ok(uploads[0].attached);
  assert.deepEqual(f.calls.find((c) => c[0] === "upload")[2].upsert, false);
});
test("submission only accepts pending and retries the same ID", async () => {
  const f = fixture();
  f.state.results.submit_listing = "approved";
  await assert.rejects(() => submitDraft(f.client, id));
  f.state.results.submit_listing = "pending";
  await submitDraft(f.client, id);
  assert.equal(
    f.calls
      .filter((c) => c[1] === "submit_listing")
      .every((c) => c[2].p_id === id),
    true,
  );
});
test("deletion requires explicit confirmation from backend", async () => {
  const f = fixture();
  f.state.results.delete_listing = false;
  await assert.rejects(() => deleteListing(f.client, id));
});
test("private photos use short lived signed URLs, never public URLs", async () => {
  const f = fixture();
  await signedPhotos(f.client, {
    id,
    seller_id: seller,
    listing_photos: [{ photo_url: `${seller}/${id}/a.webp`, sort_order: 0 }],
  });
  assert.equal(f.calls.find((c) => c[0] === "sign")[2], 300);
});

test("save and attach require explicit success, not an empty response", async () => {
  const f = fixture();
  f.state.results.save_listing_draft = false;
  await assert.rejects(() => saveDraft(f.client, id, fields));
  f.state.results.attach_listing_photo = false;
  const uploads = [
    {
      path: `${seller}/${id}/a.webp`,
      file: new File(["x"], "a.webp"),
      order: 0,
      uploaded: true,
      attached: false,
    },
  ];
  await assert.rejects(() => uploadPhotos(f.client, id, uploads));
  assert.equal(uploads[0].attached, false);
});
test("signed out users cannot query owner records or save drafts", async () => {
  const f = fixture();
  f.client.auth.getUser = async () => ({ data: { user: null }, error: null });
  await assert.rejects(() => loadListings(f.client, true), /sign in/);
  await assert.rejects(() => saveDraft(f.client, id, fields), /sign in/);
  assert.equal(
    f.calls.some((c) => c[1] === "save_listing_draft"),
    false,
  );
});

test("keyword search uses search_vector and keeps visibility filters", async () => {
  const { client, calls, state } = fixture();
  state.rows = [{ id, title: "Desk lamps" }];
  const result = await loadListings(client, false, '  "desk lamp" OR chair  ');
  assert.deepEqual(
    calls.find(([name]) => name === "textSearch"),
    [
      "textSearch",
      "search_vector",
      '"desk lamp" OR chair',
      { config: "english", type: "websearch" },
    ],
  );
  assert.ok(
    calls.some(
      ([name, field, value]) =>
        name === "eq" && field === "status" && value === "approved",
    ),
  );
  assert.ok(
    calls.some(
      ([name, field, value]) =>
        name === "eq" && field === "is_available" && value === true,
    ),
  );
  assert.equal(result[0].id, id);
});

test("empty searches omit textSearch and failed search requests remain errors", async () => {
  const { client, calls, state } = fixture();
  await loadListings(client, false, "   ");
  assert.equal(
    calls.some(([name]) => name === "textSearch"),
    false,
  );
  state.queryError = { message: "permission denied" };
  await assert.rejects(
    loadListings(client, false, "desk"),
    /Could not load listings/,
  );
});
