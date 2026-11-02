import { Suspense } from "react";
import ListingEditor from "@/components/listings/live/ListingEditor";
export default async function SellPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  return (
    <Suspense fallback={<p>Loading form…</p>}>
      <ListingEditor key={edit ?? "new"} editId={edit} />
    </Suspense>
  );
}
