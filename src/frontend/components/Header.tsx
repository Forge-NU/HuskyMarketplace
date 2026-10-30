"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useFilters } from "@/lib/use-filters";
import type { Mode } from "@/lib/types";
import Icon from "./Icon";
import SearchPill from "./SearchPill";
import Skyline from "./Skyline";
import { useToast } from "./ui/Toast";
import styles from "./Header.module.css";

const MODES: { id: Mode; label: string }[] = [
  { id: "goods", label: "Goods" },
  { id: "services", label: "Services" },
];

function ModeTabs() {
  const router = useRouter();
  const { filters } = useFilters();
  return (
    <div className={styles.modes} role="tablist">
      {MODES.map((m) => (
        <button
          key={m.id}
          className={`${styles.mode} ${filters.mode === m.id ? styles.on : ""}`}
          role="tab"
          aria-selected={filters.mode === m.id}
          // Switching mode starts a fresh search, like the prototype's setMode().
          onClick={() =>
            router.push(
              m.id === "services" ? "/browse?mode=services" : "/browse",
            )
          }
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className={styles.iconBtn}
      aria-label="Log out"
      title="Log out"
      onClick={async () => {
        await createClient().auth.signOut();
        router.replace("/login");
        router.refresh();
      }}
    >
      <Icon name="logout" />
    </button>
  );
}

/** `userEmail` is null when logged out (only possible on /login). */
export default function Header({ userEmail }: { userEmail: string | null }) {
  const toast = useToast();
  const isBrowse = usePathname() === "/browse";
  return (
    <header className={`${styles.head} ${isBrowse ? "" : styles.plain}`}>
      <div className={styles.row}>
        <Link
          className={styles.wordmark}
          href="/"
          aria-label="Husky Marketplace home"
        >
          <span className={styles.paw}>H</span>Husky <small>Marketplace</small>
        </Link>
        <Suspense fallback={<div className={styles.modes} />}>
          <ModeTabs />
        </Suspense>
        {userEmail && (
          <div className={styles.right}>
            <button
              className={styles.link}
              onClick={() => toast("Posting a listing comes in a later PR.")}
            >
              Post a listing
            </button>
            <button
              className={styles.iconBtn}
              aria-label="Messages"
              onClick={() => toast("Messages come in a later PR.")}
            >
              <Icon name="chat" />
            </button>
            <LogoutButton />
            <button
              className={styles.acct}
              aria-label={`Account: ${userEmail}`}
              title={userEmail}
              onClick={() => toast("Your profile comes in a later PR.")}
            >
              <Icon name="menu" />
              <span className={styles.av}>
                <Icon name="user" />
              </span>
            </button>
          </div>
        )}
      </div>

      {isBrowse && (
        <>
          <Suspense fallback={<div className={styles.pillSpace} />}>
            <SearchPill />
          </Suspense>
          <div className={styles.sky}>
            <Skyline />
          </div>
          <div className={styles.forge}>
            <span>Built by</span>
            <Image src="/forge.png" alt="FORGE" width={65} height={18} />
          </div>
        </>
      )}
    </header>
  );
}
