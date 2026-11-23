"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import Icon from "@/components/Icon";
import { priceLabel, type Details } from "@/lib/listings/model";
import styles from "./ListingPreview.module.css";

export default function ListingPreview({
  details,
  photos,
  category,
  pending,
  savedPhotosUnavailable = false,
}: {
  details: Details;
  photos: string[];
  category: string;
  pending: boolean;
  savedPhotosUnavailable?: boolean;
}) {
  const [selected, setSelected] = useState("");
  const [failedPhoto, setFailedPhoto] = useState("");
  const photo = photos.includes(selected) ? selected : photos[0];
  const price = details.price.trim() === "" ? null : Number(details.price);

  return (
    <aside className={styles.preview} aria-labelledby="listing-preview-title">
      <div className={styles.heading}>
        <h2 id="listing-preview-title">Your listing preview</h2>
        <span>{pending ? "Pending review" : "Only you can see this"}</span>
      </div>
      <article className={styles.card}>
        <div className={styles.cover}>
          {photo && photo !== failedPhoto ? (
            <img
              src={photo}
              alt={details.title.trim() || "Your item"}
              onError={() => setFailedPhoto(photo)}
            />
          ) : (
            <div className={styles.placeholder}>
              <Icon name="box" />
              <strong>
                {photo ? "Photo unavailable" : "Your item goes here"}
              </strong>
              <span>
                {photo
                  ? "Try another photo or reopen your draft to reload saved photos."
                  : "Add a photo to bring your listing to life."}
              </span>
            </div>
          )}
          <span className={styles.badge}>Preview</span>
        </div>
        {photos.length > 1 && (
          <div className={styles.thumbnails} aria-label="Preview photos">
            {photos.map((src, index) => (
              <button
                key={src}
                type="button"
                aria-label={`Show photo ${index + 1}`}
                aria-pressed={src === photo}
                onClick={() => setSelected(src)}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        )}
        <div className={styles.details}>
          {category && <p className={styles.category}>{category}</p>}
          <p className={styles.price}>
            {price !== null && Number.isFinite(price) && price >= 0
              ? priceLabel(price)
              : "Add a price"}
          </p>
          <h3>{details.title.trim() || "Your item title"}</h3>
          <p className={styles.meta}>
            <Icon name="pin" />
            {details.location.trim() || "Pickup area"} ·{" "}
            {details.condition || "Condition"}
          </p>
          <p className={styles.description}>
            {details.description.trim() ||
              "Tell students a little about your item, its condition, and what’s included."}
          </p>
        </div>
      </article>
      {savedPhotosUnavailable && (
        <p className={styles.note}>
          Saved photos could not load. Reopen your draft to try again; your
          photos have not been removed.
        </p>
      )}
      <p className={styles.note}>
        <Icon name="shield" />
        {pending
          ? "Submitted for review. It will appear in Browse after approval."
          : "This is a preview, not a published listing. Save your draft, then submit it for review."}
      </p>
    </aside>
  );
}
