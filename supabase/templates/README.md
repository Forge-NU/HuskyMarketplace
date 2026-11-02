# Verification email proposal

`verification.html` is a compact code-only email for the existing email OTP flow. Suggested subject: **Your Husky sign-in code**. Preview it at `/email-preview` while signed in; the code shown is a sample.

No hosted email setting was changed. The auth owner should install it as the hosted **Magic Link** (OTP) and **Confirm signup** templates, after checking which ones the project sends. Keep `{{ .Token }}` as the OTP and don't paste the sample code. Test new and returning accounts and narrow mobile email clients before publishing.

Reference: [Supabase email templates](https://supabase.com/docs/guides/local-development/customizing-email-templates).
