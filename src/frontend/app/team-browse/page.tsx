import { Suspense } from "react";
import BrowseView from "@/components/listings/BrowseView";
import { notFound } from "next/navigation";

export default function BrowsePage() {
  if (process.env.NODE_ENV === "production") notFound();
  // BrowseView reads filters from the URL, which Next.js requires to sit under <Suspense>.
  return (
    <Suspense>
      <BrowseView />
    </Suspense>
  );
}
