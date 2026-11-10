"use client";

import { useRef, type FormEvent, type MouseEvent } from "react";
import Icon from "@/components/Icon";
import { CONDITIONS } from "@/lib/listings/model";
import type { SearchFilters } from "@/lib/listings/search";
import styles from "./SearchControls.module.css";

type Props = {
  filters: SearchFilters;
  categories: string[];
  onChange: (values: Record<string, string>) => void;
};

function priceFilterLabel(filters: SearchFilters) {
  if (filters.free || filters.max === "0") return "Free only";
  if (filters.min !== "" && filters.max !== "") {
    return `$${filters.min}–$${filters.max}`;
  }
  if (filters.min !== "") return `From $${filters.min}`;
  return `Up to $${filters.max}`;
}

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
    const min = String(data.get("min") ?? "");
    const max = String(data.get("max") ?? "");
    if (min !== "" && max !== "" && Number(min) > Number(max)) {
      const input = event.currentTarget.elements.namedItem(
        "max",
      ) as HTMLInputElement;
      input.setCustomValidity(
        "Maximum price must be at least the minimum price.",
      );
      input.reportValidity();
      return;
    }
    onChange({
      min,
      cat: String(data.get("cat") ?? ""),
      condition: String(data.get("condition") ?? ""),
      max,
      free: "",
    });
    if (panel.current) {
      panel.current.open = false;
      panel.current.querySelector("summary")?.focus();
    }
  }
  function clearFilters() {
    onChange({ cat: "", condition: "", min: "", max: "", free: "" });
  }

  function setFreePrice(event: MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    if (!form) return;
    for (const name of ["min", "max"]) {
      const input = form.elements.namedItem(name) as HTMLInputElement;
      input.value = "0";
      input.setCustomValidity("");
    }
  }

  function resetFilters(event: MouseEvent<HTMLButtonElement>) {
    event.currentTarget.form?.reset();
    clearFilters();
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
  const chips: { key: string; label: string }[] = [];
  if (filters.category) {
    chips.push({
      key: "cat",
      label:
        categoryOptions.get(filters.category.toLowerCase()) ?? filters.category,
    });
  }
  if (filters.condition)
    chips.push({ key: "condition", label: filters.condition });
  if (filters.free || filters.min !== "" || filters.max !== "") {
    chips.push({ key: "price", label: priceFilterLabel(filters) });
  }

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
            onInput={(event) => {
              const input = event.currentTarget.elements.namedItem(
                "max",
              ) as HTMLInputElement;
              input.setCustomValidity("");
            }}
            key={JSON.stringify([
              filters.category,
              filters.condition,
              filters.min,
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
              <fieldset className={styles.priceRange}>
                <legend>Price</legend>
                <div className={styles.priceInputs}>
                  <label>
                    Minimum
                    <span className={styles.price}>
                      <span aria-hidden="true">$</span>
                      <input
                        name="min"
                        type="number"
                        min="0"
                        max="999999.99"
                        step="0.01"
                        defaultValue={filters.free ? "0" : filters.min}
                        placeholder="0"
                      />
                    </span>
                  </label>
                  <span aria-hidden="true">–</span>
                  <label>
                    Maximum
                    <span className={styles.price}>
                      <span aria-hidden="true">$</span>
                      <input
                        name="max"
                        type="number"
                        min="0"
                        max="999999.99"
                        step="0.01"
                        defaultValue={filters.free ? "0" : filters.max}
                        placeholder="No limit"
                      />
                    </span>
                  </label>
                  <button
                    className={styles.freePrice}
                    type="button"
                    onClick={setFreePrice}
                  >
                    Free
                  </button>
                </div>
              </fieldset>
            </div>
            <div className={styles.panelActions}>
              <button
                className={styles.reset}
                type="button"
                onClick={resetFilters}
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
              onClick={() =>
                onChange(
                  chip.key === "price"
                    ? { min: "", max: "", free: "" }
                    : { [chip.key]: "" },
                )
              }
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
