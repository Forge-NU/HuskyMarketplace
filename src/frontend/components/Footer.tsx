"use client";

import Link from "next/link";
import styles from "./Footer.module.css";

const LINKS: [string, string][] = [
  ["Safety", "/safety"],
  ["Terms", "/terms"],
  ["Privacy", "/privacy"],
  ["Photo credits", "/credits"],
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span>
          Husky Marketplace is a student project, not an official Northeastern
          University service.
        </span>
        <nav aria-label="Footer navigation">
          {LINKS.map(([label, href]) => (
            <Link key={label} href={href}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
