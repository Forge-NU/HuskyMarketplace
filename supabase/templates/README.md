# Verification email proposal

`verification.html` is a compact code-only email for the existing email OTP flow. Suggested subject: **Your Husky sign-in code**. Preview it at `/email-preview` while signed in; its displayed code is a fixture.

No hosted email setting was changed. The authentication owner should review the template and install it for the hosted **Magic Link** (OTP) template and the new-user **Confirm signup** template after confirming which templates are sent by the current project. Preserve `{{ .Token }}` as the dynamic OTP. Do not paste the preview’s sample code into the hosted template. No unverified expiry duration or redirect link is included. Test both new and returning accounts and narrow mobile email clients before publishing.

Reference: [Supabase email templates](https://supabase.com/docs/guides/local-development/customizing-email-templates).
