# Account setup and identity fields

Related to #2, #12 and #20. Usernames use the existing database constraint. Profile-photo Storage is prepared in `20261118064148_profile_photo_storage.sql`; that migration has not been applied to shared Supabase.

The `profiles` table includes `username`, `display_name`, `bio` and `campus_area` after #46. Verified students can read public profiles; updates remain limited to the owner and the permitted columns. Usernames keep the existing 3–24 character constraint and unique index on `lower(username)`. New accounts get a `husky_<18 hex digits>` handle from the registration trigger.

- `/account/setup` collects a display name, username, campus and school year after email verification, plus an optional bio and photo. Finishing setup returns to Home.
- These are the registration fields for this release. School year is used instead of graduation year; college is deferred to the broader profile work in #20. Existing accounts keep their profiles and can add missing school details from Account.
- Username, display name, bio and campus area save in one owner-scoped `profiles` update. The unique index handles username collisions, including concurrent submissions; a rejected update leaves all four fields unchanged.
- Reads use the public columns, including empty values. Old metadata copies are ignored and no longer updated. #46 backfilled existing values; recheck for accounts created by the older frontend between that backfill and the reviewed release. Campus and school year remain private account metadata because they have no matching public columns.
- School metadata is written only when it changes. If that write fails after the public profile saved, the UI says which fields remain unfinished and allows retry. Optional bio and area clear to SQL NULL; stale metadata does not restore them.
- Existing browser-local demo records are not copied or deleted, and setup no longer stores account identity in localStorage.
- Service tests cover mapping, collision, ownership, session changes, optional clearing and partial failures. The local API walkthrough also checks cross-account public reads, denied edits, case-insensitive collisions and signed-out/unverified-device access against real Supabase.

The verification template is in `supabase/templates/verification.html`; the hosted version was saved on November 17. `/email-preview` remains development-only.

## Profile photos

Photos use @S1LynKz's existing `compressImage` helper: JPEG, PNG or WebP up to 12 MB, compressed to WebP at up to 512 px and 256 KB. Profile compression runs with the bundled library instead of downloading the optional worker script. Choosing a photo previews it; saving the form uploads it and updates the account/header avatar.

The proposed `profile-photos` bucket is private, WebP-only and limited to 256 KB. Verified students can read through ten-minute signed URLs. INSERT, UPDATE and DELETE require the owner's exact `<user-id>/avatar.webp` path and device verification. Replacing the fixed object avoids accumulating orphaned files; no photo URL or image data is stored in Auth metadata or added to Simran's profile columns.

The photo is optional. Failed uploads retain the selection for retry, and the user can discard it to continue without a photo. Profile details may already be saved when a photo fails; the error says so. Missing objects use the default silhouette. Temporary read failures have a retry. Until the migration is installed, existing login/profile saves still work and photo uploads report that Storage is unavailable.

Local database tests cover owner isolation, verified-student reads, expired sessions, signed-out access, and the existing case-insensitive username uniqueness constraint. Browser tests cover setup upload, failure/retry, persistence, replacement and removal using real local Storage. Listing moderation and its draft-only photo rules remain separate; this avatar bucket does not approve listings or provide image-content moderation.

Apply the Storage migration only after review, merge and team agreement, then repeat the upload and permission checks on the deployed app.

## Local profile checks

Use the disposable stack with #46's migration installed, the device gate enabled and eight-digit signup codes in its local mailbox. From `src/frontend`, set the stack's `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `AUTH_TEST_MAILBOX_URL`, then run:

```bash
node --experimental-strip-types tests/profile.e2e.mjs
```

The runner rejects hosted service URLs before creating accounts. It creates synthetic local students and leaves those accounts in the disposable stack; it never writes to shared Supabase. `tests/auth.e2e.mjs` also checks setup, public-field editing, clearing, reload, photos, login and recovery through the actual local app.
