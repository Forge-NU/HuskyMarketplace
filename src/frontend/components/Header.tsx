"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import Icon from "./Icon";
import SearchPill from "./SearchPill";
import Skyline from "./Skyline";
import styles from "./Header.module.css";

const SECTIONS = [
  { href: "/browse", label: "Goods" },
  { href: "/moving", label: "Services" },
];

function ModeTabs() {
  const pathname = usePathname();
  return (
    <nav className={styles.modes} aria-label="Marketplace sections">
      {SECTIONS.map((section) => (
        <Link
          key={section.href}
          href={section.href}
          className={`${styles.mode} ${pathname === section.href ? styles.on : ""}`}
          aria-current={pathname === section.href ? "page" : undefined}
        >
          {section.label}
        </Link>
      ))}
    </nav>
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
            <Link className={styles.link} href="/sell">
              Post a listing
            </Link>
            <Link
              className={styles.iconBtn}
              aria-label="Messages"
              href="/messages"
            >
              <Icon name="chat" />
            </Link>
            <LogoutButton />
            <Link
              className={styles.acct}
              aria-label="My account"
              href="/account"
            >
              <Icon name="menu" />
              <span className={styles.av}>
                <Icon name="user" />
              </span>
            </Link>
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
