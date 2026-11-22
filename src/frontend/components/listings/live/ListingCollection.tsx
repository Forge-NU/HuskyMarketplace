"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import UIShell from "@/components/ui/marketplace/UIShell";
import ListingCards from "./ListingCards";
import { createClient } from "@/lib/supabase/client";
import { loadListingPage, categories, PAGE_SIZE } from "@/lib/listings/service";
import { message, type Listing } from "@/lib/listings/model";
import styles from "@/components/ui/marketplace/UI.module.css";
import Icon from "@/components/Icon";
import SearchControls from "./SearchControls";
import { readSearch, updateSearch } from "@/lib/listings/search";
import searchStyles from "./SearchControls.module.css";

export default function ListingCollection({ own = false }: { own?: boolean }) {
  const params = useSearchParams();
  const [items, setItems] = useState<Listing[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [loadedQuery, setLoadedQuery] = useState<string | null>(null),
    [count, setCount] = useState(0),
    [categoryNames, setCategoryNames] = useState<string[]>([]),
    [retry, setRetry] = useState(0);
  const filters = readSearch(params);
  const query = JSON.stringify(filters);
  useEffect(() => {
    let active = true;
    const client = createClient();
    Promise.all([
      loadListingPage(client, JSON.parse(query), own),
      own ? Promise.resolve([]) : categories(client),
    ])
      .then(([data, categoryRows]) => {
        if (active) {
          setItems(data.items);
          setCount(data.count);
          setCategoryNames(categoryRows.map((category) => category.name));
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(message(e));
      })
      .finally(() => {
        if (active) {
          setLoadedQuery(query);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [own, retry, query]);
  function change(values: Record<string, string>) {
    const next = updateSearch(window.location.search, values);
    const path = own ? "/my-listings" : "/browse";
    window.history.pushState(null, "", next.size ? `${path}?${next}` : path);
  }
  function reset() {
    window.history.pushState(null, "", own ? "/my-listings" : "/browse");
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
        {loading || loadedQuery !== query ? (
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
              {filters.page > 1 && (
                <button
                  className={styles.secondaryButton}
                  onClick={() => change({ page: "" })}
                >
                  Back to first page
                </button>
              )}
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
                {count} {count === 1 ? "listing" : "listings"}
                {filters.q ? ` for “${filters.q}”` : ""}
              </p>
            </div>
            {items.length ? (
              <div className={styles.productGrid}>
                <ListingCards items={items} manage={own} />
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
            {count > PAGE_SIZE && (
              <nav
                className={searchStyles.pagination}
                aria-label="Listing pages"
              >
                <button
                  className={styles.secondaryButton}
                  disabled={filters.page === 1}
                  onClick={() => change({ page: String(filters.page - 1) })}
                >
                  Previous
                </button>
                <span>
                  Page {filters.page} of {Math.ceil(count / PAGE_SIZE)}
                </span>
                <button
                  className={styles.secondaryButton}
                  disabled={filters.page * PAGE_SIZE >= count}
                  onClick={() => change({ page: String(filters.page + 1) })}
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </main>
    </UIShell>
  );
}
