"use client";

import { modeOptions, useFilters } from "@/lib/use-filters";
import Icon from "./Icon";
import styles from "./SearchPill.module.css";

/** The search + filter bar in the header. Reads and writes the URL filters. */
export default function SearchPill() {
  const { filters, update } = useFilters();
  const opts = modeOptions(filters.mode);

  return (
    <form
      className={styles.pill}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        document.getElementById("results")?.scrollIntoView({ block: "start" });
      }}
    >
      <div className={styles.seg}>
        <label htmlFor="q">What</label>
        <input
          id="q"
          type="search"
          // Uncontrolled so typing never lags behind the URL; remounts (clears) on mode switch.
          key={filters.mode}
          defaultValue={filters.q}
          placeholder={opts.placeholder}
          onChange={(e) => update({ q: e.target.value })}
        />
      </div>
      <div className={`${styles.seg} ${styles.opt}`}>
        <label htmlFor="fcat">Category</label>
        <select id="fcat" value={filters.cat ?? ""} onChange={(e) => update({ cat: e.target.value })}>
          <option value="">Any category</option>
          {opts.cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className={`${styles.seg} ${styles.opt}`}>
        <label htmlFor="fmax">Max price</label>
        <select id="fmax" value={filters.max ?? ""} onChange={(e) => update({ max: Number(e.target.value) || null })}>
          <option value="">Any price</option>
          {opts.maxPrices.map((n) => <option key={n} value={n}>${n}</option>)}
        </select>
      </div>
      <div className={`${styles.seg} ${styles.opt}`}>
        <label htmlFor="fmeet">{opts.meetLabel}</label>
        <select id="fmeet" value={filters.meet ?? ""} onChange={(e) => update({ meet: e.target.value })}>
          <option value="">{opts.meetAny}</option>
          {opts.meetups.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>
      <button className={styles.go} type="submit" aria-label="Search">
        <Icon name="search" />
      </button>
    </form>
  );
}
