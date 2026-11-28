import { Suspense } from "react";
import SavedListings from "@/components/listings/live/SavedListings";

export default function SavedPage() {
  return (
    <Suspense>
      <SavedListings />
    </Suspense>
  );
}
