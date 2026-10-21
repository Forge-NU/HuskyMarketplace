# Supabase

Database migrations for Husky Marketplace. Each file in `migrations/` runs once, in filename order.

## Applying migrations

Either paste the file into the dashboard's **SQL Editor** and run it, or use the Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

## What's here

- `20261004000000_auth_profiles_listings.sql`: the `@northeastern.edu` sign-up hook, `profiles` (auto-created on sign-up), `listings`, and Row Level Security for both.

The hook function only exists after the migration runs. It still has to be turned on in the dashboard under **Authentication → Hooks → Before User Created**.
