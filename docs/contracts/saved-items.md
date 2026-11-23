# Saved listings

Related to #26. This frontend uses Caleb's existing `saved_items` table and ownership policies. Shared Supabase still needs the reviewed grants from #38; no migration or shared grant was applied here.

- Home, Browse and live item details save UUID listings to the signed-in student's account. Buttons update after the database request succeeds. Duplicate saves are confirmed by reading the existing row.
- `/saved` loads real account records, newest first, with 24 saves per page. Unavailable or hidden listings show a generic card with a removal control. Deleted listings disappear through the existing foreign-key cascade.
- Account changes clear the controls. Navigation, refresh and returning to the window reload the student's saves. No live save is stored in localStorage.
- `/demo/saved` keeps the existing browser-local demonstration. Demo IDs are rejected by the live service. Failed live queries show an error and retry; they do not substitute demo saves.

## Local checks

The walkthrough creates two synthetic students and listings in local Supabase. Use the local stack's public key, eight-digit email templates, enabled device gate and temporary `SELECT`, `INSERT`, `DELETE` grants for `authenticated` on `public.saved_items`. Keep the existing ownership/device RLS policies. These grants are a local test setup, not the #38 migration or permission to change shared Supabase.

Run from `src/frontend`, with a local production build on port 3012:

```bash
node --test tests/saved.test.mjs
SAVED_TEST_ANON_KEY=LOCAL_PUBLIC_KEY node tests/saved.e2e.mjs
```

The default API and Mailpit URLs are `http://127.0.0.1:54321` and `http://127.0.0.1:54324`. Override them with `SAVED_TEST_SUPABASE_URL`, `SAVED_TEST_MAIL_URL` and `SAVED_TEST_URL`. Hosted origins are rejected before accounts are created. Set `SAVED_TEST_SCREENSHOT_DIR` to save full-page images. Use a disposable stack; test accounts and uploaded files stay local, and the runner attempts to delete its listings on exit.

All 11 service tests and 17 browser checks pass. Browser checks cover Home/Browse/details, duplicates, two-account isolation, signed-out and unverified-device denial, hidden/deleted listings, failed save/remove/read requests, pagination, a separate mobile context, demo separation, persistence after logout/password login/device verification, and switching accounts in the same browser, and a delayed background read arriving after a successful save. The read/write failure responses are injected; the successful requests and permission checks use real local Supabase.

The combined #52/#53/#55/#56 build also passes all 111 frontend tests, 46 accessibility scans and 276 layout checks in Chromium and WebKit. The standalone Saved branch passes 107 frontend tests. TypeScript, targeted lint, formatting and production builds pass.

## Remaining release work

- [ ] Review and merge the frontend and #38's grant fix.
- [ ] Apply only the reviewed, agreed grant migration; preserve ownership and device policies.
- [ ] Repeat save/remove, account isolation and cross-session checks on the reviewed deployment before closing #26.

The screenshots use synthetic blue image fixtures, not actual student listings. Fonts and colors are unchanged.
