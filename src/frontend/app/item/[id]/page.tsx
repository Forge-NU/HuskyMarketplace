import { redirect } from "next/navigation";
import ListingDetail from "@/components/listings/live/ListingDetail";
export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (/^\d+$/.test(id)) redirect(`/demo/item/${id}`);
  return <ListingDetail key={id} id={id} />;
}
