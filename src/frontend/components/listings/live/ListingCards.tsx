"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { signedPhotos } from "@/lib/listings/service";
import { priceLabel, type Listing } from "@/lib/listings/model";
import styles from "@/components/ui/marketplace/UI.module.css";
function Photo({ item }: { item: Listing }) {
  const [src, setSrc] = useState("");
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    signedPhotos(createClient(), item)
      .then((urls) => {
        if (active) {
          setSrc(urls[0] ?? "");
          setFailed(false);
        }
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [item, retry]);
  return (
    <>
      {src && !failed ? (
        <img
          className={styles.productPhoto}
          src={src}
          alt={item.title}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <p className={styles.notice}>
          {failed ? "Photo unavailable" : "No photo available"}
        </p>
      )}
      {failed && (
        <button type="button" onClick={() => setRetry((x) => x + 1)}>
          Retry photo
        </button>
      )}
    </>
  );
}
export default function ListingCards({
  items,
  manage = false,
}: {
  items: Listing[];
  manage?: boolean;
}) {
  if (!items.length) return <p className={styles.empty}>No listings found.</p>;
  return (
    <>
      {items.map((item) => (
        <article className={styles.productCard} key={item.id}>
          <Photo item={item} />
          <Link className={styles.productLink} href={`/item/${item.id}`}>
            <div className={styles.productInfo}>
              <p className={styles.productPrice}>{priceLabel(item.price)}</p>
              <h3>{item.title}</h3>
              <p className={styles.productMeta}>
                {item.location || "Pickup area not provided"} ·{" "}
                {item.condition || "Condition not provided"}
              </p>
              {manage && <p>Status: {item.status}</p>}
            </div>
          </Link>
        </article>
      ))}
    </>
  );
}
