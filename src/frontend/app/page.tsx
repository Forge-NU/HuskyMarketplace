"use client";
/* eslint-disable @next/next/no-img-element */
import {useEffect,useState} from "react";
import Link from "next/link";
import PhotoShell from "@/components/PhotoShell";
import PhotoCards from "@/components/PhotoCards";
import {getListings,type DemoListing} from "@/lib/photo-data";
import styles from "@/components/Photo.module.css";
const categories=[
  {title:"Clothes & vintage",subtitle:"Closet finds",href:"/browse?cat=clothing",color:"orange",photo:"photo-1666861585341-5bd1e7b1ed71",alt:"Vintage denim jacket"},
  {title:"Dorm & living",subtitle:"Dorm room stuff",href:"/browse?cat=furniture",color:"yellow",photo:"photo-1721743141584-73679ed9938c",alt:"White desk chair"},
  {title:"Tech & school",subtitle:"Good deals",href:"/browse?cat=electronics",color:"blue",photo:"photo-1505740420928-5e560c06d30e",alt:"Wireless headphones"},
  {title:"Free stuff",subtitle:"Take it home",href:"/browse?cat=free",color:"red",photo:"photo-1755504980103-374cf009b201",alt:"Small potted plant"},
] as const;
export default function HomePage(){
 const [featured,setFeatured]=useState<DemoListing[]>(getListings().slice(0,4));
 useEffect(()=>{setFeatured(getListings().slice(0,4))},[]);
 return <PhotoShell><main>
   <section className={`${styles.shell} ${styles.hero}`}><div className={styles.heroCopy}>
    <p className={styles.eyebrow}>FOR STUDENTS. AROUND CAMPUS.</p>
    <h1>Your next great find is close to home<span>.</span></h1>
    <p>Buy what you need, sell what you don&apos;t, and keep good stuff moving around Northeastern.</p>
    <div className={styles.actions}><Link className={styles.primaryButton} href="/browse">Explore listings ↗</Link><Link className={styles.secondaryButton} href="/sell">Sell an item</Link></div>
    <p className={styles.heroFoot}>Secondhand finds · Campus pickup · Student community</p></div>
    <div className={styles.heroArt}><img alt="White desk chair in a bright room" src="https://images.unsplash.com/photo-1721743141584-73679ed9938c?auto=format&fit=crop&w=1100&q=85"/><div className={styles.heroSticker}><strong>$45</strong><span>White desk chair</span><small>Campus find · sample listing</small></div></div>
   </section>
   <section className={`${styles.shell} ${styles.section}`}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>FIND YOUR THING</p><h2>Shop by category.</h2></div><Link href="/browse">Browse everything →</Link></div>
    <div className={styles.categories}>{categories.map(c=><Link href={c.href} key={c.title} className={`${styles.categoryCard} ${styles[c.color]}`}><span className={styles.categoryCopy}><strong>{c.title}</strong><small>{c.subtitle} ↗</small></span><span className={styles.categoryPhoto}><img src={`https://images.unsplash.com/${c.photo}?auto=format&fit=crop&w=540&q=80`} alt={c.alt}/></span></Link>)}</div>
   </section>
   <section className={`${styles.shell} ${styles.section}`}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>AROUND CAMPUS</p><h2>Fresh finds.</h2></div><Link href="/browse">All listings →</Link></div>
    <div className={styles.featuredGrid}><PhotoCards items={featured}/></div>
   </section>
   <section className={`${styles.shell} ${styles.section}`} id="moving"><div className={styles.moving}><div><p className={styles.eyebrow}>MOVE-IN / MOVE-OUT</p><h2>Moving day, made easier.</h2><p>Buying a desk? Clearing your dorm? Keep pickup and handoff organized with student-to-student messages.</p><Link className={styles.secondaryButton} href="/moving">Explore moving help →</Link></div><span className={styles.movingArt} aria-hidden="true">↗</span></div></section>
   <section className={`${styles.shell} ${styles.homeNote}`}><p>Sample items, chats, offers, and created demo listings are stored in your browser. They are not shared with other students.</p></section>
  </main></PhotoShell>
}
