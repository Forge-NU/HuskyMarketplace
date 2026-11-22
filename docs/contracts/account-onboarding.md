# Account setup and identity fields

Related to #2, #12 and #20. Usernames use the existing database constraint. Profile-photo Storage is prepared in `20261118064148_profile_photo_storage.sql`; that migration has not been applied to shared Supabase.

The `profiles` table has `user_id`, `username`, `created_at` and `updated_at`, an owner-only SELECT/UPDATE policy, a 3–24 character username constraint and a unique index on `lower(username)`. New accounts get a `husky_<18 hex digits>` handle from the registration trigger.

- `/account/setup` collects a display name, username, campus and school year after email verification, plus an optional bio and photo. Finishing setup returns to Home.
- These are the registration fields for this release. School year is used instead of graduation year; college is deferred to the broader profile work in #20. Existing accounts keep their profiles and can add missing school details from Account.
- The username is saved to `profiles.username` for the signed-in user. The unique index handles collisions, including concurrent submissions.
- Display name, campus area and bio are saved as Auth metadata (`display_name`, `campus_area`, `bio`). They are presentation only, not verification or authorization data. Auth metadata is included in access tokens, so these fields should move to `profiles` columns once the profile API is agreed.
- If the username saves but the metadata update fails, the UI reports a partial save and allows a retry. The two writes are not atomic.
- Existing browser-local demo records are not copied or deleted, and setup no longer stores account identity in localStorage.
- Save, collision, ownership, session-change and partial-failure behavior is covered by tests with mocked clients.

The verification template is in `supabase/templates/verification.html`; the hosted version was saved on November 17. `/email-preview` remains development-only.

## Profile photos

Photos use @S1LynKz's existing `compressImage` helper: JPEG, PNG or WebP up to 12 MB, compressed to WebP at up to 512 px and 256 KB. Profile compression runs with the bundled library instead of downloading the optional worker script. Choosing a photo previews it; saving the form uploads it and updates the account/header avatar.

The proposed `profile-photos` bucket is private, WebP-only and limited to 256 KB. Verified students can read through ten-minute signed URLs. INSERT, UPDATE and DELETE require the owner's exact `<user-id>/avatar.webp` path and device verification. Replacing the fixed object avoids accumulating orphaned files; no photo URL or image data is stored in Auth metadata or added to Simran's profile columns.

The photo is optional. Failed uploads retain the selection for retry, and the user can discard it to continue without a photo. Profile details may already be saved when a photo fails; the error says so. Missing objects use the default silhouette. Temporary read failures have a retry. Until the migration is installed, existing login/profile saves still work and photo uploads report that Storage is unavailable.

Local database tests cover owner isolation, verified-student reads, expired sessions, signed-out access, and the existing case-insensitive username uniqueness constraint. Browser tests cover setup upload, failure/retry, persistence, replacement and removal using real local Storage. Listing moderation and its draft-only photo rules remain separate; this avatar bucket does not approve listings or provide image-content moderation.

Apply the Storage migration only after review, merge and team agreement, then repeat the upload and permission checks on the deployed app.
