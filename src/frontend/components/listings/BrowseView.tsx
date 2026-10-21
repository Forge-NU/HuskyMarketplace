"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import { useToast } from "@/components/ui/Toast";
import { filterListings, modeOptions, useFilters } from "@/lib/use-filters";
import CategoryNav from "./CategoryNav";
import ListingGrid from "./ListingGrid";
import styles from "./BrowseView.module.css";

export default function BrowseView() {
  const toast = useToast();
  const { filters, update } = useFilters();
  // Not persisted yet; moves to the backend once sign-in exists.
  const [saved, setSaved] = useState<Set<number>>(new Set());

  const items = filterListings(filters);
  const { noun } = modeOptions(filters.mode);

  function toggleSave(id: number) {
    const next = new Set(saved);
    if (next.delete(id)) toast("Removed from saved items");
    else { next.add(id); toast("Added to saved items"); }
    setSaved(next);
  }

  return (
    <>
      <CategoryNav filters={filters} onChange={update} />
      <main className={styles.wrap} id="results">
        <p className={styles.count}>
          {items.length} {noun}{items.length === 1 ? "" : "s"} from verified Northeastern students
        </p>
        <ListingGrid
          listings={items}
          saved={saved}
          onToggleSave={toggleSave}
          empty={<>
            <strong>No {noun}s match those filters</strong>
            <span className="muted">Try another category, or raise the max price.</span>
          </>}
        />
      </main>
      <button className={styles.mapbtn} onClick={() => toast("A campus map of meetup spots is a later feature.")}>
        Show campus map <Icon name="map" />
      </button>
    </>
  );
}
