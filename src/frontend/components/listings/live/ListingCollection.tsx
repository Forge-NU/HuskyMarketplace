"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import UIShell from "@/components/ui/marketplace/UIShell";
import ListingCards from "./ListingCards";
import { createClient } from "@/lib/supabase/client";
import { loadListings, categories } from "@/lib/listings/service";
import { message, type Listing } from "@/lib/listings/model";
import styles from "@/components/ui/marketplace/UI.module.css";
import Icon from "@/components/Icon";
import SearchControls from "./SearchControls";
import {
  readSearch,
  filterListings,
  updateSearch,
} from "@/lib/listings/search";
import searchStyles from "./SearchControls.module.css";

export default function ListingCollection({ own = false }: { own?: boolean }) {
  const params = useSearchParams(),
    router = useRouter();
  const [items, setItems] = useState<Listing[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [loadedQuery, setLoadedQuery] = useState<string | null>(null),
    [categoryNames, setCategoryNames] = useState<string[]>([]),
    [retry, setRetry] = useState(0);
  const filters = readSearch(params);
  const q = filters.q;
  useEffect(() => {
    let active = true;
    const client = createClient();
    Promise.all([
      loadListings(client, own, q),
      own ? Promise.resolve([]) : categories(client),
    ])
      .then(([data, categoryRows]) => {
        if (active) {
          setItems(data);
          setCategoryNames(categoryRows.map((category) => category.name));
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(message(e));
      })
      .finally(() => {
        if (active) {
          setLoadedQuery(q);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [own, retry, q]);
  function change(values: Record<string, string>) {
    const next = updateSearch(params.toString(), values);
    router.replace(next.size ? `?${next}` : "/browse", { scroll: false });
  }
  // Keywords are matched by Postgres, including stemming and websearch syntax.
  const results = filterListings(items, { ...filters, q: "" }, own);
  function reset() {
    router.replace("/browse", { scroll: false });
  }
  return (
    <UIShell live>
      <main className={styles.content}>
        <header
          className={`${styles.contentHead} ${own ? "" : searchStyles.heading}`}
        >
          {own && <p className={styles.eyebrow}>YOUR MARKETPLACE</p>}
          <h1>{own ? "My listings" : "Find your next thing."}</h1>
          <p>
            {own
              ? "Drafts stay private. Submitted listings wait for moderation."
              : "Browse approved campus listings."}
          </p>
          {own && <Link href="/sell">Create a listing →</Link>}
        </header>
        {!own && (
          <SearchControls
            filters={filters}
            categories={categoryNames}
            onChange={change}
          />
        )}
        {loading || loadedQuery !== q ? (
          <div className={searchStyles.state} role="status">
            <Icon name="search" className={searchStyles.stateIcon} />
            <h2>Finding campus listings…</h2>
            <p>Your search and filters will stay in place.</p>
          </div>
        ) : error ? (
          <div className={searchStyles.state} role="alert">
            <Icon name="search" className={searchStyles.stateIcon} />
            <h2>We couldn’t load listings.</h2>
            <p>{error}</p>
            <div className={searchStyles.stateActions}>
              <button
                className={styles.primaryButton}
                onClick={() => {
                  setLoading(true);
                  setRetry((value) => value + 1);
                }}
              >
                Try again
              </button>
              {!own && (
                <Link className={styles.secondaryButton} href="/">
                  Explore the demo
                </Link>
              )}
            </div>
            {!own && (
              <p>The demo uses sample listings, separate from live results.</p>
            )}
          </div>
        ) : (
          <>
            <div className={searchStyles.results}>
              <p role="status">
                {results.length} {results.length === 1 ? "listing" : "listings"}
                {filters.q ? ` for “${filters.q}”` : ""}
              </p>
            </div>
            {results.length ? (
              <div className={styles.productGrid}>
                <ListingCards items={results} manage={own} />
              </div>
            ) : (
              <div className={searchStyles.state}>
                <Icon name="search" className={searchStyles.stateIcon} />
                <h2>
                  {own
                    ? "Your next listing starts here."
                    : "No finds just yet."}
                </h2>
                <p>
                  {own
                    ? "Create your first draft and add a few photos."
                    : "Try a different keyword, a higher price limit, or fewer filters."}
                </p>
                {own ? (
                  <Link className={styles.primaryButton} href="/sell">
                    Create a listing
                  </Link>
                ) : (
                  <button className={styles.secondaryButton} onClick={reset}>
                    Clear search and filters
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </UIShell>
  );
}
