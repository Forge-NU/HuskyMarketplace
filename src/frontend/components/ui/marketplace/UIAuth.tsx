"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UIShell from "./UIShell";
import { createClient } from "@/lib/supabase/client";
import { authMessage, isNortheasternEmail, validatePassword } from "@/lib/auth";
import { runCodeSteps } from "@/lib/auth/code-steps";
import { loadProfile } from "@/lib/profile/service";
import { profileComplete } from "@/lib/profile/model";
import styles from "./UI.module.css";

type Mode = "login" | "signup" | "verify" | "forgot" | "reset" | "device";
const EMAIL = "husky_registration_email";
const titles: Record<Mode, string> = {
  device: "One more check.",
  login: "Welcome back.",
  signup: "Find your campus community.",
  verify: "Check your inbox.",
  forgot: "Forgot your password?",
  reset: "A fresh start.",
};
const actions: Record<Mode, string> = {
  device: "Verify this device",
  login: "Log in",
  signup: "Create account",
  verify: "Confirm email",
  forgot: "Send reset code",
  reset: "Save new password",
};
export default function UIAuth({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [code, setCode] = useState("");
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(0);
  const lock = useRef(false);
  // A code works only once. If it was accepted but a later step failed (the
  // password save or the device request), retry from that step instead.
  const [verifiedCode, setVerifiedCode] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const codePage = mode === "verify" || mode === "reset" || mode === "device";
  const newPassword = mode === "signup" || mode === "reset";
  useEffect(() => {
    if (codePage) {
      const pending = sessionStorage.getItem(EMAIL);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore the pending address, never a password or code.
      if (pending) setEmail(pending);
      else if (mode === "device") {
        // No pending address means the proxy redirected an already signed-in,
        // unverified session here, so no code has been sent yet.
        setMessage("Click “Resend code” to get a verification code.");
        let active = true;
        createClient()
          .auth.getUser()
          .then(({ data }) => {
            if (active && data.user?.email) setEmail(data.user.email);
          })
          .catch(() => {
            /* The email field remains available for retry. */
          });
        return () => {
          active = false;
        };
      }
    }
  }, [codePage, mode]);
  useEffect(() => {
    if (!remaining) return;
    const timer = setTimeout(() => setRemaining(remaining - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);
  async function finish() {
    const response = await fetch("/api/auth/device", { method: "POST" });
    const result = await response.json();
    if (result.needsCode) {
      // Device codes use the recovery email: the Magic Link email is not being
      // delivered, and confirm_device_session accepts a recovery code as proof.
      const sent = await createClient().auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
      );
      if (sent.error) throw sent.error;
      router.push("/verify-device");
      return;
    }
    if (!response.ok)
      throw new Error(result.error || "Unable to verify this device.");
    sessionStorage.removeItem(EMAIL);
    sessionStorage.removeItem("husky_auth_next");
    let complete = false;
    try {
      complete = profileComplete(await loadProfile(createClient()));
    } catch {
      /* Setup offers a profile-load retry. */
    }
    router.replace(complete ? "/" : "/account/setup");
    router.refresh();
  }
  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (e) {
      setError(authMessage(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      const address = email.trim().toLowerCase();
      if (!isNortheasternEmail(address))
        throw new Error("Use your @northeastern.edu email.");
      if (!codePage && mode !== "forgot")
        document.cookie = `husky_keep_signed_in=${remember ? "yes" : "no"}; Path=/; SameSite=Lax${remember ? "; Max-Age=2592000" : ""}${location.protocol === "https:" ? "; Secure" : ""}`;
      const auth = createClient().auth;
      if (newPassword && !passwordSaved)
        validatePassword(password, confirmation);
      if (codePage) {
        await runCodeSteps(
          { verified: verifiedCode, passwordSaved },
          {
            verify: async () => {
              if (!/^\d{8}$/.test(code))
                throw new Error(
                  "Enter the full eight-digit code from your email.",
                );
              const result = await auth.verifyOtp({
                email: address,
                token: code,
                type:
                  mode === "reset" || mode === "device" ? "recovery" : "email",
              });
              if (result.error) throw result.error;
            },
            savePassword:
              mode === "reset"
                ? async () => {
                    const result = await auth.updateUser({ password });
                    if (result.error) throw result.error;
                  }
                : undefined,
            finish,
          },
          (progress) => {
            setVerifiedCode(progress.verified);
            setPasswordSaved(progress.passwordSaved);
          },
        );
        return;
      }
      sessionStorage.setItem(EMAIL, address);
      if (mode === "forgot") {
        const result = await auth.resetPasswordForEmail(address);
        if (result.error) throw result.error;
        router.push("/reset-password");
        return;
      }
      if (mode === "signup") {
        if (!accepted)
          throw new Error("Please accept the Terms to create an account.");
        const result = await auth.signUp({ email: address, password });
        if (result.error) throw result.error;
        // Supabase hides existing accounts: it returns a user with no
        // identities and sends no email, instead of returning an error.
        if (result.data.user?.identities?.length === 0)
          throw new Error(
            "You already have an account with this email. Log in, or use Forgot password to set one.",
          );
        if (result.data.session) {
          await auth.signOut({ scope: "local" });
          throw new Error(
            "Email confirmation isn’t configured yet. Please try again once setup is complete.",
          );
        }
        router.push("/verify");
        return;
      }
      const result = await auth.signInWithPassword({
        email: address,
        password,
      });
      if (result.error?.code === "email_not_confirmed") {
        const sent = await auth.resend({ type: "signup", email: address });
        if (sent.error) throw sent.error;
        router.push("/verify");
        return;
      }
      if (result.error) throw result.error;
      await finish();
    });
  }
  async function resend() {
    await run(async () => {
      if (!isNortheasternEmail(email))
        throw new Error("Enter your school email or start again.");
      const auth = createClient().auth;
      const result =
        mode === "reset" || mode === "device"
          ? await auth.resetPasswordForEmail(email)
          : await auth.resend({ type: "signup", email });
      if (result.error) throw result.error;
      setRemaining(60);
      setMessage("A new code is on its way. Check your spam folder too.");
    });
  }
  return (
    <UIShell>
      <main className={`${styles.content} ${styles.authFlow}`}>
        <div className={styles.authLayout}>
          <section className={styles.authCard}>
            <p className={styles.eyebrow}>
              {mode === "signup" || mode === "verify"
                ? mode === "signup"
                  ? "STEP 1 OF 3 · CREATE ACCOUNT"
                  : "STEP 2 OF 3 · VERIFY EMAIL"
                : "YOUR HUSKY ACCOUNT"}
            </p>
            <h1>{titles[mode]}</h1>
            <p className={styles.hint}>
              {verifiedCode
                ? passwordSaved
                  ? "Password updated. Continue to finish signing in."
                  : mode === "reset"
                    ? "Code accepted. Choose your new password."
                    : "Code accepted. Continue to finish signing in."
                : codePage
                  ? `Enter the eight-digit code sent to ${email || "your Northeastern email"}.`
                  : mode === "signup"
                    ? "Verify your Northeastern email, then tell us a little about yourself."
                    : mode === "forgot"
                      ? "We’ll email you a reset code. You can also use this to set your first password."
                      : "Your campus finds are waiting. Sign in with your email and password."}
            </p>
            <form onSubmit={submit}>
              <fieldset
                disabled={busy}
                style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
              >
                {(!codePage || !email) && (
                  <div className={styles.formField}>
                    <label className={styles.inputLabel} htmlFor="email">
                      Northeastern email
                    </label>
                    <input
                      className={styles.input}
                      id="email"
                      type="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="you@northeastern.edu"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                )}
                {codePage && !verifiedCode && (
                  <div className={styles.formField}>
                    <label className={styles.inputLabel} htmlFor="code">
                      Verification code
                    </label>
                    <input
                      className={styles.input}
                      id="code"
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      maxLength={8}
                      pattern="[0-9]{8}"
                      required
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, "").slice(0, 8))
                      }
                    />
                  </div>
                )}
                {mode !== "verify" &&
                  mode !== "forgot" &&
                  mode !== "device" &&
                  !passwordSaved && (
                    <div className={styles.formField}>
                      <label className={styles.inputLabel} htmlFor="password">
                        {newPassword ? "Choose a password" : "Password"}
                      </label>
                      {newPassword && (
                        <p className={styles.hint} id="password-help">
                          At least 8 characters. A longer, unique passphrase
                          works well.
                        </p>
                      )}
                      <input
                        className={styles.input}
                        id="password"
                        type={visible ? "text" : "password"}
                        autoComplete={
                          newPassword ? "new-password" : "current-password"
                        }
                        required
                        aria-describedby={
                          newPassword ? "password-help" : undefined
                        }
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className={styles.textButton}
                        aria-pressed={visible}
                        onClick={() => setVisible(!visible)}
                      >
                        {visible ? "Hide password" : "Show password"}
                      </button>
                    </div>
                  )}
                {newPassword && !passwordSaved && (
                  <div className={styles.formField}>
                    <label className={styles.inputLabel} htmlFor="confirmation">
                      Confirm password
                    </label>
                    <input
                      className={styles.input}
                      id="confirmation"
                      type={visible ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={confirmation}
                      onChange={(e) => setConfirmation(e.target.value)}
                    />
                  </div>
                )}
                {mode === "login" && (
                  <label className={styles.authChoice}>
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />{" "}
                    Keep me signed in on this device
                  </label>
                )}
                {mode === "signup" && (
                  <p>
                    <label className={styles.authChoice}>
                      <input
                        type="checkbox"
                        required
                        checked={accepted}
                        onChange={(e) => setAccepted(e.target.checked)}
                      />{" "}
                      <span>
                        I agree to the{" "}
                        <Link href="/terms" target="_blank">
                          Terms
                        </Link>{" "}
                        and acknowledge the{" "}
                        <Link href="/privacy" target="_blank">
                          Privacy Policy
                        </Link>
                        .
                      </span>
                    </label>
                  </p>
                )}
                {error && (
                  <p role="alert" className={styles.error}>
                    {error}
                  </p>
                )}
                {message && (
                  <p role="status" className={styles.hint}>
                    {message}
                  </p>
                )}
                <button
                  className={styles.primaryButton}
                  style={{ width: "100%" }}
                  type="submit"
                >
                  {busy
                    ? "Please wait…"
                    : verifiedCode
                      ? "Continue"
                      : actions[mode]}
                </button>
              </fieldset>
            </form>
            <div className={styles.formActions}>
              {mode === "device" && (
                <Link href="/">Already verified? Continue to Home</Link>
              )}
              {mode === "login" && (
                <>
                  <Link href="/forgot-password">Forgot password?</Link>
                  <span>
                    New here? <Link href="/signup">Create account</Link>
                  </span>
                </>
              )}
              {mode === "signup" && (
                <span>
                  Already have an account? <Link href="/login">Log in</Link>
                </span>
              )}
              {codePage && !verifiedCode && (
                <>
                  <button
                    type="button"
                    className={styles.textButton}
                    disabled={busy || remaining > 0}
                    onClick={resend}
                  >
                    {remaining ? `Resend in ${remaining}s` : "Resend code"}
                  </button>
                  <Link
                    onClick={
                      mode === "device"
                        ? async (event) => {
                            event.preventDefault();
                            await run(async () => {
                              const result = await createClient().auth.signOut({
                                scope: "local",
                              });
                              if (result.error) throw result.error;
                              router.replace("/login");
                              router.refresh();
                            });
                          }
                        : undefined
                    }
                    href={
                      mode === "reset"
                        ? "/forgot-password"
                        : mode === "device"
                          ? "/login"
                          : "/signup"
                    }
                  >
                    Use a different email
                  </Link>
                </>
              )}
              {mode === "forgot" && <Link href="/login">Back to login</Link>}
            </div>
          </section>
        </div>
      </main>
    </UIShell>
  );
}
