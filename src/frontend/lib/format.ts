import { CATEGORIES, SERVICE_CATS } from "./mock-data";
import type { Listing, Seller } from "./types";

export function fmtPrice(l: Listing): string {
  if (l.kind === "service")
    return `$${l.price}${l.rate === "hr" ? "/hr" : " flat"}`;
  return l.price === 0 ? "Free" : `$${l.price}`;
}

export function ratingShort(s: Seller): string {
  return s.reviews ? `★ ${s.rating.toFixed(1)}` : "New";
}

export function catLabel(l: Listing): string {
  return (
    [...CATEGORIES, ...SERVICE_CATS].find((c) => c.id === l.cat)?.name ?? ""
  );
}
