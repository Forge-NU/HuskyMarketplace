import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/Icon";
import { fmtPrice, ratingShort } from "@/lib/format";
import type { Listing } from "@/lib/types";
import styles from "./ListingCard.module.css";

interface Props {
  listing: Listing;
  saved: boolean;
  onToggleSave: (id: number) => void;
}

function badgeFor(l: Listing): string {
  if (l.featured) return "Featured";
  if (l.posted === "Just now") return "New";
  if (l.kind === "good" && l.obo) return "Open to offers";
  return "";
}

export function PriceTag({ listing: l }: { listing: Listing }) {
  if (l.kind === "good" && l.price === 0) return <span className={styles.free}>Free</span>;
  return <b>{fmtPrice(l)}</b>;
}

export default function ListingCard({ listing: l, saved, onToggleSave }: Props) {
  const href = `/listings/${l.id}`;
  const badge = badgeFor(l);

  return (
    <article className={styles.card}>
      <div className={styles.media}>
        <Link className={styles.img} href={href} style={{ background: l.tint }} aria-label={`View ${l.title}`}>
          {l.photo
            ? <Image className={styles.photo} src={l.photo} alt="" fill sizes="(max-width: 560px) 50vw, 240px" />
            : <Icon name={l.icon} strokeWidth={1.3} />}
        </Link>
        {badge && <span className={styles.badge}>{badge}</span>}
        <button
          className={`${styles.heart} ${saved ? styles.on : ""}`}
          aria-label={`${saved ? "Unsave" : "Save"} ${l.title}`}
          aria-pressed={saved}
          onClick={() => onToggleSave(l.id)}
        >
          <Icon name="heart" />
        </button>
      </div>
      <div className={styles.row}>
        <Link className={styles.title} href={href}>{l.title}</Link>
        <span className={styles.rating}>{ratingShort(l.seller)}</span>
      </div>
      <span className={styles.meta}>{l.kind === "service" ? "Where: " : "Meet at "}{l.meetup}</span>
      <span className={styles.meta}>{l.seller.name}</span>
      <span className={styles.price}><PriceTag listing={l} /></span>
    </article>
  );
}
