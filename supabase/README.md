# Supabase

Database migrations for Husky Marketplace. Each file in `migrations/` runs once, in filename order.

## Applying migrations

Apply migrations with the CLI, not the SQL Editor. The SQL Editor doesn't record them in the migration history, so the repo and the live database drift apart.

```bash
npx supabase@3.0.0 link --project-ref <your-project-ref> # Connects your folder to the project (one time per computer)
npx supabase@3.0.0 migration new <name> # Creates a correctly dated empty file
npx supabase@3.0.0 db push --remote # Runs unapplied migrations on the linked project
```

`db push` writes to production, so only run it after the PR is merged and the team agrees.

## What's here

- `20261022211914_allow_email_only_northeastern_signup_with_generated_username.sql`: the `@northeastern.edu`-only sign-up trigger that creates a profile with a generated username

- `20261104093657_remote_schema.sql`: the baseline (a copy of the live schema made from the dashboard of all 12 tables, policies, grants)

## One-time baseline repair

The tables already exist on production, so production must be marked as already having the baseline, or `db push` would try to create them again and fail.

```bash
npx supabase@3.0.0 migration repair --status applied 20261104093657 --remote
```

- Run once by Jayden (S1LynKz) right after #36 merges.
- To check if it's done: `npx supabase@3.0.0 migration list --remote`. If `20261104093657` appears in the Remote column, it's already applied. Don't run it again.