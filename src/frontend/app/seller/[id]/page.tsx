"use client";
import {useParams} from "next/navigation";
import Link from "next/link";
import PhotoShell from "@/components/PhotoShell";
import PhotoCards from "@/components/PhotoCards";
import {SELLERS,PHOTO_LISTINGS} from "@/lib/photo-data";
import styles from "@/components/Photo.module.css";
export default function SellerPage(){const params=useParams();const seller=SELLERS.find(x=>x.id===Number(params.id));if(!seller)return <PhotoShell><main className={styles.content}><h1>Seller not found.</h1></main></PhotoShell>;
 return <PhotoShell><main className={styles.content}><header className={styles.contentHead}><p className={styles.eyebrow}>CAMPUS SELLER</p><h1>Meet {seller.name}.</h1><p>Sample student profile · {seller.area}</p></header><section className={`${styles.panel} ${styles.profileBanner}`}><div className={styles.profileAvatar}>{seller.initials}</div><div><h2>{seller.name}</h2><p>Northeastern community · General pickup near {seller.area}</p><span className={styles.hint}>Fictional prototype seller; not independently verified</span></div><Link className={`${styles.primaryButton} ${styles.actionsRight}`} href={`/messages?seller=${seller.id}`}>Message seller</Link></section><section className={styles.panel} style={{marginTop:22}}><h2>About {seller.name.split(" ")[0]}</h2><p>{seller.bio}</p></section><section style={{marginTop:35}}><div className={styles.sectionHeading}><h2>{seller.name.split(" ")[0]}&apos;s listings</h2><Link href="/browse">Explore all listings →</Link></div><div className={styles.productGrid}><PhotoCards items={PHOTO_LISTINGS.filter(x=>seller.listingIds.includes(x.id))}/></div></section></main></PhotoShell>
}
