"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UIShell from "./UIShell";
import ProfileAvatar from "./ProfileAvatar";
import { createClient } from "@/lib/supabase/client";
import { loadProfile, saveProfile } from "@/lib/profile/service";
import {
  profileComplete,
  type AccountProfile as Profile,
} from "@/lib/profile/model";
import { safeNext } from "@/lib/auth";
import styles from "./UI.module.css";
export default function AccountProfile({
  setup = false,
  next = "/",
}: {
  setup?: boolean;
  next?: string;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [retry, setRetry] = useState(0);
  const lock = useRef(false);
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
        router.replace(safeNext(next));
        router.refresh();
      } else setNotice("Profile saved.");
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
      <main className={styles.content}>
        <div className={styles.setupLayout}>
          <header className={styles.setupIntro}>
            <p className={styles.eyebrow}>
              {setup ? "MAKE YOURSELF AT HOME" : "YOUR ACCOUNT"}
            </p>
            <h1>
              {setup ? "Let’s set up your profile." : "Your Husky profile."}
            </h1>
            <p>
              {setup
                ? "A name, a username, and you’re ready to explore."
                : "Choose how you appear around campus."}
            </p>
            <div className={styles.profilePreview}>
              <span className={styles.profileAvatar}>
                <ProfileAvatar />
              </span>
              <div>
                <strong>{profile?.displayName || "Your display name"}</strong>
                <p>@{profile?.username || "your_username"}</p>
              </div>
            </div>
            {!setup && (
              <div className={styles.formActions}>
                <Link className={styles.secondaryButton} href="/my-listings">
                  My listings
                </Link>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={logout}
                >
                  Sign out
                </button>
              </div>
            )}
          </header>
          <section className={styles.panel}>
            {loading ? (
              <p role="status">Loading your profile…</p>
            ) : profile ? (
              <form onSubmit={save}>
                <fieldset disabled={busy} className={styles.profileFields}>
                  <div className={styles.formField}>
                    <label className={styles.inputLabel} htmlFor="display-name">
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
                        setProfile({ ...profile, displayName: e.target.value })
                      }
                    />
                    <p className={styles.hint}>
                      The name other students will see. It doesn’t have to be
                      unique.
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
                      Your unique handle. 3–24 letters, numbers, or underscores.
                    </p>
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.inputLabel} htmlFor="school-email">
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
                    <label className={styles.inputLabel} htmlFor="campus-area">
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
              <p role="status" className={styles.success}>
                {notice}
              </p>
            )}
          </section>
        </div>
      </main>
    </UIShell>
  );
}
