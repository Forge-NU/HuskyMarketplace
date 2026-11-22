import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BUCKET,
  SELECT,
  WORKFLOW_VERSION,
  UUID,
  validateDetails,
  photoPaths,
  type Details,
  type Listing,
} from "./model.ts";
import { uploadFile, UploadError } from "../storage/uploadFile.ts";
import type { SearchFilters } from "./search.ts";

export const PAGE_SIZE = 24;

// This handshake is a deployment gate, not authorization. Every operation still
// requires backend ownership checks, grants, RLS and immutable pending content.
export async function requireWorkflow(client: SupabaseClient) {
  const { data, error } = await client.rpc("listing_workflow_version");
  if (error || data !== WORKFLOW_VERSION)
    throw new Error(
      "Live listings are temporarily unavailable while secure publishing is being connected. Please try again later.",
    );
}
export async function currentUser(client: SupabaseClient) {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user)
    throw new Error("Please sign in again to manage your listings.");
  return data.user;
}
export async function loadListings(
  client: SupabaseClient,
  own = false,
  search = "",
): Promise<Listing[]> {
  await requireWorkflow(client);
  let query = client
    .from("listings")
    .select(SELECT)
    .order("created_at", { ascending: false });
  if (own) query = query.eq("seller_id", (await currentUser(client)).id);
  else query = query.eq("status", "approved").eq("is_available", true);
  if (search.trim()) {
    query = query.textSearch("search_vector", search.trim(), {
      config: "english",
      type: "websearch",
    });
  }
  const { data, error } = await query;
  if (error) throw new Error("Could not load listings. Please retry.");
  return (data ?? []) as unknown as Listing[];
}
export async function loadListingPage(
  client: SupabaseClient,
  filters: SearchFilters,
  own = false,
) {
  await requireWorkflow(client);
  const select = filters.category
    ? SELECT.replace("categories(name)", "categories!inner(name)")
    : SELECT;
  let query = client.from("listings").select(select, { count: "exact" });
  if (own) query = query.eq("seller_id", (await currentUser(client)).id);
  else query = query.eq("status", "approved").eq("is_available", true);
  if (filters.q)
    query = query.textSearch("search_vector", filters.q, {
      config: "english",
      type: "websearch",
    });
  if (filters.category)
    query = query.ilike(
      "categories.name",
      filters.category.replace(/[\\%_]/g, "\\$&"),
    );
  if (filters.condition) query = query.eq("condition", filters.condition);
  if (filters.free) query = query.eq("price", 0);
  if (filters.min !== "") query = query.gte("price", Number(filters.min));
  if (filters.max !== "") query = query.lte("price", Number(filters.max));
  query =
    filters.sort === "new"
      ? query.order("created_at", { ascending: false })
      : query.order("price", {
          ascending: filters.sort === "priceAsc",
          nullsFirst: false,
        });
  const start = (filters.page - 1) * PAGE_SIZE;
  const { data, error, count } = await query
    .order("id", { ascending: false })
    .range(start, start + PAGE_SIZE - 1);
  if (error) throw new Error("Could not load listings. Please retry.");
  return { items: (data ?? []) as unknown as Listing[], count: count ?? 0 };
}

export async function loadListing(
  client: SupabaseClient,
  id: string,
): Promise<Listing | null> {
  if (!UUID.test(id)) return null;
  await requireWorkflow(client);
  const { data, error } = await client
    .from("listings")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Could not load this listing. Please retry.");
  // RLS allows approved records and the owner's private records only.
  return data as unknown as Listing | null;
}
export async function categories(
  client: SupabaseClient,
): Promise<{ id: string; name: string }[]> {
  await requireWorkflow(client);
  const { data, error } = await client
    .from("categories")
    .select("id,name")
    .order("sort_order");
  if (error) throw new Error("Could not load categories. Please retry.");
  return data ?? [];
}
export async function saveDraft(
  client: SupabaseClient,
  id: string,
  details: Details,
) {
  const fields = validateDetails(details);
  await requireWorkflow(client);
  await currentUser(client);
  const { data, error } = await client.rpc("save_listing_draft", {
    p_id: id,
    p_details: fields,
  });
  if (error || data !== true)
    throw new Error(
      "Could not save your draft. Retry with the same draft; nothing has been published.",
    );
}
export type Upload = {
  path: string;
  file: File;
  order: number;
  uploaded: boolean;
  attached: boolean;
};
export async function uploadPhotos(
  client: SupabaseClient,
  id: string,
  uploads: Upload[],
) {
  await requireWorkflow(client);
  for (const photo of uploads) {
    if (!photo.uploaded) {
      try {
        await uploadFile(client, BUCKET, photo.path, photo.file);
      } catch (err) {
        if (err instanceof UploadError && err.kind === "not-allowed") {
          throw new Error(
            "Your session has expired. Sign in again, then retry uploading.",
          );
        } else {
          throw new Error(
            "Photo upload failed. Your draft is private. Retry to continue uploading.",
          );
        }
      }
      photo.uploaded = true;
    }
    if (!photo.attached) {
      const { data, error } = await client.rpc("attach_listing_photo", {
        p_listing_id: id,
        p_path: photo.path,
        p_sort_order: photo.order,
      });
      if (error || data !== true)
        throw new Error(
          "Could not attach a photo. Retry to finish your private draft.",
        );
      photo.attached = true;
    }
  }
}
export async function submitDraft(client: SupabaseClient, id: string) {
  await requireWorkflow(client);
  const { data, error } = await client.rpc("submit_listing", { p_id: id });
  if (error || data !== "pending")
    throw new Error(
      "Could not confirm submission. Retry submission or check My listings. Your listing cannot appear until moderation approves it.",
    );
}
export async function deleteListing(client: SupabaseClient, id: string) {
  await requireWorkflow(client);
  const { data, error } = await client.rpc("delete_listing", { p_id: id });
  if (error || data !== true)
    throw new Error(
      "Could not confirm deletion. Refresh My listings before retrying.",
    );
}
export async function signedPhotos(client: SupabaseClient, item: Listing) {
  const paths = photoPaths(item);
  if (!paths.length) return [];
  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrls(paths, 300);
  if (error || data?.some((p) => p.error || !p.signedUrl))
    throw new Error("Listing photos could not load. Please retry.");
  return (data ?? []).map((p) => p.signedUrl!).filter(Boolean);
}
