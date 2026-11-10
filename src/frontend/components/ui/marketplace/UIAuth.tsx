"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import UIShell from "./UIShell";
import { createClient } from "@/lib/supabase/client";
import {
  OTP_LENGTH,
  PASSWORD_MIN,
  afterAuthPath,
  friendlyAuthError,
  isNortheasternEmail,
  passwordError,
  safeNext,
} from "@/lib/auth";
import styles from "./UI.module.css";
import { loadProfile } from "@/lib/profile/service";
import { profileComplete } from "@/lib/profile/model";

const NEXT_KEY = "husky_auth_next",
  EMAIL_KEY = "husky_auth_pending_email";

export type AuthMode = "login" | "signup" | "verify" | "forgot" | "reset";

const COPY: Record<AuthMode, { title: string; hint: string; submit: string }> =
  {
    login: {
      title: "Welcome back.",
      hint: "Sign in with your Northeastern email and password.",
      submit: "Log in",
    },
    signup: {
      title: "Create your Husky account.",
      hint: "Use your Northeastern email. We'll email you a code to verify it.",
      submit: "Create account",
    },
    verify: {
      title: "One quick step, and you're in.",
      hint: "",
      submit: "Verify email",
    },
    forgot: {
      title: "Reset your password.",
      hint: "We'll email you a code to set a new password. Signed up with an email code before? Use this to create a password.",
      submit: "Send reset code",
    },
    reset: {
      title: "Choose a new password.",
      hint: "",
      submit: "Save password",
    },
  };

