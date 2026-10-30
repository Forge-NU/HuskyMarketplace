"use client";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
/** UI routes supply their own navigation; existing team routes keep their original header. */
const uiRoutes = [
  "/",
  "/browse",
  "/login",
  "/signup",
  "/verify",
  "/account",
  "/saved",
  "/sell",
  "/messages",
  "/moving",
  "/terms",
  "/privacy",
  "/safety",
  "/credits",
];
export default function SiteChrome({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string | null;
}) {
  const pathname = usePathname();
  if (
    uiRoutes.includes(pathname) ||
    pathname.startsWith("/item/") ||
    pathname.startsWith("/seller/")
  )
    return <>{children}</>;
  return (
    <>
      <Header userEmail={userEmail} />
      {children}
      <Footer />
    </>
  );
}
