import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Expose the Supabase project URL and anon (public) key to the browser bundle.
  // Never add the service_role key here.
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
};

export default nextConfig;
