"use client";

import Icon, { type IconName } from "@/components/Icon";
import { useToast } from "@/components/ui/Toast";
import { modeOptions, type FilterPatch, type Filters } from "@/lib/use-filters";
import styles from "./CategoryNav.module.css";

interface Props {
  filters: Filters;
  onChange: (patch: FilterPatch) => void;
}

/** Sticky row of category tabs plus the Filters / Free stuff tools. */
export default function CategoryNav({ filters, onChange }: Props) {
  const toast = useToast();
  const all: { id: string | null; name: string; icon: IconName }[] = [
    { id: null, name: "All", icon: "all" },
    ...modeOptions(filters.mode).cats,
  ];

  return (
    <nav className={styles.cats} aria-label="Categories">
      <div className={styles.inner}>
        <div className={styles.scroll}>
          {all.map((c) => (
            <button
              key={c.id ?? "all"}
              className={`${styles.cat} ${filters.cat === c.id ? styles.on : ""}`}
              onClick={() => onChange({ cat: c.id })}
            >
              <Icon name={c.icon} strokeWidth={1.8} />
              {c.name}
            </button>
          ))}
        </div>
        <div className={styles.tools}>
          <button className={styles.tool} onClick={() => toast("More filters, like condition and course number, come with the search page.")}>
            <Icon name="sliders" />
            <span className={styles.lbl}>Filters</span>
          </button>
          {filters.mode === "goods" && (
            <button className={styles.tool} aria-pressed={filters.free} onClick={() => onChange({ free: !filters.free })}>
              <span className={styles.lbl}>Free stuff only</span>
              <span className={styles.switch} />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
