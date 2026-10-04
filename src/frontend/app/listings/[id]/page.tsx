import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import { PriceTag } from "@/components/listings/ListingCard";
import { catLabel } from "@/lib/format";
import { LISTINGS } from "@/lib/mock-data";
import styles from "./page.module.css";

// Placeholder detail page. The full version (seller card, message/save buttons,
// similar listings) gets ported from openDetail() in docs/prototype/index.html.
export default async function ListingPage({ params }: PageProps<"/listings/[id]">) {
  const { id } = await params;
  const l = LISTINGS.find((x) => x.id === Number(id));
  if (!l) notFound();

  return (
    <main className={styles.page}>
      <Link className={styles.back} href={l.kind === "service" ? "/?mode=services" : "/"}>← Back to browse</Link>
      <div className={styles.card}>
        <div className={styles.img} style={{ background: l.tint }}>
          <Icon name={l.icon} strokeWidth={1.4} />
        </div>
        <div className={styles.body}>
          <p className={styles.crumb}>{catLabel(l)} / {l.sub}</p>
          <h1>{l.title}</h1>
          <p className={styles.price}><PriceTag listing={l} /></p>
          <p>{l.desc}</p>
          <p className="muted">
            {l.kind === "service" ? "Where: " : "Meet at "}{l.meetup} · Posted {l.posted} · {l.seller.name}
          </p>
        </div>
      </div>
    </main>
  );
}