export default function UIAuth({ mode }: { mode: AuthMode }) {
  const router = useRouter(),
    search = useSearchParams();
  const [agreed, setAgreed] = useState(false);
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [code, setCode] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [info, setInfo] = useState(""),
    // Reset codes are single-use. If saving the password fails after the code
    // was accepted, the student is already signed in and can retry without a new code.
    [codeAccepted, setCodeAccepted] = useState(false);
  const codeStep = mode === "verify" || mode === "reset";
  const next = safeNext(search.get("next"));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore the address from browser session storage after hydration.
    if (codeStep) setEmail(sessionStorage.getItem(EMAIL_KEY) || "");
  }, [codeStep]);

  function remember(addr: string) {
    sessionStorage.setItem(EMAIL_KEY, addr);
    sessionStorage.setItem(NEXT_KEY, next);
  }

  async function finish() {
    sessionStorage.removeItem(EMAIL_KEY);
    const dest = safeNext(sessionStorage.getItem(NEXT_KEY) ?? next);
    sessionStorage.removeItem(NEXT_KEY);
    let complete = false;
    try {
      complete = profileComplete(await loadProfile(createClient()));
    } catch {
      // Missing or unreadable profile: send them through setup.
    }
    router.replace(afterAuthPath(dest, complete));
    router.refresh();
  }

  function readEmail() {
    const addr = email.trim().toLowerCase();
    if (!isNortheasternEmail(addr)) {
      setError("Use your @northeastern.edu email address.");
      return null;
    }
    return addr;
  }

  function readCode() {
    if (!isNortheasternEmail(email)) {
      setError("Start over and request a new code.");
      return null;
    }
    if (code.length !== OTP_LENGTH) {
      setError(`Enter the full ${OTP_LENGTH}-digit email code.`);
      return null;
    }
    return code;
  }

  async function login(addr: string) {
    const auth = createClient().auth;
    const { error } = await auth.signInWithPassword({ email: addr, password });
    if (error?.code === "email_not_confirmed") {
      // Never verified: send a fresh code and continue on the verify page.
      await auth.resend({ type: "signup", email: addr });
      remember(addr);
      router.push("/verify");
      return;
    }
    if (error?.code === "invalid_credentials") {
      // Accounts created with the old email-code sign-in have no password yet.
      return setError(
        "Wrong email or password. Signed up with an email code before? Use “Forgot password?” to create one.",
      );
    }
    if (error) throw error;
    remember(addr);
    await finish();
  }

  async function signup(addr: string) {
    if (!agreed) return setError("Accept the Terms to continue.");
    const problem = passwordError(password, confirm);
    if (problem) return setError(problem);
    const { data, error } = await createClient().auth.signUp({
      email: addr,
      password,
    });
    if (error) throw error;
    // With email confirmation on, Supabase hides existing accounts by returning
    // a user with no identities instead of an error.
    if (data.user && data.user.identities?.length === 0) {
      return setError(
        "An account with this email already exists. Log in or reset your password.",
      );
    }
    remember(addr);
    // Confirmation disabled on this project: already signed in.
    if (data.session) return finish();
    router.push("/verify");
  }

  async function verify() {
    const token = readCode();
    if (!token) return;
    const { error } = await createClient().auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error) throw error;
    await finish();
  }

  async function forgot(addr: string) {
    const { error } = await createClient().auth.resetPasswordForEmail(addr);
    if (error) throw error;
    remember(addr);
    router.push("/reset-password");
  }

  async function reset() {
    const problem = passwordError(password, confirm);
    if (problem) return setError(problem);
    const auth = createClient().auth;
    if (!codeAccepted) {
      const token = readCode();
      if (!token) return;
      const { error } = await auth.verifyOtp({
        email,
        token,
        type: "recovery",
      });
      if (error) throw error;
      setCodeAccepted(true);
    }
    const { error } = await auth.updateUser({ password });
    if (error) throw error;
    await finish();
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      if (mode === "verify") return await verify();
      if (mode === "reset") return await reset();
      const addr = readEmail();
      if (!addr) return;
      if (mode === "login") return await login(addr);
      if (mode === "signup") return await signup(addr);
      return await forgot(addr);
    } catch (ex) {
      setError(
        friendlyAuthError(
          ex instanceof Error ? ex : { message: "Unable to reach sign-in." },
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setError("");
    setInfo("");
    if (!isNortheasternEmail(email))
      return setError("Start over and request a new code.");
    setBusy(true);
    try {
      const auth = createClient().auth;
      const { error } =
        mode === "reset"
          ? await auth.resetPasswordForEmail(email)
          : await auth.resend({ type: "signup", email });
      if (error) throw error;
      setInfo(`A new code is on its way to ${email}.`);
    } catch (ex) {
      setError(friendlyAuthError(ex instanceof Error ? ex : null));
    } finally {
      setBusy(false);
    }
  }

  const copy = COPY[mode];
  const hint = codeStep
    ? `Enter the ${OTP_LENGTH}-digit code sent to ${email || "your school email"}.`
    : copy.hint;
  const needsPassword = mode !== "verify" && mode !== "forgot";
  const newPassword = mode === "signup" || mode === "reset";

  return (
    <UIShell>
      <main className={styles.content}>
        <div className={styles.authLayout}>
          <div className={styles.authCard}>
            <p className={styles.eyebrow}>YOUR HUSKY ACCOUNT</p>
            <h1>{copy.title}</h1>
            <p className={styles.hint}>{hint}</p>
            <form onSubmit={submit}>
              {!codeStep && (
                <div className={styles.formField}>
                  <label className={styles.inputLabel} htmlFor="email">
                    Northeastern email
                  </label>
                  <input
                    className={styles.input}
                    id="email"
                    type="email"
                    required
                    placeholder="you@northeastern.edu"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              )}
              {codeStep && !codeAccepted && (
                <div className={styles.formField}>
                  <label className={styles.inputLabel} htmlFor="code">
                    {OTP_LENGTH}-digit code
                  </label>
                  <input
                    className={styles.input}
                    id="code"
                    type="text"
                    inputMode="numeric"
                    pattern={`[0-9]{${OTP_LENGTH}}`}
                    maxLength={OTP_LENGTH}
                    autoComplete="one-time-code"
                    placeholder="Enter your code"
                    required
                    value={code}
                    onChange={(e) =>
                      setCode(
                        e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH),
                      )
                    }
                  />
                </div>
              )}
              {needsPassword && (
                <div className={styles.formField}>
                  <label className={styles.inputLabel} htmlFor="password">
                    {newPassword ? "New password" : "Password"}
                    {newPassword && (
                      <span className={styles.hint}>
                        {" "}
                        (at least {PASSWORD_MIN} characters, a letter and a
                        number)
                      </span>
                    )}
                  </label>
                  <input
                    className={styles.input}
                    id="password"
                    type="password"
                    required
                    minLength={newPassword ? PASSWORD_MIN : undefined}
                    autoComplete={
                      newPassword ? "new-password" : "current-password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              )}
              {newPassword && (
                <div className={styles.formField}>
                  <label className={styles.inputLabel} htmlFor="confirm">
                    Confirm password
                  </label>
                  <input
                    className={styles.input}
                    id="confirm"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
              )}
              {mode === "signup" && (
                <div className={styles.formField}>
                  <label
                    style={{
                      display: "flex",
                      gap: 9,
                      fontSize: 13,
                      alignItems: "start",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={agreed}
                      required
                      onChange={(e) => setAgreed(e.target.checked)}
                    />
                    <span>
                      I agree to the{" "}
                      <Link href="/terms" target="_blank">
                        Terms
                      </Link>{" "}
                      and acknowledge the{" "}
                      <Link href="/privacy" target="_blank">
                        Privacy Policy
                      </Link>
                      . *
                    </span>
                  </label>
                </div>
              )}
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
              {info && (
                <p className={styles.hint} role="status">
                  {info}
                </p>
              )}
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={busy}
                style={{ width: "100%" }}
              >
                {busy ? "Working…" : copy.submit}
              </button>
            </form>
            <div className={styles.formActions}>
              {mode === "login" && (
                <>
                  <span>
                    New here? <Link href="/signup">Create an account</Link>
                  </span>
                  <Link href="/forgot-password">Forgot password?</Link>
                </>
              )}
              {mode === "signup" && (
                <span>
                  Already have an account? <Link href="/login">Log in</Link>
                </span>
              )}
              {mode === "forgot" && <Link href="/login">Back to log in</Link>}
              {codeStep && (
                <>
                  {!codeAccepted && (
                    <button
                      type="button"
                      className={styles.textButton}
                      disabled={busy}
                      onClick={resend}
                    >
                      Resend code
                    </button>
                  )}
                  <Link href={mode === "reset" ? "/forgot-password" : "/login"}>
                    Use a different email
                  </Link>
                </>
              )}
              <Link href="/terms">Terms &amp; privacy</Link>
            </div>
          </div>
          <aside className={styles.authArt}>
            <img
              src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80"
              alt="College work desk"
            />
            <div className={styles.authArtCopy}>
              <p className={styles.eyebrow}>CAMPUS FINDS</p>
              <h2>Buy, sell, and make room for what comes next.</h2>
            </div>
          </aside>
        </div>
      </main>
    </UIShell>
  );
}
