"use client";
import Icon from "@/components/Icon";
import type { SavedControls } from "./useSaved";
import styles from "@/components/ui/marketplace/UI.module.css";
import savedStyles from "./Saved.module.css";

export default function SaveButton({
  id,
  title,
  controls,
  card = false,
}: {
  id: string;
  title: string;
  controls: SavedControls;
  card?: boolean;
}) {
  const saved = controls.ids.includes(id);
  const busy = controls.busy.includes(id);
  return (
    <button
      type="button"
      className={`${card ? styles.heart : styles.secondaryButton} ${savedStyles.save} ${saved ? savedStyles.selected : ""}`}
      aria-label={`${saved ? "Unsave" : "Save"} ${title}`}
      aria-pressed={saved}
      aria-busy={busy}
      disabled={!controls.ready || busy}
      onClick={() => void controls.toggle(id)}
    >
      <Icon name="heart" />
      {!card &&
        (busy
          ? saved
            ? "Removing…"
            : "Saving…"
          : saved
            ? "Saved"
            : "Save item")}
    </button>
  );
}

export function SavedError({ controls }: { controls: SavedControls }) {
  if (!controls.error) return null;
  return (
    <div className={`${styles.notice} ${styles.fullWidth}`} role="alert">
      {controls.error}{" "}
      <button type="button" onClick={controls.retry}>
        Retry saved items
      </button>
    </div>
  );
}
