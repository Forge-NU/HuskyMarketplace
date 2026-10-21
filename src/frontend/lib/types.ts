import type { IconName } from "@/components/Icon";

export type ListingKind = "good" | "service";
export type Mode = "goods" | "services";

export interface Seller {
  name: string;
  rating: number;
  reviews: number;
  /** Year they joined, e.g. "2024". */
  since: string;
}

export interface Category {
  id: string;
  name: string;
  icon: IconName;
  /** Subcategory name and listing count (goods only). */
  subs?: [string, number][];
  /** Card background color (services only; goods use TINTS). */
  tint?: string;
}

export interface Listing {
  id: number;
  kind: ListingKind;
  title: string;
  cat: string;
  sub: string;
  price: number;
  /** Services only: hourly or flat rate. */
  rate?: "hr" | "flat";
  /** "Or best offer": seller is open to offers. */
  obo: boolean;
  featured: boolean;
  icon: IconName;
  tint: string;
  photo?: string;
  meetup: string;
  posted: string;
  desc: string;
  seller: Seller;
}
