"use client";

import { useSearchParams } from "next/navigation";
import { CATEGORIES, LISTINGS, MEETUPS, SERVICE_CATS } from "./mock-data";
import type { Listing, Mode } from "./types";

export interface Filters {
  mode: Mode;
  q: string;
  cat: string | null;
  max: number | null;
  meet: string | null;
  free: boolean;
}

export type FilterPatch = Partial<Omit<Filters, "mode">>;

/** Options that differ between goods and services (the prototype's syncFilters). */
export function modeOptions(mode: Mode) {
  const svc = mode === "services";
  return {
    cats: svc ? SERVICE_CATS : CATEGORIES,
    meetLabel: svc ? "Where" : "Meetup",
    meetAny: svc ? "Anywhere" : "Anywhere on campus",
    meetups: svc ? ["Online", ...MEETUPS] : MEETUPS,
    maxPrices: svc ? [15, 25, 50] : [25, 50, 100, 200],
    placeholder: svc
      ? "Search tutoring, haircuts, moving help"
      : "Search textbooks, desks, fridges",
    noun: svc ? "service" : "listing",
  };
}

/**
 * Browse filters live in the URL (/?mode=services&cat=tutoring&q=calc)
 * so they survive reloads, can be shared, and work with the back button.
 * Must be used under a <Suspense> boundary (Next.js requirement for useSearchParams).
 */
export function useFilters() {
  const params = useSearchParams();
  const filters: Filters = {
    mode: params.get("mode") === "services" ? "services" : "goods",
    q: params.get("q") ?? "",
    cat: params.get("cat"),
    max: Number(params.get("max")) || null,
    meet: params.get("meet"),
    free: params.get("free") === "1",
  };

  function update(patch: FilterPatch) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "" || value === false) next.delete(key);
      else next.set(key, value === true ? "1" : String(value));
    }
    const qs = next.toString();
    // Native history API: updates useSearchParams without a server round trip.
    window.history.replaceState(null, "", qs ? `/browse?${qs}` : "/browse");
  }

  return { filters, update };
}

export function filterListings(f: Filters): Listing[] {
  const q = f.q.trim().toLowerCase();
  const kind = f.mode === "services" ? "service" : "good";
  return LISTINGS.filter(
    (l) =>
      l.kind === kind &&
      (!q || `${l.title} ${l.desc} ${l.sub}`.toLowerCase().includes(q)) &&
      (!f.cat || l.cat === f.cat) &&
      (!f.max || l.price <= f.max) &&
      (!f.meet || l.meetup.includes(f.meet)) &&
      (!f.free || l.price === 0),
  );
}
