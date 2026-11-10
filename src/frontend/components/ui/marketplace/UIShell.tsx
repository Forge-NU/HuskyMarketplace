"use client";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./UI.module.css";
import ProfileAvatar from "./ProfileAvatar";
import Icon from "@/components/Icon";

export default function UIShell({
  children,
  live = false,
}: {
  children: ReactNode;
  live?: boolean;
}) {
  const router = useRouter(),
    pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null),
    [q, setQ] = useState("");
  useEffect(() => {
    let active = true;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (active) setEmail(data.user?.email ?? null);
      });
    return () => {
      active = false;
    };
  }, [pathname]);
  function search(e: FormEvent) {
    e.preventDefault();
    router.push(
      q.trim() ? `/browse?q=${encodeURIComponent(q.trim())}` : "/browse",
    );
  }
  async function logout() {
    const { error } = await createClient().auth.signOut();
    if (error) {
      alert(error.message);
      return;
    }
    setEmail(null);
    router.replace("/login");
    router.refresh();
  }
  const links = [
    { href: "/", text: "Home" },
    { href: "/browse", text: "Shop" },
    { href: "/sell", text: "Sell" },
    { href: "/moving", text: "Moving help" },
  ];
  return (
    <div className={styles.page}>
      <a className={styles.skipLink} href="#main-content">
        Skip to content
      </a>
      <div className={styles.demoRibbon}>
        {live ? (
          <>
            <strong>HUSKY MARKETPLACE</strong> · live listings · reviewed before
            publishing
          </>
        ) : (
          <>
            <strong>PHOTO-LED MARKETPLACE PREVIEW</strong> · sample listings and
            browser-local demo actions
          </>
        )}
      </div>
      <header className={styles.siteHeader}>
        <div
          className={`${styles.headerInner} ${pathname === "/browse" ? styles.browseHeader : ""}`}
        >
          <Link
            className={styles.logo}
            href="/"
            aria-label="Husky Marketplace home"
          >
            husky<span>✳</span>
          </Link>
          <nav className={styles.mainNav} aria-label="Main navigation">
            {links.map((x) => (
              <Link
                key={x.href}
                href={x.href}
                className={pathname === x.href ? styles.active : ""}
                aria-current={pathname === x.href ? "page" : undefined}
              >
                {x.text}
              </Link>
            ))}
          </nav>
          {pathname !== "/browse" && (
            <form className={styles.search} onSubmit={search} role="search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                aria-label="Search listings"
                placeholder="Search anything on campus..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </form>
          )}
          <div className={styles.headerActions}>
            <Link
              className={styles.iconButton}
              href="/saved"
              aria-label="Saved items"
            >
              ♡
            </Link>
            <Link
              className={styles.iconButton}
              href="/messages"
              aria-label="Messages"
            >
              <Icon name="chat" className={styles.messageNavIcon} />
            </Link>
            <Link className={styles.postButton} href="/sell">
              ＋ Post an item
            </Link>
            {email ? (
              <div className={styles.accountWrap}>
                <Link
                  className={styles.avatar}
                  href="/account"
                  title="My account"
                  aria-label="My account"
                >
                  <ProfileAvatar />
                </Link>
              </div>
            ) : (
              <Link
                className={styles.avatar}
                href="/login"
                aria-label="Sign in"
              >
                <ProfileAvatar />
              </Link>
            )}
          </div>
        </div>
      </header>
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div>
            <Link className={styles.logo} href="/">
              husky<span>✳</span>
            </Link>
            <p>
              Independent student-led marketplace project. Not affiliated with
              or endorsed by Northeastern University. Sample listings and
              conversations are not real transactions.
            </p>
          </div>
          <nav aria-label="Footer navigation">
            <Link href="/browse">Shop</Link>
            <Link href="/sell">Sell</Link>
            <Link href="/messages?tab=offers">Offers</Link>
            <Link href="/saved">Saved</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/safety">Safety</Link>
            <Link href="/credits">Photo credits</Link>
            {email ? (
              <button onClick={logout}>Sign out</button>
            ) : (
              <Link href="/login">Log in</Link>
            )}
          </nav>
        </div>
      </footer>
    </div>
  );
}
