import test from "node:test";
import assert from "node:assert/strict";
import {
  addLocalMessage,
  markThreadRead,
  sortThreads,
} from "../lib/ui/demo-messages.ts";
// Browser-local prototype fixtures only; no recipient or backend is contacted.
const threads = [
  {
    id: "first",
    contact: "Alex",
    initials: "A",
    listingId: 2,
    unread: false,
    messages: [],
  },
  {
    id: "second",
    contact: "Sam",
    initials: "S",
    listingId: 6,
    unread: true,
    messages: [{ from: "them", text: "Available", time: "Monday" }],
  },
];
test("sending moves a conversation to the top and records a stable timestamp", () => {
  const next = addLocalMessage(
    threads,
    "second",
    " Hello ",
    "2026-11-02T12:00:00Z",
    "12:00 PM",
  );
  assert.equal(next[0].id, "second");
  assert.equal(next[0].messages.at(-1).text, "Hello");
  assert.equal(next[0].updatedAt, "2026-11-02T12:00:00Z");
  assert.equal(threads[1].messages.length, 1);
  assert.equal(next[0].messages.at(-1).from, "me");
  assert.equal("read" in next[0].messages.at(-1), false);
});
test("ordering survives a storage reload while old undated threads keep their order", () => {
  assert.deepEqual(
    sortThreads(threads).map((t) => t.id),
    ["first", "second"],
  );
  const next = addLocalMessage(
    threads,
    "second",
    "Hi",
    "2026-11-02T12:00:00Z",
    "12:00 PM",
  );
  assert.equal(sortThreads(JSON.parse(JSON.stringify(next)))[0].id, "second");
});
test("opening a thread marks only that thread read without inventing a recipient receipt", () => {
  const next = markThreadRead(threads, "second", "2026-11-02T12:00:00Z");
  assert.equal(next[1].unread, false);
  assert.equal(next[1].lastReadAt, "2026-11-02T12:00:00Z");
  assert.equal(threads[1].unread, true);
  assert.equal(next[0], threads[0]);
});
test("invalid messages cannot reorder or mutate conversations", () => {
  assert.throws(() => addLocalMessage(threads, "missing", "Hi", "now", "now"));
  assert.throws(() => addLocalMessage(threads, "first", "   ", "now", "now"));
  assert.throws(() =>
    addLocalMessage(threads, "first", "x".repeat(1001), "now", "now"),
  );
  assert.equal(threads[0].messages.length, 0);
});
