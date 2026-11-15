# Account emails

`registration.html` is the Confirm signup email; subject: **Your Husky Marketplace verification code**.
`recovery.html` is the Reset password email; subject: **Reset your Husky Marketplace password**.
Both were saved in the hosted project on November 14, 2026. Their dashboard previews render the code placeholder and short instructions. Inbox delivery and rendering still need verification.

Keep `{{ .Token }}` intact. The app expects eight digits. Email confirmation must remain enabled. `verification.html` remains the Magic Link/OTP template for email sign-in and device checks.

# Device verification rollout

The device migration changes data access, including listing RPCs. Review it before applying to the shared project. Do not apply it while the old frontend is serving users: password-only sessions are denied until verified through the new flow.

1. Run all local database tests with the new migration, including tests for the existing listing flow. Listing tests now include verified-session fixtures; the device tests also cover unverified sessions.
2. Stage the new frontend with `DEVICE_VERIFICATION_ENABLED=true` in its server environment and the migration on an isolated Supabase project. Use a public client key, never a service-role key.
3. Verify email delivery, wrong/expired codes, resend errors, signup, recovery, profile saves, logout, fresh browsers, and a remembered browser. Verify direct database, Storage, and RPC denial before email confirmation.
4. Coordinate the migration and frontend release; then test the shared deployment. Keep a rollback migration ready before rollout. No device database change has been applied by this work.

A remembered device is a random HttpOnly cookie backed by a hash in a private table. Trust expires after 30 days. It does not fingerprint hardware. Clearing cookies or using another browser requires email again. This is email-based device verification, not Supabase AAL2 MFA. School profile fields remain editable metadata pending the public-profile migration and are not used for authorization.
