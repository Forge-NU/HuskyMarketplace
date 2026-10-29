import type {Metadata} from "next";
import {Archivo,DM_Sans} from "next/font/google";
import SiteChrome from "@/components/SiteChrome";
import {ToastProvider} from "@/components/ui/Toast";
import {createClient} from "@/lib/supabase/server";
import "./globals.css";
const archivo=Archivo({variable:"--font-archivo",subsets:["latin"],axes:["wdth"]});
const dmSans=DM_Sans({variable:"--font-dm-sans",subsets:["latin"]});
export const metadata:Metadata={title:"Husky Marketplace",description:"Student-to-student marketplace demo for Northeastern."};
export default async function RootLayout({children}:LayoutProps<"/">){
 const {data}=await(await createClient()).auth.getClaims();
 const userEmail=(data?.claims.email as string|undefined)??null;
 return <html lang="en" className={`${archivo.variable} ${dmSans.variable}`}><body><ToastProvider><SiteChrome userEmail={userEmail}>{children}</SiteChrome></ToastProvider></body></html>
}
