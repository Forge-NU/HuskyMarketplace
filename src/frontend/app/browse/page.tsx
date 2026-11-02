import { Suspense } from "react";
import ListingCollection from "@/components/listings/live/ListingCollection";
export default function BrowsePage() {
  return (
    <Suspense fallback={<p>Loading listings…</p>}>
      <ListingCollection />
    </Suspense>
  );
}
