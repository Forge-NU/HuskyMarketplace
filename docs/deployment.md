# Frontend deployment handoff

Related to #19. These are instructions for an agreed release, not an automatic deployment script. No deployment or hosting change was made for this handoff.

## Existing project

Checked read-only on November 22, 2026, with Vercel CLI 65.14.0:

| Setting                | Value                                                    |
| ---------------------- | -------------------------------------------------------- |
| Team                   | `husky-marketplace1`                                     |
| Project                | `husky-marketplace`                                      |
| Site                   | https://husky-marketplace.vercel.app                     |
| Framework              | Next.js                                                  |
| Node                   | 26.x                                                     |
| CLI source directory   | `src/frontend`                                           |
| Project Root Directory | Unset; manual CLI deployments upload from `src/frontend` |
| Git integration        | Not connected                                            |

Do not create another project. If Git deployment is enabled later, set Root Directory to `src/frontend` for the repository root and agree on preview environments before connecting it. That configuration has not been changed here.

## Environment

Set these in the intended Vercel environment before building:

| Name                          | Purpose                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| `SUPABASE_URL`                | Correct Husky Supabase project URL, without surrounding quotes                        |
| `SUPABASE_ANON_KEY`           | Public client key for that same project; never a service-role key                     |
| `DEVICE_VERIFICATION_ENABLED` | `true` for the shared database's device checks                                        |
| `NEXT_PUBLIC_API_URL`         | Reserved for the later FastAPI integration; not required by the current listing pages |

The URL and public key are bundled into client code by `next.config.ts`. Saving the public key as a Vercel Secret does not make it private in the browser. Secret values in Production/Preview are omitted from environment pulls; a pulled file alone may not reproduce a build. Do not overwrite someone's existing `.env.local` with a pull.

For a names-only check from `src/frontend`:

```bash
npx vercel@65.14.0 project inspect husky-marketplace --scope husky-marketplace1
npx vercel@65.14.0 env ls --project husky-marketplace --scope husky-marketplace1 --environment production
```

Confirm the team and project before proceeding. Environment changes apply to a new deployment, not an already built app. Keep credentials out of terminal arguments, screenshots and PRs.

## Before a release

1. Use a clean checkout of the exact reviewed commit. Record its SHA and the current working production deployment URL. Do not deploy unrelated local changes.
2. Run the local checks in the [frontend README](../src/frontend/README.md), plus the relevant browser and database tests. Review the [QA record](frontend-qa.md) for checks that still need a person or the deployed site.
3. Confirm which database migrations are actually installed. Both `20261115035417_verified_device_sessions` and `20261115165537_explicit_listing_device_checks` are already recorded in shared Supabase; do not reapply them. The profile-photo migration in #52 is not installed. Use the reviewed process in [supabase/README.md](../supabase/README.md) for any separately approved migration; do not run a blanket push from a feature branch.
4. Confirm the Supabase Auth Site URL is the production site. Preserve localhost entries. Any new preview redirect entry or email-template change needs the agreed review; do not add broad wildcards as a workaround.
5. Check the intended environment has the correct client configuration. Preview testing should use an agreed isolated database. A different frontend URL does not isolate a shared database.

## Stage, test, then release

Run only after review and agreement, from `src/frontend`:

```bash
npx vercel@65.14.0 deploy --prod --skip-domain --project husky-marketplace --scope husky-marketplace1
```

This builds with Production variables and returns a deployment URL without moving the production domain. Test that exact URL: public routes, signup, reset, fresh-device verification, remembered login, profile photos, and the two-account listing walkthrough. Passwords and email codes are entered privately. Confirm internal test routes return 404. Keep demo-only messaging, offers, saved items and moving help separate from live acceptance tests.

After those checks pass and the release is approved, replace `STAGED_DEPLOYMENT_URL` below with the returned URL:

```bash
npx vercel@65.14.0 promote "STAGED_DEPLOYMENT_URL" --scope husky-marketplace1
```

Then check the stable site again. Record the commit, deployment URL, migration versions, test results and remaining limitations in the release notes. Do not promote a Preview build as a shortcut; different environment variables can cause a rebuild.

## Troubleshooting

| Symptom                                               | Check                                                                                                          |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Build says Supabase variables are missing             | Variable names and Production target; set both URL and public key before a new build                           |
| Fonts fail to download during a build                 | Network access to Google Fonts; preserve Archivo and DM Sans                                                   |
| Old UI or fonts after release                         | Deployed commit and domain assignment; do not assume the local checkout is live                                |
| Sign-in reaches a device check but data will not load | Device flag, installed migration history and verified session; do not disable RLS or the device gate           |
| Profile photo cannot save                             | Whether the reviewed private-bucket migration is installed; surface the error rather than claiming success     |
| Browse is empty or unavailable                        | Actual listing status/availability and query errors; never replace failed live requests with sample records    |
| Verification email is delayed                         | Compare Supabase/Brevo send events with message headers; the resend countdown does not measure delivery        |
| FastAPI feature fails                                 | Backend URL and deployment with its owner; changing `NEXT_PUBLIC_API_URL` does not connect unfinished features |

Read-only runtime log check:

```bash
npx vercel@65.14.0 logs --project husky-marketplace --scope husky-marketplace1 --environment production --since 1h --query 'level:error'
```

Review logs privately and redact personal data before sharing them. Do not share cookies, tokens or verification codes.

## Rollback

If a release breaks the site, coordinate with the release owner and use the previously recorded working production deployment URL:

```bash
npx vercel@65.14.0 rollback "PREVIOUS_PRODUCTION_URL" --scope husky-marketplace1
npx vercel@65.14.0 rollback status husky-marketplace --scope husky-marketplace1
```

Check the stable site after rollback. Hobby plans limit rollback to the immediately previous production deployment. Rollback restores the old build/configuration; it does not undo database migrations or pick up new environment values. It also pauses automatic production domain assignment until a later promotion. Never reverse a shared migration or weaken device/storage policies as part of a frontend rollback without a separate reviewed plan.

## References

[Vercel deployment CLI](https://vercel.com/docs/cli/deploy), [environment variables](https://vercel.com/docs/environment-variables), [promotion](https://vercel.com/docs/deployments/promote-preview-to-production), [rollback](https://vercel.com/docs/cli/rollback).
