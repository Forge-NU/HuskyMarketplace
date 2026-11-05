"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import UIShell from "@/components/ui/marketplace/UIShell";
import { createClient } from "@/lib/supabase/client";
import {
  currentUser,
  loadListing,
  signedPhotos,
  deleteListing,
} from "@/lib/listings/service";
import {
  isApproved,
  message,
  priceLabel,
  type Listing,
} from "@/lib/listings/model";
import styles from "@/components/ui/marketplace/UI.module.css";
export default function ListingDetail({ id }: { id: string }) {
  const [item, setItem] = useState<Listing | null>(null),
    [images, setImages] = useState<string[]>([]),
    [owner, setOwner] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [photoError, setPhotoError] = useState(""),
    [retry, setRetry] = useState(0),
    [index, setIndex] = useState(0),
    [busy, setBusy] = useState(false),
    [confirm, setConfirm] = useState(false),
    [deleted, setDeleted] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const client = createClient(),
          user = await currentUser(client),
          record = await loadListing(client, id);
        if (!active) return;
        const own = record?.seller_id === user.id;
        if (record && !own && !isApproved(record)) {
          setItem(null);
          return;
        }
        setItem(record);
        setOwner(own);
        setError("");
        setPhotoError("");
        setImages([]);
        setIndex(0);
        if (record) {
          try {
            const urls = await signedPhotos(client, record);
            if (active) setImages(urls);
          } catch (e) {
            if (active) setPhotoError(message(e));
          }
        }
      } catch (e) {
        if (active) setError(message(e));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [id, retry]);
  async function remove() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await deleteListing(createClient(), id);
      setDeleted(true);
    } catch (e) {
      setError(message(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function reload() {
    setLoading(true);
    setRetry((x) => x + 1);
  }
  return (
    <UIShell live>
      <main className={styles.content}>
        <Link href="/browse">Browse listings →</Link>
        {loading ? (
          <p role="status">Loading listing…</p>
        ) : deleted ? (
          <p role="status">
            Listing deleted. <Link href="/my-listings">My listings</Link>
          </p>
        ) : (
          <>
            {error && (
              <div role="alert" className={styles.notice}>
                {error} <button onClick={reload}>Retry</button>
              </div>
            )}
            {!error && !item && <h1>Listing unavailable.</h1>}
            {item && (
              <div className={styles.detailLayout}>
                <section>
                  {images.length && !photoError ? (
                    <>
                      <img
                        className={styles.detailImage}
                        src={images[index]}
                        alt={item.title}
                        onError={() =>
                          setPhotoError(
                            "Photo unavailable. Reload photos to try again.",
                          )
                        }
                      />
                      <div className={styles.detailThumbs}>
                        {images.map((src, i) => (
                          <button
                            key={src}
                            aria-label={`View photo ${i + 1}`}
                            aria-pressed={index === i}
                            onClick={() => setIndex(i)}
                          >
                            <img src={src} alt="" />
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className={styles.notice}>
                      {photoError || "No photos available."}
                    </p>
                  )}
                  {photoError && <button onClick={reload}>Retry photos</button>}
                  <section className={styles.panel}>
                    <h2>Description</h2>
                    <p style={{ whiteSpace: "pre-wrap" }}>
                      {item.description || "No description provided."}
                    </p>
                  </section>
                </section>
                <aside className={styles.panel}>
                  <p className={styles.eyebrow}>
                    {item.categories?.name || "Uncategorized"}
                  </p>
                  <h1 className={styles.detailTitle}>{item.title}</h1>
                  <div className={styles.detailPrice}>
                    {priceLabel(item.price)}
                  </div>
                  <p>
                    {item.condition || "Condition not provided"} ·{" "}
                    {item.location || "Pickup area not provided"}
                  </p>
                  {owner && (
                    <>
                      <p className={styles.notice}>
                        Status: {item.status}
                        {item.status === "pending" &&
                          ". Waiting for moderation; this listing is not public."}
                      </p>
                      <div className={styles.detailActions}>
                        {item.status === "draft" && (
                          <Link
                            className={styles.secondaryButton}
                            href={`/sell?edit=${item.id}`}
                          >
                            Edit draft / submit
                          </Link>
                        )}
                        <Link href="/my-listings">My listings</Link>
                        <button
                          className={styles.secondaryButton}
                          disabled={busy}
                          onClick={() => setConfirm(true)}
                        >
                          Delete listing
                        </button>
                        {confirm && (
                          <div role="alert">
                            <p>Delete this listing permanently?</p>
                            <button disabled={busy} onClick={remove}>
                              {busy ? "Deleting…" : "Yes, delete"}
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => setConfirm(false)}
                            >
                              Keep listing
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </aside>
              </div>
            )}
          </>
        )}
      </main>
    </UIShell>
  );
}
