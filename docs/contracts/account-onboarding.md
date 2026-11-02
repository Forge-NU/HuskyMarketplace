# Account setup and identity fields

Related to #2, #12 and #20. This frontend follow-up uses existing backend capabilities; no shared auth settings, schema, policies or grants were changed.

Live read-only inspection on November 2, 2026 confirmed `profiles(user_id,username,created_at,updated_at)`, an owner-only SELECT/UPDATE policy, authenticated SELECT/UPDATE grants, a 3–24 character username constraint and a unique index on `lower(username)`. New accounts receive an automatic `husky_<18 hex digits>` handle from the existing registration trigger.

- `/account/setup` collects a display name and personal username after OTP verification. Incomplete profiles are routed here before Sell. Completing setup returns to browsing instead of unexpectedly starting a listing.
- Usernames save to the existing `profiles.username`, scoped to the authenticated user. The database unique index resolves collisions, including concurrent submissions; no profile search or public profile access was added.
- Display name and optional campus area save to user-editable Auth metadata (`display_name`, `campus_area`). They are presentation preferences, never verification or authorization claims. Public seller profile integration still needs the profile team's agreed API. If the team introduces dedicated profile columns, migrate these presentation values deliberately.
- A failed username save does not claim success. If username saves but Auth metadata fails, the UI reports the partial save and allows a retry. This is not an atomic cross-service write.
- Existing browser-local demo records are not copied into the live profile or deleted. New setup does not persist account identity in shared localStorage.
- Profile loading and the incomplete-profile Sell redirect were checked using the existing authenticated browser session. No real profile values were changed during verification. Save/collision/ownership/session-change/partial-failure coverage uses isolated mocks.

The concise OTP email is proposed in `supabase/templates/verification.html`; `/email-preview` displays a clearly labeled sample. Hosted templates remain unchanged pending authentication-owner review and installation. See the template README for the applicable template slots.
