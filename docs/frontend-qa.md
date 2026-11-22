# Frontend QA

Related to #12, #16, #19 and #25. Local checks on November 22, 2026. The runtime checks use a temporary combined copy of #52, #53 and this branch; none of those PRs was merged or deployed for testing. Students, listing photos and browser state are synthetic and local.

## Local checklist

| Area          | Check                                                                                                                                               | Result                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Routes        | Home, Browse, Sell, My listings, Account/setup, live details, demo details/seller, Saved, Messages/offers, Moving and the older sample detail route | Checked locally                                    |
| Public pages  | Login, signup, recovery, verification/reset screens, Terms, Privacy, Safety and Credits                                                             | Checked locally                                    |
| Layout        | Chromium and WebKit at 320, 390, 640, 768, 1024 and 1440 CSS pixels                                                                                 | No horizontal overflow                             |
| Accessibility | axe-core WCAG A/AA rule scans, accessible names, one main landmark and keyboard skip navigation                                                     | Checked locally; not a screen-reader certification |
| Keyboard      | Focus stays visible below the sticky header; navigation, filters and form controls can be reached                                                   | Checked locally                                    |
| Links         | Public headers, footers and sample listing links avoid internal test pages; demo offers open demo items                                             | Checked locally                                    |
| States        | Search empty/error/retry, account/listing form states, saved/demo empty states and messaging search                                                 | Checked locally                                    |
| Motion        | Page scrolling honors reduced-motion preference                                                                                                     | Checked locally                                    |

The 640 and 320 CSS-pixel checks cover reflow equivalent to 200% and 400% zoom from a 1280-pixel viewport. They do not replace a manual native-browser zoom test. WebKit checks use Option-Tab for links on macOS, matching [Safari's keyboard behavior](https://support.apple.com/guide/safari/keyboard-shortcuts-and-gestures-cpsh003/mac).

Each browser passed 23 page variants and 138 layout checks: 46 accessibility scans and 276 layout checks in total. Targeted interaction checks also passed for demo links, search/filter focus, Browse failure/retry, internal-route guards in the combined build, mobile field visibility and reduced-motion scrolling.

## Bugs fixed in this branch

All fixes below belong to @httpsbina under #12/#16/#25.

| Reproduction                                                                | Fix                                                                                            |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Open an older `/listings/<number>` page, then choose Goods/Services or Back | Use `/browse` and `/moving`; remove navigation to `/team-browse`                               |
| Open that page's footer and choose a policy/help item                       | Open actual Safety, Terms, Privacy and Credits pages instead of placeholder toasts             |
| Save a demo offer, then open its listing                                    | Use `/demo/item/<number>` instead of the live UUID route                                       |
| Tab through the mobile account form until Username receives focus           | Add scroll margin so the sticky header does not cover the field                                |
| Read the empty Sell preview, selected inbox thread or message timestamps    | Darken secondary text/remove faded timestamp text while keeping the existing palette and fonts |
| Search the demo inbox for a nonexistent conversation                        | Show an explicit empty-search message                                                          |
| Navigate Messages/Offers or moving filters with assistive technology        | Expose selected buttons with `aria-pressed`                                                    |
| Use keyboard navigation on the older sample detail route                    | Add the same skip-to-content entry used by the marketplace shell                               |

## Repeat the UI checks

Use a local production build and a synthetic student with a verified device, complete profile and one approved local listing. Save that student's Playwright storage state outside the repository, for example `/tmp/husky-ui-state.json`. Do not use a real account or shared-database credentials.

After `npm ci` and `npx playwright install chromium webkit`, run from `src/frontend`:

```bash
UI_TEST_STATE=/tmp/husky-ui-state.json UI_TEST_ITEM_ID=LOCAL_LISTING_UUID node tests/ui.e2e.mjs
UI_TEST_STATE=/tmp/husky-ui-state.json UI_TEST_ITEM_ID=LOCAL_LISTING_UUID UI_TEST_BROWSER=webkit node tests/ui.e2e.mjs
```

Replace `LOCAL_LISTING_UUID` with the local fixture's ID. The default app is `http://127.0.0.1:3008`; local Supabase defaults to `http://127.0.0.1:54321`. Override with `UI_TEST_URL` and `UI_TEST_SUPABASE_URL` when using different local ports. Hosted URLs are rejected. Browser requests outside the local app/Supabase origins are blocked except images used by the demo pages. Browser state is never a PR attachment.

## Shared release checklist

These checks are separate from the local UI pass. Keep the related issues open until their release checks pass.

- [ ] Review and merge the intended frontend changes; confirm the exact release commit.
- [ ] Test real signup with an unused Northeastern address, password reset and a fresh device on the reviewed deployment (#2, #9, #50).
- [ ] Retest remembered-device login on that same deployment.
- [ ] Install only reviewed, merged and separately agreed migrations; verify profile-photo save/reload on the deployed site (#20, #52).
- [ ] Repeat the two-account listing write walkthrough on the deployed site (#21).
- [ ] Verify search results, navigation and internal-route 404s on that deployment (#16, #24).
- [ ] Test public seller fields and saved items after their backend work lands (#20, #26, #38, #46).
- [ ] Review real moderation, sold/report actions and their permissions with their owners (#10, #22).
- [ ] Check a physical phone, native browser zoom and a screen reader; update the Figma screens (#12).
- [ ] Confirm final policy/contact text and photo permissions with the team.
- [ ] Complete the joint launch review (#19, #25).

Messaging, offers and moving help remain demonstrations. Their backend work is paused and is not counted as a passed live flow. The [deployment handoff](deployment.md) covers staging, release and rollback; this QA work does not enable Git deployments or change shared configuration.
