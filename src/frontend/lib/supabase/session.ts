// A persistence preference, never an authentication or device-trust credential.
export const PERSISTENCE_COOKIE = "husky_keep_signed_in";
export function sessionCookieOptions<
  T extends { maxAge?: number; expires?: Date },
>(options: T, remember: boolean): Partial<T> {
  if (remember || (options.maxAge !== undefined && options.maxAge <= 0))
    return options;
  const { maxAge, expires, ...session } = options;
  void maxAge;
  void expires;
  return session as Partial<T>;
}

export function browserCookies(source: string) {
  return source.split(";").flatMap((part) => {
    const [name, ...parts] = part.trim().split("=");
    if (!name) return [];
    try {
      return [{ name, value: decodeURIComponent(parts.join("=")) }];
    } catch {
      return [];
    }
  });
}
