"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { loadFeaturedListings } from "@/lib/listings/service";
import { message, type Listing } from "@/lib/listings/model";
import ListingCards from "./ListingCards";
import styles from "@/components/ui/marketplace/UI.module.css";
import searchStyles from "./SearchControls.module.css";

export default function FeaturedListings() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    loadFeaturedListings(createClient())
      .then((data) => {
        if (active) {
          setItems(data);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(message(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  if (loading)
    return (
      <p className={styles.hint} role="status">
        Loading fresh finds…
      </p>
    );
  if (error)
    return (
      <div className={searchStyles.state} role="alert">
        <h3>We couldn’t load fresh finds.</h3>
        <p>{error}</p>
        <button
          className={styles.secondaryButton}
          onClick={() => {
            setLoading(true);
            setRetry((value) => value + 1);
          }}
        >
          Try again
        </button>
      </div>
    );
  if (!items.length)
    return (
      <div className={searchStyles.state}>
        <h3>Something good starts with your first listing.</h3>
        <p>No items are available right now. Have something to pass along?</p>
        <Link className={styles.primaryButton} href="/sell">
          Post an item
        </Link>
      </div>
    );
  return (
    <div className={styles.featuredGrid}>
      <ListingCards items={items} />
    </div>
  );
}
