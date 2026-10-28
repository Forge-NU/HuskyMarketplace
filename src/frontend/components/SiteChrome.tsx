"use client";
import {usePathname} from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
/** New photographic routes supply their own full chrome; keep legacy header on the team's routes. */
const photoRoutes=["/","/browse","/login","/signup","/verify","/account","/saved","/sell","/messages","/moving","/terms","/privacy","/safety","/credits"];
export default function SiteChrome({children,userEmail}:{children:React.ReactNode;userEmail:string|null}){
 const pathname=usePathname();
 if(photoRoutes.includes(pathname)||pathname.startsWith("/item/")||pathname.startsWith("/seller/"))return <>{children}</>;
 return <><Header userEmail={userEmail}/>{children}<Footer/></>
}
