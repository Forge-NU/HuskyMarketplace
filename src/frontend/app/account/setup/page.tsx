import AccountProfile from "@/components/ui/marketplace/AccountProfile";
export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AccountProfile setup next={next} />;
}
