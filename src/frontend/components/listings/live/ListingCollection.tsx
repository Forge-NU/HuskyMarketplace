"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import UIShell from "@/components/ui/marketplace/UIShell";
import ListingCards from "./ListingCards";
import { createClient } from "@/lib/supabase/client";
import { loadListings } from "@/lib/listings/service";
import { isApproved, message, type Listing } from "@/lib/listings/model";
import styles from "@/components/ui/marketplace/UI.module.css";
export default function ListingCollection({ own = false }: { own?: boolean }) {
  const params = useSearchParams(),
    router = useRouter();
  const [items, setItems] = useState<Listing[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [retry, setRetry] = useState(0);
  const q = params.get("q") ?? "",
    cat = params.get("cat") ?? "",
    sort = params.get("sort") ?? "new",
    condition = params.get("condition") ?? "",
    max = params.get("max") ?? "";
  useEffect(() => {
    let active = true;
    loadListings(createClient(), own)
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
  }, [own, retry]);
  function change(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`?${next}`, { scroll: false });
  }
  const results = useMemo(() => {
    const found = items.filter(
      (i) =>
        (own || isApproved(i)) &&
        (!cat || i.categories?.name.toLowerCase() === cat.toLowerCase()) &&
        (!condition || i.condition === condition) &&
        (max === "" || (i.price !== null && i.price <= Number(max))) &&
        (!(params.get("free") === "1") || i.price === 0) &&
        `${i.title} ${i.description ?? ""} ${i.location ?? ""}`
          .toLowerCase()
          .includes(q.trim().toLowerCase()),
    );
    if (sort === "priceAsc" || sort === "priceDesc")
      found.sort((a, b) =>
        a.price === null
          ? 1
          : b.price === null
            ? -1
            : sort === "priceAsc"
              ? a.price - b.price
              : b.price - a.price,
      );
    return found;
  }, [items, own, cat, condition, max, params, q, sort]);
  return (
    <UIShell live>
      <main className={styles.content}>
        <header className={styles.contentHead}>
          <p className={styles.eyebrow}>
            {own ? "YOUR MARKETPLACE" : "DISCOVER"}
          </p>
          <h1>{own ? "My listings" : "Find your next thing."}</h1>
          <p>
            {own
              ? "Drafts stay private. Submitted listings wait for moderation."
              : "Browse approved campus listings."}
          </p>
          <Link href={own ? "/sell" : "/my-listings"}>
            {own ? "Create a listing →" : "Manage my listings →"}
          </Link>
        </header>
        {!own && (
          <div className={styles.panel}>
            <div className={styles.formGrid}>
              <label>
                Search listings
                <input
                  className={styles.input}
                  type="search"
                  value={q}
                  onChange={(e) => change("q", e.target.value)}
                />
              </label>
              <label>
                Category
                <select
                  className={styles.input}
                  value={cat}
                  onChange={(e) => change("cat", e.target.value)}
                >
                  <option value="">All</option>
                  {Array.from(
                    new Set(
                      items.flatMap((i) =>
                        i.categories ? [i.categories.name] : [],
                      ),
                    ),
                  ).map((c) => (
                    <option key={c} value={c.toLowerCase()}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Condition
                <select
                  className={styles.input}
                  value={condition}
                  onChange={(e) => change("condition", e.target.value)}
                >
                  <option value="">Any</option>
                  {["New", "Like new", "Excellent", "Good", "Fair"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Maximum price
                <input
                  className={styles.input}
                  type="number"
                  min="0"
                  step="0.01"
                  value={max}
                  onChange={(e) => change("max", e.target.value)}
                />
              </label>
              <label>
                Sort
                <select
                  className={styles.input}
                  value={sort}
                  onChange={(e) => change("sort", e.target.value)}
                >
                  <option value="new">Newest</option>
                  <option value="priceAsc">Price: low to high</option>
                  <option value="priceDesc">Price: high to low</option>
                </select>
              </label>
            </div>
            <button
              className={styles.secondaryButton}
              onClick={() => router.replace("/browse")}
            >
              Clear filters
            </button>
          </div>
        )}
        {loading ? (
          <p role="status">Loading listings…</p>
        ) : error ? (
          <div role="alert" className={styles.notice}>
            <p>{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                setRetry((x) => x + 1);
              }}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <p role="status">{results.length} listing(s)</p>
            <div className={styles.productGrid}>
              <ListingCards items={results} manage={own} />
            </div>
          </>
        )}
      </main>
    </UIShell>
  );
}
