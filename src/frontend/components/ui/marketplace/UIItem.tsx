"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Link from "next/link";
import UIShell from "./UIShell";
import {
  type DemoListing,
  getListings,
  getPhoto,
  getSaved,
  KEYS,
  setStored,
  sellerForListing,
} from "@/lib/ui/demo-data";
import styles from "./UI.module.css";
export default function UIItem({ id }: { id: string }) {
  const [item, setItem] = useState<DemoListing | undefined>(() =>
    getListings().find((x) => x.id === Number(id)),
  );
  const [photoIndex, setPhotoIndex] = useState(0),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    setItem(getListings().find((x) => x.id === Number(id)));
    setSaved(getSaved().includes(String(id)));
  }, [id]);
  if (!item)
    return (
      <UIShell>
        <main className={styles.content}>
          <h1>Listing not found.</h1>
          <Link href="/browse">Browse listings →</Link>
        </main>
      </UIShell>
    );
  const seller = sellerForListing(item.id),
    own = item.source === "local-demo";
  const images = item.photos?.length ? item.photos : [getPhoto(item, 1100)];
  function toggle() {
    const s = new Set(getSaved());
    if (s.has(String(item?.id))) s.delete(String(item?.id));
    else s.add(String(item?.id));
    setSaved(s.has(String(item?.id)));
    setStored(KEYS.saved, [...s]);
  }
  return (
    <UIShell>
      <main className={styles.content}>
        <p className={styles.hint}>
          <Link href="/browse">Shop</Link> / {item.category} / {item.title}
        </p>
        <div className={styles.detailLayout}>
          <section>
            <img
              className={styles.detailImage}
              src={images[photoIndex] || images[0]}
              alt={item.title}
            />
            <div className={styles.detailThumbs}>
              {images.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPhotoIndex(i)}
                  aria-pressed={photoIndex === i}
                  aria-label={`View photo ${i + 1}`}
                  style={{
                    borderColor: i === photoIndex ? "#c8102e" : undefined,
                  }}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
            <section className={styles.panel} style={{ marginTop: 24 }}>
              <h2>Description</h2>
              <p>
                {item.description ||
                  `${item.title} in ${item.condition.toLowerCase()} condition. Available for pickup near ${item.area}.`}
              </p>
              <p>⌖ Pickup near {item.area}</p>
            </section>
          </section>
          <aside className={styles.panel}>
            <p className={styles.eyebrow}>CAMPUS FIND · SAMPLE LISTING</p>
            <h1 className={styles.detailTitle}>{item.title}</h1>
            <div className={styles.detailPrice}>
              {item.price === 0 ? "FREE" : `$${item.price}`}
            </div>
            <p className={styles.hint}>
              {item.condition} condition · {item.area}
            </p>
            <div className={styles.detailActions}>
              {!own ? (
                <Link
                  className={styles.primaryButton}
                  href={`/messages?item=${item.id}`}
                >
                  Message seller
                </Link>
              ) : (
                <Link className={styles.secondaryButton} href="/account">
                  Your demo listing
                </Link>
              )}
              {!own && item.price > 0 && (
                <Link
                  className={styles.secondaryButton}
                  href={`/messages?offer=${item.id}`}
                >
                  Make an offer
                </Link>
              )}
              <button
                type="button"
                className={styles.secondaryButton}
                aria-pressed={saved}
                onClick={toggle}
              >
                {saved ? "♥ Saved" : "♡ Save"}
              </button>
            </div>
            <hr style={{ border: "0", borderTop: "1px solid #ece7e0" }} />
            <h3>Meet the seller</h3>
            <div className={styles.sellerInline}>
              <div className={styles.sellerAvatar}>
                {own ? "YOU" : seller?.initials || "HM"}
              </div>
              <div>
                <strong>{own ? "You" : seller?.name || "Campus seller"}</strong>
                <p className={styles.hint}>
                  {own ? "Stored on this device" : "Fictional demo profile"}
                </p>
              </div>
            </div>
            {seller && (
              <Link href={`/seller/${seller.id}`}>View seller profile →</Link>
            )}
            <p className={styles.notice}>
              This is a sample listing. Messaging and offers are browser-local
              demonstrations; they are not sent to another student.
            </p>
          </aside>
        </div>
      </main>
    </UIShell>
  );
}
