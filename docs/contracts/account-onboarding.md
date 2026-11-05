# Account setup and identity fields

Related to #2, #12 and #20. This change uses existing backend features only; no auth settings, schema, policies or grants were changed.

The `profiles` table has `user_id`, `username`, `created_at` and `updated_at`, an owner-only SELECT/UPDATE policy, a 3–24 character username constraint and a unique index on `lower(username)`. New accounts get a `husky_<18 hex digits>` handle from the registration trigger.

- `/account/setup` collects a display name and username after OTP verification. Incomplete profiles are sent here before Sell, and finishing setup returns to Browse.
- The username is saved to `profiles.username` for the signed-in user. The unique index handles collisions, including concurrent submissions.
- Display name, campus area and bio are saved as Auth metadata (`display_name`, `campus_area`, `bio`). They are presentation only, not verification or authorization data. Auth metadata is included in access tokens, so these fields should move to `profiles` columns once the profile API is agreed.
- If the username saves but the metadata update fails, the UI reports a partial save and allows a retry. The two writes are not atomic.
- Existing browser-local demo records are not copied or deleted, and setup no longer stores account identity in localStorage.
- Save, collision, ownership, session-change and partial-failure behavior is covered by tests with mocked clients.

The verification email proposal is in `supabase/templates/verification.html`, and `/email-preview` shows a sample. Hosted templates are unchanged until the auth owner reviews and installs it.

## Profile photos

The profile editor has a photo chooser, a 200-character bio, display name, username, school email and campus area. Photos reuse the existing `compressImage` helper (JPEG, PNG or WebP up to 12 MB, compressed to WebP at up to 512 px and 256 KB) and show a circular preview.

**Profile photos are not saved yet.** The project only has the public `email-assets` bucket and no Storage policies, so the UI labels photos as preview-only. Before enabling uploads, the backend needs:

- A dedicated private `profile-photos` bucket with size and MIME limits and server-side image validation.
- Owner-scoped paths (`<user-id>/<random-id>.webp`) with owner-only INSERT, SELECT and DELETE policies, and no overwrites.
- A check that the object exists and belongs to the user before a reference is saved. Only the path is stored, never image bytes.
- An agreed visibility and moderation rule, signed reads, and cleanup of replaced objects, tested with two separate accounts.
