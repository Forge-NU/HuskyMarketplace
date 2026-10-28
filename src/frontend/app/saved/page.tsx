"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import PhotoShell from "@/components/PhotoShell";
import PhotoCards from "@/components/PhotoCards";
import {type DemoListing,getListings,getSaved} from "@/lib/photo-data";
import styles from "@/components/Photo.module.css";
export default function SavedPage(){const [items,setItems]=useState<DemoListing[]>([]);
 useEffect(()=>{const update=()=>setItems(getListings().filter(x=>getSaved().includes(String(x.id))));update();window.addEventListener("husky-demo-update",update);return()=>window.removeEventListener("husky-demo-update",update)},[]);
 return <PhotoShell><main className={styles.content}><header className={styles.contentHead}><p className={styles.eyebrow}>YOUR SHORTLIST</p><h1>Saved for later.</h1><p>Keep track of the campus finds you love. Your demo saves are stored in this browser only.</p></header><p className={styles.hint}>{items.length} saved item{items.length===1?"":"s"}</p><div className={styles.productGrid}>{items.length?<PhotoCards items={items}/>:<div className={`${styles.empty} ${styles.fullWidth}`}>No saved items yet. <Link href="/browse">Browse listings →</Link></div>}</div></main></PhotoShell>
}
