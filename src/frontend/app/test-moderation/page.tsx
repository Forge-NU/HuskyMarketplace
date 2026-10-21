"use client";

import { useState } from "react";
import { CATEGORIES, SERVICE_CATS } from "@/lib/mock-data";

const API_URL = process.env.NEXT_PUBLIC_MODERATION_API_URL ?? "http://localhost:8000";
const MAX_PHOTOS = 5;

type Decision = "allow" | "flag" | "block";
type PhotoResult = { filename: string; decision: Decision; reason: string | null; explicit: number; top: [string, string, number][] };
type TextResult = { decision: Decision; reason: string | null; matches: { group: string; action: string; term: string }[] };
type ModerationResult = { decision: Decision; reasons: string[]; text: TextResult; photos: PhotoResult[] };

// A photo plus a temporary browser URL so it can be shown in an <img>.
type Preview = { file: File; url: string };

const BADGES: Record<Decision, { text: string; color: string }> = {
  allow: { text: "APPROVE", color: "#1E7B34" },
  flag: { text: "FLAG FOR REVIEW", color: "#B26A00" },
  block: { text: "BLOCK", color: "var(--red)" },
};

function Badge({ decision }: { decision: Decision }) {
  const { text, color } = BADGES[decision];
  return (
    <span style={{ background: color, color: "#fff", fontWeight: 800, padding: "4px 10px", borderRadius: 6, fontSize: 13 }}>
      {text}
    </span>
  );
}

const field = { display: "flex", flexDirection: "column" as const, gap: 6, marginBottom: 16 };
const input = { padding: "10px 12px", border: "1.5px solid var(--gray-200)", borderRadius: 6 };

export default function TestModerationPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [photos, setPhotos] = useState<Preview[]>([]);
  const [result, setResult] = useState<ModerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const added = Array.from(files).map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPhotos((prev) => [...prev, ...added].slice(0, MAX_PHOTOS));
    setResult(null);
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(photos[index].url);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);

    const form = new FormData();
    form.append("title", title);
    form.append("description", description);
    form.append("category", category);
    form.append("price", price);
    photos.forEach((p) => form.append("photos", p.file));

    try {
      const res = await fetch(`${API_URL}/moderate-listing`, { method: "POST", body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body.detail ?? `Server error (${res.status})`);
      setResult(body);
    } catch (err) {
      // fetch throws a TypeError when it can't reach the server at all
      setError(err instanceof TypeError
        ? `Can't reach the moderation server at ${API_URL}. Is uvicorn running?`
        : err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ marginTop: 0 }}>Listing moderation test</h1>
      <p className="muted">Fill in a listing and see whether it would be approved, flagged for review, or blocked.</p>

      <form onSubmit={submit}>
        <label style={field}>
          <strong>Photos (up to {MAX_PHOTOS})</strong>
          <input type="file" accept="image/*" multiple onChange={(e) => addPhotos(e.target.files)} disabled={photos.length >= MAX_PHOTOS} />
        </label>
        {photos.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {photos.map((p, i) => (
              <div key={p.url} style={{ position: "relative" }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                <img src={p.url} alt={p.file.name} style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 6 }} />
                <button type="button" onClick={() => removePhoto(i)} aria-label={`Remove ${p.file.name}`}
                  style={{ position: "absolute", top: 4, right: 4, border: 0, borderRadius: 99, width: 22, height: 22, background: "#000", color: "#fff" }}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <label style={field}>
          <strong>Title</strong>
          <input style={input} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={70} placeholder="IKEA desk, white" />
        </label>

        <label style={field}>
          <strong>Category</strong>
          <select style={input} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Choose a category</option>
            <optgroup label="Goods">{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>
            <optgroup label="Services">{SERVICE_CATS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>
          </select>
        </label>

        <label style={field}>
          <strong>Description</strong>
          <textarea style={input} rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Condition, size, why you're selling..." />
        </label>

        <label style={field}>
          <strong>Price ($)</strong>
          <input style={input} type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>

        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? "Checking…" : "Check listing"}
        </button>
      </form>

      {error && <p style={{ color: "var(--red)", marginTop: 24 }}>{error}</p>}

      {result && (
        <section style={{ marginTop: 32, borderTop: "1px solid var(--gray-200)", paddingTop: 24 }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 0 }}>
            Result <Badge decision={result.decision} />
          </h2>
          {result.reasons.length > 0 && (
            <ul>{result.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
          )}

          <h3>Text</h3>
          <p>
            <Badge decision={result.text.decision} />{" "}
            {result.text.matches.length > 0
              ? `Matched: ${result.text.matches.map((m) => `"${m.term}" (${m.group})`).join(", ")}`
              : <span className="muted">No banned words found.</span>}
          </p>

          {result.photos.length > 0 && <h3>Photos</h3>}
          {result.photos.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
              {photos[i] && (
                // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                <img src={photos[i].url} alt={p.filename} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 6 }} />
              )}
              <div>
                <Badge decision={p.decision} /> {p.reason && <strong>{p.reason}</strong>}
                <div className="muted" style={{ fontSize: 13 }}>
                  Top match: {p.top[0][0]} [{p.top[0][1]}] {p.top[0][2]} · explicit score {p.explicit}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
