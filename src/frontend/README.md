# Husky Marketplace frontend

Next.js App Router, TypeScript, Supabase and CSS modules. The UI uses Archivo and DM Sans.

## Local setup

Use the same Node major version as Vercel (currently 26.x).

```bash
cd src/frontend
npm ci
cp .env.example .env.local
npm run dev
```

Create `.env.local` only if it does not already exist. Fill in `SUPABASE_URL`, the public `SUPABASE_ANON_KEY`, and `DEVICE_VERIFICATION_ENABLED=true` for the shared Husky database. Keep actual environment files local. Never use a service-role key in the frontend. Supabase URL and public key are included in the browser bundle through `next.config.ts`; RLS protects the data.

`NEXT_PUBLIC_API_URL` is a placeholder for the separate FastAPI integration. Current live listing and account pages use Supabase directly.

## Account flow

New students register with a Northeastern email and password, confirm the eight-digit email code, complete account setup, and go Home. Existing students use their email and password. Password recovery and device verification use email codes. Remembered browsers can return without another code; temporary sign-in does not retain device trust.

The forms provide validation, but database policies and RPCs enforce access. Presentation fields in Auth metadata never authorize a student or device. Account and photo follow-up work is in #52; public seller fields are separate in #46.

## Routes and code

- `/`: Home; `/browse`: approved listings; `/item/<uuid>`: a live listing.
- `/sell`: private draft editor; `/my-listings`: the signed-in student's listings.
- `/account` and `/account/setup`: profile editing and onboarding.
- `/login`, `/signup`, `/verify`, `/forgot-password`, `/reset-password`, `/verify-device`: authentication.
- `/saved`, `/messages`, `/moving`, `/seller/<number>` and `/demo/item/<number>` include browser-local demonstrations. Their labels distinguish them from real records.
- `/listings/<number>` is the older sample detail route. Public navigation must not send students to the internal `/team-browse` screen.
- `/test-compression`, `/email-preview` and `/team-browse` are development tools. #52 makes them return 404 in production, including nested paths.

Routes live in `app/`; shared marketplace components are in `components/ui/marketplace/`; live listing components and queries are in `components/listings/live/` and `lib/listings/`. Use the existing session-aware clients in `lib/supabase/`. Failed live requests must not substitute demo data.

## Checks and handoff

```bash
node --experimental-strip-types --test tests/*.test.mjs
npx next typegen
npx tsc --noEmit
npm run build
```

Run Prettier and ESLint on changed files. Browser checks and remaining manual tests are in [frontend QA](../../docs/frontend-qa.md). Listing walkthrough setup is in [listing workflow](../../docs/contracts/listing-workflow.md).

For signed-out checks against a local production build or the reviewed deployment:

```bash
node tests/release-smoke.mjs http://127.0.0.1:3008
```

Replace the origin with the exact deployment URL after release. This makes GET requests only, without cookies or keys. It checks public pages, login redirects, public links and internal-route 404s. It does not test signup, inbox delivery or signed-in workflows.

For the existing Vercel project, release steps, environment settings and rollback, see [deployment handoff](../../docs/deployment.md). Do not release changes or apply shared migrations just to run local checks.
