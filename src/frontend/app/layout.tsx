import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { ToastProvider } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: "Husky Marketplace",
  description: "Buy and sell with verified Northeastern students. Meet up on campus.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // proxy.ts already redirects logged-out users, so this is only for showing account state.
  const { data } = await (await createClient()).auth.getClaims();
  const userEmail = (data?.claims.email as string | undefined) ?? null;

  return (
    <html lang="en" className={archivo.variable}>
      <body>
        <ToastProvider>
          <Header userEmail={userEmail} />
          {children}
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
