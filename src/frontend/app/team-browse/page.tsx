import { Suspense } from "react";
import BrowseView from "@/components/listings/BrowseView";

export default function BrowsePage() {
  // BrowseView reads filters from the URL, which Next.js requires to sit under <Suspense>.
  return (
    <Suspense>
      <BrowseView />
    </Suspense>
  );
}
