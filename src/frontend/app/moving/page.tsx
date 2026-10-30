"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import UIShell from "@/components/ui/marketplace/UIShell";
import {
  MOVING_EXAMPLES,
  type MovingPost,
  getStored,
  KEYS,
  setStored,
} from "@/lib/ui/demo-data";
import styles from "@/components/ui/marketplace/UI.module.css";
const cats = [
  "Carrying & loading",
  "Pickup & delivery",
  "Furniture assembly",
  "Packing & organizing",
];
const areas = [
  "Fenway",
  "West Village",
  "East Village",
  "LightView",
  "Ruggles",
  "Other near campus",
];
const blank = {
  name: "",
  title: "",
  category: "",
  area: "",
  rate: "",
  rateType: "hour",
  when: "",
  description: "",
};
export default function MovingPage() {
  const [posts, setPosts] = useState<MovingPost[]>([...MOVING_EXAMPLES]),
    [tab, setTab] = useState("offer"),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState(""),
    [area, setArea] = useState(""),
    [creating, setCreating] = useState<"offer" | "request" | null>(null),
    [form, setForm] = useState(blank),
    [contact, setContact] = useState<MovingPost | null>(null),
    [contactMessage, setContactMessage] = useState(""),
    [notice, setNotice] = useState("");
  useEffect(() => {
    const added = getStored<MovingPost[]>(KEYS.moving, []);
    setPosts([...(Array.isArray(added) ? added : []), ...MOVING_EXAMPLES]);
  }, []);
  function publish(e: FormEvent) {
    e.preventDefault();
    if (!creating || !form.title.trim() || !form.description.trim()) {
      setNotice("Complete the required details.");
      return;
    }
    const post: MovingPost = {
      ...form,
      rate: Number(form.rate),
      id: `local-${Date.now()}`,
      kind: creating,
    };
    const local = getStored<MovingPost[]>(KEYS.moving, []);
    if (!setStored(KEYS.moving, [post, ...local])) {
      setNotice("Could not save this browser-local post.");
      return;
    }
    setPosts([post, ...posts]);
    setCreating(null);
    setForm(blank);
    setTab("mine");
    setNotice("Demo post saved on this browser only.");
  }
  function inquiry(e: FormEvent) {
    e.preventDefault();
    if (!contact || contactMessage.trim().length < 10) return;
    const old = getStored<unknown[]>(KEYS.inquiries, []);
    if (
      !setStored(KEYS.inquiries, [
        {
          postId: contact.id,
          text: contactMessage.trim(),
          createdAt: new Date().toISOString(),
        },
        ...old,
      ])
    ) {
      setNotice("Could not save inquiry.");
      return;
    }
    setNotice("Demo inquiry saved on this device. It was not delivered.");
    setContact(null);
    setContactMessage("");
  }
  const filtered = posts.filter(
    (p) =>
      (tab === "mine" ? p.id.startsWith("local-") : p.kind === tab) &&
      (!category || p.category === category) &&
      (!area || p.area === area) &&
      `${p.title} ${p.description} ${p.name}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <UIShell>
      <main className={styles.content}>
        <header className={styles.contentHead}>
          <p className={styles.eyebrow}>STUDENT-TO-STUDENT SERVICES</p>
          <h1>Moving help, from students nearby.</h1>
          <p>
            Find a helping hand, offer your time, or post what you need.
            Coordinate details directly.
          </p>
          <div className={styles.formActions}>
            <button
              className={styles.primaryButton}
              onClick={() => {
                setCreating("offer");
                setContact(null);
              }}
            >
              Offer a service
            </button>
            <button
              className={styles.secondaryButton}
              onClick={() => {
                setCreating("request");
                setContact(null);
              }}
            >
              Request help
            </button>
          </div>
        </header>
        <div className={styles.movingHero}>
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80"
            alt="Bright interior with furniture"
          />
          <div className={styles.movingText}>
            <p className={styles.eyebrow}>MOVE-IN / MOVE-OUT</p>
            <h2>An extra set of hands makes all the difference.</h2>
          </div>
        </div>
        {notice && (
          <p className={styles.notice} role="status">
            {notice}
          </p>
        )}
        {creating && (
          <section className={styles.panel} style={{ marginBottom: 28 }}>
            <h2>
              {creating === "offer" ? "Offer a service." : "Request help."}
            </h2>
            <p className={styles.hint}>
              Local demo post. Nothing is shared with other students.
            </p>
            <form onSubmit={publish}>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.inputLabel} htmlFor="m-name">
                    Display name *
                  </label>
                  <input
                    id="m-name"
                    className={styles.input}
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.inputLabel} htmlFor="m-title">
                    Title *
                  </label>
                  <input
                    id="m-title"
                    className={styles.input}
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.inputLabel} htmlFor="m-cat">
                    Category *
                  </label>
                  <select
                    id="m-cat"
                    className={styles.input}
                    value={form.category}
                    required
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    <option value="">Choose service</option>
                    {cats.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.inputLabel} htmlFor="m-area">
                    General area *
                  </label>
                  <select
                    id="m-area"
                    className={styles.input}
                    required
                    value={form.area}
                    onChange={(e) => setForm({ ...form, area: e.target.value })}
                  >
                    <option value="">Choose area</option>
                    {areas.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.inputLabel} htmlFor="m-rate">
                    Rate or budget *
                  </label>
                  <input
                    id="m-rate"
                    className={styles.input}
                    type="number"
                    min="0"
                    max="10000"
                    required
                    value={form.rate}
                    onChange={(e) => setForm({ ...form, rate: e.target.value })}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.inputLabel} htmlFor="m-rate-type">
                    Pricing
                  </label>
                  <select
                    id="m-rate-type"
                    className={styles.input}
                    value={form.rateType}
                    onChange={(e) =>
                      setForm({ ...form, rateType: e.target.value })
                    }
                  >
                    <option value="hour">Per hour</option>
                    <option value="fixed">Fixed total</option>
                  </select>
                </div>
              </div>
              <div className={styles.formField}>
                <label className={styles.inputLabel} htmlFor="m-when">
                  Availability *
                </label>
                <input
                  id="m-when"
                  className={styles.input}
                  required
                  value={form.when}
                  onChange={(e) => setForm({ ...form, when: e.target.value })}
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.inputLabel} htmlFor="m-desc">
                  What&apos;s involved? *
                </label>
                <textarea
                  id="m-desc"
                  className={styles.textarea}
                  required
                  rows={3}
                  minLength={15}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.primaryButton}>
                  Post demo listing
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setCreating(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}
        {contact && (
          <section className={styles.panel} style={{ marginBottom: 28 }}>
            <h2>Ask about {contact.title}</h2>
            <form onSubmit={inquiry}>
              <label className={styles.inputLabel} htmlFor="inquiry">
                Your inquiry
              </label>
              <textarea
                id="inquiry"
                className={styles.textarea}
                value={contactMessage}
                minLength={10}
                required
                rows={4}
                onChange={(e) => setContactMessage(e.target.value)}
              />
              <div className={styles.formActions}>
                <button type="submit" className={styles.primaryButton}>
                  Save demo inquiry
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setContact(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>AROUND CAMPUS</p>
            <h2>Find moving help.</h2>
          </div>
          <span className={styles.hint}>{filtered.length} posts</span>
        </div>
        <div className={styles.tabs}>
          {[
            { id: "offer", label: "Students offering help" },
            { id: "request", label: "Help requested" },
            { id: "mine", label: "My posts" },
          ].map((x) => (
            <button
              key={x.id}
              className={tab === x.id ? styles.tabActive : ""}
              onClick={() => setTab(x.id)}
            >
              {x.label}
            </button>
          ))}
        </div>
        <div className={styles.toolbar}>
          <input
            className={styles.input}
            style={{ flex: "1 1 200px" }}
            aria-label="Search moving help"
            placeholder="Search moving services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className={styles.select}
            aria-label="Service category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All services</option>
            {cats.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select
            className={styles.select}
            aria-label="General campus area"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          >
            <option value="">All areas</option>
            {areas.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
        <div className={styles.movingGrid}>
          {filtered.map((p) => (
            <article className={styles.movingCard} key={p.id}>
              {p.photo ? (
                <img src={p.photo} alt="Example moving help" />
              ) : (
                <div
                  style={{
                    height: 175,
                    background: "#ffe6de",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 70,
                  }}
                >
                  ↗
                </div>
              )}
              <div className={styles.movingCardBody}>
                <p className={styles.eyebrow}>{p.category}</p>
                <h3>{p.title}</h3>
                <p className={styles.hint}>
                  {p.name} · {p.area}
                </p>
                <p>
                  <strong>
                    {p.rate === 0
                      ? "Free"
                      : `$${p.rate}${p.rateType === "hour" ? " / hr" : " total"}`}
                  </strong>
                </p>
                <p>{p.description}</p>
                <p className={styles.hint}>{p.when}</p>
                <button
                  className={styles.secondaryButton}
                  onClick={() => setContact(p)}
                >
                  Ask about this post →
                </button>
              </div>
            </article>
          ))}
          {!filtered.length && (
            <p className={styles.empty}>No matching moving posts.</p>
          )}
        </div>
        <section className={styles.panel} style={{ marginTop: 35 }}>
          <h2>Know what you&apos;re agreeing to.</h2>
          <p>
            Agree on the task, time, rates, and meeting place before work
            begins. Husky does not process payments, employ helpers, or
            guarantee services.
          </p>
          <Link href="/safety">Read safety guidance →</Link>
        </section>
      </main>
    </UIShell>
  );
}
