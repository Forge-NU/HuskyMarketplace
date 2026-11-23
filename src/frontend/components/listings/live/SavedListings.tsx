"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import UIShell from "@/components/ui/marketplace/UIShell";
import { createClient } from "@/lib/supabase/client";
import {
  loadSavedPage,
  SAVED_PAGE_SIZE,
  type SavedListing,
} from "@/lib/saved/service";
import { message } from "@/lib/listings/model";
import { useSaved, SAVED_UPDATED } from "./useSaved";
import { ListingCard } from "./ListingCards";
import SaveButton, { SavedError } from "./SaveButton";
import styles from "@/components/ui/marketplace/UI.module.css";
import savedStyles from "./Saved.module.css";

export default function SavedListings() {
  const params = useSearchParams();
  const requested = Number(params.get("page") ?? "1");
  const page =
    Number.isSafeInteger(requested) && requested > 0 && requested <= 100000
      ? requested
      : 1;
  const [items, setItems] = useState<SavedListing[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadedPage, setLoadedPage] = useState(0);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const version = useRef(0);
  const saved = useSaved(items.map((item) => item.listing_id));
  useEffect(() => {
    let active = true;
    const request = ++version.current;
    const client = createClient();
    loadSavedPage(client, page)
      .then((data) => {
        if (active && version.current === request) {
          setItems(data.items);
          setCount(data.count);
          setError("");
        }
      })
      .catch((e) => {
        if (active && version.current === request) setError(message(e));
      })
      .finally(() => {
        if (active && version.current === request) {
          setLoadedPage(page);
          setLoading(false);
        }
      });
    function refresh() {
      version.current++;
      setLoading(true);
      setRetry((value) => value + 1);
    }
    const { data } = client.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") refresh();
    });
    window.addEventListener(SAVED_UPDATED, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      data.subscription.unsubscribe();
      window.removeEventListener(SAVED_UPDATED, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [page, retry]);
  return (
    <UIShell live>
      <main className={styles.content}>
        <header className={styles.contentHead}>
          <p className={styles.eyebrow}>YOUR SHORTLIST</p>
          <h1>Saved for later.</h1>
          <p>Your campus finds, saved to your account.</p>
          <Link href="/demo/saved">View demo saves</Link>
        </header>
        {loading || loadedPage !== page ? (
          <p role="status">Loading saved items…</p>
        ) : error ? (
          <div className={styles.notice} role="alert">
            <p>{error}</p>
            <button
              className={styles.secondaryButton}
              onClick={() => {
                version.current++;
                setLoading(true);
                setRetry((value) => value + 1);
              }}
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <p className={styles.hint}>
              {count} saved item{count === 1 ? "" : "s"}
            </p>
            <SavedError controls={saved} />
            <div className={styles.productGrid}>
              {items.length ? (
                items.map((row) =>
                  row.listings ? (
                    <ListingCard
                      key={row.listing_id}
                      item={row.listings}
                      saved={saved}
                    />
                  ) : (
                    <article
                      key={row.listing_id}
                      className={`${styles.productCard} ${savedStyles.unavailable}`}
                    >
                      <h2>Listing unavailable</h2>
                      <p>
                        This item is no longer available. You can remove it from
                        your saves.
                      </p>
                      <SaveButton
                        id={row.listing_id}
                        title="unavailable listing"
                        controls={saved}
                      />
                    </article>
                  ),
                )
              ) : (
                <div className={`${styles.empty} ${styles.fullWidth}`}>
                  {count ? (
                    <>
                      No saved items on this page.{" "}
                      <Link href="/saved">Return to your saves →</Link>
                    </>
                  ) : (
                    <>
                      No saved items yet.{" "}
                      <Link href="/browse">Browse listings →</Link>
                    </>
                  )}
                </div>
              )}
            </div>
            {items.length > 0 && count > SAVED_PAGE_SIZE && (
              <nav
                aria-label="Saved items pages"
                className={savedStyles.pagination}
              >
                {page > 1 && (
                  <Link
                    href={page === 2 ? "/saved" : `/saved?page=${page - 1}`}
                  >
                    Previous
                  </Link>
                )}
                <span>
                  Page {page} of {Math.ceil(count / SAVED_PAGE_SIZE)}
                </span>
                {page * SAVED_PAGE_SIZE < count && (
                  <Link href={`/saved?page=${page + 1}`}>Next</Link>
                )}
              </nav>
            )}
          </>
        )}
      </main>
    </UIShell>
  );
}
