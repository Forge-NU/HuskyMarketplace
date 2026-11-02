import { Suspense } from "react";
import ListingCollection from "@/components/listings/live/ListingCollection";
export default function MyListingsPage() {
  return (
    <Suspense fallback={<p>Loading your listings…</p>}>
      <ListingCollection own />
    </Suspense>
  );
}
