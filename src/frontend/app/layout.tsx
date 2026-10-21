import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { ToastProvider } from "@/components/ui/Toast";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={archivo.variable}>
      <body>
        <ToastProvider>
          <Header />
          {children}
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
