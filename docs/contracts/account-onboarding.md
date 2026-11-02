# Account setup and identity fields

Related to #2, #12 and #20. This frontend follow-up uses existing backend capabilities; no shared auth settings, schema, policies or grants were changed.

Live read-only inspection on November 2, 2026 confirmed `profiles(user_id,username,created_at,updated_at)`, an owner-only SELECT/UPDATE policy, authenticated SELECT/UPDATE grants, a 3–24 character username constraint and a unique index on `lower(username)`. New accounts receive an automatic `husky_<18 hex digits>` handle from the existing registration trigger.

- `/account/setup` collects a display name and personal username after OTP verification. Incomplete profiles are routed here before Sell. Completing setup returns to browsing instead of unexpectedly starting a listing.
- Usernames save to the existing `profiles.username`, scoped to the authenticated user. The database unique index resolves collisions, including concurrent submissions; no profile search or public profile access was added.
- Display name and optional campus area save to user-editable Auth metadata (`display_name`, `campus_area`). They are presentation preferences, never verification or authorization claims. Public seller profile integration still needs the profile team's agreed API. These fields, including `bio`, should move to dedicated `profiles` columns once the profile API is agreed. Auth metadata is included in access tokens, so keeping profile text there increases the token size on authenticated requests.
- A failed username save does not claim success. If username saves but Auth metadata fails, the UI reports the partial save and allows a retry. This is not an atomic cross-service write.
- Existing browser-local demo records are not copied into the live profile or deleted. New setup does not persist account identity in shared localStorage.
- Profile loading and the incomplete-profile Sell redirect were checked using the existing authenticated browser session. No real profile values were changed during verification. Save/collision/ownership/session-change/partial-failure coverage uses isolated mocks.

The concise OTP email is proposed in `supabase/templates/verification.html`; `/email-preview` displays a clearly labeled sample. Hosted templates remain unchanged pending authentication-owner review and installation. See the template README for the applicable template slots.

## Profile refinement and photo storage review

The profile editor now uses a compact single-card layout with a photo chooser, a 200-character optional bio, display name, unique username, school email and campus area. The bio persists as editable Auth metadata (`bio`) alongside the existing presentation preferences. It is not an authorization claim and is not automatically exposed as a public seller bio.

Photo selection reuses @S1LynKz’s existing `compressImage` helper: JPEG/PNG/WebP input, at most 12 MB, compressed to WebP at up to 512 pixels with a 150 KB target and a 256 KB final cap. It creates a circular object-URL preview and revokes URLs on unmount. A repository fixture was processed in the authenticated browser without saving any profile values.

**Persistent profile photos are not implemented.** Live inspection still found only the public `email-assets` bucket and no Storage policies. The UI labels photos as preview-only and explicitly says saving the profile will not save the image. It does not put image bytes in Auth metadata, use the email bucket for user uploads, or silently make photos public.

Backend review requirements before enabling uploads:

- Agree on a dedicated `profile-photos` bucket, maximum file size/MIME constraints and server-side image decoding validation. Keep uploads private until visibility and moderation rules have been agreed.
- Scope immutable object paths to the authenticated owner (`<user-id>/<random-id>.webp`) with owner-only Storage INSERT/SELECT/DELETE policies and no overwrite. Preserve existing avatar objects until the replacement is confirmed.
- Validate an object’s ownership and existence before saving a reference to it; reject arbitrary external URLs or another owner’s object. Only store a path/reference, never image bytes, in profile metadata or the agreed profile column.
- Decide permitted public profile-photo visibility with the profile/moderation owners, use appropriately limited signed reads, and arrange cleanup for abandoned/replaced objects. Test account A versus account B and failed/lost responses in an isolated environment.

No bucket, grant, RLS policy or hosted authentication setting was changed in this follow-up.
