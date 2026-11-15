# Account emails

`registration.html` is the Confirm signup email; subject: **Your Husky Marketplace verification code**.
`recovery.html` is the Reset password email; subject: **Reset your Husky Marketplace password**.
Both were saved in hosted Supabase on November 14, 2026. Brevo delivery logs confirmed verification and recovery emails reached the test mailbox that evening.

Keep `{{ .Token }}` intact. The app expects eight digits. Email confirmation must remain enabled. `verification.html` remains the Magic Link/OTP template for email sign-in and device checks.

Custom SMTP uses Brevo. Its free sending allowance and Supabase Auth rate limits still apply. Manage SMTP credentials in Supabase; do not put them in templates or the repository.

# Device verification

The migration is installed in shared Supabase, and enforcement was enabled with approval on November 14, 2026. The production frontend has `DEVICE_VERIFICATION_ENABLED=true`.

A remembered browser uses a random HttpOnly cookie backed by a hash in a private table. Trust expires after 30 days. Clearing cookies or using another browser requires email verification again. Recent email verification rotates the remembered credential. This is email-based device verification, not Supabase AAL2 MFA. School profile fields remain editable metadata pending the public-profile migration and are not used for authorization.

Hosted testing confirmed sign-in, access to the account page, and remembered-browser login: the latest password-only sessions passed the database device check. A full fresh private-browser test has not been confirmed. Fifteen isolated PostgreSQL checks passed; the full Supabase database suite still needs Docker.

## Installing in another environment

1. Review the migration and run the full database suite, including listing and device tests.
2. Install the migration inactive. Its default settings preserve the previous data-access rules; proof status still reports unverified sessions correctly.
3. Deploy the frontend with the server environment variable `DEVICE_VERIFICATION_ENABLED=true`.
4. Test signup, recovery, profile saves, logout, wrong and expired codes, resend errors, remembered browsers, and fresh browsers. Check direct database, Storage, and listing RPC access before verification.
5. Enable `private.device_verification_settings.enabled` after those checks. Setting it back to false restores the previous data-access rules while retaining private proof records.
