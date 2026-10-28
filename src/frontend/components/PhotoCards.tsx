"use client";
/* eslint-disable @next/next/no-img-element */
import {useEffect,useState} from "react";
import Link from "next/link";
import {type DemoListing,getPhoto,getSaved,KEYS,setStored} from "@/lib/photo-data";
import styles from "./Photo.module.css";

export default function PhotoCards({items}:{items:DemoListing[]}){
 const [saved,setSaved]=useState<string[]>([]);
 useEffect(()=>{setSaved(getSaved());const cb=()=>setSaved(getSaved());window.addEventListener("husky-demo-update",cb);return()=>window.removeEventListener("husky-demo-update",cb)},[]);
 function toggle(id:number){const s=new Set(saved);if(s.has(String(id)))s.delete(String(id));else s.add(String(id));const next=[...s];setSaved(next);setStored(KEYS.saved,next)}
 if(!items.length)return <div className={`${styles.empty} ${styles.fullWidth}`}>No matches yet. Try another category or search.</div>;
 return <>{items.map(item=><article className={styles.productCard} key={item.id}>
  <Link className={styles.productLink} href={`/item/${item.id}`} aria-label={`View ${item.title}`}>
   <img className={styles.productPhoto} src={getPhoto(item,650)} alt={item.title} loading="lazy"/>
   <div className={styles.productInfo}><p className={styles.productPrice}>{item.price===0?"FREE":`$${item.price}`}</p><h3>{item.title}</h3><p className={styles.productMeta}>⌖ {item.area} · {item.condition}</p></div>
  </Link>
  {item.tag&&<span className={styles.tag}>{item.tag}</span>}
  <button type="button" className={`${styles.heart} ${saved.includes(String(item.id))?styles.heartSaved:""}`} aria-pressed={saved.includes(String(item.id))} aria-label={`${saved.includes(String(item.id))?"Unsave":"Save"} ${item.title}`} onClick={()=>toggle(item.id)}>{saved.includes(String(item.id))?"♥":"♡"}</button>
 </article>)}</>
}
