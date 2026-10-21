"use client";

import { useToast } from "./ui/Toast";
import styles from "./Footer.module.css";

const LINKS: [string, string][] = [
  ["Help", "Help page comes later."],
  ["Prohibited items", "Policies page comes later."],
  ["Terms and privacy", "Policies page comes later."],
  ["Contact us", "Contact form comes later."],
];

export default function Footer() {
  const toast = useToast();
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span>Husky Marketplace is a student project, not an official Northeastern University service.</span>
        <nav>
          {LINKS.map(([label, msg]) => (
            <button key={label} onClick={() => toast(msg)}>{label}</button>
          ))}
        </nav>
      </div>
    </footer>
  );
}
