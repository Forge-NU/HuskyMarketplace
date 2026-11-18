"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UIShell from "./UIShell";
import { createClient } from "@/lib/supabase/client";
import { authMessage, isNortheasternEmail, validatePassword } from "@/lib/auth";
import { confirmEmail } from "@/lib/auth/confirm-email";
import {
  DEVICE_CODE_SENT,
  DEVICE_CODE_RESEND_SECONDS,
  DeviceSessionExpiredError,
  cooldownRemaining,
  checkDeviceSession,
  hasRequestedCode,
  requestDeviceCode,
} from "@/lib/auth/device-code";
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
async function completeSignIn() {
  const address = sessionStorage.getItem(EMAIL);
  if (address) sessionStorage.removeItem(`${DEVICE_CODE_SENT}:${address}`);
  sessionStorage.removeItem(EMAIL);
  sessionStorage.removeItem("husky_auth_next");
  let complete = false;
  try {
    complete = profileComplete(await loadProfile(createClient()));
  } catch {
    /* Setup offers a profile-load retry. */
  }
  // Recheck server access instead of reusing a cached pre-verification redirect.
  window.location.replace(complete ? "/" : "/account/setup");
}

export default function UIAuth({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [code, setCode] = useState("");
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(mode === "device");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(0);
  const remaining = cooldownRemaining(resendAt, now);
  const lock = useRef(false);
  const [verifiedCode, setVerifiedCode] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [deviceCheckFailed, setDeviceCheckFailed] = useState(false);
  const [deviceAttempt, setDeviceAttempt] = useState(0);
  const codePage = mode === "verify" || mode === "reset" || mode === "device";
  const newPassword = mode === "signup" || (mode === "reset" && !passwordSaved);
  useEffect(() => {
    if (mode === "device") {
      let active = true;
      async function start() {
        try {
          const verified = await checkDeviceSession();
          if (!active) return;
          if (verified) {
            await completeSignIn();
            return;
          }
          const client = createClient();
          const { data, error } = await client.auth.getUser();
          if (!active) return;
          if (error && (!error.status || error.status >= 500))
            throw new Error(
              "We couldn’t check your session. Please try again.",
            );
          if (error || !data.user?.email) throw new DeviceSessionExpiredError();
          const address = data.user.email;
          setEmail(address);
          sessionStorage.setItem(EMAIL, address);
          const key = `${DEVICE_CODE_SENT}:${address}`;
          const sentAt = sessionStorage.getItem(key);
          if (hasRequestedCode(sentAt)) {
            setNow(Date.now());
            setResendAt(Number(sentAt) + DEVICE_CODE_RESEND_SECONDS * 1000);
            return;
          }
          await requestDeviceCode(client);
          const requestedAt = Date.now();
          sessionStorage.setItem(key, String(requestedAt));
          if (active) {
            setNow(requestedAt);
            setResendAt(requestedAt + DEVICE_CODE_RESEND_SECONDS * 1000);
            setMessage("Your code has been requested.");
          }
        } catch (e) {
          if (active) {
            if (e instanceof DeviceSessionExpiredError) {
              router.replace("/login");
              router.refresh();
            } else {
              setDeviceCheckFailed(true);
              setError(authMessage(e));
            }
          }
        } finally {
          if (active) setBusy(false);
        }
      }
      void start();
      return () => {
        active = false;
      };
    }
    if (codePage) {
      const pending = sessionStorage.getItem(EMAIL);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore the pending address, never a password or code.
      if (pending) setEmail(pending);
    }
  }, [codePage, deviceAttempt, mode, router]);
  useEffect(() => {
    if (!remaining) return;
    const update = () => setNow(Date.now());
    const timer = setTimeout(update, 1000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [remaining]);
  async function finish() {
    const verified = await checkDeviceSession();
    if (!verified) {
      if (mode === "device") {
        setVerifiedCode(false);
        setCode("");
        throw new Error(
          "This device could not be confirmed. Please request another code.",
        );
      }
      router.push("/verify-device");
      return;
    }
    await completeSignIn();
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
      if (e instanceof DeviceSessionExpiredError) {
        router.replace("/login");
        router.refresh();
      } else setError(authMessage(e));
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
      if (newPassword) validatePassword(password, confirmation);
      if (codePage) {
        if (!verifiedCode && !/^\d{8}$/.test(code))
          throw new Error("Enter the full eight-digit code from your email.");
        await confirmEmail(
          auth,
          { email: address, code, recovery: mode === "reset", password },
          { verified: verifiedCode, passwordSaved },
          (progress) => {
            setVerifiedCode(progress.verified);
            setPasswordSaved(progress.passwordSaved);
          },
        );
        await finish();
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
      sessionStorage.removeItem(`${DEVICE_CODE_SENT}:${address}`);
      await finish();
    });
  }
  async function resend() {
    await run(async () => {
      if (mode === "device") {
        const address = await requestDeviceCode(createClient());
        const requestedAt = Date.now();
        setEmail(address);
        sessionStorage.setItem(
          `${DEVICE_CODE_SENT}:${address}`,
          String(requestedAt),
        );
        setCode("");
        setNow(requestedAt);
        setResendAt(requestedAt + DEVICE_CODE_RESEND_SECONDS * 1000);
        setMessage("New code requested. Use the newest email when it arrives.");
        return;
      }
      if (!isNortheasternEmail(email))
        throw new Error("Enter your school email or start again.");
      const auth = createClient().auth;
      const result =
        mode === "reset"
          ? await auth.resetPasswordForEmail(email)
          : await auth.resend({ type: "signup", email });
      if (result.error) throw result.error;
      const requestedAt = Date.now();
      setNow(requestedAt);
      setResendAt(requestedAt + 60_000);
      setMessage("A new code is on its way. Check your spam folder too.");
    });
  }
  return (
    <UIShell live>
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
              {codePage && verifiedCode
                ? passwordSaved
                  ? "Password updated. Continue to finish signing in."
                  : mode === "reset"
                    ? "Email confirmed. Choose your new password."
                    : "Email confirmed. Continue to finish signing in."
                : mode === "device" && !email
                  ? "We’ll send a code to the account you just signed in with."
                  : codePage
                    ? `Enter the eight-digit code sent to ${email || "your Northeastern email"}.`
                    : mode === "signup"
                      ? "Verify your Northeastern email, then tell us a little about yourself."
                      : mode === "forgot"
                        ? "We’ll email you a reset code. You can also use this to set your first password."
                        : "Your campus finds are waiting. Sign in with your email and password."}
            </p>
            {mode === "device" && (
              <p className={styles.hint} id="delivery-help">
                Emails can take a few minutes. Check Junk too. If you resend,
                use the code from the newest email.
              </p>
            )}
            <form onSubmit={submit}>
              <fieldset
                disabled={busy}
                style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
              >
                {(!codePage || (!email && mode !== "device")) && (
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
                      aria-describedby={
                        mode === "device" ? "delivery-help" : undefined
                      }
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
                {(mode === "login" || newPassword) && (
                  <div className={styles.formField}>
                    <label className={styles.inputLabel} htmlFor="password">
                      {newPassword ? "Choose a password" : "Password"}
                    </label>
                    {newPassword && (
                      <p className={styles.hint} id="password-help">
                        At least 8 characters. A longer, unique passphrase works
                        well.
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
                {newPassword && (
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
                {mode === "device" && deviceCheckFailed && (
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => {
                      setError("");
                      setDeviceCheckFailed(false);
                      setBusy(true);
                      setDeviceAttempt((value) => value + 1);
                    }}
                  >
                    Retry device check
                  </button>
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
                  disabled={mode === "device" && deviceCheckFailed}
                >
                  {busy
                    ? "Please wait…"
                    : verifiedCode && !newPassword
                      ? "Continue"
                      : actions[mode]}
                </button>
              </fieldset>
            </form>
            <div
              className={`${styles.formActions} ${codePage ? styles.codeActions : ""}`}
            >
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
              {codePage && (
                <>
                  <button
                    type="button"
                    className={styles.textButton}
                    disabled={
                      busy || remaining > 0 || verifiedCode || deviceCheckFailed
                    }
                    onClick={resend}
                  >
                    {remaining
                      ? `Resend in ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`
                      : "Resend code"}
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
