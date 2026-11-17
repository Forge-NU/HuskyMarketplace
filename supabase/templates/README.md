# Account emails

`registration.html` is the Confirm signup email; subject: **Your Husky Marketplace verification code**.
`recovery.html` is the Reset password email; subject: **Reset your Husky Marketplace password**.
Both were saved in hosted Supabase on November 14, 2026. Brevo delivery logs confirmed verification and recovery emails reached the test mailbox that evening.

Keep `{{ .Token }}` intact. The app expects eight digits. Email confirmation must remain enabled. `verification.html` is the Magic Link/OTP template for email sign-in and device checks. Its minimal version was saved in hosted Supabase on November 17, 2026, replacing the older template that incorrectly described eight-digit codes as six digits. The OTP placeholder, SMTP provider, and verification requirements are unchanged.

Custom SMTP uses Brevo. Its free sending allowance and Supabase Auth rate limits still apply. Manage SMTP credentials in Supabase; do not put them in templates or the repository.

In the November 17 delivery test, a verification email requested at 5:48 PM arrived in the Northeastern inbox at 5:51 PM Eastern. The device screen allows three minutes before resend and preserves pending requests on refresh. Brevo’s Delivered status confirms recipient-server acceptance, not inbox arrival; the cause of the delay is still unconfirmed.

# Device verification

The original migration (`20261115035417_verified_device_sessions.sql`) is installed in shared Supabase, and enforcement was enabled with approval on November 14, 2026. The production frontend has `DEVICE_VERIFICATION_ENABLED=true`.

A remembered browser uses a random HttpOnly cookie backed by a hash in a private table. Trust expires after 30 days. Clearing cookies or using another browser requires email verification again. Recent email verification rotates the remembered credential. This is email-based device verification, not Supabase AAL2 MFA. School profile fields remain editable metadata pending the public-profile migration and are not used for authorization.

Hosted testing confirmed sign-in, access to the account page, and remembered-browser login: the latest password-only sessions passed the database device check. A full fresh private-browser test has not been confirmed. Fifteen isolated PostgreSQL checks passed; the full Supabase database suite still needs Docker.

## Installing in another environment

1. Review the migration and run the full database suite, including listing and device tests.
2. Install the migration inactive. Its default settings preserve the previous data-access rules; proof status still reports unverified sessions correctly.
3. Deploy the frontend with the server environment variable `DEVICE_VERIFICATION_ENABLED=true`.
4. Test signup, recovery, profile saves, logout, wrong and expired codes, resend errors, remembered browsers, and fresh browsers. Check direct database, Storage, and listing RPC access before verification.
5. Enable `private.device_verification_settings.enabled` after those checks. Setting it back to false restores the previous data-access rules while retaining private proof records.

## Listing RPC review follow-up

`20261115165537_explicit_listing_device_checks.sql` replaces the four listing RPCs with explicit device checks. It preserves their ownership checks, grants, draft rules, and retry behavior. The original device migration is unchanged apart from its filename, which now matches production’s recorded version; its contents match the applied SQL byte for byte.

The follow-up migration has not been applied to production. Apply it only after review, merge, and team agreement. Future migrations that replace these RPCs must retain the device check; the device tests exercise all four entry points.
