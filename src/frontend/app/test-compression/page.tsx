"use client";

import { useState } from "react";
import { compressImage } from "@/lib/images/compressImage";

// A file plus a temporary browser URL so it can be shown in an <img>.
type Preview = { file: File; url: string };

type ViewMode = "side-by-side" | "fullscreen";

function toPreview(file: File): Preview {
  return { file, url: URL.createObjectURL(file) };
}

function describe(file: File): string {
  return `${file.name} (${file.type}, ${(file.size / 1024).toFixed(0)} KB)`;
}

function ImageCard({ label, preview, fill }: { label: string; preview: Preview; fill: boolean }) {
  const [dimensions, setDimensions] = useState<string | null>(null);

  return (
    <figure style={{ flex: 1, minWidth: 0, margin: 0, display: "flex", flexDirection: "column" }}>
      <figcaption style={{ marginBottom: 8 }}>
        <strong>{label}:</strong> {describe(preview.file)}
        {dimensions && ` — ${dimensions}`}
      </figcaption>
      {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, nothing to optimize */}
      <img
        src={preview.url}
        alt={label}
        onLoad={(e) => setDimensions(`${e.currentTarget.naturalWidth}×${e.currentTarget.naturalHeight}px`)}
        style={{
          width: "100%",
          height: fill ? "100%" : "70vh",
          minHeight: 0,
          objectFit: "contain",
          background: "#111",
        }}
      />
    </figure>
  );
}

export default function TestCompressionPage() {
  const [original, setOriginal] = useState<Preview | null>(null);
  const [compressed, setCompressed] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("side-by-side");
  const [fullscreenShows, setFullscreenShows] = useState<"original" | "compressed">("compressed");

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Free the previous photos' URLs so they don't pile up in memory.
    if (original) URL.revokeObjectURL(original.url);
    if (compressed) URL.revokeObjectURL(compressed.url);

    setOriginal(toPreview(file));
    setCompressed(null);
    setError(null);

    try {
      setCompressed(toPreview(await compressImage(file)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  const fullscreenPreview = fullscreenShows === "original" ? original : compressed;

  return (
    <div style={{ padding: 24 }}>
      <h1>Image compression test</h1>
      <input type="file" accept="image/*" onChange={handleChange} />

      {original && !compressed && !error && <p>Compressing...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {original && compressed && (
        <>
          <p>
            Saved {(100 - (compressed.file.size / original.file.size) * 100).toFixed(0)}%{" "}
            <button onClick={() => setViewMode("fullscreen")}>View fullscreen</button>
          </p>
          <div style={{ display: "flex", gap: 16 }}>
            <ImageCard label="Original" preview={original} fill={false} />
            <ImageCard label="Compressed" preview={compressed} fill={false} />
          </div>
        </>
      )}

      {viewMode === "fullscreen" && fullscreenPreview && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "#000",
            color: "#fff",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setFullscreenShows("original")} disabled={fullscreenShows === "original"}>
              Original
            </button>
            <button onClick={() => setFullscreenShows("compressed")} disabled={fullscreenShows === "compressed"}>
              Compressed
            </button>
            <button onClick={() => setViewMode("side-by-side")} style={{ marginLeft: "auto" }}>
              Close
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
            <ImageCard
              key={fullscreenShows}
              label={fullscreenShows === "original" ? "Original" : "Compressed"}
              preview={fullscreenPreview}
              fill
            />
          </div>
        </div>
      )}
    </div>
  );
}
