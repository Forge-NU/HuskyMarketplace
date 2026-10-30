import UIItem from "@/components/ui/marketplace/UIItem";
export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <UIItem id={id} />;
}
