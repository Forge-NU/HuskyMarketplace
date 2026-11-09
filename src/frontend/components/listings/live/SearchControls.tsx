"use client";

import { useRef, type FormEvent } from "react";
import Icon from "@/components/Icon";
import { CONDITIONS } from "@/lib/listings/model";
import type { SearchFilters } from "@/lib/listings/search";
import styles from "./SearchControls.module.css";

type Props = {
  filters: SearchFilters;
  categories: string[];
  onChange: (values: Record<string, string>) => void;
};

export default function SearchControls({
  filters,
  categories,
  onChange,
}: Props) {
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onChange({ q: String(data.get("q") ?? "").trim() });
  }

  const panel = useRef<HTMLDetailsElement>(null);
  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onChange({
      cat: String(data.get("cat") ?? ""),
      condition: String(data.get("condition") ?? ""),
      max: String(data.get("max") ?? ""),
      free: data.has("free") ? "1" : "",
    });
    if (panel.current) {
      panel.current.open = false;
      panel.current.querySelector("summary")?.focus();
    }
  }
  function clearFilters() {
    onChange({ cat: "", condition: "", max: "", free: "" });
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
          placeholder="Search campus finds"
          maxLength={200}
        />
        <button className={styles.searchButton} type="submit">
          Search
        </button>
      </form>

      <div className={styles.toolbar}>
        <details
          className={styles.filterMenu}
          ref={panel}
          onKeyDown={(event) => {
            if (event.key === "Escape" && panel.current) {
              panel.current.open = false;
              panel.current.querySelector("summary")?.focus();
            }
          }}
        >
          <summary>
            <Icon name="sliders" className={styles.filterIcon} />
            Filters
            {chips.length > 0 && (
              <span className={styles.filterCount}>{chips.length}</span>
            )}
          </summary>
          <form
            className={styles.filterPanel}
            onSubmit={applyFilters}
            key={JSON.stringify([
              filters.category,
              filters.condition,
              filters.max,
              filters.free,
            ])}
          >
            <div className={styles.filters}>
              <label>
                Category
                <select
                  name="cat"
                  defaultValue={filters.category.toLowerCase()}
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
                <select name="condition" defaultValue={filters.condition}>
                  <option value="">Any condition</option>
                  {CONDITIONS.map((condition) => (
                    <option key={condition}>{condition}</option>
                  ))}
                </select>
              </label>
              <label>
                Maximum price
                <span className={styles.price}>
                  <span aria-hidden="true">$</span>
                  <input
                    name="max"
                    type="number"
                    min="0"
                    max="999999.99"
                    step="0.01"
                    defaultValue={filters.max}
                    placeholder="Any price"
                  />
                </span>
              </label>
              <label className={styles.free}>
                <input
                  name="free"
                  type="checkbox"
                  defaultChecked={filters.free}
                />
                Free items only
              </label>
            </div>
            <div className={styles.panelActions}>
              <button
                className={styles.reset}
                type="button"
                onClick={(event) => {
                  event.currentTarget.form?.reset();
                  clearFilters();
                }}
              >
                Reset filters
              </button>
              <button className={styles.searchButton} type="submit">
                Apply filters
              </button>
            </div>
          </form>
        </details>
        <label className={styles.sort}>
          <span className={styles.srOnly}>Sort by</span>
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
          <button className={styles.reset} type="button" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}
