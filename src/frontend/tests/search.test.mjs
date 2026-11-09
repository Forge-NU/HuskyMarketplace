import test from "node:test";
import assert from "node:assert/strict";
import {
  readSearch,
  updateSearch,
  filterListings,
} from "../lib/listings/search.ts";

// Local fixtures only. Never inserted into Supabase.
const lamp = {
  id: "aaaaaaaa-0000-0000-0000-000000000001",
  title: "Desk lamp",
  description: "Warm light",
  location: "Boston",
  price: 15,
  categories: { name: "Furniture" },
  condition: "Good",
  status: "approved",
  is_available: true,
  created_at: "2026-11-01T12:00:00Z",
};
const items = [
  lamp,
  { ...lamp, id: "free", title: "Free desk", price: 0 },
  { ...lamp, id: "unknown-price", price: null },
  { ...lamp, id: "pending", status: "pending" },
  { ...lamp, id: "unavailable", is_available: false },
  {
    ...lamp,
    id: "book",
    title: "Calculus notes",
    categories: { name: "Books & Notes" },
    price: 5,
    created_at: "2026-11-02T12:00:00Z",
  },
];
const filters = (query) => readSearch(new URLSearchParams(query));

test("search combines keywords, category, condition and maximum price", () => {
  const result = filterListings(
    items,
    filters("q=+WARM+&cat=furniture&condition=Good&max=15"),
  );
  assert.deepEqual(
    result.map((item) => item.id),
    [lamp.id, "free"],
  );
  assert.equal(filterListings(items, filters("q=no+matches")).length, 0);
});

test("free category links match zero prices across categories, not missing prices", () => {
  assert.deepEqual(
    filterListings(items, filters("cat=free")).map((item) => item.id),
    ["free"],
  );
  assert.deepEqual(
    filterListings(items, filters("max=0")).map((item) => item.id),
    ["free"],
  );
  assert.equal(filterListings(items, filters("cat=books"))[0].id, "book");
});

test("sort keeps unknown prices last in both directions and does not mutate records", () => {
  const original = [...items];
  const ascending = filterListings(items, filters("sort=priceAsc"));
  const descending = filterListings(items, filters("sort=priceDesc"));
  assert.deepEqual(
    ascending.map((item) => item.id),
    ["free", "book", lamp.id, "unknown-price"],
  );
  assert.deepEqual(
    descending.map((item) => item.id),
    [lamp.id, "book", "free", "unknown-price"],
  );
  assert.equal(filterListings(items, filters(""))[0].id, "book");
  assert.deepEqual(items, original);
});

test("invalid URL filters reset safely while zero is preserved", () => {
  const result = filters("max=-10&condition=unknown&sort=random");
  assert.equal(result.max, "");
  assert.equal(result.condition, "");
  assert.equal(result.sort, "new");
  assert.equal(filters("max=0").max, "0");
});

test("removing a chip preserves other filters and can clear legacy free links", () => {
  const result = updateSearch("cat=free&q=desk&sort=priceAsc", { free: "" });
  assert.equal(readSearch(result).free, false);
  assert.equal(result.get("q"), "desk");
  assert.equal(result.get("sort"), "priceAsc");
  assert.equal(result.has("cat"), false);
  const priceOnly = updateSearch("cat=books&max=15&q=notes", { q: "" });
  assert.equal(readSearch(priceOnly).category, "books & notes");
  assert.equal(priceOnly.get("max"), "15");
});
