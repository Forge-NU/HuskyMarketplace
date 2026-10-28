"use client";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./UI.module.css";

export default function UIShell({children}:{children:ReactNode}){
 const router=useRouter(),pathname=usePathname();
 const [menu,setMenu]=useState(false),[email,setEmail]=useState<string|null>(null),[q,setQ]=useState("");
 useEffect(()=>{let active=true;createClient().auth.getUser().then(({data})=>{if(active)setEmail(data.user?.email??null)});return()=>{active=false}},[pathname]);
 function search(e:FormEvent){e.preventDefault();router.push(q.trim()?`/browse?q=${encodeURIComponent(q.trim())}`:"/browse");setMenu(false)}
 async function logout(){const {error}=await createClient().auth.signOut();if(error){alert(error.message);return}setEmail(null);router.replace("/login");router.refresh()}
 const links=[{href:"/",text:"Home"},{href:"/browse",text:"Shop"},{href:"/sell",text:"Sell"},{href:"/moving",text:"Moving help"}];
 return <div className={styles.page}>
   <div className={styles.demoRibbon}><strong>PHOTO-LED MARKETPLACE PREVIEW</strong> · sample listings and browser-local demo actions</div>
   <header className={styles.siteHeader}><div className={styles.headerInner}>
     <Link className={styles.logo} href="/" aria-label="Husky Marketplace home">husky<span>✳</span></Link>
     <nav className={styles.mainNav} aria-label="Main navigation">{links.map(x=><Link key={x.href} href={x.href} className={pathname===x.href?styles.active:""} aria-current={pathname===x.href?"page":undefined}>{x.text}</Link>)}</nav>
     <form className={styles.search} onSubmit={search} role="search"><span aria-hidden="true">⌕</span><input type="search" aria-label="Search listings" placeholder="Search anything on campus..." value={q} onChange={e=>setQ(e.target.value)}/></form>
     <div className={styles.headerActions}>
       <Link className={styles.iconButton} href="/saved" aria-label="Saved items">♡</Link>
       <Link className={styles.iconButton} href="/messages" aria-label="Messages">▤</Link>
       <Link className={styles.postButton} href="/sell">＋ Post an item</Link>
       {email?<div className={styles.accountWrap}><Link className={styles.avatar} href="/account" title={email} aria-label="My account">{email.slice(0,1).toUpperCase()}</Link></div>:<Link className={styles.avatar} href="/login" aria-label="Sign in">↗</Link>}
       <button className={styles.mobileToggle} type="button" aria-label={menu?"Close navigation":"Open navigation"} aria-expanded={menu} onClick={()=>setMenu(!menu)}>{menu?"✕":"☰"}</button>
     </div>
   </div>{menu&&<nav className={styles.mobileNav} aria-label="Mobile navigation">{links.map(x=><Link key={x.href} href={x.href} onClick={()=>setMenu(false)}>{x.text}</Link>)}<Link href="/saved" onClick={()=>setMenu(false)}>Saved items</Link><Link href="/messages" onClick={()=>setMenu(false)}>Messages and offers</Link><Link href="/account" onClick={()=>setMenu(false)}>Account</Link></nav>}</header>
   {children}
   <footer className={styles.footer}><div className={styles.footerInner}><div><Link className={styles.logo} href="/">husky<span>✳</span></Link><p>Independent student-led marketplace project. Not affiliated with or endorsed by Northeastern University. Sample listings and conversations are not real transactions.</p></div><nav aria-label="Footer navigation"><Link href="/browse">Shop</Link><Link href="/sell">Sell</Link><Link href="/messages?tab=offers">Offers</Link><Link href="/saved">Saved</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/safety">Safety</Link><Link href="/credits">Photo credits</Link>{email?<button onClick={logout}>Sign out</button>:<Link href="/login">Log in</Link>}</nav></div></footer>
 </div>
}
