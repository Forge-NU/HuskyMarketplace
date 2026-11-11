"use client";
/* eslint-disable @next/next/no-img-element */
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ChangeEvent,
} from "react";
import Link from "next/link";
import UIShell from "@/components/ui/marketplace/UIShell";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/images/compressImage";
import {
  categories,
  currentUser,
  loadListing,
  saveDraft,
  uploadPhotos,
  submitDraft,
  signedPhotos,
  type Upload,
} from "@/lib/listings/service";
import {
  CONDITIONS,
  EMPTY_DETAILS,
  validateDetails,
  validatePhoto,
  message,
  type Details,
} from "@/lib/listings/model";
import styles from "@/components/ui/marketplace/UI.module.css";
import ListingPreview from "./ListingPreview";
export default function ListingEditor({ editId }: { editId?: string }) {
  const [details, setDetails] = useState<Details>(EMPTY_DETAILS),
    [cats, setCats] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false),
    [pending, setPending] = useState(false),
    [retry, setRetry] = useState(0);
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [existingCount, setExistingCount] = useState(0);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const id = useRef(editId ?? ""),
    userId = useRef(""),
    uploads = useRef<Upload[]>([]),
    urls = useRef<string[]>([]),
    lock = useRef(false);
  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const client = createClient();
        const user = await currentUser(client);
        const options = await categories(client);
        if (!options.length)
          throw new Error(
            "No listing categories are available yet. Please try again later.",
          );
        const item = editId ? await loadListing(client, editId) : null;
        if (
          editId &&
          (!item || item.seller_id !== user.id || item.status !== "draft")
        )
          throw new Error(
            "Only your private drafts can be edited. Open My listings to check this item.",
          );
        const savedPhotos = item
          ? await signedPhotos(client, item).catch(() => [])
          : [];
        if (!active) return;
        setExistingPhotos(savedPhotos);
        userId.current = user.id;
        setCats(options);
        if (item) {
          setDetails({
            title: item.title,
            description: item.description ?? "",
            price: item.price === null ? "" : String(item.price),
            category_id: item.category_id ?? "",
            condition: item.condition ?? "",
            location: item.location ?? "",
          });
          setExistingCount(item.listing_photos.length);
          setSaved(true);
          setReady(item.listing_photos.length > 0);
        }
        setError("");
      } catch (e) {
        if (active) setError(message(e));
      } finally {
        if (active) setLoading(false);
      }
    }
    void init();
    return () => {
      active = false;
    };
  }, [editId, retry]);
  useEffect(
    () => () => {
      urls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );
  function field(key: keyof Details, value: string) {
    setDetails((d) => ({ ...d, [key]: value }));
    setReady(false);
  }
  async function choosePhotos(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      if (files.length + photos.length + existingCount > 5)
        throw new Error("Choose at most five photos per listing.");
      files.forEach(validatePhoto);
      const compressed = await Promise.all(files.map((f) => compressImage(f)));
      if (
        compressed.some(
          (file) => file.size > 1024 * 1024 || file.type !== "image/webp",
        )
      )
        throw new Error(
          "A photo could not be compressed below 1 MB. Please choose a smaller image.",
        );
      const prepared = compressed.map((file) => {
        const preview = URL.createObjectURL(file);
        urls.current.push(preview);
        return { file, preview };
      });
      setPhotos((p) => [...p, ...prepared]);
      setReady(false);
    } catch (e) {
      setError(message(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    setReady(false);
    try {
      validateDetails(details);
      if (!photos.length && !existingCount)
        throw new Error("Add at least one photo before saving.");
      const client = createClient();
      if (!id.current) id.current = crypto.randomUUID();
      await saveDraft(client, id.current, details);
      setSaved(true);
      // Keep stable paths and completed steps across retries, including lost responses.
      for (let i = uploads.current.length; i < photos.length; i++)
        uploads.current.push({
          path: `${userId.current}/${id.current}/${crypto.randomUUID()}.webp`,
          file: photos[i].file,
          order: existingCount + i,
          uploaded: false,
          attached: false,
        });
      await uploadPhotos(client, id.current, uploads.current);
      setReady(true);
      setNotice(
        "Draft and photos saved privately. Submit it when you are ready for moderation.",
      );
    } catch (e) {
      setError(message(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function submit() {
    if (lock.current || !ready) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await submitDraft(createClient(), id.current);
      setPending(true);
      setNotice(
        "Submitted for moderation. Your listing will appear in Browse only after approval.",
      );
    } catch (e) {
      setError(message(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <UIShell live>
      <main className={styles.content}>
        <header className={styles.contentHead}>
          <p className={styles.eyebrow}>SELL ON CAMPUS</p>
          <h1>
            {editId ? "Edit your draft." : "Give your stuff a second life."}
          </h1>
          <p>Save a private draft, then submit it for moderation.</p>
          <Link href="/my-listings">My listings →</Link>
        </header>
        {loading ? (
          <p role="status">Loading your listing form…</p>
        ) : (
          <div className={styles.split}>
            <form className={styles.panel} onSubmit={save}>
              <fieldset
                disabled={busy || pending || cats.length === 0}
                style={{ border: 0, padding: 0, minWidth: 0 }}
              >
                <h2>Photos &amp; details</h2>
                <p className={styles.hint}>
                  Up to five JPEG, PNG, or WebP photos, 12 MB each. Photos are
                  compressed before upload. HEIC support is pending.
                </p>
                <label className={styles.inputLabel} htmlFor="photos">
                  Photos *
                </label>
                <input
                  id="photos"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={choosePhotos}
                  disabled={existingCount + photos.length >= 5}
                />
                {existingCount > 0 && (
                  <p>
                    {existingCount} saved photo(s). Existing photo replacement
                    is not available yet.
                  </p>
                )}
                <div className={styles.photoPreview}>
                  {photos.map((p, i) => (
                    <div key={p.preview}>
                      <img src={p.preview} alt={`Selected photo ${i + 1}`} />
                      {!saved && (
                        <button
                          type="button"
                          onClick={() => {
                            setPhotos((x) => x.filter((_, j) => j !== i));
                            setReady(false);
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className={styles.formField}>
                  <label htmlFor="title">Item title *</label>
                  <input
                    id="title"
                    className={styles.input}
                    required
                    minLength={3}
                    maxLength={100}
                    value={details.title}
                    onChange={(e) => field("title", e.target.value)}
                  />
                </div>
                <div className={styles.formGrid}>
                  <label>
                    Price (USD) *
                    <input
                      className={styles.input}
                      required
                      type="number"
                      min="0"
                      max="999999.99"
                      step="0.01"
                      value={details.price}
                      onChange={(e) => field("price", e.target.value)}
                    />
                  </label>
                  <label>
                    Category *
                    <select
                      className={styles.input}
                      required
                      value={details.category_id}
                      onChange={(e) => field("category_id", e.target.value)}
                    >
                      <option value="">Choose a category</option>
                      {cats.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Condition *
                    <select
                      className={styles.input}
                      required
                      value={details.condition}
                      onChange={(e) => field("condition", e.target.value)}
                    >
                      <option value="">Choose condition</option>
                      {CONDITIONS.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    General pickup area *
                    <input
                      className={styles.input}
                      required
                      maxLength={100}
                      value={details.location}
                      onChange={(e) => field("location", e.target.value)}
                    />
                  </label>
                </div>
                <div className={styles.formField}>
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    className={styles.textarea}
                    required
                    maxLength={1200}
                    rows={5}
                    value={details.description}
                    onChange={(e) => field("description", e.target.value)}
                  />
                </div>
                <div className={styles.formActions}>
                  <button className={styles.primaryButton} type="submit">
                    {busy ? "Saving…" : "Save draft & photos"}
                  </button>
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    disabled={!ready}
                    onClick={submit}
                  >
                    Submit for moderation
                  </button>
                </div>
              </fieldset>
              {error && (
                <div role="alert" className={styles.notice}>
                  <p>{error}</p>
                  {cats.length === 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setLoading(true);
                        setRetry((x) => x + 1);
                      }}
                    >
                      Retry loading form
                    </button>
                  )}
                </div>
              )}
              {notice && (
                <p role="status" className={styles.notice}>
                  {notice}
                </p>
              )}
              {pending && <Link href="/my-listings">View submission →</Link>}
            </form>
            <ListingPreview
              details={details}
              photos={[
                ...existingPhotos,
                ...photos.map((photo) => photo.preview),
              ]}
              category={
                cats.find((category) => category.id === details.category_id)
                  ?.name ?? ""
              }
              pending={pending}
              savedPhotosUnavailable={
                existingCount > 0 && existingPhotos.length === 0
              }
            />
          </div>
        )}
      </main>
    </UIShell>
  );
}
