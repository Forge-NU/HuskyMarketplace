import { CONDITIONS, isApproved, type Listing } from "./model.ts";

export function readSearch(params: Pick<URLSearchParams, "get">) {
  const category = params.get("cat") ?? "";
  const max = params.get("max") ?? "";
  const condition = params.get("condition") ?? "";
  const sort = params.get("sort") ?? "new";

  return {
    q: (params.get("q") ?? "").trim(),
    category:
      category === "free"
        ? ""
        : category === "books"
          ? "books & notes"
          : category,
    condition: CONDITIONS.includes(condition) ? condition : "",
    max: /^\d+(\.\d{1,2})?$/.test(max) && Number(max) <= 999999.99 ? max : "",
    free: params.get("free") === "1" || category === "free",
    sort: sort === "priceAsc" || sort === "priceDesc" ? sort : "new",
  };
}

export type SearchFilters = ReturnType<typeof readSearch>;

export function updateSearch(query: string, values: Record<string, string>) {
  const next = new URLSearchParams(query);
  if (next.get("cat") === "free") {
    next.delete("cat");
    next.set("free", "1");
  }
  if (next.get("cat") === "books") next.set("cat", "books & notes");
  for (const [key, value] of Object.entries(values)) {
    if (value) next.set(key, value);
    else next.delete(key);
  }
  return next;
}

export function filterListings(
  items: Listing[],
  filters: SearchFilters,
  own = false,
) {
  const query = filters.q.toLowerCase();
  const results = items.filter(
    (item) =>
      (own || isApproved(item)) &&
      (!filters.category ||
        item.categories?.name.toLowerCase() ===
          filters.category.toLowerCase()) &&
      (!filters.condition || item.condition === filters.condition) &&
      (filters.max === "" ||
        (item.price !== null && item.price <= Number(filters.max))) &&
      (!filters.free || item.price === 0) &&
      `${item.title} ${item.description ?? ""} ${item.location ?? ""}`
        .toLowerCase()
        .includes(query),
  );

  return results.sort((a, b) => {
    if (filters.sort === "new")
      return Date.parse(b.created_at) - Date.parse(a.created_at);
    if (a.price === null) return b.price === null ? 0 : 1;
    if (b.price === null) return -1;
    return filters.sort === "priceAsc" ? a.price - b.price : b.price - a.price;
  });
}
