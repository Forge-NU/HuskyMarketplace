import Link from "next/link";
import UIShell from "@/components/ui/marketplace/UIShell";
import styles from "@/components/ui/marketplace/UI.module.css";
export default function CreditsPage() {
  return (
    <UIShell>
      <main className={styles.content}>
        <header className={styles.contentHead}>
          <p className={styles.eyebrow}>IMAGERY</p>
          <h1>Photo credits.</h1>
          <p>
            The photographic prototype uses demo images hosted by Unsplash. No
            demo listing represents an actual item for sale.
          </p>
        </header>
        <div className={styles.panel}>
          <p>
            Sample imagery is served from{" "}
            <a
              href="https://unsplash.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              Unsplash
            </a>
            . Photographer and individual photo attribution should be reviewed
            and documented before launch.
          </p>
          <Link href="/browse">Browse demo images →</Link>
        </div>
      </main>
    </UIShell>
  );
}
