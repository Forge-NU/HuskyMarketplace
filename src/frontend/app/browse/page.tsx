"use client";
import {Suspense,useEffect,useMemo,useState} from "react";
import {useSearchParams,useRouter} from "next/navigation";
import Link from "next/link";
import PhotoShell from "@/components/PhotoShell";
import PhotoCards from "@/components/PhotoCards";
import {getListings,type DemoListing} from "@/lib/photo-data";
import styles from "@/components/Photo.module.css";
const cats=["All","Clothing","Furniture","Electronics","Books","Free"];
function BrowseContent(){
 const params=useSearchParams(),router=useRouter();
 const [items,setItems]=useState<DemoListing[]>(getListings());
 const [search,setSearch]=useState(params.get("q")||""),[category,setCategory]=useState(()=>cats.find(x=>x.toLowerCase()===params.get("cat")?.toLowerCase())||"All");
 const [max,setMax]=useState(200),[sort,setSort]=useState("new");
 useEffect(()=>{setItems(getListings());const fn=()=>setItems(getListings());window.addEventListener("husky-demo-update",fn);return()=>window.removeEventListener("husky-demo-update",fn)},[]);
 useEffect(()=>{setSearch(params.get("q")||"");setCategory(cats.find(x=>x.toLowerCase()===params.get("cat")?.toLowerCase())|| (params.get("free")==="1"?"Free":"All"))},[params]);
 function changeCat(cat:string){setCategory(cat);const next=new URLSearchParams(params.toString());if(cat==="All"){next.delete("cat");next.delete("free")}else{next.set("cat",cat.toLowerCase());next.delete("free")}router.replace(`/browse${next.toString()?"?"+next.toString():""}`,{scroll:false})}
 const results=useMemo(()=>{const filtered=items.filter(item=>(category==="All"||item.category===category)&&item.price<=max&&`${item.title} ${item.area} ${item.condition}`.toLowerCase().includes(search.trim().toLowerCase()));if(sort==="priceAsc")filtered.sort((a,b)=>a.price-b.price);if(sort==="priceDesc")filtered.sort((a,b)=>b.price-a.price);return filtered},[items,search,category,max,sort]);
 return <PhotoShell><main className={styles.content}><header className={styles.contentHead}><p className={styles.eyebrow}>DISCOVER</p><h1>Find your next thing.</h1><p>Search by price, category, condition, and where to pick up.</p></header>
  <div className={styles.browseLayout}><aside className={`${styles.panel} ${styles.sidebar}`} aria-label="Listing filters"><h2 className={styles.sideTitle}>☰ Filters</h2>
   <fieldset className={styles.filterGroup}><legend>Category</legend>{cats.map(cat=><label key={cat}><input type="radio" name="category" value={cat} checked={category===cat} onChange={()=>changeCat(cat)}/>{cat}</label>)}</fieldset>
   <div className={styles.filterGroup}><label htmlFor="max-price" className={styles.inputLabel}>Max price · ${max}</label><input id="max-price" className={styles.range} type="range" min={0} max={200} step={5} value={max} onChange={e=>setMax(+e.target.value)}/><p className={styles.hint}>Free items are included.</p></div>
   <div className={styles.filterGroup}><h3>Student community</h3><p className={styles.hint}>Sample listing records. Real student verification and live listings are separate backend integration tasks.</p></div>
   <button className={styles.secondaryButton} onClick={()=>{setSearch("");setMax(200);setSort("new");changeCat("All")}}>Clear filters</button>
  </aside>
  <section className={styles.browseResults} aria-label="Student listings"><div className={styles.toolbar}><div className={styles.chips}>{cats.map(cat=><button key={cat} className={`${styles.chipButton} ${category===cat?styles.chipButtonActive:""}`} aria-pressed={category===cat} onClick={()=>changeCat(cat)}>{cat}</button>)}</div><select className={styles.select} aria-label="Sort listings" value={sort} onChange={e=>setSort(e.target.value)}><option value="new">Newest</option><option value="priceAsc">Price: low to high</option><option value="priceDesc">Price: high to low</option></select></div>
  <div className={styles.toolbar}><label style={{flex:"1 1 250px"}}><span className={styles.inputLabel}>Search listings</span><input type="search" className={styles.input} value={search} placeholder="Vintage jacket, headphones, chair..." onChange={e=>setSearch(e.target.value)}/></label><span className={styles.hint}>{results.length} campus listing{results.length===1?"":"s"} · sample data</span></div>
  <div className={styles.productGrid}><PhotoCards items={results}/></div>
  </section></div><p className={styles.notice}>Your photographic prototype&apos;s sample listings and browser-local listings appear here. The team&apos;s original browse UI remains accessible separately at <Link href="/team-browse">/team-browse</Link>.</p>
 </main></PhotoShell>
}
export default function BrowsePage(){return <Suspense><BrowseContent/></Suspense>}
