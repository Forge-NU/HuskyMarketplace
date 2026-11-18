const DEVELOPMENT_ROUTES = [
  "/test-compression",
  "/email-preview",
  "/team-browse",
];

export function isDevelopmentRoute(pathname: string) {
  return DEVELOPMENT_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
