# Account emails

`registration.html` is the Confirm signup email; subject: **Your Husky Marketplace verification code**.
`recovery.html` is the Reset password email; subject: **Reset your Husky Marketplace password**.
Both were saved in hosted Supabase on November 14, 2026. Brevo delivery logs confirmed verification and recovery emails reached the test mailbox that evening.

Keep `{{ .Token }}` intact. The app expects eight digits. Email confirmation must remain enabled. `verification.html` is the Magic Link/OTP template for email sign-in and device checks. Its minimal version was saved in hosted Supabase on November 17, 2026, replacing the older template that incorrectly described eight-digit codes as six digits. The OTP placeholder, SMTP provider, and verification requirements are unchanged.

Custom SMTP uses Brevo. Its free sending allowance and Supabase Auth rate limits still apply. Manage SMTP credentials in Supabase; do not put them in templates or the repository.

In the November 17 delivery test, a verification email requested at 5:48 PM arrived in the Northeastern inbox at 5:51 PM Eastern. Brevo recorded Sent and Delivered within the 5:48 minute, so the observed delay followed recipient-server acceptance. The device screen allows three minutes before resend and preserves pending requests on refresh. Delivered does not confirm inbox arrival; received-message headers or a recipient mail trace are needed to locate the remaining delay.

# Device verification

The original migration (`20261115035417_verified_device_sessions.sql`) is installed in shared Supabase, and enforcement was enabled with approval on November 14, 2026. The production frontend has `DEVICE_VERIFICATION_ENABLED=true`.

A remembered browser uses a random HttpOnly cookie backed by a hash in a private table. Trust expires after 30 days. Clearing cookies or using another browser requires email verification again. Recent email verification rotates the remembered credential. This is email-based device verification, not Supabase AAL2 MFA. School profile fields remain editable metadata pending the public-profile migration and are not used for authorization.

Hosted testing confirmed sign-in, access to the account page, and remembered-browser login: the latest password-only sessions passed the database device check. On November 18, all 111 database assertions across nine files passed on a fresh local Supabase stack including the proposed photo migration. Browser tests also passed signup, profile setup, recovery, and fresh/remembered-device flows against the local production build. Final hosted checks still need to run after the reviewed changes are deployed. Local Mailpit delivery does not measure Brevo or Northeastern inbox delays.

## Local auth tests

Use an isolated checkout with Docker running. From the repository root:

```bash
npx supabase@3.0.0 start
npx supabase@3.0.0 db query 'update private.device_verification_settings set enabled = true'
npx supabase@3.0.0 test db supabase/tests/database
```

These commands target the local database. Do not add `--remote`. Enabling the local gate makes the tests exercise the same verification requirement as production.

In that checkout's `src/frontend/.env.local`, use `SUPABASE_URL=http://127.0.0.1:54321`, the local **anon/public** key from `supabase status`, and `DEVICE_VERIFICATION_ENABLED=true`. Do not use a service-role key or overwrite the shared-project environment file in your usual checkout. Then, from `src/frontend`:

```bash
npm ci
npx playwright install chromium
npm test
npm run build
npm start -- --hostname 127.0.0.1 --port 3004
```

In another terminal in `src/frontend`, run `npm run test:auth`. The runner uses synthetic accounts and the local Mailpit API on port 54324. It rejects non-local app URLs and blocks browser requests to hosted services. It does not read personal inboxes or print passwords/codes. Test accounts remain in the disposable local database; rebuilding it with `db reset` removes them along with other local data. The unit-test command uses native TypeScript support; use Node 22.18 or later (verified with Node 26.12.1).

The browser runner covers 27 checks, including photo upload/retry/replacement/removal, wrong codes, refresh without duplicate sends, access before verification, session-only cookies, reopened browsers, invented device credentials, mobile layout, and old-password rejection after recovery. One device response and one photo upload deliberately return 503 to exercise recovery. Other Auth, Storage and database requests use the real local services. Photo tests require the proposed `20261118064148_profile_photo_storage.sql` migration in the local stack; it remains unapplied to shared Supabase.

## After #49 is revised

- Review its existing-account handling on top of the current login flow. Retest a new email, an existing confirmed account, and an existing unconfirmed account. Check both resend success and send failures; the screen must not promise a code that was not requested.
- Run `npm test`, the full database suite, and `npm run test:auth` against the combined code, then complete type generation, TypeScript, lint, formatting, and the production build.
- After approvals, merge and deploy through the normal release process. With a real Northeastern test account, repeat signup/setup, reset, wrong-code rejection, fresh-browser verification, and remembered-browser login. Check the HTTPS device cookie and confirm the remembered login sends no new email.
- Record actual send/arrival times separately. Delayed inbox delivery remains open until a live test confirms acceptable timing or mail tracing identifies a fix.

## Installing in another environment

1. Review the migration and run the full database suite, including listing and device tests.
2. Install the migration inactive. Its default settings preserve the previous data-access rules; proof status still reports unverified sessions correctly.
3. Deploy the frontend with the server environment variable `DEVICE_VERIFICATION_ENABLED=true`.
4. Test signup, recovery, profile saves, logout, wrong and expired codes, resend errors, remembered browsers, and fresh browsers. Check direct database, Storage, and listing RPC access before verification.
5. Enable `private.device_verification_settings.enabled` after those checks. Setting it back to false restores the previous data-access rules while retaining private proof records.

## Listing RPC review follow-up

`20261115165537_explicit_listing_device_checks.sql` replaces the four listing RPCs with explicit device checks. It preserves their ownership checks, grants, draft rules, and retry behavior. The original device migration is unchanged apart from its filename, which now matches production’s recorded version; its contents match the applied SQL byte for byte.

The shared database's migration history includes both device migrations, confirmed on November 17, 2026. Do not reapply them. Future migrations still require review, merge, and team agreement before production. Migrations that replace these RPCs must retain the device check; the device tests exercise all four entry points.
