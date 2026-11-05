export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const CONDITIONS = ["New", "Like new", "Excellent", "Good", "Fair"];
export const BUCKET = "listing-photos";
export const WORKFLOW_VERSION = "draft-review-v1";
export type Details = {
  title: string;
  description: string;
  price: string;
  category_id: string;
  condition: string;
  location: string;
};
export const EMPTY_DETAILS: Details = {
  title: "",
  description: "",
  price: "",
  category_id: "",
  condition: "",
  location: "",
};
export type Listing = {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  price: number | null;
  category_id: string | null;
  condition: string | null;
  location: string | null;
  status: string;
  is_available: boolean | null;
  created_at: string;
  categories: { name: string } | null;
  listing_photos: {
    id: string;
    photo_url: string;
    sort_order: number | null;
  }[];
};
export const SELECT =
  "id,seller_id,title,description,price,category_id,condition,location,status,is_available,created_at,categories(name),listing_photos(id,photo_url,sort_order)";
export function validateDetails(d: Details) {
  if (d.title.trim().length < 3 || d.title.trim().length > 100)
    throw new Error("Use a title between 3 and 100 characters.");
  if (!d.description.trim() || d.description.length > 1200)
    throw new Error("Add a description of up to 1,200 characters.");
  if (
    !/^\d+(\.\d{1,2})?$/.test(d.price) ||
    !Number.isFinite(Number(d.price)) ||
    Number(d.price) > 999999.99
  )
    throw new Error(
      "Enter a price from $0 to $999,999.99 with up to two decimal places.",
    );
  if (!UUID.test(d.category_id)) throw new Error("Choose a category.");
  if (!CONDITIONS.includes(d.condition)) throw new Error("Choose a condition.");
  if (!d.location.trim() || d.location.length > 100)
    throw new Error("Add a general pickup area of up to 100 characters.");
  return {
    ...d,
    title: d.title.trim(),
    description: d.description.trim(),
    location: d.location.trim(),
    price: Number(d.price),
  };
}
export function validatePhoto(file: Pick<File, "size" | "type">) {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size <= 0 ||
    file.size > 12 * 1024 * 1024
  )
    throw new Error(
      "Choose JPEG, PNG, or WebP photos up to 12 MB each. HEIC is not supported yet.",
    );
}
export function priceLabel(price: number | null) {
  return price === null
    ? "Price not provided"
    : price === 0
      ? "FREE"
      : new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(price);
}
export function photoPaths(item: Listing) {
  return [...item.listing_photos]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((p) => p.photo_url)
    .filter(
      (p) =>
        p.startsWith(`${item.seller_id}/${item.id}/`) &&
        !p.includes("..") &&
        !p.includes(":") &&
        !p.includes("?"),
    );
}
export function isApproved(item: Listing) {
  return item.status === "approved" && item.is_available === true;
}
export function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The request failed. Please retry.";
}
