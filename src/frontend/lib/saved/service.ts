import type { SupabaseClient } from "@supabase/supabase-js";
import { UUID, SELECT, isApproved, type Listing } from "../listings/model.ts";

export const SAVED_PAGE_SIZE = 24;
export type SavedListing = {
  listing_id: string;
  created_at: string;
  listings: Listing | null;
};

async function account(client: SupabaseClient) {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user)
    throw new Error("Please sign in again to manage your saved items.");
  return data.user;
}

export async function loadSavedIds(client: SupabaseClient, ids: string[]) {
  if (ids.some((id) => !UUID.test(id))) throw new Error("Invalid listing.");
  const user = await account(client);
  if (!ids.length) return { userId: user.id, ids: [] as string[] };
  const unique = [...new Set(ids)];
  const saved: string[] = [];
  for (let start = 0; start < unique.length; start += 100) {
    const { data, error } = await client
      .from("saved_items")
      .select("listing_id")
      .eq("user_id", user.id)
      .in("listing_id", unique.slice(start, start + 100));
    if (error) throw new Error("Saved items could not load. Please retry.");
    saved.push(...(data ?? []).map((row) => row.listing_id as string));
  }
  return {
    userId: user.id,
    ids: saved,
  };
}

export async function loadSavedPage(client: SupabaseClient, page: number) {
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000)
    throw new Error("Invalid saved page.");
  const user = await account(client);
  const start = (page - 1) * SAVED_PAGE_SIZE;
  const { data, error, count } = await client
    .from("saved_items")
    .select(`listing_id,created_at,listings(${SELECT})`, { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(start, start + SAVED_PAGE_SIZE - 1);
  if (error || count === null)
    throw new Error("Your saved items could not load. Please retry.");
  const rows = (data ?? []) as unknown as SavedListing[];
  return {
    userId: user.id,
    count,
    items: rows.map((row) => ({
      ...row,
      listings: row.listings && isApproved(row.listings) ? row.listings : null,
    })),
  };
}

export async function setSaved(
  client: SupabaseClient,
  id: string,
  userId: string,
  saved: boolean,
) {
  if (!UUID.test(id)) throw new Error("Invalid listing.");
  const user = await account(client);
  if (user.id !== userId)
    throw new Error("Your session changed. Reload before saving an item.");
  if (!saved) {
    const { error } = await client
      .from("saved_items")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", id);
    if (error) throw new Error("Could not remove this save. Please retry.");
    return;
  }
  const { data: listing, error: listingError } = await client
    .from("listings")
    .select("id")
    .eq("id", id)
    .eq("status", "approved")
    .eq("is_available", true)
    .maybeSingle();
  if (listingError)
    throw new Error("Could not check this listing. Please retry.");
  if (!listing) throw new Error("This listing is no longer available to save.");
  const { error } = await client
    .from("saved_items")
    .insert({ user_id: user.id, listing_id: id });
  if (error?.code === "23505") {
    const existing = await loadSavedIds(client, [id]);
    if (existing.userId === user.id && existing.ids.includes(id)) return;
  }
  if (error) throw new Error("Could not save this item. Please retry.");
}
