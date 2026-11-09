# Frontend QA

Related to #12, #19 and #25. Checked locally on November 8, 2026.

## Checked

- Home, Browse, Saved, demo item details, Safety, Terms and Privacy load at the narrow browser layout without horizontal scrolling.
- Home, Browse, Account and Sell load at the tablet layout without horizontal scrolling. Account and Sell used the existing signed-in session; no account values or listings were saved.
- Home also fits the desktop layout. The browser reported viewport widths of 480, 780 and 2560 for these checks. Physical phone testing and narrower screens remain to be checked.
- Tab reaches Skip to content first; Enter moves focus past the header to the content. Each checked page has one main landmark.
- Browse keeps its unavailable message and separate demo link when the live workflow is unavailable.
- Demo item links open the separate demo route. Live listing photo links use the UUID item route; the live photo interaction still needs checking with real records.

## Changes

- Added a keyboard skip link to the shared marketplace shell.
- Included selects and textareas in the shared keyboard focus style.
- Made live listing photos link to item details, like the demo cards.

## Deployment checks still needed

The connected Vercel account returned no projects or accessible teams. GitHub returned no deployment records for this repository. No hosting configuration was changed.

- [ ] Confirm access to the existing Vercel project and its Git connection.
- [ ] Confirm the root directory is `src/frontend` and PR preview builds are enabled.
- [ ] Check required environment variable names and targets without copying their values into issues or logs.
- [ ] Test deployed navigation and the agreed authentication flow, including logout and protected routes.
- [ ] Check the Supabase site/redirect URLs with the authentication owner.
- [ ] Test the frontend/backend connection once the backend URL is available.

## Follow-up QA

- [ ] On a physical phone, check portrait/landscape layouts and browser zoom.
- [ ] With test accounts, check uploads, retries, draft editing, deletion and published item photos after the backend rollout.
- [ ] Check that account changes persist after signing back in, once the profile API is ready.
- [ ] Review final screen changes against the team's Figma file.
- [ ] Retest reported bugs on the deployed preview before closing the related issues.
