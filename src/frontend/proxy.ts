import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "@/lib/supabase/env";
// Public auth and policy routes; all other routes require valid Supabase session.
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/verify",
  "/terms",
  "/privacy",
  "/safety",
  "/credits",
];
export async function proxy(request: NextRequest) {
  const { url, anonKey } = supabaseEnv();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  const { data } = await supabase.auth.getClaims();
  const loggedIn = !!data?.claims;
  const { pathname, search } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.includes(pathname);
  if (!loggedIn && !isPublic) {
    const to = request.nextUrl.clone();
    to.pathname = "/login";
    to.search =
      pathname === "/" && !search
        ? ""
        : `?next=${encodeURIComponent(pathname + search)}`;
    return redirectWithCookies(to, response);
  }
  if (loggedIn && (pathname === "/login" || pathname === "/signup")) {
    const to = request.nextUrl.clone();
    to.pathname = "/";
    to.search = "";
    return redirectWithCookies(to, response);
  }
  return response;
}
function redirectWithCookies(to: URL, from: NextResponse) {
  const r = NextResponse.redirect(to);
  from.cookies.getAll().forEach((c) => r.cookies.set(c));
  return r;
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
