import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "@/lib/supabase/env";

const PUBLIC_PATHS = ["/login"];

/**
 * Runs before every page request: refreshes the Supabase session cookie and
 * redirects logged-out users to /login (and logged-in users away from it).
 */
export async function proxy(request: NextRequest) {
  const { url, anonKey } = supabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getClaims() verifies the JWT. Don't trust getSession() here: it reads the cookie without checking it.
  const { data } = await supabase.auth.getClaims();
  const loggedIn = !!data?.claims;
  const { pathname, search } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (!loggedIn && !isPublic) {
    const to = request.nextUrl.clone();
    to.pathname = "/login";
    to.search = pathname === "/" && !search ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    return redirectWithCookies(to, response);
  }

  if (loggedIn && isPublic) {
    const to = request.nextUrl.clone();
    to.pathname = "/";
    to.search = "";
    return redirectWithCookies(to, response);
  }

  return response;
}

/** Redirect while keeping any refreshed session cookies Supabase just set. */
function redirectWithCookies(to: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(to);
  from.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  return redirect;
}

export const config = {
  // Every route except Next.js internals and static files in public/.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
