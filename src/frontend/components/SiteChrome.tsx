"use client";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "@/components/ui/marketplace/UI.module.css";
/** UI routes supply their own navigation; existing team routes keep their original header. */
const uiRoutes = [
  "/",
  "/browse",
  "/my-listings",
  "/login",
  "/signup",
  "/verify",
  "/forgot-password",
  "/reset-password",
  "/verify-device",
  "/account",
  "/account/setup",
  "/email-preview",
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
    pathname.startsWith("/demo/item/") ||
    pathname.startsWith("/seller/")
  )
    return <>{children}</>;
  return (
    <>
      <a className={styles.skipLink} href="#main-content">
        Skip to content
      </a>
      <Header userEmail={userEmail} />
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
      <Footer />
    </>
  );
}
