import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadProfile } from "@/lib/profile/service";
import { profileComplete } from "@/lib/profile/model";
import { Suspense } from "react";
import ListingEditor from "@/components/listings/live/ListingEditor";
export default async function SellPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  let complete = false;
  try {
    complete = profileComplete(await loadProfile(await createClient()));
  } catch {
    /* Setup provides a retry when profile retrieval fails. */
  }
  if (!complete) redirect("/account/setup");
  return (
    <Suspense fallback={<p>Loading form…</p>}>
      <ListingEditor key={edit ?? "new"} editId={edit} />
    </Suspense>
  );
}
