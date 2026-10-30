// Both values are exposed to the browser through next.config.ts `env`.
// The anon key is meant to be public: Row Level Security is what protects the data.
export function supabaseEnv() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill them in.",
    );
  }
  return { url, anonKey };
}
