import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { loadSavedIds, loadSavedPage, setSaved } from "../lib/saved/service.ts";

const owner = "aaaaaaaa-1111-4111-8111-111111111111";
const id = "bbbbbbbb-2222-4222-8222-222222222222";
// These fixtures never connect to a database.
function fixture() {
  const calls = [];
  const state = {
    user: { id: owner },
    ids: [id],
    rows: [],
    count: 0,
    listing: { id },
    readError: null,
    writeError: null,
    listingError: null,
  };
  const client = {
    auth: {
      getUser: async () => ({ data: { user: state.user }, error: null }),
    },
    from(table) {
      let write = false,
        columns,
        selected = [];
      calls.push(["from", table]);
      return {
        select(value, options) {
          columns = value;
          calls.push(["select", value, options]);
          return this;
        },
        eq(...values) {
          calls.push(["eq", ...values]);
          return this;
        },
        in(key, values) {
          selected = values;
          calls.push(["in", key, values]);
          return this;
        },
        order(...values) {
          calls.push(["order", ...values]);
          return this;
        },
        range(...values) {
          calls.push(["range", ...values]);
          return this;
        },
        insert(value) {
          write = true;
          calls.push(["insert", value]);
          return this;
        },
        delete() {
          write = true;
          calls.push(["delete"]);
          return this;
        },
        maybeSingle: async () => ({
          data: state.listing,
          error: state.listingError,
        }),
        then(resolve, reject) {
          return Promise.resolve({
            data:
              columns === "listing_id"
                ? state.ids
                    .filter((value) => selected.includes(value))
                    .map((listing_id) => ({ listing_id }))
                : state.rows,
            count: state.count,
            error: write ? state.writeError : state.readError,
          }).then(resolve, reject);
        },
      };
    },
  };
  return { client, state, calls };
}

test("save operations reject demo IDs and malformed UUIDs", async () => {
  const f = fixture();
  for (const value of ["1", "../item", "", "not-a-uuid"]) {
    await assert.rejects(
      () => setSaved(f.client, value, owner, true),
      /Invalid listing/,
    );
    await assert.rejects(
      () => loadSavedIds(f.client, [value]),
      /Invalid listing/,
    );
  }
  assert.equal(f.calls.length, 0);
});
test("saved markers are user-scoped, deduplicated and batched below response limits", async () => {
  const f = fixture();
  const ids = Array.from({ length: 1005 }, () => randomUUID());
  f.state.ids = ids;
  const result = await loadSavedIds(f.client, [...ids, ids[0]]);
  assert.equal(result.userId, owner);
  assert.deepEqual(result.ids, ids);
  const batches = f.calls.filter((c) => c[0] === "in");
  assert.equal(batches.length, 11);
  assert.ok(batches.every((c) => c[2].length <= 100));
  assert.equal(
    f.calls.filter((c) => c[0] === "eq" && c[1] === "user_id" && c[2] === owner)
      .length,
    11,
  );
});
test("saved pages retain unavailable rows without exposing hidden listing details", async () => {
  const f = fixture();
  const available = { id, status: "approved", is_available: true, price: null };
  f.state.rows = [
    { listing_id: id, listings: available },
    { listing_id: randomUUID(), listings: null },
    { listing_id: randomUUID(), listings: { ...available, status: "blocked" } },
    { listing_id: randomUUID(), listings: { ...available, status: "sold" } },
    {
      listing_id: randomUUID(),
      listings: { ...available, is_available: false },
    },
  ];
  f.state.count = 53;
  const result = await loadSavedPage(f.client, 3);
  assert.equal(result.count, 53);
  assert.equal(result.items[0].listings.price, null);
  assert.ok(result.items.slice(1).every((row) => row.listings === null));
  assert.ok(
    f.calls.some((c) => c[0] === "range" && c[1] === 48 && c[2] === 71),
  );
  assert.ok(
    f.calls.some(
      (c) =>
        c[0] === "order" && c[1] === "created_at" && c[2].ascending === false,
    ),
  );
  assert.ok(
    f.calls.some((c) => c[0] === "eq" && c[1] === "user_id" && c[2] === owner),
  );
  assert.ok(!f.calls.find((c) => c[0] === "select")[1].includes("!inner"));
});
test("empty results and permission failures remain different states", async () => {
  const f = fixture();
  assert.deepEqual((await loadSavedPage(f.client, 1)).items, []);
  f.state.readError = { code: "42501" };
  await assert.rejects(() => loadSavedPage(f.client, 1), /could not load/);
  await assert.rejects(() => loadSavedIds(f.client, [id]), /could not load/);
});
test("invalid pages are rejected before a request", async () => {
  const f = fixture();
  for (const page of [0, -1, 1.5, NaN, Infinity, 100001])
    await assert.rejects(
      () => loadSavedPage(f.client, page),
      /Invalid saved page/,
    );
  assert.equal(f.calls.length, 0);
});
test("saving checks current visibility and derives the owner from Auth", async () => {
  const f = fixture();
  await setSaved(f.client, id, owner, true);
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
  assert.deepEqual(
    f.calls.find((c) => c[0] === "insert"),
    ["insert", { user_id: owner, listing_id: id }],
  );
});
test("stale unavailable listings cannot be saved from an old card", async () => {
  const f = fixture();
  f.state.listing = null;
  await assert.rejects(
    () => setSaved(f.client, id, owner, true),
    /no longer available/,
  );
  assert.ok(!f.calls.some((c) => c[0] === "insert"));
});
test("a duplicate save succeeds only when the account really has that save", async () => {
  const f = fixture();
  f.state.writeError = { code: "23505" };
  await setSaved(f.client, id, owner, true);
  f.state.ids = [];
  await assert.rejects(
    () => setSaved(f.client, id, owner, true),
    /Could not save/,
  );
});
test("failed writes do not claim success", async () => {
  const f = fixture();
  f.state.writeError = { code: "42501" };
  await assert.rejects(
    () => setSaved(f.client, id, owner, true),
    /Could not save/,
  );
  await assert.rejects(
    () => setSaved(f.client, id, owner, false),
    /Could not remove/,
  );
});
test("removal remains owner-scoped and works for an unavailable or already removed row", async () => {
  const f = fixture();
  f.state.listing = null;
  await setSaved(f.client, id, owner, false);
  assert.deepEqual(f.calls, [
    ["from", "saved_items"],
    ["delete"],
    ["eq", "user_id", owner],
    ["eq", "listing_id", id],
  ]);
});
test("account changes and signed-out requests cannot write using the previous account", async () => {
  const f = fixture();
  f.state.user = { id: randomUUID() };
  await assert.rejects(
    () => setSaved(f.client, id, owner, true),
    /session changed/,
  );
  f.state.user = null;
  await assert.rejects(() => loadSavedPage(f.client, 1), /sign in again/i);
  await assert.rejects(
    () => setSaved(f.client, id, owner, false),
    /sign in again/i,
  );
  assert.equal(f.calls.length, 0);
});
