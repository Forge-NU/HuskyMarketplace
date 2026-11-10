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
import { useRouter } from "next/navigation";
import UIShell from "./UIShell";
import ProfileAvatar from "./ProfileAvatar";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/images/compressImage";
import { loadProfile, saveProfile } from "@/lib/profile/service";
import {
  profileComplete,
  type AccountProfile as Profile,
} from "@/lib/profile/model";
import styles from "./UI.module.css";
export default function AccountProfile({ setup = false }: { setup?: boolean }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [photoBusy, setPhotoBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [retry, setRetry] = useState(0),
    [preview, setPreview] = useState("");
  const lock = useRef(false),
    photoInput = useRef<HTMLInputElement>(null),
    urls = useRef<string[]>([]);
  useEffect(() => {
    let active = true;
    loadProfile(createClient())
      .then((p) => {
        if (active) {
          setProfile({
            ...p,
            username:
              setup &&
              !profileComplete(p) &&
              /^husky_[0-9a-f]{18}$/.test(p.username)
                ? ""
                : p.username,
          });
          setError("");
        }
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error ? e.message : "Could not load your profile.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry, setup]);
  useEffect(
    () => () => {
      urls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );
  async function choosePhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || lock.current) return;
    lock.current = true;
    setPhotoBusy(true);
    setError("");
    try {
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size <= 0 ||
        file.size > 12 * 1024 * 1024
      )
        throw new Error(
          "Choose a JPEG, PNG, or WebP photo up to 12 MB. HEIC support is coming later.",
        );
      const compressed = await compressImage(file, {
        maxWidthOrHeight: 512,
        maxSizeMB: 0.15,
        fileType: "image/webp",
      });
      if (compressed.size > 256 * 1024)
        throw new Error("This photo is still too large. Try a smaller image.");
      const url = URL.createObjectURL(compressed);
      urls.current.push(url);
      setPreview(url);
      setNotice(
        "Photo preview ready. Photo uploads aren’t connected yet; this image won’t be saved with your profile.",
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not process your photo.",
      );
    } finally {
      lock.current = false;
      setPhotoBusy(false);
    }
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!profile || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const saved = await saveProfile(createClient(), profile);
      setProfile(saved);
      if (setup) {
        router.replace("/");
        router.refresh();
      } else
        setNotice(
          preview
            ? "Profile and bio saved. Your photo remains a preview only."
            : "Profile and bio saved.",
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your profile.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function logout() {
    const { error } = await createClient().auth.signOut();
    if (error) {
      setError("Could not sign out. Please retry.");
      return;
    }
    router.replace("/login");
    router.refresh();
  }
  return (
    <UIShell live>
      <main className={`${styles.content} ${styles.profileContent}`}>
        <div className={styles.setupLayout}>
          <header className={styles.setupIntro}>
            <p className={styles.eyebrow}>
              {setup ? "YOUR CAMPUS INTRODUCTION" : "YOUR ACCOUNT"}
            </p>
            <h1>{setup ? "Make it feel like you." : "Edit your profile."}</h1>
            <p>
              A photo, a little about you, and a name your campus will know.
            </p>
            {!setup && (
              <div className={styles.formActions}>
                <Link className={styles.secondaryButton} href="/my-listings">
                  My listings
                </Link>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={logout}
                >
                  Sign out
                </button>
              </div>
            )}
          </header>
          <section className={`${styles.panel} ${styles.profileEditor}`}>
            {loading ? (
              <p role="status">Loading your profile…</p>
            ) : profile ? (
              <form onSubmit={save}>
                <fieldset
                  disabled={busy || photoBusy}
                  className={styles.profileFields}
                >
                  <div className={styles.profilePhotoRow}>
                    <button
                      className={styles.profilePhotoButton}
                      type="button"
                      onClick={() => photoInput.current?.click()}
                      aria-label="Choose a profile photo"
                    >
                      {preview ? (
                        <img src={preview} alt="Your profile photo preview" />
                      ) : (
                        <ProfileAvatar />
                      )}
                      <span>Change photo</span>
                    </button>
                    <div>
                      <strong>
                        {profile.displayName || "Your display name"}
                      </strong>
                      <p className={styles.hint}>
                        @{profile.username || "your_username"}
                      </p>
                      <button
                        className={styles.secondaryButton}
                        type="button"
                        onClick={() => photoInput.current?.click()}
                      >
                        {photoBusy ? "Compressing…" : "Choose photo"}
                      </button>
                      {preview && (
                        <button
                          className={styles.textButton}
                          type="button"
                          onClick={() => {
                            setPreview("");
                            setNotice("");
                          }}
                        >
                          Remove preview
                        </button>
                      )}
                      <p className={styles.hint}>
                        JPEG, PNG or WebP. Compressed before previewing.
                      </p>
                    </div>
                    <input
                      ref={photoInput}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={choosePhoto}
                      hidden
                    />
                  </div>
                  <p className={styles.photoPreviewNote}>
                    Photo preview only · Secure photo uploads are coming soon.
                    Names and bio can be saved now.
                  </p>
                  <div className={styles.profileDetailsGrid}>
                    <div className={styles.formField}>
                      <label
                        className={styles.inputLabel}
                        htmlFor="display-name"
                      >
                        Display name
                      </label>
                      <input
                        className={styles.input}
                        id="display-name"
                        autoComplete="name"
                        required
                        minLength={2}
                        maxLength={60}
                        placeholder="What should we call you?"
                        value={profile.displayName}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            displayName: e.target.value,
                          })
                        }
                      />
                      <p className={styles.hint}>
                        How you appear to other students.
                      </p>
                    </div>
                    <div className={styles.formField}>
                      <label className={styles.inputLabel} htmlFor="username">
                        Username
                      </label>
                      <div className={styles.usernameInput}>
                        <span aria-hidden="true">@</span>
                        <input
                          className={styles.input}
                          id="username"
                          autoComplete="username"
                          autoCapitalize="none"
                          spellCheck={false}
                          required
                          pattern="[a-zA-Z0-9_]{3,24}"
                          minLength={3}
                          maxLength={24}
                          value={profile.username}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              username: e.target.value.toLowerCase(),
                            })
                          }
                          aria-describedby="username-help"
                        />
                      </div>
                      <p id="username-help" className={styles.hint}>
                        Unique to you. 3–24 letters, numbers or underscores.
                      </p>
                    </div>
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.inputLabel} htmlFor="bio">
                      Bio <span className={styles.hint}>(optional)</span>
                    </label>
                    <textarea
                      className={styles.textarea}
                      id="bio"
                      rows={3}
                      maxLength={200}
                      placeholder="Your year, interests, or what you’re usually looking for…"
                      value={profile.bio}
                      onChange={(e) =>
                        setProfile({ ...profile, bio: e.target.value })
                      }
                      aria-describedby="bio-count"
                    />
                    <p id="bio-count" className={styles.hint}>
                      {profile.bio.length}/200 · Keep personal contact details
                      out of your bio.
                    </p>
                  </div>
                  <div className={styles.profileDetailsGrid}>
                    <div className={styles.formField}>
                      <label
                        className={styles.inputLabel}
                        htmlFor="school-email"
                      >
                        School email
                      </label>
                      <input
                        className={styles.input}
                        id="school-email"
                        type="email"
                        readOnly
                        value={profile.email}
                      />
                      <p className={styles.hint}>Used for sign-in.</p>
                    </div>
                    <div className={styles.formField}>
                      <label
                        className={styles.inputLabel}
                        htmlFor="campus-area"
                      >
                        Campus area{" "}
                        <span className={styles.hint}>(optional)</span>
                      </label>
                      <select
                        className={styles.input}
                        id="campus-area"
                        value={profile.area}
                        onChange={(e) =>
                          setProfile({ ...profile, area: e.target.value })
                        }
                      >
                        <option value="">Prefer not to say</option>
                        {[
                          "Fenway",
                          "West Village",
                          "East Village",
                          "LightView",
                          "Ruggles",
                          "Other near campus",
                        ].map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button className={styles.primaryButton} type="submit">
                    {busy
                      ? "Saving…"
                      : setup
                        ? "Save and explore"
                        : "Save profile"}
                  </button>
                </fieldset>
              </form>
            ) : (
              <button
                className={styles.secondaryButton}
                onClick={() => {
                  setLoading(true);
                  setRetry((x) => x + 1);
                }}
              >
                Retry
              </button>
            )}
            {error && (
              <p role="alert" className={styles.error}>
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className={styles.hint}>
                {notice}
              </p>
            )}
          </section>
        </div>
      </main>
    </UIShell>
  );
}
