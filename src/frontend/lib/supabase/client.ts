import { createBrowserClient } from "@supabase/ssr";
import {
  PERSISTENCE_COOKIE,
  sessionCookieOptions,
  browserCookies,
} from "./session";
import { supabaseEnv } from "./env";

/** Supabase client for Client Components. */
export function createClient() {
  const { url, anonKey } = supabaseEnv();
  return createBrowserClient(url, anonKey, {
    cookies: {
      getAll: () => browserCookies(document.cookie),
      setAll(values) {
        const remember = document.cookie
          .split(";")
          .some((value) => value.trim() === `${PERSISTENCE_COOKIE}=yes`);
        values.forEach(({ name, value, options }) => {
          const opts = sessionCookieOptions(options, remember);
          document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax${opts.maxAge !== undefined ? `; Max-Age=${opts.maxAge}` : ""}${location.protocol === "https:" ? "; Secure" : ""}`;
        });
      },
    },
  });
}
