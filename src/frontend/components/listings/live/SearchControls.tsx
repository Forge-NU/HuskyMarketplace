"use client";

import type { FormEvent } from "react";
import Icon from "@/components/Icon";
import { CONDITIONS } from "@/lib/listings/model";
import type { SearchFilters } from "@/lib/listings/search";
import styles from "./SearchControls.module.css";

type Props = {
  filters: SearchFilters;
  categories: string[];
  onChange: (values: Record<string, string>) => void;
  onReset: () => void;
};

export default function SearchControls({
  filters,
  categories,
  onChange,
  onReset,
}: Props) {
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onChange({ q: String(data.get("q") ?? "").trim() });
  }

  function price(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onChange({ max: String(data.get("max") ?? "") });
  }

  const categoryOptions = new Map(
    categories.map((name) => [name.toLowerCase(), name]),
  );
  if (
    filters.category &&
    !categoryOptions.has(filters.category.toLowerCase())
  ) {
    categoryOptions.set(filters.category.toLowerCase(), filters.category);
  }
  const chips = [
    ...(filters.q ? [{ key: "q", label: `Search: ${filters.q}` }] : []),
    ...(filters.category
      ? [
          {
            key: "cat",
            label: categoryOptions.get(filters.category.toLowerCase())!,
          },
        ]
      : []),
    ...(filters.condition
      ? [{ key: "condition", label: filters.condition }]
      : []),
    ...(filters.max !== ""
      ? [{ key: "max", label: `Up to $${filters.max}` }]
      : []),
    ...(filters.free ? [{ key: "free", label: "Free only" }] : []),
  ];

  return (
    <section
      className={styles.controls}
      aria-label="Search and filter listings"
    >
      <form className={styles.search} role="search" onSubmit={search}>
        <Icon name="search" className={styles.searchIcon} />
        <label className={styles.srOnly} htmlFor="browse-search">
          Search campus listings
        </label>
        <input
          key={filters.q}
          id="browse-search"
          name="q"
          type="search"
          defaultValue={filters.q}
          placeholder="Try a desk, headphones, or a winter jacket"
          maxLength={200}
        />
        <button className={styles.searchButton} type="submit">
          Search
        </button>
      </form>

      <div className={styles.filters}>
        <label>
          Category
          <select
            value={filters.category.toLowerCase()}
            onChange={(event) => onChange({ cat: event.target.value })}
          >
            <option value="">All categories</option>
            {[...categoryOptions]
              .sort((a, b) => a[1].localeCompare(b[1]))
              .map(([value, name]) => (
                <option key={value} value={value}>
                  {name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Condition
          <select
            value={filters.condition}
            onChange={(event) => onChange({ condition: event.target.value })}
          >
            <option value="">Any condition</option>
            {CONDITIONS.map((condition) => (
              <option key={condition}>{condition}</option>
            ))}
          </select>
        </label>
        <form onSubmit={price}>
          <label htmlFor="browse-max">Maximum price</label>
          <div className={styles.price}>
            <span aria-hidden="true">$</span>
            <input
              key={filters.max}
              id="browse-max"
              name="max"
              type="number"
              min="0"
              max="999999.99"
              step="0.01"
              defaultValue={filters.max}
              placeholder="Any price"
            />
            <button type="submit" aria-label="Apply maximum price">
              Apply
            </button>
          </div>
        </form>
        <label className={styles.free}>
          <input
            type="checkbox"
            checked={filters.free}
            onChange={(event) =>
              onChange({ free: event.target.checked ? "1" : "" })
            }
          />
          Free only
        </label>
        <label>
          Sort by
          <select
            value={filters.sort}
            onChange={(event) => onChange({ sort: event.target.value })}
          >
            <option value="new">Newest first</option>
            <option value="priceAsc">Price: low to high</option>
            <option value="priceDesc">Price: high to low</option>
          </select>
        </label>
      </div>

      {chips.length > 0 && (
        <div className={styles.activeFilters} aria-label="Active filters">
          {chips.map((chip) => (
            <button
              key={chip.key}
              className={styles.chip}
              type="button"
              onClick={() => onChange({ [chip.key]: "" })}
              aria-label={`Remove ${chip.label}`}
            >
              <span>{chip.label}</span>
              <span aria-hidden="true">×</span>
            </button>
          ))}
          <button className={styles.reset} type="button" onClick={onReset}>
            Clear all
          </button>
        </div>
      )}
    </section>
  );
}
