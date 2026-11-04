import type { Listing } from "@/lib/types";
import ListingCard from "./ListingCard";
import styles from "./ListingGrid.module.css";

interface Props {
  listings: Listing[];
  saved: Set<number>;
  onToggleSave: (id: number) => void;
  /** Shown when `listings` is empty. */
  empty: React.ReactNode;
}

export default function ListingGrid({
  listings,
  saved,
  onToggleSave,
  empty,
}: Props) {
  return (
    <div className={styles.grid}>
      {listings.length ? (
        listings.map((l) => (
          <ListingCard
            key={l.id}
            listing={l}
            saved={saved.has(l.id)}
            onToggleSave={onToggleSave}
          />
        ))
      ) : (
        <div className={styles.empty}>{empty}</div>
      )}
    </div>
  );
}
