"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { isNortheasternEmail, NU_DOMAIN, safeNext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import styles from "./LoginForm.module.css";

const CODE_LENGTH = 8;

/** Two steps: enter a @northeastern.edu email, then the 6-digit code Supabase emails to it. */
export default function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    setError("");
    const addr = email.trim().toLowerCase();
    if (!isNortheasternEmail(addr)) {
      setError(`Use your @${NU_DOMAIN} email.`);
      return;
    }
    setBusy(true);
    const { error } = await createClient().auth.signInWithOtp({
      email: addr,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEmail(addr);
    setCode("");
    setStep("code");
  }

  async function verifyCode() {
    setError("");
    if (code.length !== CODE_LENGTH) {
      setError(`Enter the ${CODE_LENGTH}-digit code from your email.`);
      return;
    }
    setBusy(true);
    const { error } = await createClient().auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    // refresh() so the server-rendered header picks up the new session.
    router.replace(next);
    router.refresh();
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        {step === "email" ? (
          <>
            <h1>Sign in</h1>
            <p className="muted">
              Husky Marketplace is for Northeastern students. We&apos;ll email
              you a {CODE_LENGTH}-digit code.
            </p>
            <form
              className={styles.form}
              onSubmit={(e) => {
                e.preventDefault();
                sendCode();
              }}
            >
              <label className={styles.label}>
                Northeastern email
                <input
                  className={styles.input}
                  type="email"
                  autoComplete="email"
                  placeholder={`you@${NU_DOMAIN}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </label>
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
              <button
                className={`btn primary ${styles.submit}`}
                type="submit"
                disabled={busy}
              >
                {busy ? "Sending…" : "Send code"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1>Check your email</h1>
            <p className="muted">
              We sent a {CODE_LENGTH}-digit code to <b>{email}</b>.
            </p>
            <form
              className={styles.form}
              onSubmit={(e) => {
                e.preventDefault();
                verifyCode();
              }}
            >
              <label className={styles.label}>
                Code
                <input
                  className={`${styles.input} ${styles.code}`}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern={`\\d{${CODE_LENGTH}}`}
                  maxLength={CODE_LENGTH}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  required
                  autoFocus
                />
              </label>
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
              <button
                className={`btn primary ${styles.submit}`}
                type="submit"
                disabled={busy}
              >
                {busy ? "Verifying…" : "Sign in"}
              </button>
              <div className={styles.row}>
                <button
                  className={styles.textBtn}
                  type="button"
                  onClick={() => {
                    setError("");
                    setStep("email");
                  }}
                >
                  Use a different email
                </button>
                <button
                  className={styles.textBtn}
                  type="button"
                  disabled={busy}
                  onClick={sendCode}
                >
                  Resend code
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
