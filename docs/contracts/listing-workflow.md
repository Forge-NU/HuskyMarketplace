# Listing workflow integration proposal — review required

Related to #21; coordinates #10, #12, #20 and #24. This is a proposed interface, **not an installed backend**. No shared database, bucket, grants, policies or moderation service was changed by this PR. The frontend stays unavailable until the backend implements the contract and advertises its version. The version check is a deployment handshake, not a security boundary.

## Verified shared database (November 2, 2026)

Read-only inspection of the Husky Marketplace project found:

- `listings.id`, `seller_id`, `category_id`: UUIDs; `price`: nullable numeric; `condition`, `location`, `description`: nullable text; `status`: nullable text defaulting to `active`; `is_available`: nullable boolean defaulting to true.
- Category data is related through `categories(id,name,sort_order)`. Photos use `listing_photos(id,listing_id,photo_url,sort_order)` with cascading deletion of photo rows.
- Listings, categories and photo tables have RLS enabled but no policies and no SELECT/INSERT/UPDATE/DELETE grants for anon/authenticated. Existing TRUNCATE/REFERENCES/TRIGGER grants should be reviewed and revoked as appropriate.
- Only `email-assets` exists in Storage. No listing bucket, listing RPCs or Edge Functions are deployed. Profiles are private and expose `user_id,username`; do not invent a public seller profile.
- Historical migrations do not describe this schema. Do not apply them blindly or label existing `active` records approved.

No open PRs were found. `origin/feature/image-upload` contains Jayden's `20261027000000_listing_photos_storage.sql` (currently empty in Git); `origin/feature/moderation-test-page` contains Allan's FastAPI `POST /moderate-listing`. That prototype returns `allow|flag|block` and reasons but does not authenticate users, persist decisions or publish listings. A browser response from it must never authorize publication. Coordinate with its owner rather than replacing it.

## Backend contract for review

Use the current public session-aware Supabase client. All RPCs authenticate and derive seller identity from `auth.uid()`; reject unverified/ineligible students according to the authentication team's trusted verification contract. Never trust user-editable metadata. Backend validates fields, UUID ownership, photo count, decoded image content, prices, and lengths independently of frontend validation.

| RPC                        | Arguments                                                  | Result and required behavior                                                                                                                                                                                              |
| -------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `listing_workflow_version` | none                                                       | scalar text `draft-review-v1`, exposed only after every requirement below is installed and tested                                                                                                                         |
| `save_listing_draft`       | `p_id uuid`, `p_details jsonb`                             | create/update own draft atomically, return boolean true; same ID is idempotent, cannot overwrite someone else's ID; derive seller server-side; accept only title, description, price, category_id, condition, location    |
| `attach_listing_photo`     | `p_listing_id uuid`, `p_path text`, `p_sort_order integer` | boolean true; own draft only; verify uploaded object exists, bucket/path ownership, MIME/content/size and 0–4 order; max five photos; same path attachment is idempotent, unique listing/path and listing/order           |
| `submit_listing`           | `p_id uuid`                                                | scalar text `pending`; validate complete fields and 1–5 attached photos, atomically lock snapshot and enqueue moderation; idempotent for pending, including lost-response retry; transaction rolls back if queueing fails |
| `delete_listing`           | `p_id uuid`                                                | boolean true after own listing is removed or already deleted; do not return success for somebody else's ID; revoke visibility immediately and arrange retryable storage cleanup                                           |

`p_details`: trimmed title (3–100), required description (1–1200), numeric price (0–999999.99, max two decimals), valid category UUID, condition `New|Like new|Excellent|Good|Fair`, general location (1–100). Unknown keys, status and seller overrides must be rejected. Frontend checks explicit backend success values.

## Security and lifecycle changes to prepare as a reviewed migration

1. Add constrained states `draft`, `pending`, `approved`, `blocked`, `sold`. Default to draft and quarantine legacy active/unknown records for review. Do not automatically approve existing data. A draft has no public visibility.
2. Grant minimum table privileges with RLS: authenticated users read approved, available listings or their own records; related photo reads follow parent visibility. Categories have read-only access. Private profiles remain private. Frontend filters supplement these policies and never replace them.
3. Enforce state transitions at the database boundary, including raw REST requests: owners may create/update only drafts, attach photos only to drafts, submit only draft → pending and delete their own listings. Protect seller identity and moderation fields. No owner may set approved/blocked or edit pending/approved content or its storage objects. Decide grants/RPC implementation with the backend owner: invoker RPCs must retain RLS; any truly necessary privileged code requires a separate security review, restricted execution, pinned search path and explicit ownership checks. Revoke PUBLIC execution by default.
4. Coordinate a **private** `listing-photos` bucket with Jayden. Paths are `<auth.uid()>/<listing-id>/<random-uuid>.webp`, immutable uploads with `upsert:false`, compressed output bounded to 1 MB, JPEG/PNG/WebP content validation. Storage INSERT requires own draft; SELECT permits own draft/pending/blocked or attached approved+available records; DELETE only while draft or through trusted cleanup. Deny replacement/upsert. Never make unchecked uploads public. Signed read URLs expire in 300 seconds; existing signed links can remain valid until expiry after removal.
5. Trusted moderation backend consumes the committed snapshot, reads stored images, and alone transitions pending → approved/blocked. Persist reasons and audit results privately. Model/service/queue failures leave pending, with retries keyed to listing ID and content revision. `allow` from the browser is never accepted as approval. Deleting while a job runs must prevent job resurrection. Worker must compare snapshot/revision and current pending state atomically before decision.
6. Install/test all ownership and state invariants before returning the workflow version. Test two student accounts, anonymous access, raw API attempts at self-approval/reassignment, concurrent photo attach/submit, failed uploads, lost responses, blocked photo reads, draft deletion and worker retries. Use an isolated database for integration tests.

This review document intentionally does not apply security configuration or manufacture a migration against a mismatched historical schema.

## Frontend behavior and limitations

- `/sell`: validate, save draft, compress/upload/attach photos, explicitly submit pending. Stable IDs/paths and in-memory progress make repeated requests safe under the proposed idempotent RPCs. Refresh after an uncertain response: open `/my-listings` and resume the draft. Unsaved fields and selected files are not persisted across refresh.
- `/my-listings`: own records and actual statuses. `/account` links to it without changing teammate profile/auth behavior.
- `/browse`: approved+available only, URL search/category/condition/max-price/sort, no sample fallback. `/item/<uuid>`: real photos and details, draft edit controls, confirmed owner deletion. All reads still rely on RLS.
- Explicit `/demo/item/<number>` routes preserve prototype cards separately. Existing homepage, saved items and seller pages remain clearly identified demonstrations. Messaging, offers, moving and payments remain outside this implementation.
- Draft editing supports details and additional photos. Replacing/removing already attached photos and editing approved/blocked listings need reviewed backend transitions and are not implemented. The UI says so rather than claiming completion.
- Actual shared-database creation, uploads, permissions and moderation cannot be tested end to end until the backend contract is deployed and authenticated test accounts are available. Mocked service tests do not verify RLS.

## Verification

Run from `src/frontend`: `node --test tests/listings.test.mjs`, `npx next typegen`, `npx tsc --noEmit`, targeted ESLint on changed TS/TSX, and `npm run build`. Use Prettier only on changed files. Check final PR results for actual execution outcomes.
