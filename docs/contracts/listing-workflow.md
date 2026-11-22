# Listing integration status

Related to #21. The backend proposal and API decision are tracked in [#33](https://github.com/Forge-NU/HuskyMarketplace/issues/33).

The listing RPCs and photo-storage policies merged in #40. The frontend uses `listing_workflow_version`, `save_listing_draft`, `attach_listing_photo`, `submit_listing` and `delete_listing`, with the signed-in student's Supabase client. The shared schema and RPC definitions were checked on November 22.

The lifecycle is draft → photos → pending → approved or blocked. The existing backend temporarily auto-approves submissions for the demo; full moderation remains #10. The frontend only submits drafts and cannot approve them. RLS and the RPCs enforce ownership, visibility and verified-device access.

Only private drafts can be edited or receive additional photos. Submitted photos cannot be overwritten or deleted. Blocked listings cannot be edited or deleted. Removing or replacing already attached draft photos needs a backend operation and is not offered by the editor.

Saving keeps the draft ID in the Sell URL, so refresh reopens it. Upload and attachment retries reuse the same object paths. Browse shows approved, available listings and keeps failed requests separate from empty results and demo routes.

## Local walkthrough

Start local Supabase with this repository's migrations, email confirmations enabled and an eight-digit signup email template. Enable the local device gate when checking permissions. Start the frontend with that instance's URL and public key and `DEVICE_VERIFICATION_ENABLED=true`.

After `npm ci`, run `npx playwright install chromium` once. From `src/frontend`, run `npm run test:listings` with `LISTING_TEST_ANON_KEY` set to the local public key. Defaults are app `http://127.0.0.1:3007`, Supabase `http://127.0.0.1:54321` and Mailpit `http://127.0.0.1:54324`. Override them with `LISTING_TEST_URL`, `LISTING_TEST_SUPABASE_URL` and `LISTING_TEST_MAIL_URL`. The script rejects hosted URLs and blocks browser requests outside the local app and Supabase origins.

The walkthrough creates two synthetic students and tests saving, compression, refresh, editing, submission, Browse/details, ownership and deletion. Upload/submission response loss and a deletion failure are injected; the underlying writes use real local Supabase. The blocked-state UI uses a response fixture; its database permissions are checked separately by pgTAP. Set `LISTING_TEST_SCREENSHOT_DIR` to save full-page screenshots. Local accounts and storage objects remain in the disposable database; the test attempts to delete its listing on exit.

The deployed two-account write pass remains open in #21. Do not use production credentials or accounts for this local walkthrough.
